import { test, expect, describe } from 'bun:test';
import type { QrResult } from '@levischuck/tiny-qr';
import { toSvgString, toSvgJsx } from './index';

// Simple test QR code matrix (3x3)
const testQrResult: QrResult = {
  matrix: [
    [true, false, true],
    [false, true, false],
    [true, false, true]
  ],
  width: 3,
  version: 1,
  ec: 1
};

describe('toSvgString', () => {
  test('should generate path data with output="path"', () => {
    const result = toSvgString(testQrResult, { output: 'path', moduleSize: 1 });

    expect(result).toContain('M0,0l1,0 0,1 -1,0 0,-1z');
    expect(result).toContain('M2,0l1,0 0,1 -1,0 0,-1z');
    expect(result).toContain('M1,1l1,0 0,1 -1,0 0,-1z');
    expect(result).toContain('M0,2l1,0 0,1 -1,0 0,-1z');
    expect(result).toContain('M2,2l1,0 0,1 -1,0 0,-1z');
  });

  test('should generate g element with output="g"', () => {
    const result = toSvgString(testQrResult, { output: 'g', margin: 4, moduleSize: 4 });

    expect(result).toStartWith('<g transform="translate(16,16)">');
    expect(result).toContain('<rect width="12" height="12" fill="white"/>'); // QR is 3x4 = 12
    expect(result).toContain('<path d=');
    expect(result).toContain('fill="black"');
    expect(result).toEndWith('</g>');
  });

  test('should generate svg element with output="svg"', () => {
    const result = toSvgString(testQrResult, { output: 'svg', margin: 4, moduleSize: 4 });

    expect(result).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(result).toContain('viewBox="0 0 44 44"'); // (3 + 4*2) * 4 = 44
    expect(result).toContain('<rect width="44" height="44" fill="white"/>');
    expect(result).toContain('<g transform="translate(16,16)">');
    expect(result).toEndWith('</svg>');
  });

  test('should generate svg+xml with output="svg+xml" (default)', () => {
    const result = toSvgString(testQrResult, { margin: 4, moduleSize: 4 });

    expect(result).toStartWith('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(result).toContain('viewBox="0 0 44 44"');
  });

  test('should use custom background color', () => {
    const result = toSvgString(testQrResult, { background: '#FF0000', output: 'svg' });

    expect(result).toContain('fill="#FF0000"');
  });

  test('should use custom module color', () => {
    const result = toSvgString(testQrResult, { color: '#00FF00', output: 'g' });

    expect(result).toContain('fill="#00FF00"');
  });

  test('should not include background rect when background is transparent', () => {
    const result = toSvgString(testQrResult, { background: 'transparent', output: 'svg' });

    expect(result).not.toContain('<rect');
    expect(result).toContain('<svg xmlns');
    expect(result).toContain('<g transform');
  });

  test('should use custom margin', () => {
    const result = toSvgString(testQrResult, { margin: 2, moduleSize: 4, output: 'svg' });

    // totalSize = (3 + 2*2) * 4 = 28
    expect(result).toContain('viewBox="0 0 28 28"');
    expect(result).toContain('transform="translate(8,8)"'); // margin * moduleSize = 2 * 4
  });

  test('should use custom moduleSize', () => {
    const result = toSvgString(testQrResult, { margin: 0, moduleSize: 10, output: 'svg' });

    // totalSize = (3 + 0) * 10 = 30
    expect(result).toContain('viewBox="0 0 30 30"');
    expect(result).toContain('M0,0l10,0 0,10 -10,0 0,-10z');
  });

  test('should handle empty matrix', () => {
    const emptyQr: QrResult = {
      matrix: [[]],
      width: 0,
      version: 1,
      ec: 1
    };

    const result = toSvgString(emptyQr, { output: 'path' });
    expect(result).toBe('');
  });

  test('should omit transform when margin is 0', () => {
    const result = toSvgString(testQrResult, { margin: 0, moduleSize: 4, output: 'svg' });

    expect(result).toContain('<g>'); // no transform attribute
    expect(result).not.toContain('transform="translate(0,0)"');
  });

  test('should omit transform in g output when margin is 0', () => {
    const result = toSvgString(testQrResult, { margin: 0, moduleSize: 4, output: 'g' });

    expect(result).toStartWith('<g>'); // no transform attribute
    expect(result).not.toContain('transform=');
  });
});

describe('toSvgJsx', () => {
  test('should generate JSX object with output="svg" (default)', () => {
    const result = toSvgJsx(testQrResult, { margin: 4, moduleSize: 4 });

    expect(result.type).toBe('svg');
    expect(result.props.xmlns).toBe('http://www.w3.org/2000/svg');
    expect(result.props.version).toBe('1.1');
    expect(result.props.viewBox).toBe('0 0 44 44');
    expect(result.props.children).toBeDefined();
    expect(Array.isArray(result.props.children)).toBe(true);
    expect((result.props.children as any[]).length).toBe(2); // rect + g

    const [rect, g] = result.props.children as any[];
    expect(rect.type).toBe('rect');
    expect(rect.props.fill).toBe('white');
    expect(g.type).toBe('g');
  });

  test('should generate JSX object with output="g"', () => {
    const result = toSvgJsx(testQrResult, { output: 'g', margin: 4, moduleSize: 4 });

    expect(result.type).toBe('g');
    expect(result.props.transform).toBe('translate(16,16)');
    expect(result.props.children).toBeDefined();
    expect(Array.isArray(result.props.children)).toBe(true);
    expect((result.props.children as any[]).length).toBe(2); // rect + path

    const [rect, path] = result.props.children as any[];
    expect(rect.type).toBe('rect');
    expect(path.type).toBe('path');
    expect(path.props.fill).toBe('black');
    expect(path.props.stroke).toBe('transparent');
  });

  test('should use custom background color in JSX', () => {
    const result = toSvgJsx(testQrResult, { background: 'blue' });

    const rect = (result.props.children as any[])[0];
    expect(rect.props.fill).toBe('blue');
  });

  test('should use custom module color in JSX', () => {
    const result = toSvgJsx(testQrResult, { color: 'red', output: 'g' });

    const children = result.props.children as any[];
    const path = children[children.length - 1]; // path is last element
    expect(path.props.fill).toBe('red');
  });

  test('should not include rect when background is transparent', () => {
    const result = toSvgJsx(testQrResult, { background: 'transparent' });

    expect(Array.isArray(result.props.children)).toBe(true);
    expect((result.props.children as any[]).length).toBe(1); // only g, no rect
    expect((result.props.children as any[])[0].type).toBe('g');
  });

  test('should use custom margin in JSX', () => {
    const result = toSvgJsx(testQrResult, { margin: 2, moduleSize: 4 });

    expect(result.props.viewBox).toBe('0 0 28 28');
    const g = (result.props.children as any[]).find((c: any) => c.type === 'g')!;
    expect(g.props.transform).toBe('translate(8,8)');
  });

  test('should use custom moduleSize in JSX', () => {
    const result = toSvgJsx(testQrResult, { margin: 0, moduleSize: 10 });

    expect(result.props.viewBox).toBe('0 0 30 30');
    const g = (result.props.children as any[]).find((c: any) => c.type === 'g')!;
    const path = g.props.children as any; // when output is svg, g's children is a single element
    expect(path.props.d).toContain('M0,0l10,0 0,10 -10,0 0,-10z');
  });

  test('should handle empty matrix in JSX', () => {
    const emptyQr: QrResult = {
      matrix: [[]],
      width: 0,
      version: 1,
      ec: 1
    };

    const result = toSvgJsx(emptyQr, { output: 'g' });
    const children = result.props.children as any[];
    const path = children[children.length - 1]; // path is last element
    expect(path.props.d).toBe('');
  });

  test('should generate correct path data structure', () => {
    const result = toSvgJsx(testQrResult, { output: 'g', moduleSize: 1 });

    const children = result.props.children as any[];
    const path = children[children.length - 1]; // path is last
    expect(path.type).toBe('path');
    expect(typeof path.props.d).toBe('string');
    expect(path.props.d).toContain('M0,0');
    expect(path.props.d).toContain('M2,0');
    expect(path.props.d).toContain('M1,1');
    expect(path.props.d).toContain('M0,2');
    expect(path.props.d).toContain('M2,2');
  });

  test('should omit transform property when margin is 0', () => {
    const result = toSvgJsx(testQrResult, { margin: 0, moduleSize: 4 });

    const g = (result.props.children as any[]).find((c: any) => c.type === 'g');
    expect(g.props.transform).toBeUndefined();
  });

  test('should include background rect in g output', () => {
    const result = toSvgJsx(testQrResult, { output: 'g', margin: 4, moduleSize: 4 });

    const children = result.props.children as any[];
    expect(children.length).toBe(2); // rect + path
    expect(children[0].type).toBe('rect');
    expect(children[0].props.width).toBe(12); // 3 * 4
    expect(children[0].props.fill).toBe('white');
  });

  test('should not include background rect in g output when transparent', () => {
    const result = toSvgJsx(testQrResult, { output: 'g', background: 'transparent' });

    const children = result.props.children as any[];
    expect(children.length).toBe(1); // only path
    expect(children[0].type).toBe('path');
  });
});

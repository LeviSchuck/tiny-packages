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

const randomBytes = await crypto.getRandomValues(new Uint8Array(21 * 21));
const randomMatrix = Array.from({ length: 21 }, (_, i) => [...randomBytes.slice(i * 21, (i + 1) * 21)].map((byte) => byte > 128));

const randomCode : QrResult = {
  matrix: randomMatrix,
  version: 1,
  ec: 1,
  width: 21
};

describe('toSvgString', () => {
  test('should generate path data with output="path"', () => {
    const result = toSvgString(testQrResult, { output: 'path', moduleSize: 1 });
    const { svg } = result;

    expect(svg).toContain('M0,0l1,0 0,1 -1,0 0,-1z');
    expect(svg).toContain('M2,0l1,0 0,1 -1,0 0,-1z');
    expect(svg).toContain('M1,1l1,0 0,1 -1,0 0,-1z');
    expect(svg).toContain('M0,2l1,0 0,1 -1,0 0,-1z');
    expect(svg).toContain('M2,2l1,0 0,1 -1,0 0,-1z');
  });

  test('should generate g element with output="g"', () => {
    const result = toSvgString(randomCode, { output: 'g', margin: 4, moduleSize: 4 });
    const { svg , width, height} = result;

    // 21 * 4  = 84
    expect(svg).toStartWith('<g transform="translate(16,16)">');
    expect(svg).toContain('<rect width="84" height="84" fill="white"/>'); // QR is 21x21 * 4
    expect(svg).toContain('<path d=');
    expect(svg).toContain('fill="black"');
    expect(svg).toEndWith('</g>');

    // 84 + 16 * 2 = 116
    expect(width).toBe(116);
    expect(height).toBe(116);
  });

  test('should generate svg element with output="svg"', () => {
    const result = toSvgString(testQrResult, { output: 'svg', margin: 4, moduleSize: 4 });
    const { svg , width, height} = result;

    expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 44 44"'); // (3 + 4*2) * 4 = 44
    expect(svg).toContain('<rect width="44" height="44" fill="white"/>');
    expect(svg).toContain('<g transform="translate(16,16)">');
    expect(svg).toEndWith('</svg>');
    expect(width).toBe(44);
    expect(height).toBe(44);
  });

  test('should generate svg+xml with output="svg+xml" (default)', () => {
    const result = toSvgString(randomCode, { margin: 4, moduleSize: 4 });
    const { svg , width, height} = result;

    expect(svg).toStartWith('<?xml version="1.0" encoding="UTF-8"?>');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain(`viewBox="0 0 ${width} ${height}"`);
  });

  test('should use custom background color', () => {
    const result = toSvgString(randomCode, { background: '#FF0000', output: 'svg' });
    const { svg } = result;
    expect(svg).toContain('fill="#FF0000"');
  });

  test('should use custom module color', () => {
    const result = toSvgString(randomCode, { color: '#00FF00', output: 'g' });
    const { svg } = result;

    expect(svg).toContain('fill="#00FF00"');
  });

  test('should not include background rect when background is transparent', () => {
    const result = toSvgString(randomCode, { background: 'transparent', output: 'svg' });
    const { svg } = result;
    expect(svg).not.toContain('<rect');
    expect(svg).toContain('<svg xmlns');
    expect(svg).toContain('<g transform');
  });

  test('should use custom margin', () => {
    const result = toSvgString(randomCode, { margin: 2, moduleSize: 4, output: 'svg' });
    const { svg , width, height} = result;
    expect(svg).toContain(`viewBox="0 0 ${width} ${height}"`);
    expect(svg).toContain('transform="translate(8,8)"'); // margin * moduleSize = 2 * 4
  });

  test('should use custom moduleSize', () => {
    const result = toSvgString(testQrResult, { margin: 0, moduleSize: 10, output: 'svg' });
    const { svg , width, height} = result;
    // totalSize = (3 + 0) * 10 = 30
    expect(svg).toContain('viewBox="0 0 30 30"');
    expect(svg).toContain('M0,0l10,0 0,10 -10,0 0,-10z');
    expect(width).toBe(30);
    expect(height).toBe(30);
  });

  test('should handle empty matrix', () => {
    const emptyQr: QrResult = {
      matrix: [[]],
      width: 0,
      version: 1,
      ec: 1
    };

    const result = toSvgString(emptyQr, { output: 'path' });
    const { svg } = result;
    expect(svg).toBe('');
  });

  test('should omit transform when margin is 0', () => {
    const result = toSvgString(randomCode, { margin: 0, moduleSize: 4, output: 'svg' });
    const { svg } = result;
    expect(svg).toContain('<g>'); // no transform attribute
    expect(svg).not.toContain('transform="translate(0,0)"');
  });

  test('should omit transform in g output when margin is 0', () => {
    const result = toSvgString(randomCode, { margin: 0, moduleSize: 4, output: 'g' });
    const { svg } = result;
    expect(svg).toStartWith('<g>'); // no transform attribute
    expect(svg).not.toContain('transform=');
  });
});

describe('toSvgJsx', () => {
  test('should generate JSX object with output="svg" (default)', () => {
    const result = toSvgJsx(randomCode, { margin: 4, moduleSize: 4 });
    const { svg , width, height} = result;
    expect(svg.type).toBe('svg');
    expect(svg.props.xmlns).toBe('http://www.w3.org/2000/svg');
    expect(svg.props.version).toBe('1.1');
    expect(svg.props.viewBox).toBe(`0 0 ${width} ${height}`);
    expect(svg.props.children).toBeDefined();
    expect(Array.isArray(svg.props.children)).toBe(true);
    expect((svg.props.children as any[]).length).toBe(2); // rect + g

    const [rect, g] = svg.props.children as any[];
    expect(rect.type).toBe('rect');
    expect(rect.props.fill).toBe('white');
    expect(g.type).toBe('g');
  });

  test('should generate JSX object with output="g"', () => {
    const result = toSvgJsx(randomCode, { output: 'g', margin: 4, moduleSize: 4 });
    const { svg } = result;
    expect(svg.type).toBe('g');
    expect(svg.props.transform).toBe('translate(16,16)');
    expect(svg.props.children).toBeDefined();
    expect(Array.isArray(svg.props.children)).toBe(true);
    expect((svg.props.children as any[]).length).toBe(2); // rect + path

    const [rect, path] = svg.props.children as any[];
    expect(rect.type).toBe('rect');
    expect(path.type).toBe('path');
    expect(path.props.fill).toBe('black');
    expect(path.props.stroke).toBe('transparent');
  });

  test('should use custom background color in JSX', () => {
    const result = toSvgJsx(randomCode, { background: 'blue' });
    const { svg } = result;
    const rect = (svg.props.children as any[])[0];
    expect(rect.props.fill).toBe('blue');
  });

  test('should use custom module color in JSX', () => {
    const result = toSvgJsx(randomCode, { color: 'red', output: 'g' });

    const { svg } = result;
    const children = svg.props.children as any[];
    const path = children[children.length - 1]; // path is last element
    expect(path.props.fill).toBe('red');
  });

  test('should not include rect when background is transparent', () => {
    const result = toSvgJsx(randomCode, { background: 'transparent' });
    const { svg } = result;
    expect(Array.isArray(svg.props.children)).toBe(true);
    expect((svg.props.children as any[]).length).toBe(1); // only g, no rect
    expect((svg.props.children as any[])[0].type).toBe('g');
  });

  test('should use custom margin in JSX', () => {
    const result = toSvgJsx(randomCode, { margin: 2, moduleSize: 4 });
    const { svg, width, height } = result;
    expect(svg.props.viewBox).toBe(`0 0 ${width} ${height}`);
    const g = (svg.props.children as any[]).find((c: any) => c.type === 'g')!;
    expect(g.props.transform).toBe('translate(8,8)');
  });

  test('should use custom moduleSize in JSX', () => {
    const result = toSvgJsx(testQrResult, { margin: 0, moduleSize: 10 });
    const { svg } = result;
    expect(svg.props.viewBox).toBe('0 0 30 30');
    const g = (svg.props.children as any[]).find((c: any) => c.type === 'g')!;
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
    const { svg } = result;
    const children = svg.props.children as any[];
    const path = children[children.length - 1]; // path is last element
    expect(path.props.d).toBe('');
  });

  test('should generate correct path data structure', () => {
    const result = toSvgJsx(testQrResult, { output: 'g', moduleSize: 1 });
    const { svg } = result;

    const children = svg.props.children as any[];
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
    const result = toSvgJsx(randomCode, { margin: 0, moduleSize: 4 });
    const { svg } = result;

    const g = (svg.props.children as any[]).find((c: any) => c.type === 'g');
    expect(g.props.transform).toBeUndefined();
  });

  test('should include background rect in g output', () => {
    const result = toSvgJsx(randomCode, { output: 'g', margin: 4, moduleSize: 4 });
    const { svg } = result;
    const children = svg.props.children as any[];
    expect(children.length).toBe(2); // rect + path
    expect(children[0].type).toBe('rect');
    expect(children[0].props.width).toBe(84);
    expect(children[0].props.fill).toBe('white');
  });

  test('should not include background rect in g output when transparent', () => {
    const result = toSvgJsx(randomCode, { output: 'g', background: 'transparent' });
    const { svg } = result;
    const children = svg.props.children as any[];
    expect(children.length).toBe(1); // only path
    expect(children[0].type).toBe('path');
  });
});

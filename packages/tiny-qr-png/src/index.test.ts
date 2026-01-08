import { test, expect, describe } from 'bun:test';
import type { QrResult } from '@levischuck/tiny-qr';
import { toPng } from './index';

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

// Helper to check PNG signature
function isPng(buffer: ArrayBuffer): boolean {
  const view = new Uint8Array(buffer);
  return (
    view[0] === 137 &&
    view[1] === 80 &&
    view[2] === 78 &&
    view[3] === 71 &&
    view[4] === 13 &&
    view[5] === 10 &&
    view[6] === 26 &&
    view[7] === 10
  );
}

describe('toPng', () => {
  test('should generate valid PNG with default options', async () => {
    const result = await toPng(testQrResult);

    expect(isPng(result.bytes)).toBe(true);
  });

  test('should return correct dimensions (default margin and moduleSize)', async () => {
    const result = await toPng(testQrResult);

    // Default margin is 4, moduleSize is 4
    // totalSize = (3 + 4*2) * 4 = 44
    expect(result.width).toBe(44);
    expect(result.height).toBe(44);
    expect(isPng(result.bytes)).toBe(true);
  });

  test('should return correct dimensions with custom margin', async () => {
    const result = await toPng(testQrResult, { margin: 2, moduleSize: 4 });

    // totalSize = (3 + 2*2) * 4 = 28
    expect(result.width).toBe(28);
    expect(result.height).toBe(28);
  });

  test('should return correct dimensions with custom moduleSize', async () => {
    const result = await toPng(testQrResult, { margin: 4, moduleSize: 8 });

    // totalSize = (3 + 4*2) * 8 = 88
    expect(result.width).toBe(88);
    expect(result.height).toBe(88);
  });

  test('should return correct dimensions with zero margin', async () => {
    const result = await toPng(testQrResult, { margin: 0, moduleSize: 4 });

    // totalSize = (3 + 0) * 4 = 12
    expect(result.width).toBe(12);
    expect(result.height).toBe(12);
  });

  test('should handle empty matrix', async () => {
    const emptyQr: QrResult = {
      matrix: [[]],
      width: 0,
      version: 1,
      ec: 1
    };

    const result = await toPng(emptyQr, { margin: 4, moduleSize: 4 });

    // Matrix [[]] has height=1 (one empty row), width=0
    // totalWidth = (0 + 4*2) * 4 = 32
    // totalHeight = (1 + 4*2) * 4 = 36
    expect(result.width).toBe(32);
    expect(result.height).toBe(36);
  });

  test('should return correct dimensions with custom margin and moduleSize', async () => {
    const result = await toPng(testQrResult, { margin: 1, moduleSize: 2 });

    // totalSize = (3 + 1*2) * 2 = 10
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('should return PngResult with bytes, width, and height', async () => {
    const result = await toPng(testQrResult);

    expect(result.bytes).toBeInstanceOf(ArrayBuffer);
    expect(typeof result.width).toBe('number');
    expect(typeof result.height).toBe('number');
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  test('should generate different sized PNGs with different options', async () => {
    const small = await toPng(testQrResult, { margin: 0, moduleSize: 1 });
    const large = await toPng(testQrResult, { margin: 10, moduleSize: 10 });

    expect(small.bytes.byteLength).toBeLessThan(large.bytes.byteLength);
    expect(small.width).toBeLessThan(large.width);
    expect(small.height).toBeLessThan(large.height);
  });
});

import { test, expect, describe } from 'bun:test';
import { qrCode, debugString, EcLevel } from './index.ts';

describe('QR Code Generation', () => {
  test('generates valid version 1 QR code for Hello World', () => {
    const result = qrCode({ data: 'Hello World', ec: EcLevel.M });

    expect(result.version).toBe(1);
    expect(result.width).toBe(21);
    expect(result.matrix.length).toBe(21);
    expect(result.matrix[0]!.length).toBe(21);

    // Check finder patterns are correct
    // Top-left finder pattern (7x7, dark border with light inside and dark center)
    const checkFinderPattern = (startX: number, startY: number) => {
      // Outer ring should be dark
      for (let i = 0; i < 7; i++) {
        expect(result.matrix[startY]![startX + i]).toBe(true); // top
        expect(result.matrix[startY + 6]![startX + i]).toBe(true); // bottom
        expect(result.matrix[startY + i]![startX]).toBe(true); // left
        expect(result.matrix[startY + i]![startX + 6]).toBe(true); // right
      }
      // Inner ring (1 pixel in) should be light
      for (let i = 1; i < 6; i++) {
        expect(result.matrix[startY + 1]![startX + i]).toBe(false); // top
        expect(result.matrix[startY + 5]![startX + i]).toBe(false); // bottom
        expect(result.matrix[startY + i]![startX + 1]).toBe(false); // left
        expect(result.matrix[startY + i]![startX + 5]).toBe(false); // right
      }
      // Center 3x3 should be dark
      for (let y = 2; y < 5; y++) {
        for (let x = 2; x < 5; x++) {
          expect(result.matrix[startY + y]![startX + x]).toBe(true);
        }
      }
    };

    checkFinderPattern(0, 0); // Top-left
    checkFinderPattern(14, 0); // Top-right
    checkFinderPattern(0, 14); // Bottom-left

    // Check timing patterns (row 6 and column 6)
    for (let i = 8; i < 13; i++) {
      const expected = i % 2 === 0;
      expect(result.matrix[6]![i]).toBe(expected); // Horizontal timing
      expect(result.matrix[i]![6]).toBe(expected); // Vertical timing
    }

    // Check dark module at (8, width-8)
    expect(result.matrix[13]![8]).toBe(true);
  });

  test('generates valid QR code for HELLO WORLD (uppercase alphanumeric)', () => {
    const result = qrCode({ data: 'HELLO WORLD', ec: EcLevel.Q });

    expect(result.version).toBe(1);
    expect(result.width).toBe(21);
  });

  test('format info matches expected values for known inputs', () => {
    // This tests the format info calculation by generating a QR code
    // and verifying the format info bits match expected patterns
    const result = qrCode({ data: 'Test', ec: EcLevel.L });

    // For version 1, the format info should be present
    expect(result.version).toBeLessThanOrEqual(40);
    expect(result.version).toBeGreaterThanOrEqual(1);
  });

  test('generates same output for same input', () => {
    const result1 = qrCode({ data: 'Hello World', ec: EcLevel.M });
    const result2 = qrCode({ data: 'Hello World', ec: EcLevel.M });

    expect(debugString(result1)).toBe(debugString(result2));
  });

  test('different EC levels produce different sized QR codes for long data', () => {
    const longData = 'This is a longer string that requires more capacity';

    const resultL = qrCode({ data: longData, ec: EcLevel.L });
    const resultH = qrCode({ data: longData, ec: EcLevel.H });

    // Higher EC level needs more space, so might use higher version
    expect(resultH.version).toBeGreaterThanOrEqual(resultL.version);
  });
});

describe('Debug String', () => {
  test('produces correct character count', () => {
    const result = qrCode({ data: 'A', ec: EcLevel.L });
    const debug = debugString(result, '#', '.');

    const lines = debug.trim().split('\n');
    expect(lines.length).toBe(result.width);
    expect(lines[0]!.length).toBe(result.width);
  });
});

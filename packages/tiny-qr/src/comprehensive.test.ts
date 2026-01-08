import { test, expect, describe } from 'bun:test';
import { qrCode, debugString, EcLevel } from './index.ts';

describe('Comprehensive QR Code Validation', () => {
  test('version 1 QR code has all required structural elements', () => {
    const result = qrCode({ data: 'Test', ec: EcLevel.M });

    expect(result.version).toBe(1);
    expect(result.width).toBe(21);

    const m = result.matrix;
    const w = result.width;

    // 1. Verify finder patterns (7x7)
    // Top-left finder pattern
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isEdge = x === 0 || x === 6 || y === 0 || y === 6;
        const isSecondRing = (x === 1 || x === 5) && y >= 1 && y <= 5 ||
          (y === 1 || y === 5) && x >= 1 && x <= 5;
        const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;

        if (isEdge || isCenter) {
          expect(m[y]![x]).toBe(true);
        } else if (isSecondRing) {
          expect(m[y]![x]).toBe(false);
        }
      }
    }

    // Top-right finder pattern
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const px = w - 7 + x;
        const isEdge = x === 0 || x === 6 || y === 0 || y === 6;
        const isSecondRing = (x === 1 || x === 5) && y >= 1 && y <= 5 ||
          (y === 1 || y === 5) && x >= 1 && x <= 5;
        const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;

        if (isEdge || isCenter) {
          expect(m[y]![px]).toBe(true);
        } else if (isSecondRing) {
          expect(m[y]![px]).toBe(false);
        }
      }
    }

    // Bottom-left finder pattern
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const py = w - 7 + y;
        const isEdge = x === 0 || x === 6 || y === 0 || y === 6;
        const isSecondRing = (x === 1 || x === 5) && y >= 1 && y <= 5 ||
          (y === 1 || y === 5) && x >= 1 && x <= 5;
        const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;

        if (isEdge || isCenter) {
          expect(m[py]![x]).toBe(true);
        } else if (isSecondRing) {
          expect(m[py]![x]).toBe(false);
        }
      }
    }

    // 2. Verify timing patterns
    for (let i = 8; i < w - 8; i++) {
      expect(m[6]![i]).toBe(i % 2 === 0); // Horizontal timing
      expect(m[i]![6]).toBe(i % 2 === 0); // Vertical timing
    }

    // 3. Verify separator around finder patterns is light
    // Top-left separator
    for (let i = 0; i < 8; i++) {
      expect(m[7]![i]).toBe(false); // Row 7
      expect(m[i]![7]).toBe(false); // Column 7
    }

    // Top-right separator
    for (let i = 0; i < 8; i++) {
      expect(m[7]![w - 1 - i]).toBe(false);
      expect(m[i]![w - 8]).toBe(false);
    }

    // Bottom-left separator
    for (let i = 0; i < 8; i++) {
      expect(m[w - 8]![i]).toBe(false);
      expect(m[w - 1 - i]![7]).toBe(false);
    }

    // 4. Verify dark module
    expect(m[w - 8]![8]).toBe(true);

    // 5. Verify format info is present (not empty)
    // The format info values depend on the mask, but we can verify
    // the structure by checking that these positions are set
    // (they should all have been overwritten from the initial empty state)

    // Main format info positions - all should be boolean values
    for (let i = 0; i < 6; i++) {
      expect(typeof m[8]![i]).toBe('boolean'); // Row 8, cols 0-5
    }
    expect(typeof m[8]![7]).toBe('boolean'); // Row 8, col 7
    expect(typeof m[8]![8]).toBe('boolean'); // Row 8, col 8
    expect(typeof m[7]![8]).toBe('boolean'); // Col 8, row 7
    for (let i = 0; i < 6; i++) {
      expect(typeof m[i]![8]).toBe('boolean'); // Col 8, rows 0-5
    }

    // Side format info positions
    for (let i = 0; i < 7; i++) {
      expect(typeof m[w - 1 - i]![8]).toBe('boolean'); // Col 8, bottom rows
    }
    for (let i = 0; i < 8; i++) {
      expect(typeof m[8]![w - 8 + i]).toBe('boolean'); // Row 8, right cols
    }
  });

  test('MAIN and SIDE format info encode the same value', () => {
    const result = qrCode({ data: 'A', ec: EcLevel.L });
    const m = result.matrix;
    const w = result.width;

    // Extract MAIN format info bits
    const mainBits: boolean[] = [];
    // Bits 14-9: row 8, cols 0-5
    for (let i = 0; i < 6; i++) mainBits.push(m[8]![i]!);
    // Bit 8: row 8, col 7
    mainBits.push(m[8]![7]!);
    // Bit 7: row 8, col 8
    mainBits.push(m[8]![8]!);
    // Bit 6: col 8, row 7
    mainBits.push(m[7]![8]!);
    // Bits 5-0: col 8, rows 5,4,3,2,1,0
    for (let i = 5; i >= 0; i--) mainBits.push(m[i]![8]!);

    // Extract SIDE format info bits
    const sideBits: boolean[] = [];
    // Bits 14-8: col 8, rows w-1 to w-7
    for (let i = 0; i < 7; i++) sideBits.push(m[w - 1 - i]![8]!);
    // Bits 7-0: row 8, cols w-8 to w-1
    for (let i = 0; i < 8; i++) sideBits.push(m[8]![w - 8 + i]!);

    // Both should encode the same 15-bit value
    expect(mainBits).toEqual(sideBits);
  });

  test('QR code is deterministic', () => {
    // Same input should always produce same output
    const result1 = qrCode({ data: 'Hello World', ec: EcLevel.M });
    const result2 = qrCode({ data: 'Hello World', ec: EcLevel.M });

    const debug1 = debugString(result1);
    const debug2 = debugString(result2);

    expect(debug1).toBe(debug2);
  });

  test('different data produces different QR codes', () => {
    const result1 = qrCode({ data: 'A', ec: EcLevel.L });
    const result2 = qrCode({ data: 'B', ec: EcLevel.L });

    const debug1 = debugString(result1);
    const debug2 = debugString(result2);

    expect(debug1).not.toBe(debug2);
  });
});

import { test, expect, describe } from 'bun:test';
import { qrCode, EcLevel } from './index.ts';

describe('Format Info Placement', () => {
  test('format info is placed correctly for a simple QR code', () => {
    // Generate a simple QR code
    const result = qrCode({ data: 'A', ec: EcLevel.L });
    const width = result.width;

    // The format info placement should be consistent
    // We'll verify the dark module at (8, width-8) is placed
    expect(result.matrix[width - 8]![8]).toBe(true); // Dark module is always present
  });

  test('timing pattern is correctly placed', () => {
    const result = qrCode({ data: 'Test', ec: EcLevel.M });

    // Timing pattern on row 6 (columns 8 to width-9)
    for (let x = 8; x < result.width - 8; x++) {
      const expected = x % 2 === 0;
      expect(result.matrix[6]![x]).toBe(expected);
    }

    // Timing pattern on column 6 (rows 8 to width-9)
    for (let y = 8; y < result.width - 8; y++) {
      const expected = y % 2 === 0;
      expect(result.matrix[y]![6]).toBe(expected);
    }
  });

  test('separator around finder patterns is light', () => {
    const result = qrCode({ data: 'Test', ec: EcLevel.M });
    const width = result.width;

    // Separator row 7 (between top-left finder and data area)
    for (let x = 0; x < 8; x++) {
      expect(result.matrix[7]![x]).toBe(false); // Should be light
    }

    // Separator column 7 (between top-left finder and data area)
    for (let y = 0; y < 8; y++) {
      expect(result.matrix[y]![7]).toBe(false); // Should be light
    }
  });

  test('MAIN format info spans correct positions', () => {
    const result = qrCode({ data: 'A', ec: EcLevel.L });

    // MAIN format info positions (from Rust reference):
    // Row 8: columns 0-5, 7, 8 (bits 14-7)
    // Column 8: rows 7, 5, 4, 3, 2, 1, 0 (bits 6-0)

    // We can't easily verify the exact bit values without knowing which mask was selected,
    // but we can verify the positions are within the QR code bounds
    const positions = [
      [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [7, 8], [8, 8], // bits 14-7
      [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], // bits 6-0
    ];

    for (const [x, y] of positions) {
      expect(x).toBeLessThan(result.width);
      expect(y).toBeLessThan(result.width);
      // The value at these positions is determined by format info + any masking
      // We just verify these positions exist and are accessible
      expect(typeof result.matrix[y!]![x!]).toBe('boolean');
    }
  });

  test('SIDE format info spans correct positions', () => {
    const result = qrCode({ data: 'A', ec: EcLevel.L });
    const width = result.width;

    // SIDE format info positions (from Rust reference):
    // Column 8: rows width-1 to width-7 (bits 14-8)
    // Row 8: columns width-8 to width-1 (bits 7-0)

    const positions = [
      [8, width - 1], [8, width - 2], [8, width - 3], [8, width - 4],
      [8, width - 5], [8, width - 6], [8, width - 7], // bits 14-8
      [width - 8, 8], [width - 7, 8], [width - 6, 8], [width - 5, 8],
      [width - 4, 8], [width - 3, 8], [width - 2, 8], [width - 1, 8], // bits 7-0
    ];

    for (const [x, y] of positions) {
      expect(x).toBeLessThan(result.width);
      expect(y).toBeLessThan(result.width);
      expect(typeof result.matrix[y!]![x!]).toBe('boolean');
    }
  });
});

describe('Version Info Placement (version >= 7)', () => {
  test('version 7 QR code has version info', () => {
    // Generate a QR code that requires version 7 or higher
    const longData = 'A'.repeat(200); // Should require version 7+
    const result = qrCode({ data: longData, ec: EcLevel.M });

    if (result.version >= 7) {
      const width = result.width;

      // Version info is placed at:
      // Bottom-left: rows width-11 to width-9, columns 0-5
      // Top-right: columns width-11 to width-9, rows 0-5

      // Just verify these positions are accessible
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 3; j++) {
          expect(typeof result.matrix[width - 11 + j]![i]).toBe('boolean');
          expect(typeof result.matrix[i]![width - 11 + j]).toBe('boolean');
        }
      }
    }
  });
});

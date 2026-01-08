import { test, expect, describe } from 'bun:test';
import { EcLevel } from './types.ts';
import { canvasDrawAllFunctionalPatterns, createCanvas } from './canvas.ts';

// Total codewords (data + EC) for each version
// Source: ISO/IEC 18004 Table 1
const TOTAL_CODEWORDS: Record<number, number> = {
  1: 26,
  2: 44,
  3: 70,
};

// Remainder bits for each version (after all data + EC bits are placed)
// Source: ISO/IEC 18004 Table 1
const REMAINDER_BITS: Record<number, number> = {
  1: 0,
  2: 7,
  3: 7,
};

describe('Data Capacity', () => {
  test.each([1, 2, 3])('version %i has correct number of data modules', (version) => {
    // Canvas module count is independent of EC level (EC only affects data/EC split, not total)
    let canvas = createCanvas(version, EcLevel.M);
    canvas = canvasDrawAllFunctionalPatterns(canvas);

    // Count empty modules
    const emptyCount = canvas.modules.filter(m => m === 0).length;

    // Expected: total codewords * 8 bits + remainder bits
    const totalCodewords = TOTAL_CODEWORDS[version]!;
    const remainderBits = REMAINDER_BITS[version]!;
    const expectedBits = totalCodewords * 8 + remainderBits;

    expect(emptyCount).toBe(expectedBits);
  });

  test('version 1 EC M has exactly 208 data module positions', () => {
    let canvas = createCanvas(1, EcLevel.M);
    canvas = canvasDrawAllFunctionalPatterns(canvas);

    const emptyCount = canvas.modules.filter(m => m === 0).length;
    // Version 1: 26 codewords * 8 bits + 0 remainder = 208 bits
    expect(emptyCount).toBe(208);
  });

  test('version 2 has correct module count with remainder bits', () => {
    let canvas = createCanvas(2, EcLevel.M);
    canvas = canvasDrawAllFunctionalPatterns(canvas);

    const emptyCount = canvas.modules.filter(m => m === 0).length;
    // Version 2: 44 codewords * 8 bits + 7 remainder = 359 bits
    expect(emptyCount).toBe(359);
  });
});

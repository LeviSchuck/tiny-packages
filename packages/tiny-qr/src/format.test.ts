import { test, expect, describe } from 'bun:test';
import { EcLevel } from './types.ts';

// Format info calculation - matches the Rust implementation
function getFormatInfo(ecLevel: EcLevel, maskPattern: number): number {
  // EC level encoding in format info uses XOR with 1:
  // L(0) -> 01, M(1) -> 00, Q(2) -> 11, H(3) -> 10
  const data = ((ecLevel ^ 1) << 3) | maskPattern;
  let d = data << 10;
  for (let i = 0; i < 5; i++) {
    if (d & (1 << (14 - i))) {
      d ^= 0x0537 << (4 - i);
    }
  }
  return ((data << 10) | d) ^ 0x5412;
}

// Expected format info values from Rust implementation's FORMAT_INFOS_QR table
// Index is ((ec_level ^ 1) << 3) | mask_pattern
const EXPECTED_FORMAT_INFOS: number[] = [
  0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0,
  0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976,
  0x1689, 0x13be, 0x1ce7, 0x19d0, 0x0762, 0x0255, 0x0d0c, 0x083b,
  0x355f, 0x3068, 0x3f31, 0x3a06, 0x24b4, 0x2183, 0x2eda, 0x2bed,
];

describe('Format Info Calculation', () => {
  test('EC level XOR mapping is correct', () => {
    // L(0) -> 01, M(1) -> 00, Q(2) -> 11, H(3) -> 10
    expect(EcLevel.L ^ 1).toBe(1);
    expect(EcLevel.M ^ 1).toBe(0);
    expect(EcLevel.Q ^ 1).toBe(3);
    expect(EcLevel.H ^ 1).toBe(2);
  });

  test('format info matches Rust precomputed values for all EC levels and masks', () => {
    for (let ec = 0; ec < 4; ec++) {
      for (let mask = 0; mask < 8; mask++) {
        const index = ((ec ^ 1) << 3) | mask;
        const expected = EXPECTED_FORMAT_INFOS[index]!;
        const actual = getFormatInfo(ec, mask);
        expect(actual).toBe(expected);
      }
    }
  });

  test('specific format info values', () => {
    // EC L, mask 0: index = ((0 ^ 1) << 3) | 0 = 8 -> 0x77c4
    expect(getFormatInfo(EcLevel.L, 0)).toBe(0x77c4);

    // EC M, mask 0: index = ((1 ^ 1) << 3) | 0 = 0 -> 0x5412
    expect(getFormatInfo(EcLevel.M, 0)).toBe(0x5412);

    // EC Q, mask 0: index = ((2 ^ 1) << 3) | 0 = 24 -> 0x355f
    expect(getFormatInfo(EcLevel.Q, 0)).toBe(0x355f);

    // EC H, mask 0: index = ((3 ^ 1) << 3) | 0 = 16 -> 0x1689
    expect(getFormatInfo(EcLevel.H, 0)).toBe(0x1689);
  });

  test('format info bits are correctly structured', () => {
    // Format info is 15 bits: 2 bits EC + 3 bits mask + 10 bits BCH
    // All values should fit in 15 bits
    for (let ec = 0; ec < 4; ec++) {
      for (let mask = 0; mask < 8; mask++) {
        const formatInfo = getFormatInfo(ec, mask);
        expect(formatInfo).toBeLessThan(0x8000); // 15 bits max
        expect(formatInfo).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

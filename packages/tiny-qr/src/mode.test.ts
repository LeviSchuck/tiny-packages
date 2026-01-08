import { test, expect } from 'bun:test';
import { Mode } from './types.ts';
import { modeLengthBitsCount, modeMax } from './mode.ts';

test('Mode ordering', () => {
  expect(modeMax(Mode.Numeric, Mode.Alphanumeric)).toBe(Mode.Alphanumeric);
  expect(modeMax(Mode.Alphanumeric, Mode.Numeric)).toBe(Mode.Alphanumeric);
  expect(modeMax(Mode.Alphanumeric, Mode.Alphanumeric)).toBe(Mode.Alphanumeric);
});

test('Mode length bits count', () => {
  expect(modeLengthBitsCount(Mode.Numeric, 1)).toBe(10);
  expect(modeLengthBitsCount(Mode.Numeric, 10)).toBe(12);
  expect(modeLengthBitsCount(Mode.Numeric, 27)).toBe(14);
});

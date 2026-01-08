import { test, expect } from 'bun:test';
import { versionWidth } from './version.ts';

test('Version width', () => {
  expect(versionWidth(1)).toBe(21);
  expect(versionWidth(2)).toBe(25);
  expect(versionWidth(40)).toBe(177);
});

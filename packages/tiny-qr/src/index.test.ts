import { test, expect } from 'bun:test';
import { qrCode, debugString, EcLevel } from './index.ts';

test('qrcode can encode simple data', () => {
  const qr = qrCode({ data: 'HELLO WORLD' });
  expect(qr.width).toBeGreaterThan(0);
  expect(qr.version).toBeGreaterThan(0);
  expect(qr.ec).toBe(EcLevel.M);
});

test('qrcode can encode with different error correction levels', () => {
  const qrL = qrCode({ data: 'TEST', ec: EcLevel.L });
  const qrH = qrCode({ data: 'TEST', ec: EcLevel.H });

  expect(qrL.ec).toBe(EcLevel.L);
  expect(qrH.ec).toBe(EcLevel.H);

  // Higher error correction should require larger version or same
  expect(qrH.version).toBeGreaterThanOrEqual(qrL.version);
});

test('qrcode matrix returns correct dimensions', () => {
  const qr = qrCode({ data: 'TEST' });
  const { matrix, width } = qr;

  expect(matrix.length).toBe(width);
  expect(matrix[0]?.length).toBe(width);

  // Check all rows have same length
  for (const row of matrix) {
    expect(row.length).toBe(width);
  }
});

test('qrcode can encode binary data', () => {
  const data = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
  const qr = qrCode({ data });

  expect(qr.width).toBeGreaterThan(0);
});

test('debugstring produces output', () => {
  const qr = qrCode({ data: 'A' });
  const debugStr = debugString(qr);

  expect(debugStr.length).toBeGreaterThan(0);
  expect(debugStr).toContain('#');
  expect(debugStr).toContain('.');
  expect(debugStr).toContain('\n');
});

test('qrcode produces consistent output for same input', () => {
  const qr1 = qrCode({ data: 'HELLO' });
  const qr2 = qrCode({ data: 'HELLO' });

  expect(qr1.width).toBe(qr2.width);
  expect(qr1.version).toBe(qr2.version);
  expect(qr1.matrix).toEqual(qr2.matrix);
});

test('qrcode can handle numeric data', () => {
  const qr = qrCode({ data: '01234567' });
  expect(qr.width).toBeGreaterThan(0);
});

test('qrcode can handle alphanumeric data', () => {
  const qr = qrCode({ data: 'HELLO123' });
  expect(qr.width).toBeGreaterThan(0);
});

test('qrcode version 1 should be 21x21', () => {
  const qr = qrCode({ data: 'A' }); // Short data should use version 1
  expect(qr.width).toBe(21);
  expect(qr.version).toBe(1);
});

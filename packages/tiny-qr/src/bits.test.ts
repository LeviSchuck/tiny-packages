import { test, expect, describe } from 'bun:test';
import { encodeAuto, bitsIntoBytes } from './bits.ts';
import { EcLevel } from './types.ts';

describe('Bits Encoding', () => {
  test('encodes HELLO WORLD correctly for EC level Q', () => {
    // This matches the Rust test_hello_world test
    const data = new TextEncoder().encode('HELLO WORLD');
    const bits = encodeAuto(data, EcLevel.Q);
    const bytes = Array.from(bitsIntoBytes(bits));

    // Expected from Rust:
    // vec![
    //     0b00100000, 0b01011011, 0b00001011, 0b01111000, 0b11010001, 0b01110010, 0b11011100, 0b01001101,
    //     0b01000011, 0b01000000, 0b11101100, 0b00010001, 0b11101100,
    // ]
    const expected = [
      0b00100000, 0b01011011, 0b00001011, 0b01111000,
      0b11010001, 0b01110010, 0b11011100, 0b01001101,
      0b01000011, 0b01000000, 0b11101100, 0b00010001, 0b11101100,
    ];

    expect(bytes).toEqual(expected);
  });

  test('encodes numeric data correctly', () => {
    // Test encoding "01234567" as in Rust test_iso_18004_2006_example_1
    const data = new TextEncoder().encode('01234567');
    const bits = encodeAuto(data, EcLevel.L);
    const bytes = Array.from(bitsIntoBytes(bits));

    // The encoding should use numeric mode for this input
    // Expected bits: mode(4) + length(10) + encoded data + terminator + padding
    // For numeric mode: 0001 (mode) + length bits + data bits

    // Version 1, L level has 152 bits capacity = 19 bytes
    expect(bytes.length).toBe(19);
  });

  test('encodes mixed alphanumeric and numeric', () => {
    // Test "123A" which should use alphanumeric mode
    const data = new TextEncoder().encode('123A');
    const bits = encodeAuto(data, EcLevel.L);
    const bytes = Array.from(bitsIntoBytes(bits));

    // Should fit in version 1
    expect(bytes.length).toBe(19);
  });

  test('encodes byte mode data correctly', () => {
    // Test lowercase data which requires byte mode
    const data = new TextEncoder().encode('hello');
    const bits = encodeAuto(data, EcLevel.L);
    const bytes = Array.from(bitsIntoBytes(bits));

    // Byte mode: 0100 (mode) + 8 bits length + 8 bits per char
    // "hello" = 5 chars * 8 bits = 40 bits data + 4 bits mode + 8 bits length = 52 bits
    // Version 1, L has 152 bits = 19 bytes
    expect(bytes.length).toBe(19);

    // First byte should have mode indicator 0100 and start of length
    // Mode: 0100, Length for "hello" is 5 = 00000101
    // Combined: 0100 0000 0101 ...
    expect(bytes[0]).toBe(0b01000000);
    expect(bytes[1]).toBe(0b01010110); // 0101 (length cont) + 0110 (start of 'h')
  });
});

describe('Error Correction', () => {
  test('generates correct EC codewords for HELLO WORLD', () => {
    // Import the EC function
    const { constructCodewords } = require('./ec.ts');

    const data = new TextEncoder().encode('HELLO WORLD');
    const bits = encodeAuto(data, EcLevel.Q);
    const rawBytes = bitsIntoBytes(bits);
    const [dataBytes, ecBytes] = constructCodewords(rawBytes, 1, EcLevel.Q);

    // For version 1, Q level, there should be 13 EC codewords
    expect(ecBytes.length).toBe(13);
  });
});

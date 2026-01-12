import { test, expect, describe } from 'bun:test';
import {
  scanChunk,
  iterateChunks,
  findChunk,
  readIHDR,
  validatePngSignature,
  readPngIHDR,
  type PngChunk,
  type ColorType
} from '../reader';
import { indexedPng } from '../index';

describe('PNG Reader', () => {
  // Helper to create a minimal PNG for testing
  async function createTestPng(width: number, height: number, bitDepth: number = 8) {
    const pixels = new Uint8Array(width * height).fill(0);
    const colors: [number, number, number][] = [[0, 0, 0], [255, 255, 255]];
    return indexedPng(pixels, width, height, colors);
  }

  describe('validatePngSignature', () => {
    test('should validate correct PNG signature', async () => {
      const png = await createTestPng(4, 4);
      const view = new DataView(png.buffer);
      expect(validatePngSignature(view)).toBe(true);
    });

    test('should throw on invalid signature', () => {
      const invalid = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]);
      const view = new DataView(invalid.buffer);
      expect(() => validatePngSignature(view)).toThrow('Invalid PNG signature');
    });

    test('should throw on data too short', () => {
      const short = new Uint8Array([137, 80, 78, 71]);
      const view = new DataView(short.buffer);
      expect(() => validatePngSignature(view)).toThrow('Data too short');
    });
  });

  describe('scanChunk', () => {
    test('should scan IHDR chunk correctly', async () => {
      const png = await createTestPng(4, 4);
      const view = new DataView(png.buffer);

      // IHDR starts at offset 8 (after signature)
      const chunk = scanChunk(view, 8);

      expect(chunk.type).toBe('IHDR');
      expect(chunk.data.byteLength).toBe(13);
      expect(chunk.offset).toBe(8);
      expect(chunk.totalSize).toBe(25); // 4 + 4 + 13 + 4
    });

    test('should throw on out of bounds offset', async () => {
      const png = await createTestPng(4, 4);
      const view = new DataView(png.buffer);

      expect(() => scanChunk(view, png.length - 5)).toThrow('extends beyond data');
    });
  });

  describe('iterateChunks', () => {
    test('should iterate over all chunks', async () => {
      const png = await createTestPng(4, 4);
      const view = new DataView(png.buffer);

      const chunks: PngChunk[] = [];
      for (const chunk of iterateChunks(view, 8)) {
        chunks.push(chunk);
      }

      // Should have IHDR, PLTE, IDAT, IEND
      expect(chunks.length).toBe(4);
      expect(chunks[0]!.type).toBe('IHDR');
      expect(chunks[1]!.type).toBe('PLTE');
      expect(chunks[2]!.type).toBe('IDAT');
      expect(chunks[3]!.type).toBe('IEND');
    });
  });

  describe('findChunk', () => {
    test('should find IHDR chunk', async () => {
      const png = await createTestPng(8, 16);
      const view = new DataView(png.buffer);

      const result = findChunk(view, 'IHDR', (data) => {
        return {
          width: data.getUint32(0, false),
          height: data.getUint32(4, false),
        };
      }, 8);

      expect(result).toEqual({ width: 8, height: 16 });
    });

    test('should find PLTE chunk', async () => {
      const png = await createTestPng(4, 4);
      const view = new DataView(png.buffer);

      const result = findChunk(view, 'PLTE', (data) => data.byteLength, 8);

      expect(result).toBeGreaterThan(0);
    });

    test('should return undefined for non-existent chunk', async () => {
      const png = await createTestPng(4, 4);
      const view = new DataView(png.buffer);

      const result = findChunk(view, 'tEXt', (data) => data, 8);

      expect(result).toBeUndefined();
    });
  });

  describe('readIHDR', () => {
    test('should parse IHDR with indexed color', async () => {
      const png = await createTestPng(32, 64);
      const view = new DataView(png.buffer);

      // Get IHDR data directly
      const chunk = scanChunk(view, 8);
      const ihdr = readIHDR(chunk.data);

      expect(ihdr.width).toBe(32);
      expect(ihdr.height).toBe(64);
      expect(ihdr.bitDepth).toBe(1); // Only 2 colors, so 1-bit
      expect(ihdr.colorType).toBe('indexed');
      expect(ihdr.compressionMethod).toBe('deflate');
      expect(ihdr.filterMethod).toBe('adaptive');
      expect(ihdr.interlaceMethod).toBe('none');
    });

    test('should throw on invalid IHDR size', () => {
      const invalid = new DataView(new ArrayBuffer(10));
      expect(() => readIHDR(invalid)).toThrow('IHDR chunk must be 13 bytes');
    });

    test('should throw on zero width', () => {
      const data = new ArrayBuffer(13);
      const view = new DataView(data);
      view.setUint32(0, 0, false); // width = 0
      view.setUint32(4, 100, false); // height = 100
      view.setUint8(8, 8); // bit depth
      view.setUint8(9, 2); // color type (truecolor)
      view.setUint8(10, 0); // compression
      view.setUint8(11, 0); // filter
      view.setUint8(12, 0); // interlace

      expect(() => readIHDR(view)).toThrow('width cannot be zero');
    });

    test('should throw on zero height', () => {
      const data = new ArrayBuffer(13);
      const view = new DataView(data);
      view.setUint32(0, 100, false); // width = 100
      view.setUint32(4, 0, false); // height = 0
      view.setUint8(8, 8); // bit depth
      view.setUint8(9, 2); // color type (truecolor)
      view.setUint8(10, 0); // compression
      view.setUint8(11, 0); // filter
      view.setUint8(12, 0); // interlace

      expect(() => readIHDR(view)).toThrow('height cannot be zero');
    });

    test('should throw on invalid bit depth for color type', () => {
      const data = new ArrayBuffer(13);
      const view = new DataView(data);
      view.setUint32(0, 100, false);
      view.setUint32(4, 100, false);
      view.setUint8(8, 4); // bit depth 4 - invalid for truecolor
      view.setUint8(9, 2); // color type (truecolor)
      view.setUint8(10, 0);
      view.setUint8(11, 0);
      view.setUint8(12, 0);

      expect(() => readIHDR(view)).toThrow('Invalid bit depth');
    });

    test('should throw on invalid compression method', () => {
      const data = new ArrayBuffer(13);
      const view = new DataView(data);
      view.setUint32(0, 100, false);
      view.setUint32(4, 100, false);
      view.setUint8(8, 8);
      view.setUint8(9, 2);
      view.setUint8(10, 1); // invalid compression method
      view.setUint8(11, 0);
      view.setUint8(12, 0);

      expect(() => readIHDR(view)).toThrow('Invalid compression method');
    });

    test('should throw on invalid filter method', () => {
      const data = new ArrayBuffer(13);
      const view = new DataView(data);
      view.setUint32(0, 100, false);
      view.setUint32(4, 100, false);
      view.setUint8(8, 8);
      view.setUint8(9, 2);
      view.setUint8(10, 0);
      view.setUint8(11, 1); // invalid filter method
      view.setUint8(12, 0);

      expect(() => readIHDR(view)).toThrow('Invalid filter method');
    });

    test('should throw on invalid interlace method', () => {
      const data = new ArrayBuffer(13);
      const view = new DataView(data);
      view.setUint32(0, 100, false);
      view.setUint32(4, 100, false);
      view.setUint8(8, 8);
      view.setUint8(9, 2);
      view.setUint8(10, 0);
      view.setUint8(11, 0);
      view.setUint8(12, 2); // invalid interlace method

      expect(() => readIHDR(view)).toThrow('Invalid interlace method');
    });

    test('should parse all color types correctly', () => {
      const testCases: Array<{ colorType: number; bitDepth: number; expected: ColorType }> = [
        { colorType: 0, bitDepth: 8, expected: 'greyscale' },
        { colorType: 2, bitDepth: 8, expected: 'truecolor' },
        { colorType: 3, bitDepth: 8, expected: 'indexed' },
        { colorType: 4, bitDepth: 8, expected: 'greyscale-alpha' },
        { colorType: 6, bitDepth: 8, expected: 'truecolor-alpha' },
      ];

      for (const { colorType, bitDepth, expected } of testCases) {
        const data = new ArrayBuffer(13);
        const view = new DataView(data);
        view.setUint32(0, 100, false);
        view.setUint32(4, 100, false);
        view.setUint8(8, bitDepth);
        view.setUint8(9, colorType);
        view.setUint8(10, 0);
        view.setUint8(11, 0);
        view.setUint8(12, 0);

        const ihdr = readIHDR(view);
        expect(ihdr.colorType).toBe(expected);
      }
    });

    test('should parse adam7 interlace method', () => {
      const data = new ArrayBuffer(13);
      const view = new DataView(data);
      view.setUint32(0, 100, false);
      view.setUint32(4, 100, false);
      view.setUint8(8, 8);
      view.setUint8(9, 2);
      view.setUint8(10, 0);
      view.setUint8(11, 0);
      view.setUint8(12, 1); // adam7 interlace

      const ihdr = readIHDR(view);
      expect(ihdr.interlaceMethod).toBe('adam7');
    });
  });

  describe('readPngIHDR', () => {
    test('should read IHDR from valid PNG (Uint8Array)', async () => {
      const png = await createTestPng(128, 256);
      const ihdr = readPngIHDR(png);

      expect(ihdr.width).toBe(128);
      expect(ihdr.height).toBe(256);
      expect(ihdr.colorType).toBe('indexed');
    });

    test('should read IHDR from valid PNG (ArrayBuffer)', async () => {
      const png = await createTestPng(64, 32);
      const ihdr = readPngIHDR(png.buffer);

      expect(ihdr.width).toBe(64);
      expect(ihdr.height).toBe(32);
    });

    test('should throw on invalid PNG signature', () => {
      const invalid = new Uint8Array(100);
      expect(() => readPngIHDR(invalid)).toThrow('Invalid PNG signature');
    });

    test('should throw if IHDR not found', () => {
      // Create valid signature but no IHDR
      const fakeData = new Uint8Array([
        137, 80, 78, 71, 13, 10, 26, 10, // PNG signature
        0, 0, 0, 0, // length = 0
        73, 69, 78, 68, // "IEND"
        174, 66, 96, 130 // CRC
      ]);

      expect(() => readPngIHDR(fakeData)).toThrow('IHDR chunk not found');
    });

    test('should work with Uint8Array slice (subarray)', async () => {
      const png = await createTestPng(16, 16);

      // Create a larger buffer with the PNG in the middle
      const padded = new Uint8Array(png.length + 100);
      padded.set(png, 50);

      // Create a subarray view
      const subarray = padded.subarray(50, 50 + png.length);

      const ihdr = readPngIHDR(subarray);
      expect(ihdr.width).toBe(16);
      expect(ihdr.height).toBe(16);
    });
  });

  describe('integration: roundtrip', () => {
    test('should correctly read back generated PNG properties', async () => {
      const testCases = [
        { width: 1, height: 1 },
        { width: 100, height: 200 },
        { width: 1920, height: 1080 },
        { width: 7, height: 13 },
      ];

      for (const { width, height } of testCases) {
        const png = await createTestPng(width, height);
        const ihdr = readPngIHDR(png);

        expect(ihdr.width).toBe(width);
        expect(ihdr.height).toBe(height);
        expect(ihdr.colorType).toBe('indexed');
        expect(ihdr.compressionMethod).toBe('deflate');
        expect(ihdr.filterMethod).toBe('adaptive');
        expect(ihdr.interlaceMethod).toBe('none');
      }
    });
  });

  describe('real PNG files', () => {
    test('should read grayscale.png as greyscale', async () => {
      const file = Bun.file(new URL('./images/grayscale.png', import.meta.url));
      const buffer = await file.arrayBuffer();
      const ihdr = readPngIHDR(buffer);

      expect(ihdr.colorType).toBe('greyscale');
			expect(ihdr.bitDepth).toBe(8);
			expect(ihdr.width).toBe(8);
			expect(ihdr.height).toBe(8);
    });

    test('should read grayscale_alpha.png as greyscale-alpha', async () => {
      const file = Bun.file(new URL('./images/grayscale_alpha.png', import.meta.url));
      const buffer = await file.arrayBuffer();
      const ihdr = readPngIHDR(buffer);

      expect(ihdr.colorType).toBe('greyscale-alpha');
			expect(ihdr.bitDepth).toBe(16);
			expect(ihdr.width).toBe(8);
			expect(ihdr.height).toBe(8);
    });

    test('should read indexed.png as indexed', async () => {
      const file = Bun.file(new URL('./images/indexed.png', import.meta.url));
      const buffer = await file.arrayBuffer();
      const ihdr = readPngIHDR(buffer);

      expect(ihdr.colorType).toBe('indexed');
			expect(ihdr.bitDepth).toBe(2);
			expect(ihdr.width).toBe(8);
			expect(ihdr.height).toBe(8);
    });

    test('should read indexed_alpha.png as indexed', async () => {
      const file = Bun.file(new URL('./images/indexed_alpha.png', import.meta.url));
      const buffer = await file.arrayBuffer();
      const ihdr = readPngIHDR(buffer);

      expect(ihdr.colorType).toBe('indexed');
			expect(ihdr.bitDepth).toBe(8);
			expect(ihdr.width).toBe(8);
			expect(ihdr.height).toBe(8);
    });

    test('should read truecolor.png as truecolor', async () => {
      const file = Bun.file(new URL('./images/truecolor.png', import.meta.url));
      const buffer = await file.arrayBuffer();
      const ihdr = readPngIHDR(buffer);

      expect(ihdr.colorType).toBe('truecolor');
			expect(ihdr.bitDepth).toBe(16);
    });

    test('should read truecolor_alpha.png as truecolor-alpha', async () => {
      const file = Bun.file(new URL('./images/truecolor_alpha.png', import.meta.url));
      const buffer = await file.arrayBuffer();
      const ihdr = readPngIHDR(buffer);

      expect(ihdr.colorType).toBe('truecolor-alpha');
			expect(ihdr.bitDepth).toBe(8);
			expect(ihdr.width).toBe(8);
			expect(ihdr.height).toBe(8);
    });
  });
});

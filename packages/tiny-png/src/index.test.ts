import { test, expect, describe, afterAll } from 'bun:test';
import { 
  indexedPng, 
  scanChunk, 
  iterateChunks, 
  findChunk, 
  readIHDR, 
  validatePngSignature, 
  readPngIHDR,
  type IHDRData,
  type PngChunk,
  type ColorType
} from './index';

// Helper to check PNG signature
function isPng(buffer: ArrayBuffer): boolean {
  const view = new Uint8Array(buffer);
  return (
    view[0] === 137 &&
    view[1] === 80 &&
    view[2] === 78 &&
    view[3] === 71 &&
    view[4] === 13 &&
    view[5] === 10 &&
    view[6] === 26 &&
    view[7] === 10
  );
}

// Helper to extract bit depth from IHDR chunk
function getBitDepth(buffer: ArrayBuffer): number {
  const view = new DataView(buffer);
  // PNG sig (8) + IHDR length (4) + "IHDR" (4) + width (4) + height (4) = offset 24 for bit depth
  return view.getUint8(24);
}

describe('indexedPng', () => {
  describe('validation', () => {
    test('should throw on empty input', async () => {
      await expect(indexedPng(new Uint8Array(0), 0, 0, [])).rejects.toThrow('Received empty input');
    });

    test('should throw on dimension mismatch', async () => {
      await expect(
        indexedPng(new Uint8Array([0, 0, 0]), 2, 2, [[0, 0, 0]])
      ).rejects.toThrow('Input does not match dimensions');
    });

    test('should throw on insufficient palette colors', async () => {
      await expect(
        indexedPng(new Uint8Array([0, 1, 2, 3]), 2, 2, [[0, 0, 0], [255, 255, 255]])
      ).rejects.toThrow('Color palette does not have enough colors');
    });
  });

  describe('bit depth selection', () => {
    test('should generate valid PNG with 1-bit depth (2 colors)', async () => {
      const width = 8;
      const height = 8;
      const pixels = new Uint8Array(width * height);
      // Create a checkerboard pattern with 2 colors
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          pixels[y * width + x] = (x + y) % 2;
        }
      }

      const colors: [number, number, number][] = [
        [0, 0, 0],       // black
        [255, 255, 255]  // white
      ];

      const result = await indexedPng(pixels, width, height, colors);

      expect(isPng(result.buffer)).toBe(true);
      expect(getBitDepth(result.buffer)).toBe(1);

      // Write test file
      await Bun.write('./test-1bit.png', result);
    });

    test('should generate valid PNG with 2-bit depth (4 colors)', async () => {
      const width = 8;
      const height = 8;
      const pixels = new Uint8Array(width * height);
      // Create a pattern with 4 colors
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          pixels[y * width + x] = (x % 2) + (y % 2) * 2;
        }
      }

      const colors: [number, number, number][] = [
        [0, 0, 0],       // black
        [255, 0, 0],     // red
        [0, 255, 0],     // green
        [0, 0, 255]      // blue
      ];

      const result = await indexedPng(pixels, width, height, colors);

      expect(isPng(result.buffer)).toBe(true);
      expect(getBitDepth(result.buffer)).toBe(2);

      // Write test file
      await Bun.write('./test-2bit.png', result);
    });

    test('should generate valid PNG with 4-bit depth (16 colors)', async () => {
      const width = 16;
      const height = 16;
      const pixels = new Uint8Array(width * height);
      // Create a pattern with 16 colors (uses indices 0-15)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          pixels[y * width + x] = (x + y) % 16;
        }
      }

      const colors: [number, number, number][] = [];
      // Generate 16 grayscale colors
      for (let i = 0; i < 16; i++) {
        const v = Math.floor((i / 15) * 255);
        colors.push([v, v, v]);
      }

      const result = await indexedPng(pixels, width, height, colors);

      expect(isPng(result.buffer)).toBe(true);
      expect(getBitDepth(result.buffer)).toBe(4);

      // Write test file
      await Bun.write('./test-4bit.png', result);
    });

    test('should generate valid PNG with 8-bit depth (256 colors)', async () => {
      const width = 16;
      const height = 16;
      const pixels = new Uint8Array(width * height);
      // Create a pattern that uses index up to 255
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          pixels[y * width + x] = (y * width + x) % 256;
        }
      }

      const colors: [number, number, number][] = [];
      // Generate 256 colors
      for (let i = 0; i < 256; i++) {
        colors.push([i, 255 - i, (i * 3) % 256]);
      }

      const result = await indexedPng(pixels, width, height, colors);

      expect(isPng(result.buffer)).toBe(true);
      expect(getBitDepth(result.buffer)).toBe(8);

      // Write test file
      await Bun.write('./test-8bit.png', result);
    });

    test('should use 1-bit depth when only index 0 is used', async () => {
      const width = 4;
      const height = 4;
      const pixels = new Uint8Array(width * height).fill(0);

      const colors: [number, number, number][] = [[128, 128, 128]];

      const result = await indexedPng(pixels, width, height, colors);

      expect(isPng(result.buffer)).toBe(true);
      expect(getBitDepth(result.buffer)).toBe(1);
    });

    test('should use 2-bit depth when max index is 2 or 3', async () => {
      const width = 4;
      const height = 4;
      const pixels = new Uint8Array(width * height);
      pixels[0] = 3; // Max index

      const colors: [number, number, number][] = [
        [0, 0, 0],
        [85, 85, 85],
        [170, 170, 170],
        [255, 255, 255]
      ];

      const result = await indexedPng(pixels, width, height, colors);

      expect(isPng(result.buffer)).toBe(true);
      expect(getBitDepth(result.buffer)).toBe(2);
    });

    test('should use 4-bit depth when max index is between 4 and 15', async () => {
      const width = 4;
      const height = 4;
      const pixels = new Uint8Array(width * height);
      pixels[0] = 15; // Max index

      const colors: [number, number, number][] = [];
      for (let i = 0; i < 16; i++) {
        colors.push([i * 16, i * 16, i * 16]);
      }

      const result = await indexedPng(pixels, width, height, colors);

      expect(isPng(result.buffer)).toBe(true);
      expect(getBitDepth(result.buffer)).toBe(4);
    });

    test('should use 8-bit depth when max index is 16 or higher', async () => {
      const width = 4;
      const height = 4;
      const pixels = new Uint8Array(width * height);
      pixels[0] = 16; // Max index, just above 4-bit threshold

      const colors: [number, number, number][] = [];
      for (let i = 0; i < 17; i++) {
        colors.push([i * 15, i * 15, i * 15]);
      }

      const result = await indexedPng(pixels, width, height, colors);

      expect(isPng(result.buffer)).toBe(true);
      expect(getBitDepth(result.buffer)).toBe(8);
    });
  });

  describe('pixel packing correctness', () => {
    test('should correctly pack 1-bit pixels (8 pixels per byte)', async () => {
      // Create 8x1 image with alternating pattern
      const width = 8;
      const height = 1;
      const pixels = new Uint8Array([1, 0, 1, 0, 1, 0, 1, 0]);

      const colors: [number, number, number][] = [
        [0, 0, 0],
        [255, 255, 255]
      ];

      const result = await indexedPng(pixels, width, height, colors);
      expect(isPng(result.buffer)).toBe(true);
      expect(getBitDepth(result.buffer)).toBe(1);
    });

    test('should correctly pack 2-bit pixels (4 pixels per byte)', async () => {
      // Create 4x1 image using all 4 indices
      const width = 4;
      const height = 1;
      const pixels = new Uint8Array([0, 1, 2, 3]);

      const colors: [number, number, number][] = [
        [0, 0, 0],
        [85, 85, 85],
        [170, 170, 170],
        [255, 255, 255]
      ];

      const result = await indexedPng(pixels, width, height, colors);
      expect(isPng(result.buffer)).toBe(true);
      expect(getBitDepth(result.buffer)).toBe(2);
    });

    test('should correctly pack 4-bit pixels (2 pixels per byte)', async () => {
      // Create 4x1 image using indices 0-15
      const width = 4;
      const height = 1;
      const pixels = new Uint8Array([0, 5, 10, 15]);

      const colors: [number, number, number][] = [];
      for (let i = 0; i < 16; i++) {
        colors.push([i * 16, i * 16, i * 16]);
      }

      const result = await indexedPng(pixels, width, height, colors);
      expect(isPng(result.buffer)).toBe(true);
      expect(getBitDepth(result.buffer)).toBe(4);
    });

    test('should handle non-byte-aligned widths in 1-bit mode', async () => {
      // Width 5 means 5 bits per row, padded to 1 byte
      const width = 5;
      const height = 2;
      const pixels = new Uint8Array([
        1, 0, 1, 0, 1,
        0, 1, 0, 1, 0
      ]);

      const colors: [number, number, number][] = [
        [0, 0, 0],
        [255, 255, 255]
      ];

      const result = await indexedPng(pixels, width, height, colors);
      expect(isPng(result.buffer)).toBe(true);
      expect(getBitDepth(result.buffer)).toBe(1);
    });

    test('should handle non-byte-aligned widths in 4-bit mode', async () => {
      // Width 3 means 12 bits per row, padded to 2 bytes
      const width = 3;
      const height = 2;
      const pixels = new Uint8Array([
        0, 8, 15,
        15, 8, 0
      ]);

      const colors: [number, number, number][] = [];
      for (let i = 0; i < 16; i++) {
        colors.push([i * 16, i * 16, i * 16]);
      }

      const result = await indexedPng(pixels, width, height, colors);
      expect(isPng(result.buffer)).toBe(true);
      expect(getBitDepth(result.buffer)).toBe(4);
    });
  });
});

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
});

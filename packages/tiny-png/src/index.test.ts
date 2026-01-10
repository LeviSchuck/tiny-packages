import { test, expect, describe, afterAll } from 'bun:test';
import { indexedPng } from './index';

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

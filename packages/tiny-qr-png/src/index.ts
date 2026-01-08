import type { QrResult } from '@levischuck/tiny-qr';
import { indexedPng } from '@levischuck/tiny-png';

export interface PngOptions {
  margin?: number;
  moduleSize?: number;
  backgroundColor?: [number, number, number];
  foregroundColor?: [number, number, number];
}

export interface PngResult {
  bytes: Uint8Array;
  width: number;
  height: number;
}

export async function toPng(qr: QrResult, options: PngOptions = {}): Promise<PngResult> {
  const {
    margin = 4,
    moduleSize = 4,
    backgroundColor = [255, 255, 255],
    foregroundColor = [0, 0, 0]
  } = options;

  const { matrix } = qr;
  const width = matrix[0]?.length ?? 0;
  const height = matrix.length;
  const totalWidth = (width + margin * 2) * moduleSize;
  const totalHeight = (height + margin * 2) * moduleSize;

  // Create a buffer with the QR code data including margin
  const buffer = new Uint8Array(totalWidth * totalHeight);

  // Initialize with 0 (white)
  buffer.fill(0);

  // Draw the QR code modules
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (matrix[y]![x]) {
        // Fill the module with black (1)
        for (let dy = 0; dy < moduleSize; dy++) {
          for (let dx = 0; dx < moduleSize; dx++) {
            const px = (x + margin) * moduleSize + dx;
            const py = (y + margin) * moduleSize + dy;
            buffer[py * totalWidth + px] = 1;
          }
        }
      }
    }
  }

  const pngBytes = await indexedPng(buffer, totalWidth, totalHeight, [backgroundColor, foregroundColor]);

  return {
    bytes: pngBytes,
    width: totalWidth,
    height: totalHeight
  };
}

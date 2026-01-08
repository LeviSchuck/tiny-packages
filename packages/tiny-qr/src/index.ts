import { Color, EcLevel, type QrOptions, type QrResult } from './types.ts';
import { bitsIntoBytes, bitsVersion, encodeAuto } from './bits.ts';
import { constructCodewords } from './ec.ts';
import { canvasApplyBestMask, canvasDrawAllFunctionalPatterns, canvasDrawData, canvasIntoColors, createCanvas } from './canvas.ts';
import { versionWidth } from './version.ts';
export type { Version } from './types.ts'

/**
 * Generates a QR code from the given data
 * @param options - QR code generation options
 * @returns A QR code result object with matrix, width, version, and error correction level
 */
export function qrCode(options: QrOptions): QrResult {
  const { data, ec = EcLevel.M } = options;
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const bits = encodeAuto(bytes, ec);
  const version = bitsVersion(bits);
  const [encodedData, ecData] = constructCodewords(bitsIntoBytes(bits), version, ec);

  let canvas = createCanvas(version, ec);
  canvas = canvasDrawAllFunctionalPatterns(canvas);
  canvas = canvasDrawData(canvas, encodedData, ecData);
  canvas = canvasApplyBestMask(canvas);

  const width = versionWidth(version);
  const colors = canvasIntoColors(canvas);

  // Convert to matrix
  const matrix: boolean[][] = [];
  for (let y = 0; y < width; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < width; x++) {
      row.push(colors[y * width + x] === Color.Dark);
    }
    matrix.push(row);
  }

  return {
    matrix,
    width,
    version,
    ec,
  };
}

/**
 * Converts a QR code result to a debug string
 * @param qr - The QR code result object
 * @param darkChar - Character to use for dark modules (default: '#')
 * @param lightChar - Character to use for light modules (default: '.')
 * @returns A string representation of the QR code
 */
export function debugString(
  qr: QrResult,
  darkChar: string = '#',
  lightChar: string = '.'
): string {
  let result = '';
  for (let y = 0; y < qr.width; y++) {
    for (let x = 0; x < qr.width; x++) {
      result += qr.matrix[y]![x] ? darkChar : lightChar;
    }
    result += '\n';
  }
  return result;
}

// Re-export types
export { EcLevel };
export type { QrOptions, QrResult };

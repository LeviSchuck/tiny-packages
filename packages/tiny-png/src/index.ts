import { concat } from "./bytes.ts";
import { deflate } from "./compress.ts";
import { pngChunk } from "./pngBytes.ts";
import { calculateBitDepth, packPixelData } from "./writer.ts";

// Re-export reader functions and types
export {
  scanChunk,
  iterateChunks,
  findChunk,
  readIHDR,
  validatePngSignature,
  readPngIHDR,
  type PngChunk,
  type ColorType,
  type InterlaceMethod,
  type IHDRData,
} from "./reader.ts";

/**
 * Generate an indexed-color PNG image, up to 256 colors are supported
 *
 * Automatically selects the optimal bit depth based on the number of colors used:
 * - 1-bit for 2 or fewer colors
 * - 2-bit for 4 or fewer colors
 * - 4-bit for 16 or fewer colors
 * - 8-bit for up to 256 colors
 *
 * @param input - Pixel data as a Uint8Array where each byte is a palette index
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param colors - Color palette as an array of `[R, G, B]` tuples (0-255)
 * @returns Promise resolving to PNG file bytes as a Uint8Array
 * @throws Error if the color palette doesn't have enough colors for the highest index in the input data.
 * @throws Error if the input does not match the dimensions.
 * @throws Error if the input is empty.
 */
export async function indexedPng(
  input: Uint8Array,
  width: number,
  height: number,
  colors: [number, number, number][]
): Promise<Uint8Array<ArrayBuffer>> {
  const inputView = new DataView(input.buffer);
  const inputLength = inputView.byteLength;

  // Validate input is not empty first
  if (inputLength === 0) {
    throw new Error(`Received empty input`);
  }

  // Validate dimensions
  if (inputLength !== width * height) {
    throw new Error(
      `Input does not match dimensions ${width}x${height}. Only ${inputLength} bytes were given when ${width * height} are expected!`
    );
  }

  // Find the maximum index used in the input
  let maxIndex = 0;
  for (let i = 0; i < inputLength; i++) {
    const index = inputView.getUint8(i);
    if (index > maxIndex) {
      maxIndex = index;
    }
  }

  // Validate palette has enough colors
  if (colors.length <= maxIndex) {
    throw new Error(
      `Color palette does not have enough colors (${maxIndex + 1}). Only ${colors.length} were given!`
    );
  }

  // Calculate optimal bit depth
  const bitDepth = calculateBitDepth(maxIndex);

  // PNG Header
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR: Indexed color with calculated bit depth
  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdrView.setUint8(8, bitDepth);
  ihdrView.setUint8(9, 3); // Indexed color
  ihdrView.setUint8(10, 0); // Compression method: deflate
  ihdrView.setUint8(11, 0); // Filter method: adaptive
  ihdrView.setUint8(12, 0); // Interlace method: none
  const ihdr = pngChunk("IHDR", ihdrData);

  // PLTE: Build palette from colors array
  const plteData = new Uint8Array(colors.length * 3);
  const plteDataView = new DataView(plteData.buffer);
  for (let i = 0; i <= maxIndex; i++) {
    plteDataView.setUint8(i * 3, colors[i]![0]);
    plteDataView.setUint8(i * 3 + 1, colors[i]![1]);
    plteDataView.setUint8(i * 3 + 2, colors[i]![2]);
  }
  const plte = pngChunk("PLTE", plteData);

	// Future note: If adding transparency support, a tRNS chunk is needed here.
	// https://www.w3.org/TR/png-3/#11tRNS
	// For color type 3 (indexed-color), the tRNS chunk contains a series of one-byte alpha values,
	// corresponding to entries in the PLTE chunk. Each entry indicates that pixels of the
	// corresponding palette index shall be treated as having the specified alpha value.
	// Alpha values have the same interpretation as in an 8-bit full alpha channel: 0 is fully
	// transparent, 255 is fully opaque, regardless of image bit depth. The tRNS chunk shall not
	// contain more alpha values than there are palette entries, but a tRNS chunk may contain fewer
	// values than there are palette entries. In this case, the alpha value for all remaining
	// palette entries is assumed to be 255. In the common case in which only palette index 0
	// need be made transparent, only a one-byte tRNS chunk is needed, and when all palette
	// indices are opaque, the tRNS chunk may be omitted.

  // Pack pixel data according to bit depth
  const uncompressed = packPixelData(inputView, width, height, bitDepth);

  const idat = pngChunk("IDAT", await deflate(uncompressed));
  const iend = pngChunk("IEND", new Uint8Array(0));

  return concat(sig, ihdr, plte, idat, iend);
}

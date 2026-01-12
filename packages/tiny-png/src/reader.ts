/**
 * PNG chunk reading and parsing utilities
 */

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const TEXT_DECODER = new TextDecoder();

/**
 * Represents a PNG chunk with its metadata and data
 */
export interface PngChunk {
  /** 4-character chunk type name (e.g., "IHDR", "IDAT", "IEND") */
  type: string;
  /** Chunk data (excluding length, type, and CRC) */
  data: DataView;
  /** Offset of the chunk in the original data (points to length field) */
  offset: number;
  /** Total chunk size including length, type, data, and CRC */
  totalSize: number;
}

/**
 * Color type strings for PNG images
 */
export type ColorType =
  | "greyscale"
  | "truecolor"
  | "indexed"
  | "greyscale-alpha"
  | "truecolor-alpha";

/**
 * Interlace method strings
 */
export type InterlaceMethod = "none" | "adam7";

/**
 * Bits per sample or palette index (1, 2, 4, 8, or 16)
 */
export type BitDepth = 1 | 2 | 4 | 8 | 16;

/**
 * Parsed IHDR (Image Header) chunk data
 */
export interface IHDRData {
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Bits per sample or palette index (1, 2, 4, 8, or 16) */
  bitDepth: BitDepth;
  /** Color type of the image */
  colorType: ColorType;
  /** Compression method (always 'deflate' for valid PNGs) */
  compressionMethod: "deflate";
  /** Filter method (always 'adaptive' for valid PNGs) */
  filterMethod: "adaptive";
  /** Interlace method */
  interlaceMethod: InterlaceMethod;
}

/**
 * Maps numeric color type to string representation
 */
function parseColorType(value: number): ColorType {
  switch (value) {
    case 0:
      return "greyscale";
    case 2:
      return "truecolor";
    case 3:
      return "indexed";
    case 4:
      return "greyscale-alpha";
    case 6:
      return "truecolor-alpha";
    default:
      throw new Error(`Invalid color type: ${value}`);
  }
}

/**
 * Maps numeric interlace method to string representation
 */
function parseInterlaceMethod(value: number): InterlaceMethod {
  switch (value) {
    case 0:
      return "none";
    case 1:
      return "adam7";
    default:
      throw new Error(`Invalid interlace method: ${value}`);
  }
}

/**
 * Validates bit depth for a given color type according to PNG spec
 */
function validateBitDepth(
  bitDepth: number,
  colorType: number
): bitDepth is BitDepth {
  const validCombinations: Record<number, number[]> = {
    0: [1, 2, 4, 8, 16], // Greyscale
    2: [8, 16], // Truecolor
    3: [1, 2, 4, 8], // Indexed
    4: [8, 16], // Greyscale with alpha
    6: [8, 16], // Truecolor with alpha
  };

  const allowed = validCombinations[colorType];
  if (!allowed) {
    throw new Error(`Invalid color type: ${colorType}`);
  }

  if (!allowed.includes(bitDepth)) {
    throw new Error(
      `Invalid bit depth ${bitDepth} for color type ${colorType}. Allowed: ${allowed.join(", ")}`
    );
  }

  return true;
}

/**
 * Scans a PNG chunk at the given offset in a DataView
 *
 * @param view - DataView of the PNG data
 * @param offset - Byte offset where the chunk starts (at the length field)
 * @returns The parsed chunk information
 * @throws Error if the offset is out of bounds or chunk is malformed
 */
export function scanChunk(view: DataView, offset: number): PngChunk {
  if (offset + 12 > view.byteLength) {
    throw new Error(
      `Chunk at offset ${offset} extends beyond data (need at least 12 bytes for header)`
    );
  }

  const length = view.getUint32(offset, false); // Big-endian
  const typeBytes = new Uint8Array(view.buffer, view.byteOffset + offset + 4, 4);
  const type = TEXT_DECODER.decode(typeBytes);

  const totalSize = 4 + 4 + length + 4; // length + type + data + crc

  if (offset + totalSize > view.byteLength) {
    throw new Error(
      `Chunk "${type}" at offset ${offset} extends beyond data (chunk size: ${totalSize}, available: ${view.byteLength - offset})`
    );
  }

  const data = new DataView(view.buffer, view.byteOffset + offset + 8, length);

  return {
    type,
    data,
    offset,
    totalSize,
  };
}

/**
 * Generator that iterates over all chunks in a PNG DataView
 *
 * @param view - DataView of the PNG data (should start after PNG signature)
 * @param startOffset - Byte offset to start scanning from (default: 0, assumes signature already skipped)
 * @yields Each chunk in sequence
 */
export function* iterateChunks(
  view: DataView,
  startOffset: number = 0
): Generator<PngChunk, void, unknown> {
  let offset = startOffset;

  while (offset < view.byteLength) {
    const chunk = scanChunk(view, offset);
    yield chunk;
    offset += chunk.totalSize;
  }
}

/**
 * Finds a chunk by its type name and calls a reader function on it
 *
 * @param view - DataView of the PNG data (after signature)
 * @param chunkType - The 4-character chunk type to find (e.g., "IHDR")
 * @param reader - Function to call with the chunk's data DataView
 * @param startOffset - Byte offset to start scanning from (default: 0)
 * @returns The result of the reader function, or undefined if chunk not found
 */
export function findChunk<T>(
  view: DataView,
  chunkType: string,
  reader: (data: DataView) => T,
  startOffset: number = 0
): T | undefined {
  for (const chunk of iterateChunks(view, startOffset)) {
    if (chunk.type === chunkType) {
      return reader(chunk.data);
    }
  }
  return undefined;
}

/**
 * Reads and parses an IHDR chunk from its data
 *
 * @param data - DataView of the IHDR chunk data (13 bytes)
 * @returns Parsed IHDR data with human-readable type strings
 * @throws Error if the IHDR data is invalid
 */
export function readIHDR(data: DataView): IHDRData {
  if (data.byteLength !== 13) {
    throw new Error(`IHDR chunk must be 13 bytes, got ${data.byteLength}`);
  }

  const width = data.getUint32(0, false);
  const height = data.getUint32(4, false);
  const bitDepth = data.getUint8(8);
  const colorTypeNum = data.getUint8(9);
  const compressionMethod = data.getUint8(10);
  const filterMethod = data.getUint8(11);
  const interlaceMethodNum = data.getUint8(12);

  // Validate width and height
  if (width === 0) {
    throw new Error("IHDR width cannot be zero");
  }
  if (height === 0) {
    throw new Error("IHDR height cannot be zero");
  }

  // Validate compression method
  if (compressionMethod !== 0) {
    throw new Error(
      `Invalid compression method: ${compressionMethod}. Only 0 (deflate) is supported.`
    );
  }

  // Validate filter method
  if (filterMethod !== 0) {
    throw new Error(
      `Invalid filter method: ${filterMethod}. Only 0 (adaptive) is supported.`
    );
  }

  // Validate bit depth for color type
  validateBitDepth(bitDepth, colorTypeNum);

  const colorType = parseColorType(colorTypeNum);
  const interlaceMethod = parseInterlaceMethod(interlaceMethodNum);

  return {
    width,
    height,
    bitDepth: bitDepth as BitDepth,
    colorType,
    compressionMethod: "deflate",
    filterMethod: "adaptive",
    interlaceMethod,
  };
}

/**
 * Validates that the data starts with a valid PNG signature
 *
 * @param view - DataView of the data to check
 * @returns true if the signature is valid
 * @throws Error if the signature is invalid or data is too short
 */
export function validatePngSignature(view: DataView): boolean {
  if (view.byteLength < 8) {
    throw new Error("Data too short to contain PNG signature");
  }

  for (let i = 0; i < 8; i++) {
    if (view.getUint8(i) !== PNG_SIGNATURE[i]) {
      throw new Error("Invalid PNG signature");
    }
  }

  return true;
}

/**
 * Reads a PNG and extracts the parsed IHDR data
 *
 * This is a convenience function that combines signature validation,
 * chunk scanning, and IHDR parsing.
 *
 * @param data - PNG file data as Uint8Array or ArrayBuffer
 * @returns Parsed IHDR data with human-readable type strings
 * @throws Error if the PNG is invalid or IHDR chunk is not found
 */
export function readPngIHDR(data: Uint8Array | ArrayBuffer): IHDRData {
  const buffer = data instanceof Uint8Array ? data.buffer : data;
  const byteOffset = data instanceof Uint8Array ? data.byteOffset : 0;
  const byteLength = data instanceof Uint8Array ? data.byteLength : data.byteLength;

  const view = new DataView(buffer, byteOffset, byteLength);

  // Validate PNG signature
  validatePngSignature(view);

  // Find and read IHDR chunk (starts after 8-byte signature)
  const ihdr = findChunk(view, "IHDR", readIHDR, 8);

  if (ihdr === undefined) {
    throw new Error("IHDR chunk not found in PNG");
  }

  return ihdr;
}

import { Mode } from './types.ts';
import type { EcLevel, Version } from './types.ts';
import { createOptimizer, createParser, optimizerCollect, totalEncodedLen } from './optimize.ts';
import type { Segment } from './optimize.ts';
import { versionFetch, versionModeBitsCount } from './version.ts';
import { modeLengthBitsCount } from './mode.ts';

function truncateU8(n: number): number {
  return n & 0xff;
}

// Data capacity table from ISO/IEC 18004:2006 §6.4.10, Table 7
const DATA_LENGTHS: ReadonlyArray<readonly [number, number, number, number]> = [
  // Normal versions 1-40
  [152, 128, 104, 72],
  [272, 224, 176, 128],
  [440, 352, 272, 208],
  [640, 512, 384, 288],
  [864, 688, 496, 368],
  [1088, 864, 608, 480],
  [1248, 992, 704, 528],
  [1552, 1232, 880, 688],
  [1856, 1456, 1056, 800],
  [2192, 1728, 1232, 976],
  [2592, 2032, 1440, 1120],
  [2960, 2320, 1648, 1264],
  [3424, 2672, 1952, 1440],
  [3688, 2920, 2088, 1576],
  [4184, 3320, 2360, 1784],
  [4712, 3624, 2600, 2024],
  [5176, 4056, 2936, 2264],
  [5768, 4504, 3176, 2504],
  [6360, 5016, 3560, 2728],
  [6888, 5352, 3880, 3080],
  [7456, 5712, 4096, 3248],
  [8048, 6256, 4544, 3536],
  [8752, 6880, 4912, 3712],
  [9392, 7312, 5312, 4112],
  [10208, 8000, 5744, 4304],
  [10960, 8496, 6032, 4768],
  [11744, 9024, 6464, 5024],
  [12248, 9544, 6968, 5288],
  [13048, 10136, 7288, 5608],
  [13880, 10984, 7880, 5960],
  [14744, 11640, 8264, 6344],
  [15640, 12328, 8920, 6760],
  [16568, 13048, 9368, 7208],
  [17528, 13800, 9848, 7688],
  [18448, 14496, 10288, 7888],
  [19472, 15312, 10832, 8432],
  [20528, 15936, 11408, 8768],
  [21616, 16816, 12016, 9136],
  [22496, 17728, 12656, 9776],
  [23648, 18672, 13328, 10208],
];

/** The Bits state stores the encoded data for a QR code */
export interface BitsState {
  readonly data: number[];
  readonly bitOffset: number;
  readonly version: Version;
}

/** Creates a new bits state */
export function createBits(version: Version): BitsState {
  return {
    data: [],
    bitOffset: 0,
    version,
  };
}

/** Gets the version from bits state */
export function bitsVersion(bits: BitsState): Version {
  return bits.version;
}

/** Pushes an N-bit big-endian integer to the end of the bits */
function pushNumber(bits: BitsState, n: number, number: number): BitsState {
  const b = bits.bitOffset + n;
  const lastIndex = bits.data.length - 1;
  const newData = [...bits.data];

  if (bits.bitOffset === 0) {
    if (b <= 8) {
      newData.push(truncateU8(number << (8 - b)));
    } else {
      newData.push(truncateU8(number >> (b - 8)));
      newData.push(truncateU8(number << (16 - b)));
    }
  } else if (b <= 8) {
    newData[lastIndex]! |= truncateU8(number << (8 - b));
  } else if (b <= 16) {
    newData[lastIndex]! |= truncateU8(number >> (b - 8));
    newData.push(truncateU8(number << (16 - b)));
  } else {
    newData[lastIndex]! |= truncateU8(number >> (b - 8));
    newData.push(truncateU8(number >> (b - 16)));
    newData.push(truncateU8(number << (24 - b)));
  }

  return {
    ...bits,
    data: newData,
    bitOffset: b & 7,
  };
}

/** Pushes an N-bit big-endian integer with bounds checking */
function pushNumberChecked(bits: BitsState, n: number, number: number): BitsState {
  if (n > 16 || number >= 1 << n) {
    throw new Error('Data too long');
  }
  return pushNumber(bits, n, number);
}

/** Convert the bits into a bytes array */
export function bitsIntoBytes(bits: BitsState): Uint8Array {
  return new Uint8Array(bits.data);
}

/** Total number of bits currently pushed */
function bitsLen(bits: BitsState): number {
  if (bits.bitOffset === 0) {
    return bits.data.length * 8;
  }
  return (bits.data.length - 1) * 8 + bits.bitOffset;
}

/** The maximum number of bits allowed */
function bitsMaxLen(bits: BitsState, ecLevel: EcLevel): number {
  return versionFetch(bits.version, ecLevel, DATA_LENGTHS);
}

/** Pushes mode indicator */
function pushModeIndicator(bits: BitsState, mode: Mode): BitsState {
  const modeBits = versionModeBitsCount(bits.version);
  let number: number;
  switch (mode) {
    case Mode.Numeric:
      number = 0b0001;
      break;
    case Mode.Alphanumeric:
      number = 0b0010;
      break;
    case Mode.Byte:
      number = 0b0100;
      break;
  }
  return pushNumberChecked(bits, modeBits, number);
}

/** Pushes header with mode and length */
function pushHeader(bits: BitsState, mode: Mode, rawDataLen: number): BitsState {
  const lengthBits = modeLengthBitsCount(mode, bits.version);
  let newBits = pushModeIndicator(bits, mode);
  return pushNumberChecked(newBits, lengthBits, rawDataLen);
}

/** Encodes numeric data (0-9) */
function pushNumericData(bits: BitsState, data: Uint8Array): BitsState {
  let newBits = pushHeader(bits, Mode.Numeric, data.length);
  for (let i = 0; i < data.length; i += 3) {
    const chunk = data.slice(i, Math.min(i + 3, data.length));
    let number = 0;
    for (const byte of chunk) {
      number = number * 10 + (byte - 0x30); // '0' = 0x30
    }
    const length = chunk.length * 3 + 1;
    newBits = pushNumber(newBits, length, number);
  }
  return newBits;
}

/** Encodes alphanumeric data */
function pushAlphanumericData(bits: BitsState, data: Uint8Array): BitsState {
  let newBits = pushHeader(bits, Mode.Alphanumeric, data.length);
  for (let i = 0; i < data.length; i += 2) {
    const chunk = data.slice(i, Math.min(i + 2, data.length));
    let number = 0;
    for (const byte of chunk) {
      number = number * 45 + alphanumericDigit(byte);
    }
    const length = chunk.length * 5 + 1;
    newBits = pushNumber(newBits, length, number);
  }
  return newBits;
}

/** Encodes byte data */
function pushByteData(bits: BitsState, data: Uint8Array): BitsState {
  let newBits = pushHeader(bits, Mode.Byte, data.length);
  for (const byte of data) {
    newBits = pushNumber(newBits, 8, byte);
  }
  return newBits;
}

/** Pushes terminator and padding */
export function bitsPushTerminator(bits: BitsState, ecLevel: EcLevel): BitsState {
  const terminatorSize = 4; // Normal QR codes use 4 bits

  const curLength = bitsLen(bits);
  const dataLength = bitsMaxLen(bits, ecLevel);
  if (curLength > dataLength) {
    throw new Error('Data too long');
  }

  let newBits = bits;
  const actualTerminatorSize = Math.min(terminatorSize, dataLength - curLength);
  if (actualTerminatorSize > 0) {
    newBits = pushNumber(newBits, actualTerminatorSize, 0);
  }

  // Add padding to byte boundary
  if (bitsLen(newBits) < dataLength) {
    const PADDING_BYTES = [0b11101100, 0b00010001];
    const newData = [...newBits.data];
    const dataBytesLength = Math.floor(dataLength / 8);
    const paddingBytesCount = dataBytesLength - newData.length;
    for (let i = 0; i < paddingBytesCount; i++) {
      newData.push(PADDING_BYTES[i % 2]!);
    }
    newBits = {
      ...newBits,
      data: newData,
      bitOffset: 0,
    };
  }

  // Final padding if needed
  if (bitsLen(newBits) < dataLength) {
    const newData = [...newBits.data];
    newData.push(0);
    newBits = {
      ...newBits,
      data: newData,
    };
  }

  return newBits;
}

/** Pushes segments */
export function bitsPushSegments(bits: BitsState, data: Uint8Array, segments: Segment[]): BitsState {
  let newBits = bits;
  for (const segment of segments) {
    const slice = data.slice(segment.begin, segment.end);
    switch (segment.mode) {
      case Mode.Numeric:
        newBits = pushNumericData(newBits, slice);
        break;
      case Mode.Alphanumeric:
        newBits = pushAlphanumericData(newBits, slice);
        break;
      case Mode.Byte:
        newBits = pushByteData(newBits, slice);
        break;
    }
  }
  return newBits;
}

/** Pushes data using optimal encoding */
export function bitsPushOptimalData(bits: BitsState, data: Uint8Array): BitsState {
  const parser = createParser(data);
  const optimizer = createOptimizer(parser, bits.version);
  const segments = optimizerCollect(optimizer);
  return bitsPushSegments(bits, data, segments);
}

/** Converts alphanumeric character to its digit value */
function alphanumericDigit(character: number): number {
  if (character >= 0x30 && character <= 0x39) return character - 0x30; // 0-9
  if (character >= 0x41 && character <= 0x5a) return character - 0x41 + 10; // A-Z
  if (character === 0x20) return 36; // space
  if (character === 0x24) return 37; // $
  if (character === 0x25) return 38; // %
  if (character === 0x2a) return 39; // *
  if (character === 0x2b) return 40; // +
  if (character === 0x2d) return 41; // -
  if (character === 0x2e) return 42; // .
  if (character === 0x2f) return 43; // /
  if (character === 0x3a) return 44; // :
  return 0;
}

/** Finds the minimum version that can store N bits */
function findMinVersion(length: number, ecLevel: EcLevel): Version {
  let base = 0;
  let size = 39;

  while (size > 1) {
    const half = Math.floor(size / 2);
    const mid = base + half;
    base = DATA_LENGTHS[mid]![ecLevel] > length ? base : mid;
    size -= half;
  }

  base = DATA_LENGTHS[base]![ecLevel] >= length ? base : base + 1;
  return base + 1;
}

/** Automatically determines minimum version and encodes data */
export function encodeAuto(data: Uint8Array, ecLevel: EcLevel): BitsState {
  for (const version of [9, 26, 40]) {
    const parser = createParser(data);
    const optimizer = createOptimizer(parser, version);
    const optSegments = optimizerCollect(optimizer);
    const totalLen = totalEncodedLen(optSegments, version);
    const dataCapacity = versionFetch(version, ecLevel, DATA_LENGTHS);

    if (totalLen <= dataCapacity) {
      const minVersion = findMinVersion(totalLen, ecLevel);
      let bits = createBits(minVersion);
      bits = bitsPushSegments(bits, data, optSegments);
      bits = bitsPushTerminator(bits, ecLevel);
      return bits;
    }
  }

  throw new Error('Data too long');
}

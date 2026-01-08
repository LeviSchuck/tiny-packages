import type { Version } from "./types.ts";
import { Mode } from "./types.ts";

/** Computes the number of bits needed to encode the data length */
export function modeLengthBitsCount(mode: Mode, version: Version): number {
  if (version >= 1 && version <= 9) {
    switch (mode) {
      case Mode.Numeric:
        return 10;
      case Mode.Alphanumeric:
        return 9;
      case Mode.Byte:
        return 8;
    }
  } else if (version >= 10 && version <= 26) {
    switch (mode) {
      case Mode.Numeric:
        return 12;
      case Mode.Alphanumeric:
        return 11;
      case Mode.Byte:
        return 16;
    }
  } else {
    // version >= 27
    switch (mode) {
      case Mode.Numeric:
        return 14;
      case Mode.Alphanumeric:
        return 13;
      case Mode.Byte:
        return 16;
    }
  }
}

/** Computes the number of bits needed to encode data of a given length */
export function modeDataBitsCount(mode: Mode, rawDataLen: number): number {
  switch (mode) {
    case Mode.Numeric:
      return Math.floor((rawDataLen * 10 + 2) / 3);
    case Mode.Alphanumeric:
      return Math.floor((rawDataLen * 11 + 1) / 2);
    case Mode.Byte:
      return rawDataLen * 8;
  }
}

/** Find the lowest common mode which both modes are compatible with */
export function modeMax(a: Mode, b: Mode): Mode {
  const cmp = partialCmp(a, b);
  if (cmp === null) return Mode.Byte;
  return cmp > 0 ? a : b;
}

/** Partial ordering between modes */
function partialCmp(a: Mode, b: Mode): number | null {
  if (a === b) return 0;
  if (a === Mode.Numeric && b === Mode.Alphanumeric) return -1;
  if (a === Mode.Alphanumeric && b === Mode.Numeric) return 1;
  if (b === Mode.Byte) return -1;
  if (a === Mode.Byte) return 1;
  return null; // Numeric/Alphanumeric
}
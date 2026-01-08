import type { EcLevel, Version } from "./types.ts";

/** Gets the width of the QR code in modules */
export function versionWidth(version: Version): number {
  return version * 4 + 17;
}

/** Gets the number of bits needed to encode the mode indicator */
export function versionModeBitsCount(version: Version): number {
  return 4; // Normal QR codes always use 4 bits
}

/** Fetches a value from a lookup table */
export function versionFetch<T>(
  version: Version,
  ecLevel: EcLevel,
  table: ReadonlyArray<readonly [T, T, T, T]>
): T {
  if (version < 1 || version > 40) {
    throw new Error('Invalid version');
  }
  return table[version - 1]![ecLevel]!;
}
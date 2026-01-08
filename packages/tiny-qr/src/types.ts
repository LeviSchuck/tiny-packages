/** The color of a module */
export enum Color {
  Light = 0,
  Dark = 1,
}

/** Error correction level */
export enum EcLevel {
  /** Low error correction. Allows up to 7% of wrong blocks. */
  L = 0,
  /** Medium error correction. Allows up to 15% of wrong blocks. */
  M = 1,
  /** "Quartile" error correction. Allows up to 25% of wrong blocks. */
  Q = 2,
  /** High error correction. Allows up to 30% of wrong blocks. */
  H = 3,
}

/** QR code version (1-40) */
export type Version = number;

/** Encoding mode */
export enum Mode {
  /** Numeric mode (0-9) */
  Numeric = 0,
  /** Alphanumeric mode (0-9, A-Z, space, $, %, *, +, -, ., /, :) */
  Alphanumeric = 1,
  /** Byte mode (arbitrary binary data) */
  Byte = 2,
}

/** QR code result object */
export interface QrResult {
  /** 2D array of booleans (true = dark, false = light) */
  matrix: boolean[][];
  /** Width of the QR code in modules */
  width: number;
  /** QR code version (1-40) */
  version: Version;
  /** Error correction level used */
  ec: EcLevel;
}

/** Options for generating a QR code */
export interface QrOptions {
  /** Data to encode (string or binary data) */
  data: string | Uint8Array;
  /** Error correction level (defaults to Medium) */
  ec?: EcLevel;
}

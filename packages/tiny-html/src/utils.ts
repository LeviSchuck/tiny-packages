/**
 * Converts a kebab-case or snake_case string to camelCase
 * @example toCamelCase("foo-bar") => "fooBar"
 * @example toCamelCase("background-color") => "backgroundColor"
 */
export function toCamelCase(str: string): string {
  return str.replace(/[-_]([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Converts a camelCase string to kebab-case
 * @example toKebabCase("fooBar") => "foo-bar"
 * @example toKebabCase("backgroundColor") => "background-color"
 */
export function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

/**
 * Efficient string builder using array accumulation
 */
export class StringBuilder {
  private chunks: string[] = [];

  append(str: string): void {
    this.chunks.push(str);
  }

  toString(): string {
    return this.chunks.join('');
  }

  clear(): void {
    this.chunks = [];
  }

  get length(): number {
    return this.chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  }
}

/**
 * Decodes a UTF-8 byte sequence to a string
 */
export function decodeUtf8(bytes: Uint8Array, start: number, end: number): string {
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes.slice(start, end));
}

/**
 * Checks if a character code is whitespace
 */
export function isWhitespace(code: number): boolean {
  return code === 0x20 || code === 0x09 || code === 0x0A || code === 0x0D;
}

/**
 * Checks if a character code is valid for tag/attribute names
 */
export function isNameChar(code: number): boolean {
  return (
    (code >= 0x61 && code <= 0x7A) || // a-z
    (code >= 0x41 && code <= 0x5A) || // A-Z
    (code >= 0x30 && code <= 0x39) || // 0-9
    code === 0x2D || // -
    code === 0x5F || // _
    code === 0x3A    // :
  );
}

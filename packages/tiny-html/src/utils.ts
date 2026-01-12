import { parseHtml } from "./parser.ts";
import type { HtmlElement, HtmlNode } from "./types.ts";

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

/**
 * Find the first HtmlElement in the HtmlNode, may be an html string.
 *
 * @param node - the result of readHtml or a string of HTML
 * @returns the first HtmlElement in the HtmlNode
 * @throws an error if no HtmlElement is found
 */
export function htmlNodeToHtmlElement(node: HtmlNode): HtmlElement {
	if (typeof node === 'string' && node.trim().startsWith('<')) {
		// Automatically parse strings of html into HtmlElement
		const parsedResult = parseHtml(node);
		node = parsedResult.node;
	}
	if (typeof node === 'object' && !!node && 'type' in node) {
		return node as HtmlElement;
	}
	if (Array.isArray(node)) {
		// Find the first HtmlElement in the array
		for (const child of node) {
			if (typeof child === 'object' && !!child && 'type' in child) {
				return child as HtmlElement;
			}
		}
	}
	throw new Error('Could not find HtmlElement in decoded Html');
}

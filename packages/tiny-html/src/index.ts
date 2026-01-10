import { parseHtml as parseHtmlInternal } from './parser.ts';
import { renderHtml as renderHtmlInternal } from './writer.ts';
import { awaitReactNode as awaitHtmlNodeInternal } from './async-utils.ts';
import type {
  ParseResult,
  HtmlNode,
  WriterOptions,
} from './types.ts';

// Public API functions

/**
 * Parses HTML string into a ParseResult containing HtmlNode
 */
export function readHtml(html: string): ParseResult {
  return parseHtmlInternal(html);
}

/**
 * Renders HtmlNode or ParseResult to HTML string
 */
export function writeHtml(input: HtmlNode | ParseResult, options: WriterOptions = {}): string {
  if (input && typeof input === 'object' && 'node' in input) {
    // It's a ParseResult
    return renderHtmlInternal(input as ParseResult, options);
  } else {
    // It's a HtmlNode
    if (input === undefined) {
      return '';
    }
    return renderHtmlInternal(input, options);
  }
}

/**
 * Recursively awaits all Promise children in a HtmlNode tree
 * Returns a new HtmlNode with all promises resolved
 */
export async function awaitHtmlNode(node: HtmlNode | Promise<HtmlNode>): Promise<HtmlNode> {
  return await awaitHtmlNodeInternal(node);
}

// Re-export converter
export { htmlNodeTo } from './convert.ts';
export type { CreateElementFn, CreateElementProps } from './convert.ts';

// Re-export public types
export type { WriterOptions, ParseResult, HtmlNode, HtmlElement, HtmlProps, HtmlStyle } from './types.ts';

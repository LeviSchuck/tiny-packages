import { parseHtml as parseHtmlInternal } from './parser.ts';
import { renderHtml as renderHtmlInternal } from './writer.ts';
import { awaitReactNode as awaitHtmlNodeInternal } from './async-utils.ts';
import { safeHtml as safeHtmlInternal } from './safe-html.ts';
import type {
  ParseResult,
  HtmlNode,
  WriterOptions,
  SafeHtmlOptions,
  ParserOptions,
} from './types.ts';

// Public API functions

/**
 * Parses HTML string into a ParseResult containing HtmlNode
 * @param html - The HTML string to parse
 * @param options - Parser options including attributeNaming ('reactName' or 'exactName')
 */
export function readHtml(html: string, options: ParserOptions = {}): ParseResult {
  return parseHtmlInternal(html, options);
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

/**
 * Sanitizes an HtmlNode tree by removing disallowed tags, attributes, and URLs.
 * - Tags not in allowedTags have their content retained (folded into parent)
 * - Images replaced with their alt text when removed
 * - Attributes not in the tag's allowed list are dropped
 * - Classes are filtered by allowedClasses patterns (supports wildcards)
 * - URLs not matching allowedLinkProtocols cause the element to be removed
 */
export function safeHtml(node: HtmlNode, options: SafeHtmlOptions = {}): HtmlNode {
  return safeHtmlInternal(node, options);
}

// Re-export converter
export { htmlNodeTo } from './convert.ts';
export { decodeHtmlEntities, encodeHtmlEntities } from './entities.ts';
export type { CreateElementFn, CreateElementProps } from './convert.ts';
export { getTextContent } from './writer.ts';

// Re-export public types
export type {
  WriterOptions,
  ParseResult,
  HtmlNode,
  HtmlElement,
  HtmlProps,
  HtmlStyle,
  SafeHtmlOptions,
  AllowedTag,
  ParserOptions,
  ParserAttributeNaming,
  WriterAttributeNaming,
} from './types.ts';

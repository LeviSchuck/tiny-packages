/**
 * Style attribute as a structured record.
 */
export interface HtmlStyle {
  [key: string]: string;
}

/**
 * Properties of an HtmlElement.
 */
export interface HtmlElement {
  type: string;
  props: HtmlProps;
}

/**
 * HtmlElement properties
 */
export interface HtmlProps {
  [key: string]: string | number | boolean | HtmlStyle | HtmlNode | Promise<HtmlNode>;
  children?: HtmlNode | Promise<HtmlNode>;
}

/**
 * Nodes will be parsed into one of these types.
 */
export type HtmlNode =
  | HtmlElement
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | HtmlNode[];

// Parser types (internal)
export enum ParserState {
  TEXT = 'TEXT',
  TAG_OPEN = 'TAG_OPEN',
  TAG_NAME = 'TAG_NAME',
  ATTRIBUTES = 'ATTRIBUTES',
  ATTRIBUTE_NAME = 'ATTRIBUTE_NAME',
  ATTRIBUTE_VALUE_START = 'ATTRIBUTE_VALUE_START',
  ATTRIBUTE_VALUE_QUOTED = 'ATTRIBUTE_VALUE_QUOTED',
  ATTRIBUTE_VALUE_UNQUOTED = 'ATTRIBUTE_VALUE_UNQUOTED',
  TAG_CLOSE_SELF = 'TAG_CLOSE_SELF',
  TAG_CLOSE_START = 'TAG_CLOSE_START',
  TAG_CLOSE_NAME = 'TAG_CLOSE_NAME',
  COMMENT = 'COMMENT',
  DOCTYPE = 'DOCTYPE',
  CDATA = 'CDATA',
  PROCESSING_INSTRUCTION = 'PROCESSING_INSTRUCTION',
  SCRIPT_CONTENT = 'SCRIPT_CONTENT',
  STYLE_CONTENT = 'STYLE_CONTENT',
}

/**
 * Namespace of an element.
 */
export enum Namespace {
  HTML = 'HTML',
  SVG = 'SVG',
  MATHML = 'MATHML',
}

export interface ElementStackEntry {
  type: string;
  props: Partial<HtmlProps>;
  children: HtmlNode[];
  namespace: Namespace;
}

// Public ParseResult
export interface ParseResult {
  xml?: string;
  doctype?: string;
  node: HtmlNode | HtmlNode[];
}

// Attribute naming conventions
/**
 * Controls how special attributes like 'class' and 'for' are named:
 * - 'reactName': Use React-style names (className, htmlFor) - default for parsing
 * - 'exactName': Use exact HTML names (class, for)
 */
export type ParserAttributeNaming = 'reactName' | 'exactName';

/**
 * Controls how special attributes are written:
 * - 'reactName': Write as React-style (className, htmlFor)
 * - 'exactName': Write as exact HTML (class, for)
 * - 'eitherName': Normalize className->class, htmlFor->for (default)
 */
export type WriterAttributeNaming = 'reactName' | 'exactName' | 'eitherName';

// Parser options
export interface ParserOptions {
  /**
   * How to name special attributes like 'class' and 'for'.
   * - 'reactName' (default): Convert to React-style (className, htmlFor)
   * - 'exactName': Keep exact HTML names (class, for)
   */
  attributeNaming?: ParserAttributeNaming;
}

// Writer types
export interface WriterOptions {
  useCDataForScripts?: boolean;
  useCDataForStyles?: boolean;
  xml?: string;
  doctype?: string;
  voidTrailingSlash?: boolean;
  /**
   * How to write special attributes like 'class' and 'for'.
   * - 'eitherName' (default): Normalize className->class, htmlFor->for
   * - 'reactName': Write as-is (className, htmlFor)
   * - 'exactName': Write as exact HTML (class, for)
   */
  attributeNaming?: WriterAttributeNaming;
}

// SafeHtml types

/**
 * Allowed tag specification:
 * - string: tag name with no custom attributes allowed (only global attrs like 'class' if classes are allowed)
 * - [tagName, ...attrs]: tag name with specific allowed attributes
 */
export type AllowedTag = string | [string, ...string[]];

/**
 * Options for the safeHtml function.
 */
export interface SafeHtmlOptions {
  /**
   * List of allowed tags. Can be strings (tag name only) or tuples [tagName, ...allowedAttributes].
   * If not provided, uses default safe tags.
   */
  allowedTags?: AllowedTag[];

  /**
   * List of allowed CSS class patterns. Supports wildcards like 'h-*', 'p-*'.
   * If not provided, uses default allowed classes.
   */
  allowedClasses?: string[];

  /**
   * List of allowed URL protocols for links/media. Use '.' for relative URLs.
   * If not provided, uses default ['http', 'https'].
   */
  allowedLinkProtocols?: string[];

  /**
   * The attribute naming convention used in the input.
   * - 'reactName' (default): Input uses React-style names (className, htmlFor)
   * - 'exactName': Input uses exact HTML names (class, for)
   * When set, also affects how the output is named.
   */
  attributeNaming?: ParserAttributeNaming;
}

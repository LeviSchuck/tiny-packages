// Public HTML types
export interface HtmlStyle {
  [key: string]: string;
}

export interface HtmlElement {
  type: string;
  props: HtmlProps;
}

export interface HtmlProps {
  [key: string]: string | number | boolean | HtmlStyle | HtmlNode | Promise<HtmlNode>;
  children?: HtmlNode | Promise<HtmlNode>;
}

// Public type for parsed nodes
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

// Writer types
export interface WriterOptions {
  useCDataForScripts?: boolean;
  useCDataForStyles?: boolean;
  xml?: string;
  doctype?: string;
  voidTrailingSlash?: boolean;
}

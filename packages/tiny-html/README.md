# tiny-html

A minimal, dependency-free TypeScript HTML parser and renderer that is easily compatible with react, hono, preact.

## Usage

### Basic Parsing and Rendering

```typescript
import { readHtml, writeHtml, awaitHtmlNode } from '@levischuck/tiny-html';

// Parse HTML into HtmlNode structure
const result = readHtml('<div class="container"><h1>Hello</h1></div>');
console.log(result.node); // HtmlNode structure
console.log(result.doctype); // DOCTYPE if present
console.log(result.xml); // XML declaration if present

// Render HtmlNode back to HTML
const html = writeHtml(result);
// Output: <div className="container"><h1>Hello</h1></div>

// Render with options
const xhtml = writeHtml(result, { voidTrailingSlash: true });

// You can also render HtmlNode directly (without parsing first)
const node = { type: 'div', props: { children: 'Hello World' } };
const output = writeHtml(node);
// Output: <div>Hello World</div>

// Handle async HtmlNode trees (with Promise children)
const asyncNode = {
  type: 'div',
  props: {
    children: [
      Promise.resolve({ type: 'span', props: { children: 'Async content' } }),
      'Regular content'
    ]
  }
};
const resolved = await awaitHtmlNode(asyncNode);
const asyncHtml = writeHtml(resolved);
```

### Converting to Framework Elements

Use `htmlNodeTo` to convert HtmlNode structures to React, Preact, or other framework elements:

```typescript
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { readHtml, htmlNodeTo } from '@levischuck/tiny-html';

const result = readHtml('<div><span>Hello React!</span></div>');
const reactElement: ReactNode = htmlNodeTo(result.node, createElement);
// Now you can render reactElement in your React component
```

This package provides a simple HTML parser and renderer with a structure compatible with React elements, making it easy to integrate with React-based rendering pipelines.

## API

### `readHtml(html: string): ParseResult`

Parses an HTML string into a ParseResult containing HtmlNode elements.

**Returns:**
```typescript
interface ParseResult {
  xml?: string;           // XML declaration if present
  doctype?: string;       // DOCTYPE declaration if present
  node: HtmlNode | HtmlNode[];  // Parsed content as HtmlNode
}
```

### `writeHtml(input: HtmlNode | ParseResult, options?: WriterOptions): string`

Renders a HtmlNode or ParseResult back to an HTML string.

**Parameters:**
- `input: HtmlNode | ParseResult` - The content to render
- `options?: WriterOptions` - Rendering options (see WriterOptions below)

**Returns:** HTML string

### `awaitHtmlNode(node: HtmlNode | Promise<HtmlNode>): Promise<HtmlNode>`

Recursively awaits all Promise children in a HtmlNode tree. Useful for handling async content.

**Parameters:**
- `node: HtmlNode | Promise<HtmlNode>` - The node tree to resolve

**Returns:** A new HtmlNode with all promises resolved

**Note:** Incompatible types (functions, symbols) are dropped during resolution.

### `htmlNodeTo<T>(node: HtmlNode, createElement: CreateElementFn<T>): T | null`

Generic converter that transforms HtmlNode structures into any element type using a provided createElement function.

**Parameters:**
- `node: HtmlNode` - The HtmlNode to convert
- `createElement: CreateElementFn<T>` - Function that creates elements of type T
  - Signature: `(type: string, props: CreateElementProps, ...children: T[]) => T`

**Returns:** Converted element of type T, or null

**Example with React:**
```typescript
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { readHtml, htmlNodeTo } from '@levischuck/tiny-html';

const result = readHtml('<div><span>Hello</span></div>');
const reactElement = htmlNodeTo<ReactNode>(result.node, createElement);
```

**Example with Preact:**
```typescript
import { h } from 'preact';
import { readHtml, htmlNodeTo } from '@levischuck/tiny-html';

const result = readHtml('<div><span>Hello</span></div>');
const preactElement = htmlNodeTo(result.node, h);
```

## Types

### `HtmlNode`

The core type representing parsed HTML content:
- HTML element: `{ type: string, props: HtmlProps }`
- Primitives: `string`, `number`, `boolean`, `null`, `undefined`, `bigint`
- Arrays: `HtmlNode[]`

### `HtmlElement`

```typescript
interface HtmlElement {
  type: string;
  props: HtmlProps;
}
```

### `HtmlProps`

```typescript
interface HtmlProps {
  [key: string]: string | number | boolean | HtmlStyle | HtmlNode | Promise<HtmlNode>;
  children?: HtmlNode | Promise<HtmlNode>;
}
```

### `HtmlStyle`

```typescript
interface HtmlStyle {
  [key: string]: string;
}
```

### `CreateElementFn<T>`

Type for createElement functions used with `htmlNodeTo`.

```typescript
type CreateElementFn<T> = (
  type: string,
  props: CreateElementProps,
  ...children: T[]
) => T;
```

### `CreateElementProps`

Props object passed to createElement functions.

```typescript
type CreateElementProps = Record<string, any>;
```

### `ParseResult`

```typescript
interface ParseResult {
  xml?: string;
  doctype?: string;
  node: HtmlNode | HtmlNode[];
}
```

### `WriterOptions`

Options for controlling HTML output formatting.

```typescript
interface WriterOptions {
  useCDataForScripts?: boolean;  // Wrap <script> content in CDATA
  useCDataForStyles?: boolean;   // Wrap <style> content in CDATA
  xml?: string;                  // XML declaration to prepend
  doctype?: string;              // DOCTYPE declaration to prepend
  voidTrailingSlash?: boolean;   // Add trailing slash to void elements (e.g., <br />)
}
```

**Options:**
- `useCDataForScripts?: boolean` - When true, wraps `<script>` content in CDATA sections. Useful for XHTML output. Default: `false`
- `useCDataForStyles?: boolean` - When true, wraps `<style>` content in CDATA sections. Useful for XHTML output. Default: `false`
- `xml?: string` - XML declaration to prepend to the output (e.g., `<?xml version="1.0" encoding="UTF-8"?>`)
- `doctype?: string` - DOCTYPE declaration to prepend to the output (e.g., `<!DOCTYPE html>`)
- `voidTrailingSlash?: boolean` - When true, adds trailing slash to void elements like `<br/>`, `<img/>`. Useful for XHTML compatibility. Default: `false`

## Why use this?

There are many other great libraries to parse HTML.
I need to process things on the edge and I can rely on this being fast and available on every platform I want to use it.
Also.. I'm tired of writing little parsers here and there just to put them into a hono-jsx like format for post-processing.

## License

MIT Licensed.

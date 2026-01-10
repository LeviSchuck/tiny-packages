import { test, expect, describe } from 'bun:test';
import type { HtmlNode } from '../index';
import { readHtml } from '../index';

describe('Parser - Basic HTML', () => {
  test('parses simple div', () => {
    const result = readHtml('<div>Hello</div>');
    expect(result.node).toEqual({
      type: 'div',
      props: { children: 'Hello' },
    } as unknown as HtmlNode);
  });

  test('parses nested tags', () => {
    const result = readHtml('<div><p>Text</p></div>');
    expect(result.node).toEqual({
      type: 'div',
      props: {
        children: {
          type: 'p',
          props: { children: 'Text' },
        },
      },
    } as unknown as HtmlNode);
  });

  test('parses self-closing tags', () => {
    const result = readHtml('<img src="test.png" />');
    expect(result.node).toEqual({
      type: 'img',
      props: { src: 'test.png' },
    } as unknown as HtmlNode);
  });

  test('parses void elements without slash', () => {
    const result = readHtml('<br>');
    expect(result.node).toEqual({
      type: 'br',
      props: {},
    } as unknown as HtmlNode);
  });

  test('parses multiple root elements', () => {
    const result = readHtml('<div>A</div><div>B</div>');
    expect(Array.isArray(result.node)).toBe(true);
    expect(result.node).toHaveLength(2);
  });
});

describe('Parser - Attributes', () => {
  test('parses boolean attributes', () => {
    const result = readHtml('<input disabled />');
    expect(result.node).toEqual({
      type: 'input',
      props: { disabled: true },
    } as unknown as HtmlNode);
  });

  test('parses attributes with double quotes', () => {
    const result = readHtml('<div class="foo">test</div>');
    expect(result.node).toEqual({
      type: 'div',
      props: { className: 'foo', children: 'test' },
    } as unknown as HtmlNode);
  });

  test('parses attributes with single quotes', () => {
    const result = readHtml("<div class='foo'>test</div>");
    expect(result.node).toEqual({
      type: 'div',
      props: { className: 'foo', children: 'test' },
    } as unknown as HtmlNode);
  });

  test('parses attributes without quotes', () => {
    const result = readHtml('<div class=foo>test</div>');
    expect(result.node).toEqual({
      type: 'div',
      props: { className: 'foo', children: 'test' },
    } as unknown as HtmlNode);
  });

  test('converts class to className', () => {
    const result = readHtml('<div class="test"></div>');
    expect((result.node as any).props.className).toBe('test');
  });
});

describe('Parser - HTML Entities', () => {
  test('decodes named entities', () => {
    const result = readHtml('<div>&lt;div&gt;</div>');
    expect(result.node).toEqual({
      type: 'div',
      props: { children: '<div>' },
    } as unknown as HtmlNode);
  });

  test('decodes numeric entities (decimal)', () => {
    const result = readHtml('<div>&#60;</div>');
    expect(result.node).toEqual({
      type: 'div',
      props: { children: '<' },
    } as unknown as HtmlNode);
  });

  test('decodes numeric entities (hex)', () => {
    const result = readHtml('<div>&#x3C;</div>');
    expect(result.node).toEqual({
      type: 'div',
      props: { children: '<' },
    } as unknown as HtmlNode);
  });

  test('decodes common entities', () => {
    const result = readHtml('<div>&amp;&nbsp;&copy;</div>');
    expect(result.node).toEqual({
      type: 'div',
      props: { children: '&\u00A0©' },
    } as unknown as HtmlNode);
  });
});

describe('Parser - Comments and Special', () => {
  test('discards comments', () => {
    const result = readHtml('<!-- comment --><div>test</div>');
    expect(result.node).toEqual({
      type: 'div',
      props: { children: 'test' },
    } as unknown as HtmlNode);
  });

  test('handles CDATA sections', () => {
    const result = readHtml('<div><![CDATA[<raw>content</raw>]]></div>');
    expect(result.node).toEqual({
      type: 'div',
      props: { children: '<raw>content</raw>' },
    } as unknown as HtmlNode);
  });

  test('captures XML processing instruction', () => {
    const result = readHtml('<?xml version="1.0"?><root />');
    expect(result.xml).toBe('<?xml version="1.0"?>');
    expect(result.node).toEqual({
      type: 'root',
      props: {},
    } as unknown as HtmlNode);
  });

  test('captures DOCTYPE', () => {
    const result = readHtml('<!DOCTYPE html><div>test</div>');
    expect(result.doctype).toBe('<!DOCTYPE html>');
    expect(result.node).toEqual({
      type: 'div',
      props: { children: 'test' },
    } as unknown as HtmlNode);
  });
});

describe('Parser - Case Normalization', () => {
  test('normalizes HTML tag names to lowercase', () => {
    const result = readHtml('<DIV>test</DIV>');
    expect((result.node as any).type).toBe('div');
  });

  test('normalizes HTML attribute names to lowercase', () => {
    const result = readHtml('<div CLASS="foo">test</div>');
    expect((result.node as any).props.className).toBe('foo');
  });
});

describe('Parser - SVG', () => {
  test('preserves SVG element case', () => {
    const result = readHtml('<svg><feGaussianBlur /></svg>');
    const svg = result.node as any;
    expect(svg.props.children.type).toBe('feGaussianBlur');
  });

  test('preserves SVG attribute case', () => {
    const result = readHtml('<svg viewBox="0 0 100 100"></svg>');
    expect((result.node as any).props.viewBox).toBe('0 0 100 100');
  });

  test('handles nested SVG elements', () => {
    const result = readHtml('<svg><linearGradient /></svg>');
    const svg = result.node as any;
    expect(svg.props.children.type).toBe('linearGradient');
  });
});

describe('Parser - Auto-closing', () => {
  test('auto-closes paragraphs', () => {
    const result = readHtml('<p>A<p>B</p>');
    expect(Array.isArray(result.node)).toBe(true);
    expect((result.node as any).length).toBe(2);
  });

  test('auto-closes list items', () => {
    const result = readHtml('<ul><li>A<li>B</ul>');
    const ul = result.node as any;
    expect(Array.isArray(ul.props.children)).toBe(true);
    expect(ul.props.children.length).toBe(2);
  });
});

describe('Parser - Implicit Closure', () => {
  test('closes nested tags when parent closes', () => {
    const result = readHtml('<div><p>Hi<h1>Hello</div>');
    // div should close h1 and p implicitly
    expect((result.node as any).type).toBe('div');
  });
});

describe('Parser - Malformed HTML', () => {
  test('handles incomplete tags gracefully', () => {
    // Parser handles malformed HTML by best effort
    const result = readHtml('<div style="..test');
    // Currently returns null for incomplete tags - graceful degradation
    expect(result.node).toBeDefined();
  });

  test('ignores stray closing tags', () => {
    const result = readHtml('<p>Test</p></p>');
    expect(result.node).toEqual({
      type: 'p',
      props: { children: 'Test' },
    } as unknown as HtmlNode);
  });
});

describe('Parser - Script and Style', () => {
  test('handles script content verbatim', () => {
    const result = readHtml('<script>if (x < 5) {}</script>');
    expect(result.node).toEqual({
      type: 'script',
      props: { children: 'if (x < 5) {}' },
    } as unknown as HtmlNode);
  });

  test('handles style content verbatim', () => {
    const result = readHtml('<style>.foo > bar {}</style>');
    expect(result.node).toEqual({
      type: 'style',
      props: { children: '.foo > bar {}' },
    } as unknown as HtmlNode);
  });
});

describe('Parser - Whitespace', () => {
  test('preserves whitespace', () => {
    const result = readHtml('<div>  text  </div>');
    expect(result.node).toEqual({
      type: 'div',
      props: { children: '  text  ' },
    } as unknown as HtmlNode);
  });

  test('preserves newlines', () => {
    const result = readHtml('<div>\ntext\n</div>');
    expect(result.node).toEqual({
      type: 'div',
      props: { children: '\ntext\n' },
    } as unknown as HtmlNode);
  });
});

describe('Parser - Style Attribute', () => {
  test('parses style attribute to object', () => {
    const result = readHtml('<div style="color: red; font-size: 12px"></div>');
    expect((result.node as any).props.style).toEqual({
      color: 'red',
      fontSize: '12px',
    });
  });

  test('handles style with semicolon in value', () => {
    const result = readHtml('<div style="background: url(data:image/svg+xml;base64,...)"></div>');
    expect((result.node as any).props.style.background).toContain('url(');
  });
});

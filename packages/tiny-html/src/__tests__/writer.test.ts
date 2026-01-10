import { test, expect, describe } from 'bun:test';
import { writeHtml, getTextContent } from '../index';
import type { HtmlNode, HtmlElement } from '../index';

// Helper to create test nodes that match HtmlNode
const node = (obj: { type: string; props: any }) => obj as HtmlNode;

describe('Writer - Basic Elements', () => {
  test('renders simple div', () => {
    const nodeObj = {
      type: 'div',
      props: { children: 'Hello' },
    } as HtmlNode;
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<div>Hello</div>');
  });

  test('renders nested elements', () => {
    const nodeObj = {
      type: 'div',
      props: {
        children: node({ type: 'p', props: { children: 'Text' } }),
      },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<div><p>Text</p></div>');
  });

  test('renders multiple root elements', () => {
    const nodesArr = [
      { type: 'div', props: { children: 'A' } },
      { type: 'div', props: { children: 'B' } },
    ];
    expect(writeHtml(nodesArr as HtmlNode)).toBe('<div>A</div><div>B</div>');
  });
});

describe('Writer - Void Elements', () => {
  test('renders void elements with trailing slash by default', () => {
    const nodeObj = { type: 'br', props: {} };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<br />');
  });

  test('renders void elements without trailing slash when disabled', () => {
    const nodeObj = { type: 'br', props: {} };
    expect(writeHtml(nodeObj as HtmlNode, { voidTrailingSlash: false })).toBe('<br>');
  });

  test('renders img with trailing slash', () => {
    const nodeObj = {
      type: 'img',
      props: { src: 'test.png' },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<img src="test.png" />');
  });

  test('renders hr without trailing slash when disabled', () => {
    const nodeObj = { type: 'hr', props: {} };
    expect(writeHtml(nodeObj as HtmlNode, { voidTrailingSlash: false })).toBe('<hr>');
  });
});

describe('Writer - Attributes', () => {
  test('renders boolean true attributes', () => {
    const nodeObj = {
      type: 'input',
      props: { disabled: true },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<input disabled />');
  });

  test('omits boolean false attributes', () => {
    const nodeObj = {
      type: 'input',
      props: { disabled: false },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<input />');
  });

  test('renders number attributes', () => {
    const nodeObj = {
      type: 'input',
      props: { width: 100 },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<input width="100" />');
  });

  test('renders string attributes', () => {
    const nodeObj = {
      type: 'div',
      props: { className: 'foo' },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<div className="foo"></div>');
  });
});

describe('Writer - Children', () => {
  test('renders string children', () => {
    const nodeObj = {
      type: 'div',
      props: { children: 'text' },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<div>text</div>');
  });

  test('renders number children', () => {
    const nodeObj = {
      type: 'div',
      props: { children: 123 },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<div>123</div>');
  });

  test('renders boolean children', () => {
    const nodeObj = {
      type: 'div',
      props: { children: true },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<div>true</div>');
  });

  test('renders array children', () => {
    const nodeObj = {
      type: 'div',
      props: { children: ['A', 'B', 'C'] },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<div>ABC</div>');
  });
});

describe('Writer - Style Attribute', () => {
  test('renders style object', () => {
    const nodeObj = {
      type: 'div',
      props: {
        style: { color: 'red', fontSize: '12px' },
      },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<div style="color: red; font-size: 12px"></div>');
  });

  test('converts camelCase to kebab-case', () => {
    const nodeObj = {
      type: 'div',
      props: {
        style: { backgroundColor: 'blue' },
      },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<div style="background-color: blue"></div>');
  });
});

describe('Writer - Entity Encoding', () => {
  test('encodes < and >', () => {
    const nodeObj = {
      type: 'div',
      props: { children: '<div>' },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<div>&lt;div&gt;</div>');
  });

  test('encodes ampersand', () => {
    const nodeObj = {
      type: 'div',
      props: { children: 'A & B' },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<div>A &amp; B</div>');
  });

  test('encodes quotes in attributes', () => {
    const nodeObj = {
      type: 'div',
      props: { title: 'Say "Hello"' },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<div title="Say &quot;Hello&quot;"></div>');
  });
});

describe('Writer - Empty Elements', () => {
  test('renders empty container with closing tag', () => {
    const nodeObj = {
      type: 'div',
      props: {},
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<div></div>');
  });

  test('renders empty script with closing tag', () => {
    const nodeObj = {
      type: 'script',
      props: {},
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<script></script>');
  });

  test('renders empty style with closing tag', () => {
    const nodeObj = {
      type: 'style',
      props: {},
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<style></style>');
  });

  test('renders empty formatting tags with closing tag', () => {
    const nodeObj = {
      type: 'strong',
      props: {},
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<strong></strong>');
  });
});

describe('Writer - CDATA', () => {
  test('wraps script content in CDATA when enabled', () => {
    const nodeObj = {
      type: 'script',
      props: { children: 'if (x < 5) {}' },
    };
    expect(writeHtml(nodeObj as HtmlNode, { useCDataForScripts: true }))
      .toBe('<script><![CDATA[if (x < 5) {}]]></script>');
  });

  test('wraps style content in CDATA when enabled', () => {
    const nodeObj = {
      type: 'style',
      props: { children: '.foo > .bar {}' },
    };
    expect(writeHtml(nodeObj as HtmlNode, { useCDataForStyles: true }))
      .toBe('<style><![CDATA[.foo > .bar {}]]></style>');
  });

  test('escapes ]]> in CDATA content', () => {
    const nodeObj = {
      type: 'script',
      props: { children: 'var x = "]]>";' },
    };
    expect(writeHtml(nodeObj as HtmlNode, { useCDataForScripts: true }))
      .toBe('<script><![CDATA[var x = "]]]]><![CDATA[>";]]></script>');
  });
});

describe('Writer - XML and DOCTYPE', () => {
  test('prepends XML processing instruction', () => {
    const nodeObj = {
      type: 'root',
      props: {},
    };
    expect(writeHtml(nodeObj as HtmlNode, { xml: '<?xml version="1.0"?>' }))
      .toBe('<?xml version="1.0"?>\n<root></root>');
  });

  test('prepends DOCTYPE', () => {
    const nodeObj = {
      type: 'html',
      props: {},
    };
    expect(writeHtml(nodeObj as HtmlNode, { doctype: '<!DOCTYPE html>' }))
      .toBe('<!DOCTYPE html>\n<html></html>');
  });

  test('prepends both XML and DOCTYPE in correct order', () => {
    const nodeObj = {
      type: 'html',
      props: {},
    };
    expect(writeHtml(nodeObj as HtmlNode, {
      xml: '<?xml version="1.0"?>',
      doctype: '<!DOCTYPE html>',
    })).toBe('<?xml version="1.0"?>\n<!DOCTYPE html>\n<html></html>');
  });

  test('uses ParseResult xml and doctype', () => {
    const parseResult = {
      xml: '<?xml version="1.0"?>',
      doctype: '<!DOCTYPE html>',
      node: { type: 'html', props: {} } as HtmlElement,
    };
    expect(writeHtml(parseResult))
      .toBe('<?xml version="1.0"?>\n<!DOCTYPE html>\n<html></html>');
  });
});

describe('Writer - Error Handling', () => {
  test('drops Promise nodes', () => {
    const node = Promise.resolve('test');
    const html = writeHtml(node as unknown as HtmlNode);
    expect(html).toBe(''); // Promise is dropped
  });

  test('drops Function nodes', () => {
    const node = () => 'test';
    const html = writeHtml(node as unknown as HtmlNode);
    expect(html).toBe(''); // Function is dropped
  });

  test('drops Symbol nodes', () => {
    const node = Symbol('test');
    const html = writeHtml(node as unknown as HtmlNode);
    expect(html).toBe(''); // Symbol is dropped
  });
});

describe('Writer - SVG', () => {
  test('renders SVG elements', () => {
    const nodeObj = {
      type: 'svg',
      props: {
        children: {
          type: 'feGaussianBlur',
          props: {},
        },
      },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<svg><feGaussianBlur></feGaussianBlur></svg>');
  });

  test('renders SVG with viewBox attribute', () => {
    const nodeObj = {
      type: 'svg',
      props: { viewBox: '0 0 100 100' },
    };
    expect(writeHtml(nodeObj as HtmlNode)).toBe('<svg viewBox="0 0 100 100"></svg>');
  });
});

describe('getTextContent - Primitive Types', () => {
  test('extracts text from string node', () => {
    expect(getTextContent('Hello')).toBe('Hello');
  });

  test('extracts text from number node', () => {
    expect(getTextContent(42)).toBe('42');
  });

  test('extracts text from bigint node', () => {
    expect(getTextContent(BigInt(123))).toBe('123');
  });

  test('extracts text from boolean node', () => {
    expect(getTextContent(true)).toBe('true');
    expect(getTextContent(false)).toBe('false');
  });

  test('handles null and undefined', () => {
    expect(getTextContent(null)).toBe('');
    expect(getTextContent(undefined)).toBe('');
  });

  test('extracts text from array of primitives', () => {
    expect(getTextContent(['Hello', ' ', 'World'])).toBe('Hello World');
    expect(getTextContent([1, 2, 3])).toBe('123');
    expect(getTextContent([true, false])).toBe('truefalse');
  });
});

describe('getTextContent - Element Nodes', () => {
  test('extracts text from element with string children', () => {
    const nodeObj = {
      type: 'div',
      props: { children: 'Hello World' },
    };
    expect(getTextContent(nodeObj as HtmlNode)).toBe('Hello World');
  });

  test('extracts text from nested elements', () => {
    const nodeObj = {
      type: 'div',
      props: {
        children: {
          type: 'p',
          props: {
            children: 'Paragraph text',
          },
        },
      },
    };
    expect(getTextContent(nodeObj as HtmlNode)).toBe('Paragraph text');
  });

  test('extracts text from element with array children', () => {
    const nodeObj = {
      type: 'div',
      props: {
        children: ['Hello', ' ', 'World'],
      },
    };
    expect(getTextContent(nodeObj as HtmlNode)).toBe('Hello World');
  });

  test('extracts text from deeply nested elements', () => {
    const nodeObj = {
      type: 'div',
      props: {
        children: {
          type: 'p',
          props: {
            children: {
              type: 'span',
              props: {
                children: 'Deep text',
              },
            },
          },
        },
      },
    };
    expect(getTextContent(nodeObj as HtmlNode)).toBe('Deep text');
  });

  test('extracts text from multiple sibling elements', () => {
    const nodeObj = {
      type: 'div',
      props: {
        children: [
          { type: 'p', props: { children: 'First' } },
          { type: 'p', props: { children: 'Second' } },
        ],
      },
    };
    expect(getTextContent(nodeObj as HtmlNode)).toBe('FirstSecond');
  });

  test('handles element with mixed children types', () => {
    const nodeObj = {
      type: 'div',
      props: {
        children: [
          'Text',
          42,
          true,
          { type: 'span', props: { children: 'More' } },
        ],
      },
    };
    expect(getTextContent(nodeObj as HtmlNode)).toBe('Text42trueMore');
  });

  test('handles element with no children', () => {
    const nodeObj = {
      type: 'div',
      props: {},
    };
    expect(getTextContent(nodeObj as HtmlNode)).toBe('');
  });
});

describe('getTextContent - Script, Style, Template Elements', () => {
  test('skips script element content', () => {
    const nodeObj = {
      type: 'script',
      props: {
        children: 'console.log("Hello");',
      },
    };
    expect(getTextContent(nodeObj as HtmlNode)).toBe('');
  });

  test('skips style element content', () => {
    const nodeObj = {
      type: 'style',
      props: {
        children: '.foo { color: red; }',
      },
    };
    expect(getTextContent(nodeObj as HtmlNode)).toBe('');
  });

  test('skips template element content', () => {
    const nodeObj = {
      type: 'template',
      props: {
        children: '<div>Content</div>',
      },
    };
    expect(getTextContent(nodeObj as HtmlNode)).toBe('');
  });

  test('extracts text from elements inside script parent (but skips script itself)', () => {
    const nodeObj = {
      type: 'div',
      props: {
        children: [
          { type: 'script', props: { children: 'hidden' } },
          { type: 'p', props: { children: 'visible' } },
        ],
      },
    };
    expect(getTextContent(nodeObj as HtmlNode)).toBe('visible');
  });
});

describe('getTextContent - Edge Cases', () => {
  test('handles empty array', () => {
    expect(getTextContent([])).toBe('');
  });

  test('handles array with null/undefined', () => {
    expect(getTextContent([null, undefined, 'text'])).toBe('text');
  });

  test('handles element with non-array children (string)', () => {
    const nodeObj = {
      type: 'div',
      props: {
        children: 'Single child',
      },
    };
    expect(getTextContent(nodeObj as HtmlNode)).toBe('Single child');
  });

  test('handles mixed array of elements and primitives', () => {
    const nodes = [
      'Start',
      { type: 'span', props: { children: ['Middle'] } },
      'End',
    ];
    expect(getTextContent(nodes as HtmlNode)).toBe('StartMiddleEnd');
  });

  test('handles complex nested structure', () => {
    const nodeObj = {
      type: 'article',
      props: {
        children: [
          {
            type: 'h1',
            props: { children: ['Title'] },
          },
          {
            type: 'p',
            props: {
              children: [
                'Paragraph with ',
                {
                  type: 'strong',
                  props: { children: ['bold'] },
                },
                ' text',
              ],
            },
          },
        ],
      },
    };
    expect(getTextContent(nodeObj as HtmlNode)).toBe('TitleParagraph with bold text');
  });

  test('handles element without props property', () => {
    const nodeObj = {
      type: 'div',
    };
    expect(getTextContent(nodeObj as HtmlNode)).toBe('');
  });
});

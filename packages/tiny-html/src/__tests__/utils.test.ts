import { test, expect, describe } from 'bun:test';
import { htmlNodeToHtmlElement } from '../utils.ts';
import type { HtmlElement, HtmlNode } from '../types.ts';

describe('htmlNodeToHtmlElement', () => {
  test('returns HtmlElement when node is already an HtmlElement', () => {
    const element: HtmlElement = {
      type: 'div',
      props: { children: 'text' },
    };

    const result = htmlNodeToHtmlElement(element);
    expect(result).toBe(element);
    expect(result.type).toBe('div');
    expect(result.props.children).toBe('text');
  });

  test('parses HTML string and returns HtmlElement', () => {
    const htmlString = '<div>Hello World</div>';
    const result = htmlNodeToHtmlElement(htmlString);

    expect(result).toBeDefined();
    expect(result.type).toBe('div');
    expect(result.props.children).toBe('Hello World');
  });

  test('parses HTML string with attributes', () => {
    const htmlString = '<div class="test" id="myId">Content</div>';
    const result = htmlNodeToHtmlElement(htmlString);

    expect(result.type).toBe('div');
    expect(result.props.className).toBe('test');
    expect(result.props.id).toBe('myId');
    expect(result.props.children).toBe('Content');
  });

  test('parses HTML string with whitespace before tag', () => {
    const htmlString = '  <div>Test</div>';
    const result = htmlNodeToHtmlElement(htmlString);

    expect(result.type).toBe('div');
    expect(result.props.children).toBe('Test');
  });

  test('returns first HtmlElement from array', () => {
    const element1: HtmlElement = {
      type: 'div',
      props: { children: 'first' },
    };
    const element2: HtmlElement = {
      type: 'span',
      props: { children: 'second' },
    };
    const node: HtmlNode = [element1, element2];

    const result = htmlNodeToHtmlElement(node);
    expect(result).toBe(element1);
    expect(result.type).toBe('div');
  });

  test('returns first HtmlElement from array with mixed types', () => {
    const element: HtmlElement = {
      type: 'div',
      props: { children: 'content' },
    };
    const node: HtmlNode = ['text', 123, element, 'more text'];

    const result = htmlNodeToHtmlElement(node);
    expect(result).toBe(element);
    expect(result.type).toBe('div');
  });

  test('returns first HtmlElement from array when not first item', () => {
    const element: HtmlElement = {
      type: 'span',
      props: { children: 'found' },
    };
    const node: HtmlNode = ['text', null, undefined, element];

    const result = htmlNodeToHtmlElement(node);
    expect(result).toBe(element);
    expect(result.type).toBe('span');
  });

  test('throws error when node is a string not starting with <', () => {
    expect(() => {
      htmlNodeToHtmlElement('just text');
    }).toThrow('Could not find HtmlElement in decoded Html');
  });

  test('throws error when node is a number', () => {
    expect(() => {
      htmlNodeToHtmlElement(123);
    }).toThrow('Could not find HtmlElement in decoded Html');
  });

  test('throws error when node is a boolean', () => {
    expect(() => {
      htmlNodeToHtmlElement(true);
    }).toThrow('Could not find HtmlElement in decoded Html');

    expect(() => {
      htmlNodeToHtmlElement(false);
    }).toThrow('Could not find HtmlElement in decoded Html');
  });

  test('throws error when node is null', () => {
    expect(() => {
      htmlNodeToHtmlElement(null);
    }).toThrow('Could not find HtmlElement in decoded Html');
  });

  test('throws error when node is undefined', () => {
    expect(() => {
      htmlNodeToHtmlElement(undefined);
    }).toThrow('Could not find HtmlElement in decoded Html');
  });

  test('throws error when node is an empty array', () => {
    expect(() => {
      htmlNodeToHtmlElement([]);
    }).toThrow('Could not find HtmlElement in decoded Html');
  });

  test('throws error when node is array with only primitives', () => {
    const node: HtmlNode = ['text', 123, true, null, undefined];
    expect(() => {
      htmlNodeToHtmlElement(node);
    }).toThrow('Could not find HtmlElement in decoded Html');
  });

  test('throws error when node is array with only strings', () => {
    const node: HtmlNode = ['text1', 'text2', 'text3'];
    expect(() => {
      htmlNodeToHtmlElement(node);
    }).toThrow('Could not find HtmlElement in decoded Html');
  });

  test('handles nested elements in array', () => {
    const innerElement: HtmlElement = {
      type: 'span',
      props: { children: 'inner' },
    };
    const outerElement: HtmlElement = {
      type: 'div',
      props: { children: innerElement },
    };
    const node: HtmlNode = [outerElement];

    const result = htmlNodeToHtmlElement(node);
    expect(result).toBe(outerElement);
    expect(result.type).toBe('div');
  });

  test('handles complex HTML string with nested elements', () => {
    const htmlString = '<div><span>Nested</span></div>';
    const result = htmlNodeToHtmlElement(htmlString);

    expect(result.type).toBe('div');
    expect(result.props.children).toBeDefined();
    const children = result.props.children as HtmlElement;
    expect(children.type).toBe('span');
    expect(children.props.children).toBe('Nested');
  });

  test('handles HTML string that parses to array', () => {
    // Multiple root elements should parse to an array
    const htmlString = '<div>First</div><span>Second</span>';
    const result = htmlNodeToHtmlElement(htmlString);

    // Should return the first element from the parsed array
    expect(result.type).toBe('div');
    expect(result.props.children).toBe('First');
  });
});

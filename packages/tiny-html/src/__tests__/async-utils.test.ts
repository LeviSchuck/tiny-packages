import { test, expect, describe } from 'bun:test';
import { awaitHtmlNode } from '../index';
import type { HtmlNode } from '../index';

describe('awaitHtmlNode', () => {
  test('resolves simple promise', async () => {
    const promise = Promise.resolve('text');
    const result = await awaitHtmlNode(promise);
    expect(result).toBe('text');
  });

  test('resolves nested promises in children', async () => {
    const node = {
      type: 'div',
      props: {
        children: Promise.resolve('async text'),
      },
    } as HtmlNode;

    const result = await awaitHtmlNode(node) as any;
    expect(result.props.children).toBe('async text');
  });

  test('resolves promise arrays', async () => {
    const promises = [
      Promise.resolve('a'),
      Promise.resolve('b'),
      Promise.resolve('c'),
    ] as unknown as HtmlNode[];

    const result = await awaitHtmlNode(promises);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  test('resolves mixed promises and values', async () => {
    const mixed = [
      Promise.resolve('a'),
      'b',
      Promise.resolve('c'),
    ] as HtmlNode;

    const result = await awaitHtmlNode(mixed);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  test('handles deep nesting', async () => {
    const node = {
      type: 'div',
      props: {
        children: {
          type: 'span',
          props: {
            children: Promise.resolve('deeply nested'),
          },
        },
      },
    } as HtmlNode;

    const result = await awaitHtmlNode(node) as any;
    const span = result.props.children as any;
    expect(span.props.children).toBe('deeply nested');
  });

  test('handles primitives', async () => {
    expect(await awaitHtmlNode('text')).toBe('text');
    expect(await awaitHtmlNode(123)).toBe(123);
    expect(await awaitHtmlNode(true)).toBe(true);
    expect(await awaitHtmlNode(null)).toBe(null);
    expect(await awaitHtmlNode(undefined)).toBe(undefined);
  });

  test('handles elements without promises', async () => {
    const node = {
      type: 'div',
      props: { children: 'text' },
    } as HtmlNode;

    const result = await awaitHtmlNode(node);
    expect(result).toEqual(node as any);
  });

  test('resolves multiple levels of promises', async () => {
    const deepPromise = Promise.resolve(Promise.resolve('deep'));
    const result = await awaitHtmlNode(deepPromise);
    expect(result).toBe('deep');
  });

  test('handles array of elements with promises', async () => {
    const nodes = [
      { type: 'div', props: { children: Promise.resolve('A') } },
      { type: 'div', props: { children: Promise.resolve('B') } },
    ] as HtmlNode;

    const result = await awaitHtmlNode(nodes) as HtmlNode[];
    expect(Array.isArray(result)).toBe(true);
    expect((result[0] as any)?.props.children).toBe('A');
    expect((result[1] as any)?.props.children).toBe('B');
  });

  test('drops onClick handler', async () => {
    const node = {
      type: 'button',
      props: {
        onClick: () => console.log('clicked'),
        children: 'Click me',
      },
    } as unknown as HtmlNode;

    const result = await awaitHtmlNode(node) as any;
    expect(result.props.onClick).toBeUndefined();
    expect(result.props.children).toBe('Click me');
  });

  test('drops function in HtmlNode', async () => {
    const fn = () => 'test';
    const result = await awaitHtmlNode(fn as any);
    expect(result).toBeUndefined();
  });

  test('drops symbol in HtmlNode', async () => {
    const sym = Symbol('test');
    const result = await awaitHtmlNode(sym as any);
    expect(result).toBeUndefined();
  });

  test('drops null and undefined children', async () => {
    const node = {
      type: 'div',
      props: {
        children: [
          'a',
          null,
          'b',
          undefined,
          'c',
        ],
      },
    } as HtmlNode;

    const result = await awaitHtmlNode(node) as any;
    expect(result.props.children).toEqual(['a', 'b', 'c']);
  });

  test('drops functions and symbols from arrays', async () => {
    const nodes = [
      'a',
      () => 'fn',
      'b',
      Symbol('sym'),
      'c',
    ] as any;

    const result = await awaitHtmlNode(nodes);
    expect(result).toEqual(['a', 'b', 'c']);
  });
});

import { test, expect, describe } from 'bun:test';
import { decodeHtmlEntities, encodeHtmlEntities, escapeCData } from '../entities';

describe('Entity Decoding', () => {
  test('decodes named entities', () => {
    expect(decodeHtmlEntities('&lt;')).toBe('<');
    expect(decodeHtmlEntities('&gt;')).toBe('>');
    expect(decodeHtmlEntities('&amp;')).toBe('&');
    expect(decodeHtmlEntities('&quot;')).toBe('"');
    expect(decodeHtmlEntities('&apos;')).toBe("'");
  });

  test('decodes common special entities', () => {
    expect(decodeHtmlEntities('&nbsp;')).toBe('\u00A0');
    expect(decodeHtmlEntities('&copy;')).toBe('©');
    expect(decodeHtmlEntities('&reg;')).toBe('®');
    expect(decodeHtmlEntities('&trade;')).toBe('™');
  });

  test('decodes decimal numeric entities', () => {
    expect(decodeHtmlEntities('&#60;')).toBe('<');
    expect(decodeHtmlEntities('&#62;')).toBe('>');
    expect(decodeHtmlEntities('&#38;')).toBe('&');
  });

  test('decodes hexadecimal numeric entities', () => {
    expect(decodeHtmlEntities('&#x3C;')).toBe('<');
    expect(decodeHtmlEntities('&#x3E;')).toBe('>');
    expect(decodeHtmlEntities('&#x26;')).toBe('&');
    expect(decodeHtmlEntities('&#X41;')).toBe('A');
  });

  test('handles mixed entities and text', () => {
    expect(decodeHtmlEntities('Hello &amp; goodbye')).toBe('Hello & goodbye');
    expect(decodeHtmlEntities('&lt;div&gt;')).toBe('<div>');
  });

  test('handles unknown entities', () => {
    expect(decodeHtmlEntities('&unknown;')).toBe('&unknown;');
  });

  test('handles text without entities', () => {
    expect(decodeHtmlEntities('plain text')).toBe('plain text');
  });

  test('handles empty string', () => {
    expect(decodeHtmlEntities('')).toBe('');
  });
});

describe('Entity Encoding', () => {
  test('encodes basic special characters', () => {
    expect(encodeHtmlEntities('<')).toBe('&lt;');
    expect(encodeHtmlEntities('>')).toBe('&gt;');
    expect(encodeHtmlEntities('&')).toBe('&amp;');
  });

  test('encodes quotes in attributes', () => {
    expect(encodeHtmlEntities('"test"', true)).toBe('&quot;test&quot;');
  });

  test('does not encode quotes outside attributes', () => {
    expect(encodeHtmlEntities('"test"', false)).toBe('"test"');
  });

  test('encodes mixed content', () => {
    expect(encodeHtmlEntities('A & B < C > D')).toBe('A &amp; B &lt; C &gt; D');
  });

  test('handles plain text', () => {
    expect(encodeHtmlEntities('plain text')).toBe('plain text');
  });

  test('handles empty string', () => {
    expect(encodeHtmlEntities('')).toBe('');
  });

  test('encodes ampersand before other entities', () => {
    expect(encodeHtmlEntities('&amp;')).toBe('&amp;amp;');
  });
});

describe('CDATA Escaping', () => {
  test('escapes ]]> sequences', () => {
    expect(escapeCData('text]]>more')).toBe('text]]]]><![CDATA[>more');
  });

  test('handles multiple ]]> sequences', () => {
    expect(escapeCData(']]>and]]>')).toBe(']]]]><![CDATA[>and]]]]><![CDATA[>');
  });

  test('handles text without ]]>', () => {
    expect(escapeCData('plain text')).toBe('plain text');
  });
});

describe('Round-trip Encoding/Decoding', () => {
  test('round-trips basic entities', () => {
    const original = '< > &';
    const encoded = encodeHtmlEntities(original);
    const decoded = decodeHtmlEntities(encoded);
    expect(decoded).toBe(original);
  });

  test('handles double encoding', () => {
    const text = '&lt;';
    const encoded = encodeHtmlEntities(text);
    expect(encoded).toBe('&amp;lt;');
    expect(decodeHtmlEntities(encoded)).toBe('&lt;');
  });
});

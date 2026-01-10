import { HTML_ENTITIES } from './constants.ts';

/**
 * Decodes HTML entities to their UTF-8 representation
 * Handles named entities (&lt;, &gt;, &amp;, etc.), decimal (&#60;), and hex (&#x3C;) entities
 */
export function decodeHtmlEntities(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Quick check if there are any entities to decode
  if (!text.includes('&')) {
    return text;
  }

  return text.replace(/&(?:#[xX]([0-9a-fA-F]+)|#(\d+)|([a-zA-Z][a-zA-Z0-9]*));/g, (match, hex, dec, named) => {
    if (hex) {
      // Hexadecimal entity: &#x3C; or &#X3C;
      const code = parseInt(hex, 16);
      return String.fromCodePoint(code);
    } else if (dec) {
      // Decimal entity: &#60;
      const code = parseInt(dec, 10);
      return String.fromCodePoint(code);
    } else if (named && HTML_ENTITIES[named]) {
      // Named entity: &lt;, &gt;, etc.
      return HTML_ENTITIES[named];
    }
    // Unknown entity, return as-is
    return match;
  });
}

/**
 * Encodes special characters as HTML entities
 * @param text - The text to encode
 * @param inAttribute - If true, also encode quotes
 */
export function encodeHtmlEntities(text: string, inAttribute: boolean = false): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let result = text;

  // Always encode these characters
  result = result.replace(/&/g, '&amp;');
  result = result.replace(/</g, '&lt;');
  result = result.replace(/>/g, '&gt;');

  // In attributes, also encode quotes
  if (inAttribute) {
    result = result.replace(/"/g, '&quot;');
    // Single quotes can stay as-is in double-quoted attributes
  }

  return result;
}

/**
 * Escape CDATA content - split ]]> into ]]]]><![CDATA[>
 */
export function escapeCData(content: string): string {
  return content.replace(/\]\]>/g, ']]]]><![CDATA[>');
}

import { test, expect, describe } from 'bun:test';
import { safeHtml, readHtml, writeHtml } from '../index';
import type { HtmlNode, HtmlElement } from '../index';

describe('safeHtml - Basic Tag Filtering', () => {
  test('allows tags in allowedTags list', () => {
    const node: HtmlNode = {
      type: 'p',
      props: { children: 'Hello' },
    };
    const result = safeHtml(node);
    expect(result).toEqual({
      type: 'p',
      props: { children: 'Hello' },
    });
  });

  test('removes disallowed tags but keeps content', () => {
    const node: HtmlNode = {
      type: 'script',
      props: { children: 'alert("xss")' },
    };
    const result = safeHtml(node);
    // Script not in default allowed list, content is kept
    expect(result).toBe('alert("xss")');
  });

  test('handles nested disallowed tags', () => {
    const node: HtmlNode = {
      type: 'div',
      props: {
        children: {
          type: 'p',
          props: { children: 'Keep me' },
        },
      },
    };
    const result = safeHtml(node);
    // div is not allowed, but p is - content should be flattened
    expect(result).toEqual({
      type: 'p',
      props: { children: 'Keep me' },
    });
  });

  test('replaces img with alt text when not allowed', () => {
    const node: HtmlNode = {
      type: 'img',
      props: { src: 'test.png', alt: 'A test image' },
    };
    const result = safeHtml(node);
    expect(result).toBe('A test image');
  });

  test('removes img without alt silently', () => {
    const node: HtmlNode = {
      type: 'img',
      props: { src: 'test.png' },
    };
    const result = safeHtml(node);
    expect(result).toBeUndefined();
  });

  test('preserves primitives', () => {
    expect(safeHtml('text')).toBe('text');
    expect(safeHtml(123)).toBe(123);
    expect(safeHtml(true)).toBe(true);
    expect(safeHtml(null)).toBe(null);
    expect(safeHtml(undefined)).toBe(undefined);
  });

  test('processes arrays of nodes', () => {
    const nodes: HtmlNode = [
      { type: 'p', props: { children: 'A' } },
      { type: 'script', props: { children: 'bad' } },
      { type: 'em', props: { children: 'B' } },
    ];
    const result = safeHtml(nodes) as HtmlNode[];
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
    expect((result[0] as HtmlElement).type).toBe('p');
    expect(result[1]).toBe('bad');
    expect((result[2] as HtmlElement).type).toBe('em');
  });
});

describe('safeHtml - Attribute Filtering', () => {
  test('allows attributes specified for tag', () => {
    const node: HtmlNode = {
      type: 'a',
      props: {
        href: 'https://example.com',
        rel: 'noopener',
        className: 'link',
        onclick: 'evil()',
        children: 'Link',
      },
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result.props.href).toBe('https://example.com');
    expect(result.props.rel).toBe('noopener');
    expect(result.props.onclick).toBeUndefined();
  });

  test('removes all non-allowed attributes', () => {
    const node: HtmlNode = {
      type: 'p',
      props: {
        id: 'test',
        'data-custom': 'value',
        onclick: 'evil()',
        children: 'Text',
      },
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result.props.id).toBeUndefined();
    expect(result.props['data-custom']).toBeUndefined();
    expect(result.props.onclick).toBeUndefined();
    expect(result.props.children).toBe('Text');
  });

  test('handles ol with start and reversed attributes', () => {
    const node: HtmlNode = {
      type: 'ol',
      props: {
        start: 5,
        reversed: true,
        id: 'my-list',
        children: { type: 'li', props: { children: 'Item' } },
      },
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result.props.start).toBe(5);
    expect(result.props.reversed).toBe(true);
    expect(result.props.id).toBeUndefined();
  });

  test('handles li with value attribute', () => {
    const node: HtmlNode = {
      type: 'li',
      props: { value: 3, children: 'Third' },
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result.props.value).toBe(3);
  });
});

describe('safeHtml - Class Filtering', () => {
  test('filters classes by allowed patterns', () => {
    const node: HtmlNode = {
      type: 'span',
      props: { className: 'h-card p-name dangerous-class mention' },
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result.props.className).toBe('h-card p-name mention');
  });

  test('removes class attribute if no classes match', () => {
    const node: HtmlNode = {
      type: 'span',
      props: { className: 'bad-class evil-class' },
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result.props.className).toBeUndefined();
  });

  test('handles wildcard patterns', () => {
    const node: HtmlNode = {
      type: 'span',
      props: { className: 'h-entry h-feed u-url dt-published e-content' },
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result.props.className).toBe('h-entry h-feed u-url dt-published e-content');
  });

  test('handles exact match patterns', () => {
    const node: HtmlNode = {
      type: 'span',
      props: { className: 'mention hashtag ellipsis invisible unknown' },
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result.props.className).toBe('mention hashtag ellipsis invisible');
  });

  test('class filtering with custom patterns', () => {
    const node: HtmlNode = {
      type: 'span',
      props: { className: 'custom-class allowed-thing foo-bar' },
    };
    const result = safeHtml(node, {
      allowedTags: [['span', 'class']],
      allowedClasses: ['custom-*', 'foo-bar'],
    }) as HtmlElement;
    expect(result.props.className).toBe('custom-class foo-bar');
  });
});

describe('safeHtml - URL Protocol Filtering', () => {
  test('allows http and https by default', () => {
    const node: HtmlNode = {
      type: 'a',
      props: {
        href: 'https://example.com',
        children: 'Link',
      },
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result.props.href).toBe('https://example.com');
  });

  test('removes anchor with javascript: protocol', () => {
    const node: HtmlNode = {
      type: 'a',
      props: {
        href: 'javascript:alert("xss")',
        children: 'Evil Link',
      },
    };
    const result = safeHtml(node);
    // Element removed, but children kept
    expect(result).toBe('Evil Link');
  });

  test('removes anchor with data: protocol', () => {
    const node: HtmlNode = {
      type: 'a',
      props: {
        href: 'data:text/html,<script>alert("xss")</script>',
        children: 'Data Link',
      },
    };
    const result = safeHtml(node);
    expect(result).toBe('Data Link');
  });

  test('allows custom protocols', () => {
    const node: HtmlNode = {
      type: 'a',
      props: {
        href: 'magnet:?xt=urn:btih:...',
        children: 'Magnet Link',
      },
    };
    const result = safeHtml(node, {
      allowedLinkProtocols: ['http', 'https', 'magnet'],
    }) as HtmlElement;
    expect(result.props.href).toBe('magnet:?xt=urn:btih:...');
  });

  test('allows ipfs protocol when specified', () => {
    const node: HtmlNode = {
      type: 'a',
      props: {
        href: 'ipfs://QmXxxx',
        children: 'IPFS Link',
      },
    };
    const result = safeHtml(node, {
      allowedLinkProtocols: ['ipfs'],
    }) as HtmlElement;
    expect(result.props.href).toBe('ipfs://QmXxxx');
  });

  test('allows relative URLs with "." protocol', () => {
    const node: HtmlNode = {
      type: 'a',
      props: { href: '/path/to/page', children: 'Relative' },
    };
    const result = safeHtml(node, {
      allowedLinkProtocols: ['.'],
    }) as HtmlElement;
    expect(result.props.href).toBe('/path/to/page');
  });

  test('handles various relative URL formats with "." protocol', () => {
    const testCases = [
      '/absolute/path',
      './relative/path',
      '../parent/path',
      '#anchor',
      '?query=value',
      'path/without/slash',
    ];

    for (const href of testCases) {
      const node: HtmlNode = {
        type: 'a',
        props: { href, children: 'Link' },
      };
      const result = safeHtml(node, {
        allowedLinkProtocols: ['.'],
      }) as HtmlElement;
      expect(result.props.href).toBe(href);
    }
  });

  test('rejects absolute URLs when only "." is allowed', () => {
    const node: HtmlNode = {
      type: 'a',
      props: { href: 'https://example.com', children: 'Absolute' },
    };
    const result = safeHtml(node, {
      allowedLinkProtocols: ['.'],
    });
    expect(result).toBe('Absolute');
  });
});

describe('safeHtml - img and media URL handling', () => {
  test('removes img with disallowed protocol and returns alt', () => {
    const node: HtmlNode = {
      type: 'img',
      props: {
        src: 'javascript:alert("xss")',
        alt: 'Image description',
      },
    };
    // img is not in default allowed tags, so it gets replaced with alt
    const result = safeHtml(node);
    expect(result).toBe('Image description');
  });

  test('img with allowed protocol but not in allowedTags still returns alt', () => {
    const node: HtmlNode = {
      type: 'img',
      props: {
        src: 'https://example.com/image.png',
        alt: 'Valid image',
      },
    };
    const result = safeHtml(node);
    expect(result).toBe('Valid image');
  });

  test('allows img when in allowedTags with proper protocol', () => {
    const node: HtmlNode = {
      type: 'img',
      props: {
        src: 'https://example.com/image.png',
        alt: 'Valid image',
      },
    };
    const result = safeHtml(node, {
      allowedTags: [['img', 'src', 'alt']],
    }) as HtmlElement;
    expect(result.type).toBe('img');
    expect(result.props.src).toBe('https://example.com/image.png');
  });

  test('removes allowed img with bad protocol', () => {
    const node: HtmlNode = {
      type: 'img',
      props: {
        src: 'javascript:evil()',
        alt: 'Bad image',
      },
    };
    const result = safeHtml(node, {
      allowedTags: [['img', 'src', 'alt']],
    });
    expect(result).toBe('Bad image');
  });
});

describe('safeHtml - Custom Options', () => {
  test('uses custom allowedTags', () => {
    const node: HtmlNode = {
      type: 'div',
      props: {
        className: 'container',
        children: 'Content',
      },
    };
    const result = safeHtml(node, {
      allowedTags: [['div', 'class']],
      allowedClasses: ['container'],
    }) as HtmlElement;
    expect(result.type).toBe('div');
    expect(result.props.className).toBe('container');
  });

  test('uses custom allowedClasses', () => {
    const node: HtmlNode = {
      type: 'span',
      props: { className: 'my-custom-class default-class' },
    };
    const result = safeHtml(node, {
      allowedClasses: ['my-custom-*'],
    }) as HtmlElement;
    expect(result.props.className).toBe('my-custom-class');
  });

  test('uses custom allowedLinkProtocols', () => {
    const node: HtmlNode = {
      type: 'a',
      props: { href: 'ftp://files.example.com', children: 'FTP' },
    };
    const result = safeHtml(node, {
      allowedLinkProtocols: ['ftp'],
    }) as HtmlElement;
    expect(result.props.href).toBe('ftp://files.example.com');
  });

  test('merges defaults when only some options provided', () => {
    // Only override allowedTags, classes and protocols use defaults
    const node: HtmlNode = {
      type: 'a',
      props: {
        href: 'https://example.com',
        rel: 'noopener',
        className: 'h-card mention',
        children: 'Link',
      },
    };
    const result = safeHtml(node, {
      allowedTags: [['a', 'href', 'rel', 'class']],
    }) as HtmlElement;
    expect(result.props.href).toBe('https://example.com');
    expect(result.props.rel).toBe('noopener');
    expect(result.props.className).toBe('h-card mention');
  });
});

describe('safeHtml - Complex Nesting', () => {
  test('handles deeply nested structures', () => {
    const node: HtmlNode = {
      type: 'div',
      props: {
        children: {
          type: 'section',
          props: {
            children: {
              type: 'p',
              props: {
                children: {
                  type: 'strong',
                  props: { children: 'Bold text' },
                },
              },
            },
          },
        },
      },
    };
    const result = safeHtml(node) as HtmlElement;
    // div and section not allowed, p and strong are
    expect(result.type).toBe('p');
    expect((result.props.children as HtmlElement).type).toBe('strong');
  });

  test('handles mixed content with arrays', () => {
    const node: HtmlNode = {
      type: 'div',
      props: {
        children: [
          'Some text ',
          { type: 'strong', props: { children: 'bold' } },
          ' more text',
        ],
      },
    };
    const result = safeHtml(node) as HtmlNode[];
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toBe('Some text ');
    expect((result[1] as HtmlElement).type).toBe('strong');
    expect(result[2]).toBe(' more text');
  });

  test('handles empty elements', () => {
    const node: HtmlNode = {
      type: 'br',
      props: {},
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result.type).toBe('br');
    expect(result.props).toEqual({});
  });

  test('flattens multiple levels of disallowed tags', () => {
    const node: HtmlNode = {
      type: 'html',
      props: {
        children: {
          type: 'body',
          props: {
            children: {
              type: 'main',
              props: {
                children: {
                  type: 'p',
                  props: { children: 'Finally allowed' },
                },
              },
            },
          },
        },
      },
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result.type).toBe('p');
    expect(result.props.children).toBe('Finally allowed');
  });
});

describe('safeHtml - Integration with parser', () => {
  test('works with parsed HTML', () => {
    const parsed = readHtml('<div><script>alert("xss")</script><p>Safe content</p></div>');
    const safe = safeHtml(parsed.node);
    const output = writeHtml(safe);
    expect(output).toContain('<p>Safe content</p>');
    expect(output).toContain('alert("xss")');
    expect(output).not.toContain('<script>');
  });

  test('sanitizes anchor with javascript href', () => {
    const parsed = readHtml('<p>Click <a href="javascript:void(0)">here</a></p>');
    const safe = safeHtml(parsed.node);
    const output = writeHtml(safe);
    expect(output).toBe('<p>Click here</p>');
  });

  test('preserves valid links', () => {
    const parsed = readHtml('<p>Visit <a href="https://example.com" rel="noopener">Example</a></p>');
    const safe = safeHtml(parsed.node);
    const output = writeHtml(safe);
    expect(output).toContain('href="https://example.com"');
    expect(output).toContain('rel="noopener"');
  });

  test('filters classes in parsed HTML', () => {
    const parsed = readHtml('<span class="h-card mention evil-class">User</span>');
    const safe = safeHtml(parsed.node);
    const output = writeHtml(safe);
    // Default writer eitherName normalizes className to class
    expect(output).toContain('class="h-card mention"');
    expect(output).not.toContain('evil-class');
  });

  test('handles complex real-world HTML', () => {
    const html = `
      <div class="post">
        <p>Check out <a href="https://example.com" class="mention" onclick="track()">@user</a></p>
        <script>malicious()</script>
        <blockquote>
          <p>A quote with <em>emphasis</em></p>
        </blockquote>
        <img src="data:text/html,<script>" alt="Bad image">
      </div>
    `;
    const parsed = readHtml(html);
    const safe = safeHtml(parsed.node);
    const output = writeHtml(safe);

    // Should keep safe elements
    expect(output).toContain('<p>');
    expect(output).toContain('<blockquote>');
    expect(output).toContain('<em>emphasis</em>');
    expect(output).toContain('mention');

    // Should remove dangerous elements
    expect(output).not.toContain('<script>');
    expect(output).not.toContain('onclick');
    expect(output).not.toContain('<img');

    // Should replace img with alt
    expect(output).toContain('Bad image');
  });
});

describe('safeHtml - Edge Cases', () => {
  test('handles empty arrays', () => {
    const result = safeHtml([]);
    expect(result).toEqual([]);
  });

  test('handles arrays with only null/undefined', () => {
    const result = safeHtml([null, undefined]);
    expect(result).toEqual([]);
  });

  test('handles bigint', () => {
    const result = safeHtml(BigInt(12345));
    expect(result).toBe(BigInt(12345));
  });

  test('handles element with no props', () => {
    const node: HtmlNode = {
      type: 'br',
      props: {},
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result).toEqual({ type: 'br', props: {} });
  });

  test('handles element with only children in props', () => {
    const node: HtmlNode = {
      type: 'p',
      props: { children: 'Just text' },
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result).toEqual({ type: 'p', props: { children: 'Just text' } });
  });

  test('case insensitive tag matching', () => {
    const node: HtmlNode = {
      type: 'P',
      props: { children: 'Uppercase' },
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result.type).toBe('P');
    expect(result.props.children).toBe('Uppercase');
  });

  test('case insensitive protocol matching', () => {
    const node: HtmlNode = {
      type: 'a',
      props: { href: 'HTTPS://EXAMPLE.COM', children: 'Link' },
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result.props.href).toBe('HTTPS://EXAMPLE.COM');
  });

  test('handles whitespace in URLs', () => {
    const node: HtmlNode = {
      type: 'a',
      props: { href: '  https://example.com  ', children: 'Link' },
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result.props.href).toBe('  https://example.com  ');
  });
});

describe('safeHtml - Default options match spec', () => {
  test('default allowed tags work as specified', () => {
    const allowedTagNames = ['br', 'span', 'p', 'a', 'pre', 'del', 'code', 'em', 'strong', 'i', 'u', 'ul', 'ol', 'li', 'blockquote'];

    for (const tagName of allowedTagNames) {
      const node: HtmlNode = { type: tagName, props: { children: 'test' } };
      const result = safeHtml(node) as HtmlElement;
      expect(result.type).toBe(tagName);
    }
  });

  test('default class patterns work as specified', () => {
    const patterns = ['h-card', 'p-name', 'u-url', 'dt-published', 'e-content', 'mention', 'hashtag', 'ellipsis', 'invisible'];
    const node: HtmlNode = {
      type: 'span',
      props: { className: patterns.join(' ') + ' bad-class' },
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result.props.className).toBe(patterns.join(' '));
  });

  test('default protocols http and https work', () => {
    const httpNode: HtmlNode = { type: 'a', props: { href: 'http://example.com', children: 'HTTP' } };
    const httpsNode: HtmlNode = { type: 'a', props: { href: 'https://example.com', children: 'HTTPS' } };

    const httpResult = safeHtml(httpNode) as HtmlElement;
    const httpsResult = safeHtml(httpsNode) as HtmlElement;

    expect(httpResult.props.href).toBe('http://example.com');
    expect(httpsResult.props.href).toBe('https://example.com');
  });
});

describe('safeHtml - Attribute Naming Options', () => {
  test('default (reactName) outputs className', () => {
    const node: HtmlNode = {
      type: 'span',
      props: { className: 'h-card mention' },
    };
    const result = safeHtml(node) as HtmlElement;
    expect(result.props.className).toBe('h-card mention');
    expect(result.props.class).toBeUndefined();
  });

  test('reactName accepts className input and outputs className', () => {
    const node: HtmlNode = {
      type: 'span',
      props: { className: 'h-card mention' },
    };
    const result = safeHtml(node, { attributeNaming: 'reactName' }) as HtmlElement;
    expect(result.props.className).toBe('h-card mention');
    expect(result.props.class).toBeUndefined();
  });

  test('reactName accepts class input and outputs className', () => {
    const node: HtmlNode = {
      type: 'span',
      props: { class: 'h-card mention' },
    };
    const result = safeHtml(node, { attributeNaming: 'reactName' }) as HtmlElement;
    expect(result.props.className).toBe('h-card mention');
    expect(result.props.class).toBeUndefined();
  });

  test('exactName accepts className input and outputs class', () => {
    const node: HtmlNode = {
      type: 'span',
      props: { className: 'h-card mention' },
    };
    const result = safeHtml(node, { attributeNaming: 'exactName' }) as HtmlElement;
    expect(result.props.class).toBe('h-card mention');
    expect(result.props.className).toBeUndefined();
  });

  test('exactName accepts class input and outputs class', () => {
    const node: HtmlNode = {
      type: 'span',
      props: { class: 'h-card mention' },
    };
    const result = safeHtml(node, { attributeNaming: 'exactName' }) as HtmlElement;
    expect(result.props.class).toBe('h-card mention');
    expect(result.props.className).toBeUndefined();
  });

  test('filters classes correctly with reactName', () => {
    const node: HtmlNode = {
      type: 'span',
      props: { className: 'h-card evil-class mention' },
    };
    const result = safeHtml(node, { attributeNaming: 'reactName' }) as HtmlElement;
    expect(result.props.className).toBe('h-card mention');
  });

  test('filters classes correctly with exactName', () => {
    const node: HtmlNode = {
      type: 'span',
      props: { class: 'h-card evil-class mention' },
    };
    const result = safeHtml(node, { attributeNaming: 'exactName' }) as HtmlElement;
    expect(result.props.class).toBe('h-card mention');
  });

  test('works with parsed HTML using exactName', () => {
    const parsed = readHtml('<span class="h-card mention evil">User</span>', { attributeNaming: 'exactName' });
    const safe = safeHtml(parsed.node, { attributeNaming: 'exactName' }) as HtmlElement;
    expect(safe.props.class).toBe('h-card mention');
    expect(safe.props.className).toBeUndefined();
  });

  test('works with parsed HTML using reactName', () => {
    const parsed = readHtml('<span class="h-card mention evil">User</span>', { attributeNaming: 'reactName' });
    const safe = safeHtml(parsed.node, { attributeNaming: 'reactName' }) as HtmlElement;
    expect(safe.props.className).toBe('h-card mention');
    expect(safe.props.class).toBeUndefined();
  });

  test('full round-trip with exactName', () => {
    const parsed = readHtml('<p><span class="mention">@user</span></p>', { attributeNaming: 'exactName' });
    const safe = safeHtml(parsed.node, { attributeNaming: 'exactName' });
    const output = writeHtml(safe, { attributeNaming: 'exactName' });
    expect(output).toBe('<p><span class="mention">@user</span></p>');
  });

  test('full round-trip with reactName then eitherName writer', () => {
    const parsed = readHtml('<p><span class="mention">@user</span></p>', { attributeNaming: 'reactName' });
    const safe = safeHtml(parsed.node, { attributeNaming: 'reactName' });
    const output = writeHtml(safe, { attributeNaming: 'eitherName' });
    expect(output).toBe('<p><span class="mention">@user</span></p>');
  });

  test('handles for/htmlFor with reactName', () => {
    const node: HtmlNode = {
      type: 'label',
      props: { htmlFor: 'my-input', children: 'Label' },
    };
    const result = safeHtml(node, {
      allowedTags: [['label', 'for']],
      attributeNaming: 'reactName',
    }) as HtmlElement;
    expect(result.props.htmlFor).toBe('my-input');
    expect(result.props.for).toBeUndefined();
  });

  test('handles for/htmlFor with exactName', () => {
    const node: HtmlNode = {
      type: 'label',
      props: { for: 'my-input', children: 'Label' },
    };
    const result = safeHtml(node, {
      allowedTags: [['label', 'for']],
      attributeNaming: 'exactName',
    }) as HtmlElement;
    expect(result.props.for).toBe('my-input');
    expect(result.props.htmlFor).toBeUndefined();
  });

  test('htmlFor input with exactName output', () => {
    const node: HtmlNode = {
      type: 'label',
      props: { htmlFor: 'my-input', children: 'Label' },
    };
    const result = safeHtml(node, {
      allowedTags: [['label', 'for']],
      attributeNaming: 'exactName',
    }) as HtmlElement;
    expect(result.props.for).toBe('my-input');
    expect(result.props.htmlFor).toBeUndefined();
  });
});

describe('safeHtml - Wildcard Features', () => {
  test('allowedClasses with "*" allows all classes', () => {
    const node: HtmlNode = {
      type: 'span',
      props: { className: 'any-class another-class totally-random' },
    };
    const result = safeHtml(node, {
      allowedTags: [['span', 'class']],
      allowedClasses: ['*'],
    }) as HtmlElement;
    expect(result.props.className).toBe('any-class another-class totally-random');
  });

  test('allowedClasses with "*" preserves all classes including dangerous-looking ones', () => {
    const node: HtmlNode = {
      type: 'span',
      props: { className: 'evil-class malicious-style xss-attempt' },
    };
    const result = safeHtml(node, {
      allowedTags: [['span', 'class']],
      allowedClasses: ['*'],
    }) as HtmlElement;
    expect(result.props.className).toBe('evil-class malicious-style xss-attempt');
  });

  test('allowedTags with "*" string allows all tags with no attributes', () => {
    const node: HtmlNode = {
      type: 'div',
      props: {
        id: 'test-id',
        className: 'test-class',
        children: 'Content',
      },
    };
    const result = safeHtml(node, {
      allowedTags: ['*'],
    }) as HtmlElement;
    expect(result.type).toBe('div');
    expect(result.props.children).toBe('Content');
    // No attributes should be allowed
    expect(result.props.id).toBeUndefined();
    expect(result.props.className).toBeUndefined();
  });

  test('allowedTags with ["*", "href", "class"] allows all tags with only specified attributes', () => {
    const node: HtmlNode = {
      type: 'custom-element',
      props: {
        href: 'https://example.com',
        className: 'my-class',
        id: 'should-be-removed',
        onclick: 'evil()',
        children: 'Link',
      },
    };
    const result = safeHtml(node, {
      allowedTags: [['*', 'href', 'class']],
      allowedClasses: ['my-class'],
    }) as HtmlElement;
    expect(result.type).toBe('custom-element');
    expect(result.props.href).toBe('https://example.com');
    expect(result.props.className).toBe('my-class');
    expect(result.props.id).toBeUndefined();
    expect(result.props.onclick).toBeUndefined();
    expect(result.props.children).toBe('Link');
  });

  test('allowedTags with ["*", "href", "class", "title"] works with multiple custom tags', () => {
    const nodes: HtmlNode = [
      {
        type: 'my-component',
        props: { href: '/page', className: 'link', title: 'My Title', children: 'Link' },
      },
      {
        type: 'another-tag',
        props: { className: 'test', id: 'removed', children: 'Text' },
      },
    ];
    const result = safeHtml(nodes, {
      allowedTags: [['*', 'href', 'class', 'title']],
      allowedClasses: ['*'],
      allowedLinkProtocols: ['.'],
    }) as HtmlNode[];

    expect(Array.isArray(result)).toBe(true);
    const first = result[0] as HtmlElement;
    const second = result[1] as HtmlElement;

    expect(first.type).toBe('my-component');
    expect(first.props.href).toBe('/page');
    expect(first.props.className).toBe('link');
    expect(first.props.title).toBe('My Title');

    expect(second.type).toBe('another-tag');
    expect(second.props.className).toBe('test');
    expect(second.props.id).toBeUndefined();
  });

  test('allowedTags "*" combined with specific tags', () => {
    const node: HtmlNode = {
      type: 'div',
      props: {
        children: [
          { type: 'p', props: { id: 'para', children: 'Paragraph' } },
          { type: 'custom', props: { href: '/link', children: 'Custom' } },
        ],
      },
    };
    const result = safeHtml(node, {
      allowedTags: [['*', 'href'], ['p', 'id']],
      allowedLinkProtocols: ['.'],
    }) as HtmlElement;

    expect(result.type).toBe('div');
    const children = result.props.children as HtmlElement[];
    expect(children[0]!.type).toBe('p');
    expect(children[0]!.props.id).toBe('para');
    expect(children[1]!.type).toBe('custom');
    expect(children[1]!.props.href).toBe('/link');
  });

  test('wildcard "*" for classes combined with allowedTags "*" with attributes', () => {
    const node: HtmlNode = {
      type: 'anything',
      props: {
        className: 'literally-any-class another forbidden',
        href: 'https://example.com',
        onclick: 'removed()',
        children: 'Content',
      },
    };
    const result = safeHtml(node, {
      allowedTags: [['*', 'class', 'href']],
      allowedClasses: ['*'],
    }) as HtmlElement;

    expect(result.type).toBe('anything');
    expect(result.props.className).toBe('literally-any-class another forbidden');
    expect(result.props.href).toBe('https://example.com');
    expect(result.props.onclick).toBeUndefined();
  });

  test('allowedTags "*" still validates URL protocols', () => {
    const node: HtmlNode = {
      type: 'a',
      props: {
        href: 'javascript:alert("xss")',
        children: 'Evil Link',
      },
    };
    const result = safeHtml(node, {
      allowedTags: [['*', 'href']],
    });
    // Element should be removed due to bad protocol, children kept
    expect(result).toBe('Evil Link');
  });

  test('allowedTags "*" with title attribute on various elements', () => {
    const nodes: HtmlNode = [
      { type: 'abbr', props: { title: 'Abbreviation', children: 'ABBR' } },
      { type: 'span', props: { title: 'Tooltip', children: 'Hover' } },
      { type: 'div', props: { title: 'Division', children: 'Block' } },
    ];
    const result = safeHtml(nodes, {
      allowedTags: [['*', 'title']],
    }) as HtmlNode[];

    expect(Array.isArray(result)).toBe(true);
    expect((result[0] as HtmlElement).props.title).toBe('Abbreviation');
    expect((result[1] as HtmlElement).props.title).toBe('Tooltip');
    expect((result[2] as HtmlElement).props.title).toBe('Division');
  });

  test('allowedTags ["*", "*"] allows all tags with all attributes', () => {
    const node: HtmlNode = {
      type: 'custom-element',
      props: {
        id: 'my-id',
        className: 'my-class',
        'data-value': '123',
        href: 'https://example.com',
        onclick: 'kept()',
        title: 'My Title',
        children: 'Content',
      },
    };
    const result = safeHtml(node, {
      allowedTags: [['*', '*']],
    }) as HtmlElement;

    expect(result.type).toBe('custom-element');
    expect(result.props.id).toBe('my-id');
    expect(result.props.className).toBe('my-class');
    expect(result.props['data-value']).toBe('123');
    expect(result.props.href).toBe('https://example.com');
    expect(result.props.onclick).toBe('kept()');
    expect(result.props.title).toBe('My Title');
    expect(result.props.children).toBe('Content');
  });

  test('specific tag with wildcard attributes ["div", "*"] allows all attributes for div', () => {
    const node: HtmlNode = {
      type: 'div',
      props: {
        id: 'test',
        className: 'container',
        'data-custom': 'value',
        onclick: 'kept()',
        style: 'color: red',
        children: 'Text',
      },
    };
    const result = safeHtml(node, {
      allowedTags: [['div', '*']],
    }) as HtmlElement;

    expect(result.type).toBe('div');
    expect(result.props.id).toBe('test');
    expect(result.props.className).toBe('container');
    expect(result.props['data-custom']).toBe('value');
    expect(result.props.onclick).toBe('kept()');
    expect(result.props.style).toBe('color: red');
    expect(result.props.children).toBe('Text');
  });

  test('["*", "*"] still validates URL protocols', () => {
    const node: HtmlNode = {
      type: 'a',
      props: {
        href: 'javascript:alert("xss")',
        id: 'link',
        children: 'Evil Link',
      },
    };
    const result = safeHtml(node, {
      allowedTags: [['*', '*']],
    });
    // Element should be removed due to bad protocol, children kept
    expect(result).toBe('Evil Link');
  });

  test('["*", "*"] with allowed javascript protocol keeps everything', () => {
    const node: HtmlNode = {
      type: 'a',
      props: {
        href: 'javascript:void(0)',
        id: 'link',
        className: 'button',
        children: 'Button Link',
      },
    };
    const result = safeHtml(node, {
      allowedTags: [['*', '*']],
      allowedLinkProtocols: ['javascript'],
    }) as HtmlElement;

    expect(result.type).toBe('a');
    expect(result.props.href).toBe('javascript:void(0)');
    expect(result.props.id).toBe('link');
    expect(result.props.className).toBe('button');
  });

  test('mixed tags: specific tag with "*" attributes and normal tags', () => {
    const nodes: HtmlNode = [
      {
        type: 'div',
        props: { id: 'container', 'data-value': '1', className: 'box', children: 'Div' },
      },
      {
        type: 'p',
        props: { id: 'removed', className: 'text', children: 'Paragraph' },
      },
    ];
    const result = safeHtml(nodes, {
      allowedTags: [['div', '*'], ['p', 'class']],
      allowedClasses: ['text'],
    }) as HtmlNode[];

    const div = result[0] as HtmlElement;
    const p = result[1] as HtmlElement;

    expect(div.type).toBe('div');
    expect(div.props.id).toBe('container');
    expect(div.props['data-value']).toBe('1');
    expect(div.props.className).toBe('box');

    expect(p.type).toBe('p');
    expect(p.props.id).toBeUndefined();
    expect(p.props.className).toBe('text');
  });

  test('["*", "*"] with ["*"] for classes allows everything', () => {
    const node: HtmlNode = {
      type: 'anything',
      props: {
        className: 'any-class-at-all forbidden evil',
        id: 'test',
        'data-foo': 'bar',
        children: 'Content',
      },
    };
    const result = safeHtml(node, {
      allowedTags: [['*', '*']],
      allowedClasses: ['*'],
    }) as HtmlElement;

    expect(result.type).toBe('anything');
    expect(result.props.className).toBe('any-class-at-all forbidden evil');
    expect(result.props.id).toBe('test');
    expect(result.props['data-foo']).toBe('bar');
  });

  test('["div", "*"] keeps all classes when wildcard attributes used', () => {
    const node: HtmlNode = {
      type: 'div',
      props: {
        className: 'allowed-class forbidden-class another',
        id: 'test',
        children: 'Text',
      },
    };
    const result = safeHtml(node, {
      allowedTags: [['div', '*']],
      allowedClasses: ['allowed-*'],
    }) as HtmlElement;

    expect(result.type).toBe('div');
    expect(result.props.id).toBe('test');
    // When using ['div', '*'], all attributes including all class values are kept
    expect(result.props.className).toBe('allowed-class forbidden-class another');
  });

  test('explicit class attribute filters classes', () => {
    const node: HtmlNode = {
      type: 'div',
      props: {
        className: 'allowed-class forbidden-class another',
        id: 'test',
        children: 'Text',
      },
    };
    const result = safeHtml(node, {
      allowedTags: [['div', 'id', 'class']],
      allowedClasses: ['allowed-*'],
    }) as HtmlElement;

    expect(result.type).toBe('div');
    expect(result.props.id).toBe('test');
    // When explicitly listing 'class' attribute, class filtering applies
    expect(result.props.className).toBe('allowed-class');
  });
});

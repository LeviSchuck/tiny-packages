import { test, expect, describe } from 'bun:test';
import { readHtml, writeHtml, awaitHtmlNode } from '../index';
import type { HtmlNode } from '../index';

describe('Round-trip Tests', () => {
  test('round-trips simple HTML', () => {
    const html = '<div>Hello</div>';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);
    expect(rendered).toBe(html);
  });

  test('round-trips nested HTML', () => {
    const html = '<div><p>Hello & goodbye</p></div>';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);
    expect(rendered).toBe('<div><p>Hello &amp; goodbye</p></div>');
  });

  test('round-trips attributes', () => {
    // Parser converts class to className, writer outputs as-is
    const html = '<div class="foo">test</div>';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);
    expect(rendered).toBe('<div className="foo">test</div>');
  });

  test('round-trips void elements', () => {
    const html = '<img src="test.png" />';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);
    expect(rendered).toBe(html);
  });

  test('round-trips multiple root elements', () => {
    const html = '<div>A</div><div>B</div>';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);
    expect(rendered).toBe(html);
  });
});

describe('Complex HTML', () => {
  test('handles full HTML documents', () => {
    const html = '<!DOCTYPE html><html><head><title>Test</title></head><body><div>Content</div></body></html>';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);

    expect(parsed.doctype).toBe('<!DOCTYPE html>');
    expect(rendered).toContain('<!DOCTYPE html>');
    expect(rendered).toContain('<html>');
    expect(rendered).toContain('<body>');
  });

  test('handles XML documents', () => {
    const html = '<?xml version="1.0"?><root><child>text</child></root>';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);

    expect(parsed.xml).toBe('<?xml version="1.0"?>');
    expect(rendered).toContain('<?xml version="1.0"?>');
  });

  test('handles tables', () => {
    const html = '<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);

    expect(rendered).toContain('<table>');
    expect(rendered).toContain('<tr>');
    expect(rendered).toContain('<td>');
  });

  test('handles SVG graphics', () => {
    const html = '<svg viewBox="0 0 100 100"><feGaussianBlur stdDeviation="5" /></svg>';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);

    expect(rendered).toContain('viewBox="0 0 100 100"');
    expect(rendered).toContain('<feGaussianBlur');
    expect(rendered).toContain('stdDeviation="5"');
  });

  test('handles script tags with operators', () => {
    const html = '<script>if (x < 5 && y > 3) { alert("test"); }</script>';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);

    expect(rendered).toContain('if (x < 5 && y > 3)');
  });

  test('handles style tags with selectors', () => {
    const html = '<style>.foo > .bar { color: red; }</style>';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);

    expect(rendered).toContain('.foo > .bar');
  });

  test('strips comments', () => {
    const html = '<!-- comment --><div>test</div><!-- another -->';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);

    expect(rendered).not.toContain('comment');
    expect(rendered).not.toContain('another');
    expect(rendered).toBe('<div>test</div>');
  });

  test('normalizes case', () => {
    const html = '<DIV CLASS="foo"><P>Test</P></DIV>';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);

    expect(rendered).toBe('<div className="foo"><p>Test</p></div>');
  });
});

describe('Promise Workflow', () => {
  test('resolves promises before rendering', async () => {
    const nodeWithPromises = {
      type: 'div',
      props: {
        children: [
          Promise.resolve('async text'),
          {
            type: 'span',
            props: {
              children: Promise.resolve('more'),
            },
          },
        ],
      },
    } as HtmlNode;

    const resolved = await awaitHtmlNode(nodeWithPromises);
    const html = writeHtml(resolved as any);

    expect(html).toBe('<div>async text<span>more</span></div>');
  });

  test('drops unresolved promises in children', () => {
    const nodeWithPromise = {
      type: 'div',
      props: {
        children: Promise.resolve('text'),
      },
    } as any;

    const html = writeHtml(nodeWithPromise);
    expect(html).toBe('<div></div>'); // Promise is dropped, leaving empty div
  });
});

describe('Edge Cases', () => {
  test('handles empty HTML', () => {
    const parsed = readHtml('');
    expect(parsed.node).toBe(null);
  });

  test('handles text-only content', () => {
    const parsed = readHtml('plain text');
    expect(parsed.node).toBe('plain text');
  });

  test('handles entities in attributes', () => {
    const html = '<div title="&lt;test&gt;">content</div>';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);

    // Entities are decoded during parsing, then re-encoded during writing
    expect((parsed.node as any).props.title).toBe('<test>');
    expect(rendered).toContain('title="&lt;test&gt;"');
  });

  test('handles style attribute round-trip', () => {
    const html = '<div style="color: red; font-size: 12px">test</div>';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);

    expect(rendered).toContain('style="color: red; font-size: 12px"');
  });

  test('handles CDATA in input', () => {
    const html = '<div><![CDATA[<raw>content</raw>]]></div>';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);

    expect(rendered).toBe('<div>&lt;raw&gt;content&lt;/raw&gt;</div>');
  });

  test('handles malformed tags gracefully', () => {
    const html = '<div class="foo>test';
    const parsed = readHtml(html);

    // Parser handles malformed HTML with best effort
    expect(parsed.node).toBeDefined();
  });

  test('handles auto-closing paragraphs', () => {
    const html = '<p>First<p>Second</p>';
    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);

    // Both paragraphs should be properly closed
    expect(rendered).toContain('<p>First</p>');
    expect(rendered).toContain('<p>Second</p>');
  });
});

describe('Real-world Examples', () => {
  test('handles email template structure', () => {
    const html = `
<!DOCTYPE html>
<html>
  <body>
    <table>
      <tr><td>Hello</td></tr>
    </table>
  </body>
</html>`.trim();

    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);

    expect(rendered).toContain('<!DOCTYPE html>');
    expect(rendered).toContain('<table>');
    expect(rendered).toContain('Hello');
  });

  test('handles SVG icon', () => {
    const html = `<svg viewBox="0 0 24 24">
  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
</svg>`;

    const parsed = readHtml(html);
    const rendered = writeHtml(parsed);

    expect(rendered).toContain('viewBox="0 0 24 24"');
    expect(rendered).toContain('<path');
  });
});

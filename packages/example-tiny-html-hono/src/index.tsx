import { Hono } from 'hono';
import { readHtml, htmlNodeTo } from '@levischuck/tiny-html';
import type { HtmlNode } from '@levischuck/tiny-html';
import { createElement, JSXNode } from 'hono/jsx';

const app = new Hono();

const defaultHtml = `<div style="padding: 20px; background: linear-gradient(135deg, #2d7d2d 0%, #1a5e1a 100%); color: white; border-radius: 8px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">
  <h1>Hello from tiny-html!</h1>
  <p>This HTML is parsed and rendered using <strong>@levischuck/tiny-html</strong></p>
  <ul>
    <li>Server-side rendering with Hono</li>
    <li>Full HTML support</li>
    <li>Input preserved after submission</li>
  </ul>
</div>`;

// Convert HtmlNode to Hono JSX element
const toHonoJSX = (node: HtmlNode) => {
  return htmlNodeTo(node, createElement);
};

interface PageProps {
  htmlInput: string;
  renderedOutput?: JSXNode | null;
  error?: string;
}

function Page({ htmlInput, renderedOutput, error }: PageProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>tiny-html + Hono Demo</title>
      </head>
      <body style="margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5;">
        <div style="display: flex; min-height: 100vh; gap: 0;">

          {/* Left Panel: Input Form */}
          <div style="flex: 1; padding: 2rem; background: white; box-shadow: 2px 0 8px rgba(0,0,0,0.1); display: flex; flex-direction: column;">
            <h2 style="margin-top: 0; color: #333;">HTML Input</h2>
            <form method="post" action="/" style="display: flex; flex-direction: column; flex: 1;">
              <textarea
                name="htmlInput"
                style="flex: 1; padding: 1rem; border: 2px solid #ddd; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 14px; resize: none; min-height: 400px;"
                placeholder="Enter HTML here..."
              >{htmlInput}</textarea>
              <button
                type="submit"
                style="margin-top: 1rem; padding: 12px 24px; background: #2d7d2d; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s;"
                onmouseover="this.style.background='#1a5e1a'"
                onmouseout="this.style.background='#2d7d2d'"
              >
                Render HTML
              </button>
            </form>
          </div>

          {/* Right Panel: Rendered Output */}
          <div style="flex: 1; padding: 2rem; background: #fafafa; display: flex; flex-direction: column;">
            <h2 style="margin-top: 0; color: #333;">Rendered Output</h2>
            <div style="flex: 1; padding: 1rem; background: white; border: 2px solid #ddd; border-radius: 8px; overflow: auto;">
              {error ? (
                <div style="color: red; padding: 1rem; background: #ffe6e6; border-radius: 4px; border: 1px solid #ff9999;">
                  <strong>Error parsing HTML:</strong><br />
                  {error}
                </div>
              ) : renderedOutput ? (
                renderedOutput
              ) : (
                <p style="color: #999; font-style: italic;">
                  Submit HTML to see the rendered output here.
                </p>
              )}
            </div>
          </div>

        </div>
      </body>
    </html>
  );
}

app.get('/', (c) => {
  return c.html(<Page htmlInput={defaultHtml} />);
});

app.post('/', async (c) => {
  const body = await c.req.parseBody();
  const htmlInput = String(body.htmlInput || '');

  let renderedOutput: JSXNode | null = null;
  let error: string | undefined;

  try {
    // Parse the HTML using tiny-html
    const result = readHtml(htmlInput);

    // Convert HtmlNode to Hono JSX element using htmlNodeTo
    renderedOutput = toHonoJSX(result. node);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  return c.html(
    <Page
      htmlInput={htmlInput}
      renderedOutput={renderedOutput}
      error={error}
    />
  );
});

const port = 3000;

export default {
  port,
  fetch: app.fetch,
};

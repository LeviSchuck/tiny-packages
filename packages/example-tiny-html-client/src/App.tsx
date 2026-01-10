import { useState, createElement } from 'react';
import type { ReactNode } from 'react';
import { readHtml, htmlNodeTo} from '@levischuck/tiny-html';
import type { HtmlNode } from '@levischuck/tiny-html';
import './App.css';

const defaultHtml = `<div style="padding: 20px; background: linear-gradient(135deg, #2d7d2d 0%, #1a5e1a 100%); color: white; border-radius: 8px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">
  <h1>Hello from tiny-html!</h1>
  <p>This HTML is parsed and rendered using <strong>@levischuck/tiny-html</strong></p>
  <ul>
    <li>Live updates as you type</li>
    <li>Full HTML support</li>
    <li>React element rendering</li>
  </ul>
</div>`;

// React-specific helper using the generic converter from tiny-html
const toReactElement = (node: HtmlNode): ReactNode => {
  return htmlNodeTo<ReactNode>(node, createElement);
};

function App() {
  const [htmlInput, setHtmlInput] = useState(defaultHtml);

  let renderedNode: ReactNode = null;
  let parseError = null;

  try {
    const result = readHtml(htmlInput);
    renderedNode = toReactElement(result.node);
  } catch (error) {
    parseError = error instanceof Error ? error.message : 'Unknown error';
  }

  return (
    <div className="app-container">
      <div className="input-panel">
        <h2>HTML Input</h2>
        <textarea
          className="html-input"
          value={htmlInput}
          onChange={(e) => setHtmlInput(e.target.value)}
          placeholder="Enter HTML here..."
        />
      </div>

      <div className="output-panel">
        <h2>Rendered Output</h2>
        <div className="rendered-output">
          {parseError ? (
            <div className="error">Error: {parseError}</div>
          ) : (
            renderedNode
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

import { VOID_ELEMENTS, NEVER_SELF_CLOSE } from './constants.ts';
import { encodeHtmlEntities, escapeCData } from './entities.ts';
import { toKebabCase } from './utils.ts';
import type { HtmlNode, HtmlElement, WriterOptions, ParseResult, HtmlStyle, Namespace } from './types.ts';

export function renderHtml(input: HtmlNode | ParseResult, options: WriterOptions = {}): string {
  const chunks: string[] = [];

  // Extract node, xml, and doctype from input
  let node: HtmlNode;
  let xml: string | undefined;
  let doctype: string | undefined;

  if (input && typeof input === 'object' && 'node' in input) {
    // It's a ParseResult
    const parseResult = input as ParseResult;
    node = parseResult.node as HtmlNode;
    xml = parseResult.xml ?? options.xml;
    doctype = parseResult.doctype ?? options.doctype;
  } else {
    // It's a HtmlNode
    node = input as HtmlNode;
    xml = options.xml;
    doctype = options.doctype;
  }

  // Add XML processing instruction
  if (xml) {
    chunks.push(xml);
    if (!xml.endsWith('\n')) {
      chunks.push('\n');
    }
  }

  // Add DOCTYPE
  if (doctype) {
    chunks.push(doctype);
    if (!doctype.endsWith('\n')) {
      chunks.push('\n');
    }
  }

  // Render the node tree
  const useCDataForScripts = options.useCDataForScripts ?? false;
  const useCDataForStyles = options.useCDataForStyles ?? false;
  const voidTrailingSlash = options.voidTrailingSlash ?? true;

  renderNode(node, chunks, 'HTML' as Namespace, useCDataForScripts, useCDataForStyles, voidTrailingSlash);

  return chunks.join('');
}

function renderNode(
  node: HtmlNode,
  chunks: string[],
  namespace: Namespace,
  useCDataForScripts: boolean,
  useCDataForStyles: boolean,
  voidTrailingSlash: boolean
): void {
  if (node === null || node === undefined) {
    return;
  }

  if (typeof node === 'string') {
    chunks.push(encodeHtmlEntities(node, false));
    return;
  }

  if (typeof node === 'number' || typeof node === 'bigint') {
    chunks.push(String(node));
    return;
  }

  if (typeof node === 'boolean') {
    chunks.push(String(node));
    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      renderNode(child, chunks, namespace, useCDataForScripts, useCDataForStyles, voidTrailingSlash);
    }
    return;
  }

  // Drop invalid types (functions, symbols, promises)
  if (typeof node === 'function') {
    return; // Drop functions
  }

  if (typeof node === 'symbol') {
    return; // Drop symbols
  }

  if (node && typeof node === 'object' && 'then' in node && typeof node.then === 'function') {
    return; // Drop promises (should use awaitReactNode first)
  }

  // Must be ReactElement
  if (node && typeof node === 'object' && 'type' in node && 'props' in node) {
    const element = node as HtmlElement;
    renderElement(element, chunks, namespace, useCDataForScripts, useCDataForStyles, voidTrailingSlash);
    return;
  }

  // Unknown type, drop it
}

function renderElement(
  element: HtmlElement,
  chunks: string[],
  namespace: Namespace,
  useCDataForScripts: boolean,
  useCDataForStyles: boolean,
  voidTrailingSlash: boolean
): void {
  const tagName = element.type;

  // Update namespace
  let currentNamespace = namespace;
  if (tagName === 'svg') {
    currentNamespace = 'SVG' as Namespace;
  } else if (tagName === 'math') {
    currentNamespace = 'MATHML' as Namespace;
  }

  // Open tag
  chunks.push('<');
  chunks.push(tagName);

  // Render attributes
  if (element.props) {
    for (const [key, value] of Object.entries(element.props)) {
      if (key === 'children') continue;

      if (value === false || value === null || value === undefined) {
        // Omit false, null, undefined attributes
        continue;
      }

      if (value === true) {
        // Boolean attribute
        chunks.push(' ');
        chunks.push(key);
      } else if (key === 'style' && typeof value === 'object') {
        // Style object
        const styleStr = renderStyle(value as HtmlStyle);
        if (styleStr) {
          chunks.push(' style="');
          chunks.push(encodeHtmlEntities(styleStr, true));
          chunks.push('"');
        }
      } else {
        // String, number, or other value
        chunks.push(' ');
        chunks.push(key);
        chunks.push('="');
        chunks.push(encodeHtmlEntities(String(value), true));
        chunks.push('"');
      }
    }
  }

  // Handle children and closing
  const children = element.props?.children;

  // Drop promises in children (should use awaitReactNode first)
  let hasChildren: boolean;
  if (children && typeof children === 'object' && 'then' in children && typeof children.then === 'function') {
    // Treat as having no children
    hasChildren = false;
  } else {
    hasChildren = children !== undefined && children !== null && (
      (Array.isArray(children) && children.length > 0) ||
      (!Array.isArray(children) && children !== false)
    );
  }

  if (VOID_ELEMENTS.has(tagName)) {
    // Void element
    if (voidTrailingSlash) {
      chunks.push(' />');
    } else {
      chunks.push('>');
    }
  } else if (hasChildren) {
    // Has children
    chunks.push('>');

    // Type assertion: we've already checked for promises above
    const childrenNode = children as HtmlNode;

    // Special handling for script/style with CDATA
    if (tagName === 'script' && useCDataForScripts) {
      chunks.push('<![CDATA[');
      renderNodeContent(childrenNode, chunks, currentNamespace, useCDataForScripts, useCDataForStyles, voidTrailingSlash, true);
      chunks.push(']]>');
    } else if (tagName === 'style' && useCDataForStyles) {
      chunks.push('<![CDATA[');
      renderNodeContent(childrenNode, chunks, currentNamespace, useCDataForScripts, useCDataForStyles, voidTrailingSlash, true);
      chunks.push(']]>');
    } else if (tagName === 'script' || tagName === 'style') {
      // Script and style content should not be entity-encoded
      renderRawContent(childrenNode, chunks);
    } else {
      renderNode(childrenNode, chunks, currentNamespace, useCDataForScripts, useCDataForStyles, voidTrailingSlash);
    }

    chunks.push('</');
    chunks.push(tagName);
    chunks.push('>');
  } else if (NEVER_SELF_CLOSE.has(tagName)) {
    // Empty but must use closing tag
    chunks.push('></');
    chunks.push(tagName);
    chunks.push('>');
  } else {
    // Empty and can self-close
    chunks.push('></');
    chunks.push(tagName);
    chunks.push('>');
  }
}

function renderNodeContent(
  node: HtmlNode,
  chunks: string[],
  namespace: Namespace,
  useCDataForScripts: boolean,
  useCDataForStyles: boolean,
  voidTrailingSlash: boolean,
  insideCData: boolean
): void {
  if (node === null || node === undefined) {
    return;
  }

  if (typeof node === 'string') {
    if (insideCData) {
      chunks.push(escapeCData(node));
    } else {
      chunks.push(encodeHtmlEntities(node, false));
    }
    return;
  }

  if (typeof node === 'number' || typeof node === 'bigint' || typeof node === 'boolean') {
    chunks.push(String(node));
    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      renderNodeContent(child, chunks, namespace, useCDataForScripts, useCDataForStyles, voidTrailingSlash, insideCData);
    }
    return;
  }

  // For elements inside CDATA, just render normally
  renderNode(node, chunks, namespace, useCDataForScripts, useCDataForStyles, voidTrailingSlash);
}

function renderRawContent(node: HtmlNode, chunks: string[]): void {
  if (node === null || node === undefined) {
    return;
  }

  if (typeof node === 'string') {
    // No encoding for script/style content
    chunks.push(node);
    return;
  }

  if (typeof node === 'number' || typeof node === 'bigint' || typeof node === 'boolean') {
    chunks.push(String(node));
    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      renderRawContent(child, chunks);
    }
    return;
  }
}

function renderStyle(style: HtmlStyle): string {
  const declarations: string[] = [];

  for (const [prop, value] of Object.entries(style)) {
    if (value) {
      const kebabProp = toKebabCase(prop);
      declarations.push(`${kebabProp}: ${value}`);
    }
  }

  return declarations.join('; ');
}

export function getTextContent(node: HtmlNode): string {
	const text : string[] = [];
	function traverse(node: HtmlNode): void {
		if (typeof node === "string") {
			text.push(node);
		}
		if (typeof node === "number" || typeof node === "bigint" || typeof node === "boolean") {
			text.push(`${node}`);
		}
		if (typeof node === "object" && node !== null && "type" in node && node.props && "children" in node.props) {
			const children = node.props.children;
			if (node.type === "script" || node.type === "style" || node.type === "template") {
				return;
			}
			// Skip promises (should use awaitHtmlNode first)
			if (children && typeof children === "object" && "then" in children && typeof children.then === "function") {
				return;
			}
			if (Array.isArray(children)) {
				for (const child of children) {
					traverse(child);
				}
			} else if (children !== null && children !== undefined) {
				// Handle single element children
				traverse(children as HtmlNode);
			}
		}
		if (Array.isArray(node)) {
			for (const child of node) {
				traverse(child);
			}
		}
	}
	traverse(node);
	return text.join("");
}

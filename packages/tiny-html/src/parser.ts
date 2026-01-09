import {
  VOID_ELEMENTS,
  AUTO_CLOSING_SIBLINGS,
  SVG_TAG_CASE_MAP,
  SVG_ATTR_CASE_MAP,
} from './constants.ts';
import { decodeHtmlEntities } from './entities.ts';
import { toCamelCase, decodeUtf8, isWhitespace, isNameChar } from './utils.ts';
import type {
  ParseResult,
  HtmlNode,
  HtmlElement,
  ParserState,
  Namespace,
  ElementStackEntry,
  HtmlStyle,
  HtmlProps,
} from './types.ts';

export function parseHtml(html: string): ParseResult {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(html);

  const result: ParseResult = {
    node: [],
  };

  const rootChildren: HtmlNode[] = [];
  const stack: ElementStackEntry[] = [];
  let currentNamespace: Namespace = 'HTML' as Namespace;

  let state: ParserState = 'TEXT' as ParserState;
  let i = 0;
  let textStart = 0;
  let tagNameStart = 0;
  let attrNameStart = 0;
  let attrValueStart = 0;
  let currentAttrName = '';
  let currentQuoteChar = 0;
  let currentElement: ElementStackEntry | null = null;

  function getCurrentChildren(): HtmlNode[] {
    return stack.length > 0 ? stack[stack.length - 1]!.children : rootChildren;
  }

  function addTextNode(start: number, end: number): void {
    if (start >= end) return;
    const text = decodeUtf8(bytes, start, end);
    const decoded = decodeHtmlEntities(text);
    if (decoded.length > 0) {
      getCurrentChildren().push(decoded);
    }
  }

  function addRawTextNode(start: number, end: number): void {
    if (start >= end) return;
    const text = decodeUtf8(bytes, start, end);
    if (text.length > 0) {
      getCurrentChildren().push(text);
    }
  }

  function normalizeTagName(name: string, namespace: Namespace): string {
    const lower = name.toLowerCase();
    if (namespace === 'SVG' as Namespace && SVG_TAG_CASE_MAP.has(lower)) {
      return SVG_TAG_CASE_MAP.get(lower)!;
    }
    return lower;
  }

  function normalizeAttrName(name: string, namespace: Namespace): string {
    const lower = name.toLowerCase();

    // Special React attributes - preserve exact casing
    if (lower === 'class') return 'className';
    if (lower === 'for') return 'htmlFor';

    if (namespace === 'SVG' as Namespace) {
      // Check if it's a known SVG attribute that needs case correction
      if (SVG_ATTR_CASE_MAP.has(lower)) {
        return SVG_ATTR_CASE_MAP.get(lower)!;
      }
      // Preserve original case for other SVG attributes
      return name;
    }

    // Convert to camelCase for HTML attributes
    if (namespace === 'HTML' as Namespace) {
      const camelCased = toCamelCase(lower);
      // Special case: preserve className, htmlFor as-is
      if (lower === 'class' || lower === 'for') {
        return lower === 'class' ? 'className' : 'htmlFor';
      }
      return camelCased;
    }

    return lower;
  }

  function closeTag(tagName: string): void {
    const normalizedName = normalizeTagName(tagName, currentNamespace);

    // Find matching tag in stack
    for (let j = stack.length - 1; j >= 0; j--) {
      if (stack[j]!.type === normalizedName) {
        // Close all tags from j to end
        for (let k = stack.length - 1; k >= j; k--) {
          const elem = stack.pop()!;
          const reactElem: HtmlElement = {
            type: elem.type,
            props: {
              ...elem.props,
              children: elem.children.length === 1 ? elem.children[0] : elem.children,
            },
          };

          if (stack.length > 0) {
            stack[stack.length - 1]!.children.push(reactElem);
          } else {
            rootChildren.push(reactElem);
          }

          // Restore namespace when exiting SVG
          if (elem.type === 'svg' || elem.type === 'math') {
            currentNamespace = 'HTML' as Namespace;
          }
        }
        return;
      }
    }

    // No matching open tag found, ignore stray closing tag
  }

  function openTag(tagName: string, props: Partial<HtmlProps>, selfClosing: boolean): void {
    const normalizedName = normalizeTagName(tagName, currentNamespace);

    // Check for auto-closing siblings
    if (stack.length > 0 && AUTO_CLOSING_SIBLINGS.has(normalizedName)) {
      const siblings = AUTO_CLOSING_SIBLINGS.get(normalizedName)!;
      const topTag = stack[stack.length - 1]!.type;
      if (siblings.has(topTag)) {
        closeTag(topTag);
      }
    }

    // Update namespace
    let newNamespace = currentNamespace;
    if (normalizedName === 'svg') {
      newNamespace = 'SVG' as Namespace;
    } else if (normalizedName === 'math') {
      newNamespace = 'MATHML' as Namespace;
    }

    if (VOID_ELEMENTS.has(normalizedName) || selfClosing) {
      // Void element or self-closing, add directly
      const reactElem: HtmlElement = {
        type: normalizedName,
        props: props,
      };
      getCurrentChildren().push(reactElem);
    } else {
      // Push to stack
      const elem: ElementStackEntry = {
        type: normalizedName,
        props: props,
        children: [],
        namespace: newNamespace,
      };
      stack.push(elem);
      currentNamespace = newNamespace;
    }
  }

  // Main parsing loop
  while (i < bytes.length) {
    const byte = bytes[i]!;

    switch (state) {
      case 'TEXT' as ParserState:
        if (byte === 0x3C) { // <
          addTextNode(textStart, i);
          state = 'TAG_OPEN' as ParserState;
          i++;
        } else {
          i++;
        }
        break;

      case 'TAG_OPEN' as ParserState:
        if (byte === 0x21) { // !
          // Could be comment, DOCTYPE, or CDATA
          if (bytes[i + 1] === 0x2D && bytes[i + 2] === 0x2D) {
            // Comment: <!--
            state = 'COMMENT' as ParserState;
            i += 3;
          } else if (bytes[i + 1] === 0x44 || bytes[i + 1] === 0x64) {
            // DOCTYPE
            const docStr = decodeUtf8(bytes, i, Math.min(i + 20, bytes.length)).toLowerCase();
            if (docStr.startsWith('!doctype')) {
              state = 'DOCTYPE' as ParserState;
              tagNameStart = i;
              i++;
            } else {
              // Unknown, treat as text
              textStart = i - 1;
              state = 'TEXT' as ParserState;
            }
          } else if (bytes[i + 1] === 0x5B && bytes[i + 2] === 0x43) {
            // Check for CDATA
            const cdataStr = decodeUtf8(bytes, i, Math.min(i + 9, bytes.length));
            if (cdataStr.startsWith('![CDATA[')) {
              state = 'CDATA' as ParserState;
              textStart = i + 8;
              i += 8;
            } else {
              textStart = i - 1;
              state = 'TEXT' as ParserState;
            }
          } else {
            textStart = i - 1;
            state = 'TEXT' as ParserState;
          }
        } else if (byte === 0x3F) { // ?
          // Processing instruction
          state = 'PROCESSING_INSTRUCTION' as ParserState;
          tagNameStart = i - 1;
          i++;
        } else if (byte === 0x2F) { // /
          // Closing tag
          state = 'TAG_CLOSE_START' as ParserState;
          i++;
        } else if (isNameChar(byte)) {
          // Opening tag
          tagNameStart = i;
          state = 'TAG_NAME' as ParserState;
          currentElement = null;
          i++;
        } else {
          // Invalid, treat as text
          textStart = i - 1;
          state = 'TEXT' as ParserState;
        }
        break;

      case 'TAG_NAME' as ParserState:
        if (isWhitespace(byte)) {
          const tagName = decodeUtf8(bytes, tagNameStart, i);
          // Determine namespace for this element's attributes
          const tagLower = tagName.toLowerCase();
          const attrNamespace = (tagLower === 'svg') ? 'SVG' as Namespace :
                                (tagLower === 'math') ? 'MATHML' as Namespace :
                                currentNamespace;
          currentElement = {
            type: tagName,
            props: {},
            children: [],
            namespace: attrNamespace,
          };
          state = 'ATTRIBUTES' as ParserState;
          i++;
        } else if (byte === 0x3E) { // >
          const tagName = decodeUtf8(bytes, tagNameStart, i);
          openTag(tagName, {}, false);

          // Check for script/style
          const normalized = normalizeTagName(tagName, currentNamespace);
          if (normalized === 'script') {
            state = 'SCRIPT_CONTENT' as ParserState;
            textStart = i + 1;
          } else if (normalized === 'style') {
            state = 'STYLE_CONTENT' as ParserState;
            textStart = i + 1;
          } else {
            state = 'TEXT' as ParserState;
            textStart = i + 1;
          }
          i++;
        } else if (byte === 0x2F) { // /
          state = 'TAG_CLOSE_SELF' as ParserState;
          i++;
        } else if (isNameChar(byte)) {
          i++;
        } else {
          // Invalid character, treat whole thing as text
          textStart = tagNameStart - 1;
          state = 'TEXT' as ParserState;
        }
        break;

      case 'ATTRIBUTES' as ParserState:
        if (isWhitespace(byte)) {
          i++;
        } else if (byte === 0x3E) { // >
          const tagName = currentElement!.type;
          openTag(tagName, currentElement!.props, false);

          const normalized = normalizeTagName(tagName, currentNamespace);
          if (normalized === 'script') {
            state = 'SCRIPT_CONTENT' as ParserState;
            textStart = i + 1;
          } else if (normalized === 'style') {
            state = 'STYLE_CONTENT' as ParserState;
            textStart = i + 1;
          } else {
            state = 'TEXT' as ParserState;
            textStart = i + 1;
          }
          i++;
        } else if (byte === 0x2F) { // /
          state = 'TAG_CLOSE_SELF' as ParserState;
          i++;
        } else if (isNameChar(byte)) {
          attrNameStart = i;
          state = 'ATTRIBUTE_NAME' as ParserState;
          i++;
        } else {
          // Invalid, treat as text
          textStart = tagNameStart - 1;
          state = 'TEXT' as ParserState;
        }
        break;

      case 'ATTRIBUTE_NAME' as ParserState:
        if (isWhitespace(byte)) {
          currentAttrName = decodeUtf8(bytes, attrNameStart, i);
          const normalizedAttr = normalizeAttrName(currentAttrName, currentElement!.namespace);
          currentElement!.props[normalizedAttr] = true;
          currentAttrName = '';
          state = 'ATTRIBUTES' as ParserState;
          i++;
        } else if (byte === 0x3D) { // =
          currentAttrName = decodeUtf8(bytes, attrNameStart, i);
          state = 'ATTRIBUTE_VALUE_START' as ParserState;
          i++;
        } else if (byte === 0x3E) { // >
          currentAttrName = decodeUtf8(bytes, attrNameStart, i);
          const normalizedAttr = normalizeAttrName(currentAttrName, currentElement!.namespace);
          currentElement!.props[normalizedAttr] = true;
          currentAttrName = '';

          const tagName = currentElement!.type;
          openTag(tagName, currentElement!.props, false);

          const normalized = normalizeTagName(tagName, currentNamespace);
          if (normalized === 'script') {
            state = 'SCRIPT_CONTENT' as ParserState;
            textStart = i + 1;
          } else if (normalized === 'style') {
            state = 'STYLE_CONTENT' as ParserState;
            textStart = i + 1;
          } else {
            state = 'TEXT' as ParserState;
            textStart = i + 1;
          }
          i++;
        } else if (byte === 0x2F) { // /
          currentAttrName = decodeUtf8(bytes, attrNameStart, i);
          const normalizedAttr = normalizeAttrName(currentAttrName, currentElement!.namespace);
          currentElement!.props[normalizedAttr] = true;
          currentAttrName = '';
          state = 'TAG_CLOSE_SELF' as ParserState;
          i++;
        } else if (isNameChar(byte)) {
          i++;
        } else {
          textStart = tagNameStart - 1;
          state = 'TEXT' as ParserState;
        }
        break;

      case 'ATTRIBUTE_VALUE_START' as ParserState:
        if (isWhitespace(byte)) {
          i++;
        } else if (byte === 0x22 || byte === 0x27) { // " or '
          currentQuoteChar = byte;
          attrValueStart = i + 1;
          state = 'ATTRIBUTE_VALUE_QUOTED' as ParserState;
          i++;
        } else {
          attrValueStart = i;
          state = 'ATTRIBUTE_VALUE_UNQUOTED' as ParserState;
        }
        break;

      case 'ATTRIBUTE_VALUE_QUOTED' as ParserState:
        if (byte === currentQuoteChar) {
          const rawValue = decodeUtf8(bytes, attrValueStart, i);
          const value = decodeHtmlEntities(rawValue);
          const normalizedAttr = normalizeAttrName(currentAttrName, currentElement!.namespace);

          // Handle style attribute specially
          if (normalizedAttr === 'style') {
            currentElement!.props[normalizedAttr] = parseStyleAttribute(value);
          } else {
            currentElement!.props[normalizedAttr] = value;
          }

          currentAttrName = '';
          state = 'ATTRIBUTES' as ParserState;
          i++;
        } else {
          i++;
        }
        break;

      case 'ATTRIBUTE_VALUE_UNQUOTED' as ParserState:
        if (isWhitespace(byte) || byte === 0x3E || byte === 0x2F) {
          const rawValue = decodeUtf8(bytes, attrValueStart, i);
          const value = decodeHtmlEntities(rawValue);
          const normalizedAttr = normalizeAttrName(currentAttrName, currentElement!.namespace);

          if (normalizedAttr === 'style') {
            currentElement!.props[normalizedAttr] = parseStyleAttribute(value);
          } else {
            currentElement!.props[normalizedAttr] = value;
          }

          currentAttrName = '';
          state = 'ATTRIBUTES' as ParserState;
          // Don't increment i, let ATTRIBUTES handle the next char
        } else {
          i++;
        }
        break;

      case 'TAG_CLOSE_SELF' as ParserState:
        if (byte === 0x3E) { // >
          const tagName = currentElement!.type;
          openTag(tagName, currentElement!.props, true);
          state = 'TEXT' as ParserState;
          textStart = i + 1;
          i++;
        } else {
          textStart = tagNameStart - 1;
          state = 'TEXT' as ParserState;
        }
        break;

      case 'TAG_CLOSE_START' as ParserState:
        if (isNameChar(byte)) {
          tagNameStart = i;
          state = 'TAG_CLOSE_NAME' as ParserState;
          i++;
        } else {
          textStart = i - 2;
          state = 'TEXT' as ParserState;
        }
        break;

      case 'TAG_CLOSE_NAME' as ParserState:
        if (byte === 0x3E) { // >
          const tagName = decodeUtf8(bytes, tagNameStart, i);
          closeTag(tagName);
          state = 'TEXT' as ParserState;
          textStart = i + 1;
          i++;
        } else if (isWhitespace(byte)) {
          // Skip whitespace before >
          i++;
        } else if (isNameChar(byte)) {
          i++;
        } else {
          textStart = tagNameStart - 2;
          state = 'TEXT' as ParserState;
        }
        break;

      case 'COMMENT' as ParserState:
        // Look for -->
        if (byte === 0x2D && bytes[i + 1] === 0x2D && bytes[i + 2] === 0x3E) {
          // End of comment, discard content
          state = 'TEXT' as ParserState;
          textStart = i + 3;
          i += 3;
        } else {
          i++;
        }
        break;

      case 'DOCTYPE' as ParserState:
        if (byte === 0x3E) { // >
          const doctype = decodeUtf8(bytes, tagNameStart, i + 1);
          result.doctype = '<' + doctype;
          state = 'TEXT' as ParserState;
          textStart = i + 1;
          i++;
        } else {
          i++;
        }
        break;

      case 'CDATA' as ParserState:
        // Look for ]]>
        if (byte === 0x5D && bytes[i + 1] === 0x5D && bytes[i + 2] === 0x3E) {
          addRawTextNode(textStart, i);
          state = 'TEXT' as ParserState;
          textStart = i + 3;
          i += 3;
        } else {
          i++;
        }
        break;

      case 'PROCESSING_INSTRUCTION' as ParserState:
        // Look for ?>
        if (byte === 0x3F && bytes[i + 1] === 0x3E) {
          const pi = decodeUtf8(bytes, tagNameStart, i + 2);
          result.xml = pi;
          state = 'TEXT' as ParserState;
          textStart = i + 2;
          i += 2;
        } else {
          i++;
        }
        break;

      case 'SCRIPT_CONTENT' as ParserState:
      case 'STYLE_CONTENT' as ParserState:
        // Look for </script> or </style>
        if (byte === 0x3C && bytes[i + 1] === 0x2F) {
          const tagType = state === ('SCRIPT_CONTENT' as ParserState) ? 'script' : 'style';
          const endTag = '</' + tagType;
          const match = decodeUtf8(bytes, i, Math.min(i + endTag.length + 1, bytes.length)).toLowerCase();

          if (match.startsWith(endTag) && (match[endTag.length] === '>' || isWhitespace(match.charCodeAt(endTag.length)))) {
            // Found closing tag
            addRawTextNode(textStart, i);

            // Skip to >
            let j = i + endTag.length;
            while (j < bytes.length && bytes[j] !== 0x3E) j++;

            closeTag(tagType);
            state = 'TEXT' as ParserState;
            textStart = j + 1;
            i = j + 1;
          } else {
            i++;
          }
        } else {
          i++;
        }
        break;

      default:
        i++;
    }
  }

  // Handle remaining text
  if (state === 'TEXT' as ParserState) {
    addTextNode(textStart, i);
  } else if (state === ('SCRIPT_CONTENT' as ParserState) || state === ('STYLE_CONTENT' as ParserState)) {
    addRawTextNode(textStart, i);
  }

  // Close any remaining open tags
  while (stack.length > 0) {
    const elem = stack.pop()!;
    const reactElem: HtmlElement = {
      type: elem.type,
      props: {
        ...elem.props,
        children: elem.children.length === 1 ? elem.children[0] : elem.children,
      },
    };

    if (stack.length > 0) {
      stack[stack.length - 1]!.children.push(reactElem);
    } else {
      rootChildren.push(reactElem);
    }
  }

  // Set result node
  if (rootChildren.length === 0) {
    result.node = null;
  } else if (rootChildren.length === 1) {
    result.node = rootChildren[0];
  } else {
    result.node = rootChildren;
  }

  return result;
}

function parseStyleAttribute(styleStr: string): HtmlStyle {
  const style: HtmlStyle = {};
  const decoded = decodeHtmlEntities(styleStr);

  // Split by semicolon, but not inside parentheses
  const declarations = decoded.split(/;(?![^(]*\))/);

  for (const decl of declarations) {
    const colonIndex = decl.indexOf(':');
    if (colonIndex === -1) continue;

    const prop = decl.substring(0, colonIndex).trim();
    const value = decl.substring(colonIndex + 1).trim();

    if (prop && value) {
      style[toCamelCase(prop)] = value;
    }
  }

  return style;
}

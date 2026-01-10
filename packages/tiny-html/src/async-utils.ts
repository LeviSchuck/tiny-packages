import type { HtmlNode, HtmlElement, HtmlProps } from './types';

/**
 * Recursively awaits all Promise children in a HtmlNode tree
 * Returns a new HtmlNode with all promises resolved
 * Incompatible types (functions, symbols, etc.) are dropped
 *
 * @param node - A HtmlNode that may contain promises
 * @returns An HtmlNode with all promises resolved
 */
export async function awaitReactNode(node: HtmlNode | Promise<HtmlNode>): Promise<HtmlNode> {
  if (node === null || node === undefined) {
    return node;
  }

  // Check if it's a Promise
  if (node && typeof node === 'object' && 'then' in node && typeof node.then === 'function') {
    const resolved = await node;
    return awaitReactNode(resolved);
  }

  // Primitives pass through
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean' || typeof node === 'bigint') {
    return node;
  }

  // Functions are not allowed - drop them (typically event handlers like onClick)
  if (typeof node === 'function') {
    return undefined;
  }

  // Symbols are not allowed - drop them
  if (typeof node === 'symbol') {
    return undefined;
  }

  // Array of nodes
  if (Array.isArray(node)) {
    const resolvedArray = await Promise.all(
      node
        .filter((child) => {
          // Drop null/undefined children
          if (child === null || child === undefined) {
            return false;
          }
          // Drop functions and symbols
          if (typeof child === 'function' || typeof child === 'symbol') {
            return false;
          }
          return true;
        })
        .map((child) => awaitReactNode(child))
    );
    return resolvedArray;
  }

  // HtmlElement
  if (node && typeof node === 'object' && 'type' in node && 'props' in node) {
    const element = node as HtmlElement;
    const newProps: Partial<HtmlProps> = {};

    // Await all props
    for (const [key, value] of Object.entries(element.props)) {
      if (key === 'children') {
        const awaited = await awaitReactNode(value as HtmlNode);
        // Drop null/undefined children
        if (awaited !== null && awaited !== undefined) {
          newProps.children = awaited as HtmlNode;
        }
      } else {
        // Drop function and symbol props (like onClick handlers)
        if (typeof value === 'function' || typeof value === 'symbol') {
          continue;
        }
        // Drop null/undefined props
        if (value !== null && value !== undefined) {
          newProps[key] = value;
        }
      }
    }

    return {
      type: element.type,
      props: newProps,
    } as HtmlNode;
  }

  // Unknown type - drop it
  return undefined;
}

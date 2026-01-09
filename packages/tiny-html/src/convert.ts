import type { HtmlNode } from './types.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CreateElementProps = Record<string, any>;

export type CreateElementFn<T> = (
  type: string,
  props: CreateElementProps,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...children: any[]
) => T;

/**
 * Generic converter from HtmlNode to any element type T
 * @param node - The HtmlNode to convert
 * @param createElement - Function that creates elements of type T
 * @returns Converted element of type T, or null
 */
export function htmlNodeTo<T>(
  node: HtmlNode,
  createElement: CreateElementFn<T>
): T | null {
  // Handle primitives - these pass through as-is
  if (
    node === null ||
    node === undefined ||
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean' ||
    typeof node === 'bigint'
  ) {
    return node as unknown as T;
  }

  // Handle arrays
  if (Array.isArray(node)) {
    return node.map((child) => htmlNodeTo(child, createElement)) as unknown as T;
  }

  // Handle HtmlElement objects
  if (typeof node === 'object' && 'type' in node && 'props' in node) {
    const { type, props } = node;
    const { children, ...restProps } = props;

    // Recursively convert children
    if (children !== undefined) {
      const converted = htmlNodeTo(children as HtmlNode, createElement);

      if (converted === null) {
        return createElement(type, restProps);
      }

      // If children is an array, spread it
      if (Array.isArray(converted)) {
        return createElement(type, restProps, ...(converted as T[]));
      }

      return createElement(type, restProps, converted as T);
    }

    return createElement(type, restProps);
  }

  // Unknown type, return null
  return null;
}

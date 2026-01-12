import type { HtmlNode, HtmlElement, HtmlProps, SafeHtmlOptions, AllowedTag, ParserAttributeNaming } from './types.ts';

// Borrowing from Mastodon's HTML sanitization default rules:
// https://docs.joinmastodon.org/spec/activitypub/#sanitization

// Default allowed tags for safe HTML (common text formatting and structure)
const DEFAULT_ALLOWED_TAGS: AllowedTag[] = [
  'br',
  ['span', 'class'],
  'p',
  ['a', 'href', 'rel', 'class'],
  'pre',
  'del',
  'code',
  'em',
  'strong',
  'i',
  'u',
  'ul',
  ['ol', 'start', 'reversed'],
  ['li', 'value'],
  'blockquote',
];

// Default allowed class patterns
const DEFAULT_ALLOWED_CLASSES: string[] = [
  'h-*',
  'p-*',
  'u-*',
  'dt-*',
  'e-*',
  'mention',
  'hashtag',
  'ellipsis',
  'invisible',
];

// Default allowed link protocols
const DEFAULT_ALLOWED_PROTOCOLS: string[] = ['http', 'https'];

// Map of elements to their URL-bearing attributes
const URL_ATTRIBUTES: Record<string, string[]> = {
  'a': ['href'],
  'area': ['href'],
  'audio': ['src'],
  'base': ['href'],
  'blockquote': ['cite'],
  'button': ['formaction'],
  'del': ['cite'],
  'embed': ['src'],
  'form': ['action'],
  'iframe': ['src'],
  'img': ['src', 'longdesc'],
  'input': ['src', 'formaction'],
  'ins': ['cite'],
  'link': ['href'],
  'object': ['data'],
  'q': ['cite'],
  'script': ['src'],
  'source': ['src'],
  'track': ['src'],
  'video': ['src', 'poster'],
};

interface TagConfig {
  allowed: boolean;
  allowedAttributes: Set<string>;
  allowAllAttributes: boolean;
}

interface ProcessedOptions {
  tagConfigs: Map<string, TagConfig>;
  classPatterns: RegExp[];
  protocols: Set<string>;
  attributeNaming: ParserAttributeNaming;
  allowAllClasses: boolean;
  allowAllTags: boolean;
  universalAttributes: Set<string>;
  universalAllowAllAttributes: boolean;
}

function buildTagConfig(allowedTags: AllowedTag[]): { configs: Map<string, TagConfig>; allowAll: boolean; universalAttrs: Set<string>; universalAllowAllAttrs: boolean } {
  const configs = new Map<string, TagConfig>();
  let allowAll = false;
  let universalAttrs = new Set<string>();
  let universalAllowAllAttrs = false;

  for (const tag of allowedTags) {
    if (typeof tag === 'string') {
      if (tag === '*') {
        allowAll = true;
      } else {
        configs.set(tag.toLowerCase(), {
          allowed: true,
          allowedAttributes: new Set(),
          allowAllAttributes: false,
        });
      }
    } else {
      const [tagName, ...attrs] = tag;
      const hasWildcardAttr = attrs.includes('*');

      if (tagName === '*') {
        allowAll = true;
        if (hasWildcardAttr) {
          universalAllowAllAttrs = true;
        } else {
          universalAttrs = new Set(attrs.map(a => a.toLowerCase()));
        }
      } else {
        configs.set(tagName.toLowerCase(), {
          allowed: true,
          allowedAttributes: hasWildcardAttr ? new Set() : new Set(attrs.map(a => a.toLowerCase())),
          allowAllAttributes: hasWildcardAttr,
        });
      }
    }
  }

  return { configs, allowAll, universalAttrs, universalAllowAllAttrs };
}

function buildClassPatterns(allowedClasses: string[]): { patterns: RegExp[]; allowAll: boolean } {
  // Check for wildcard that allows all classes
  if (allowedClasses.includes('*')) {
    return { patterns: [], allowAll: true };
  }

  const patterns = allowedClasses.map(pattern => {
    // Escape regex special chars except *
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    // Convert * to .*
    const regexStr = '^' + escaped.replace(/\*/g, '.*') + '$';
    return new RegExp(regexStr);
  });

  return { patterns, allowAll: false };
}

function processOptions(options: SafeHtmlOptions = {}): ProcessedOptions {
  const allowedTags = options.allowedTags ?? DEFAULT_ALLOWED_TAGS;
  const allowedClasses = options.allowedClasses ?? DEFAULT_ALLOWED_CLASSES;
  const allowedProtocols = options.allowedLinkProtocols ?? DEFAULT_ALLOWED_PROTOCOLS;
  const attributeNaming = options.attributeNaming ?? 'reactName';

  const tagConfig = buildTagConfig(allowedTags);
  const classConfig = buildClassPatterns(allowedClasses);

  return {
    tagConfigs: tagConfig.configs,
    classPatterns: classConfig.patterns,
    protocols: new Set(allowedProtocols.map(p => p.toLowerCase())),
    attributeNaming,
    allowAllClasses: classConfig.allowAll,
    allowAllTags: tagConfig.allowAll,
    universalAttributes: tagConfig.universalAttrs,
    universalAllowAllAttributes: tagConfig.universalAllowAllAttrs,
  };
}

function isClassAllowed(className: string, patterns: RegExp[], allowAll: boolean): boolean {
  if (allowAll) return true;
  return patterns.some(pattern => pattern.test(className));
}

function filterClasses(classValue: string, patterns: RegExp[], allowAll: boolean): string {
  if (allowAll) return classValue;
  const classes = classValue.split(/\s+/).filter(c => c.length > 0);
  const filtered = classes.filter(c => isClassAllowed(c, patterns, allowAll));
  return filtered.join(' ');
}

function isUrlAllowed(url: string, protocols: Set<string>): boolean {
  const trimmed = url.trim();

  // Check for relative URLs if '.' protocol is allowed
  if (protocols.has('.')) {
    // Relative URLs start with /, ./, ../, #, ?, or are path-only (no colon before first /)
    if (
      trimmed.startsWith('/') ||
      trimmed.startsWith('./') ||
      trimmed.startsWith('../') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('?')
    ) {
      return true;
    }
    // Check if it's a relative path (no protocol)
    const colonIndex = trimmed.indexOf(':');
    const slashIndex = trimmed.indexOf('/');
    if (colonIndex === -1 || (slashIndex !== -1 && slashIndex < colonIndex)) {
      return true;
    }
  }

  // Extract protocol
  const match = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (!match || !match[1]) {
    // No protocol found - could be relative if '.' is allowed (handled above)
    // Otherwise reject
    return protocols.has('.');
  }

  const protocol = match[1].toLowerCase();
  return protocols.has(protocol);
}

function getUrlAttributes(tagName: string): string[] {
  return URL_ATTRIBUTES[tagName.toLowerCase()] ?? [];
}

function filterAttributes(
  tagName: string,
  props: HtmlProps,
  config: TagConfig,
  opts: ProcessedOptions
): HtmlProps | null {
  const newProps: HtmlProps = {};
  const urlAttrs = getUrlAttributes(tagName);
  const allowAllAttrs = config.allowAllAttributes || opts.universalAllowAllAttributes;

  // Determine output attribute names based on naming convention
  const classAttrName = opts.attributeNaming === 'exactName' ? 'class' : 'className';
  const forAttrName = opts.attributeNaming === 'exactName' ? 'for' : 'htmlFor';

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') {
      continue; // Handle children separately
    }

    const lowerKey = key.toLowerCase();

    // Check if this is a URL attribute that needs protocol validation
    if (urlAttrs.includes(lowerKey) && typeof value === 'string') {
      if (!isUrlAllowed(value, opts.protocols)) {
        // URL not allowed - signal to remove element
        return null;
      }
    }

    // Handle class/className specially (input can be either)
    if ((key === 'className' || key === 'class') && typeof value === 'string') {
      if (allowAllAttrs) {
        // When all attributes are allowed, bypass class filtering
        newProps[classAttrName] = value;
      } else if (config.allowedAttributes.has('class') || opts.universalAttributes.has('class')) {
        // Class attribute is allowed, filter classes according to allowedClasses
        const filtered = filterClasses(value, opts.classPatterns, opts.allowAllClasses);
        if (filtered) {
          newProps[classAttrName] = filtered;
        }
      }
      continue;
    }

    // Handle for/htmlFor specially (input can be either)
    if ((key === 'htmlFor' || key === 'for') && typeof value === 'string') {
      if (allowAllAttrs || config.allowedAttributes.has('for') || opts.universalAttributes.has('for')) {
        newProps[forAttrName] = value;
      }
      continue;
    }

    // Check if attribute is allowed for this tag
    if (allowAllAttrs || config.allowedAttributes.has(lowerKey) || config.allowedAttributes.has(key) ||
        opts.universalAttributes.has(lowerKey) || opts.universalAttributes.has(key)) {
      newProps[key] = value;
    }
  }

  return newProps;
}

function processNode(node: HtmlNode, opts: ProcessedOptions): HtmlNode {
  // Handle null, undefined, primitives
  if (node === null || node === undefined) {
    return node;
  }

  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean' || typeof node === 'bigint') {
    return node;
  }

  // Handle arrays
  if (Array.isArray(node)) {
    const results: HtmlNode[] = [];
    for (const child of node) {
      const processed = processNode(child, opts);
      if (Array.isArray(processed)) {
        results.push(...processed);
      } else if (processed !== null && processed !== undefined) {
        results.push(processed);
      }
    }
    return results.length === 0 ? [] : results.length === 1 ? results[0] : results;
  }

  // Handle HtmlElement
  const element = node as HtmlElement;
  const tagName = element.type.toLowerCase();
  let config = opts.tagConfigs.get(tagName);

  // If tag not found but allowAllTags is true, use universal attributes
  if (!config && opts.allowAllTags) {
    config = {
      allowed: true,
      allowedAttributes: opts.universalAttributes,
      allowAllAttributes: opts.universalAllowAllAttributes,
    };
  }

  // Process children first
  const processedChildren = element.props.children !== undefined
    ? processNode(element.props.children as HtmlNode, opts)
    : undefined;

  // Tag not allowed
  if (!config) {
    // Special case for img: replace with alt text
    if (tagName === 'img') {
      const alt = element.props.alt;
      if (typeof alt === 'string' && alt.length > 0) {
        return alt;
      }
      return undefined;
    }

    // For other tags, fold children into parent
    if (processedChildren !== undefined) {
      return processedChildren;
    }
    return undefined;
  }

  // Tag allowed - filter attributes
  const filteredProps = filterAttributes(tagName, element.props, config, opts);

  // URL validation failed - remove element
  if (filteredProps === null) {
    // For img, return alt text
    if (tagName === 'img') {
      const alt = element.props.alt;
      if (typeof alt === 'string' && alt.length > 0) {
        return alt;
      }
    }
    // For other elements with URLs, fold children
    if (processedChildren !== undefined) {
      return processedChildren;
    }
    return undefined;
  }

  // Add processed children
  if (processedChildren !== undefined) {
    filteredProps.children = processedChildren;
  }

  return {
    type: element.type,
    props: filteredProps,
  };
}

/**
 * Sanitizes an HtmlNode tree by removing disallowed tags, attributes, and URLs.
 *
 * - Tags not in allowedTags have their content retained (folded into parent)
 * - Images replaced with their alt text when removed
 * - Attributes not in the tag's allowed list are dropped
 * - Classes are filtered by allowedClasses patterns (supports wildcards like 'h-*')
 * - URLs not matching allowedLinkProtocols cause the element to be removed
 * - Use '.' as a protocol to allow relative URLs
 * @param node - The HtmlNode to sanitize
 * @param options - The SafeHtmlOptions to use
 * @returns The sanitized HtmlNode
 */
export function safeHtml(node: HtmlNode, options: SafeHtmlOptions = {}): HtmlNode {
  const opts = processOptions(options);
  return processNode(node, opts);
}

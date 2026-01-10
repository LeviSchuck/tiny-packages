// Namespace URIs
export const NAMESPACE_HTML = 'http://www.w3.org/1999/xhtml';
export const NAMESPACE_SVG = 'http://www.w3.org/2000/svg';
export const NAMESPACE_MATHML = 'http://www.w3.org/1998/Math/MathML';

// Void elements (self-closing, no children)
export const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

// Elements that must never self-close (even when empty)
export const NEVER_SELF_CLOSE = new Set([
  // Containers
  'div', 'span', 'p', 'section', 'article', 'aside', 'header', 'footer', 'nav', 'main',
  // Forms
  'button', 'textarea', 'select', 'label', 'form', 'fieldset', 'legend', 'optgroup',
  // Lists
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  // Script/style
  'script', 'style',
  // Formatting
  'a', 'b', 'i', 'strong', 'em', 'u', 's', 'del', 'ins', 'mark', 'small', 'sub', 'sup',
  'code', 'kbd', 'samp', 'var', 'abbr', 'cite', 'dfn', 'q', 'time',
  // Graphics
  'canvas', 'svg',
  // Tables
  'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'caption', 'colgroup',
  // Headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Media
  'video', 'audio', 'picture', 'figure', 'figcaption',
  // Interactive
  'details', 'summary', 'dialog',
  // Other
  'blockquote', 'pre', 'address', 'noscript', 'iframe', 'object', 'map',
  'html', 'head', 'body', 'title', 'meta'
]);

// Tags that auto-close previous siblings
export const AUTO_CLOSING_SIBLINGS: Map<string, Set<string>> = new Map([
  ['p', new Set(['p'])],
  ['li', new Set(['li'])],
  ['dt', new Set(['dt', 'dd'])],
  ['dd', new Set(['dt', 'dd'])],
  ['option', new Set(['option'])],
  ['optgroup', new Set(['optgroup'])],
  ['thead', new Set(['tbody', 'tfoot'])],
  ['tbody', new Set(['thead', 'tfoot'])],
  ['tfoot', new Set(['thead', 'tbody'])],
  ['tr', new Set(['tr'])],
  ['td', new Set(['td', 'th'])],
  ['th', new Set(['td', 'th'])],
]);

// Elements where whitespace is significant
export const WHITESPACE_SENSITIVE = new Set([
  'pre', 'code', 'textarea', 'script', 'style'
]);

// SVG elements requiring case preservation (lowercase -> proper case)
export const SVG_TAG_CASE_MAP = new Map([
  ['altglyph', 'altGlyph'],
  ['altglyphdef', 'altGlyphDef'],
  ['altglyphitem', 'altGlyphItem'],
  ['animatecolor', 'animateColor'],
  ['animatemotion', 'animateMotion'],
  ['animatetransform', 'animateTransform'],
  ['clippath', 'clipPath'],
  ['feblend', 'feBlend'],
  ['fecolormatrix', 'feColorMatrix'],
  ['fecomponenttransfer', 'feComponentTransfer'],
  ['fecomposite', 'feComposite'],
  ['feconvolvematrix', 'feConvolveMatrix'],
  ['fediffuselighting', 'feDiffuseLighting'],
  ['fedisplacementmap', 'feDisplacementMap'],
  ['fedistantlight', 'feDistantLight'],
  ['fedropshadow', 'feDropShadow'],
  ['feflood', 'feFlood'],
  ['fefunca', 'feFuncA'],
  ['fefuncb', 'feFuncB'],
  ['fefuncg', 'feFuncG'],
  ['fefuncr', 'feFuncR'],
  ['fegaussianblur', 'feGaussianBlur'],
  ['feimage', 'feImage'],
  ['femerge', 'feMerge'],
  ['femergenode', 'feMergeNode'],
  ['femorphology', 'feMorphology'],
  ['feoffset', 'feOffset'],
  ['fepointlight', 'fePointLight'],
  ['fespecularlighting', 'feSpecularLighting'],
  ['fespotlight', 'feSpotLight'],
  ['fetile', 'feTile'],
  ['feturbulence', 'feTurbulence'],
  ['foreignobject', 'foreignObject'],
  ['glyphref', 'glyphRef'],
  ['lineargradient', 'linearGradient'],
  ['radialgradient', 'radialGradient'],
  ['textpath', 'textPath'],
]);

// SVG attributes requiring case preservation
export const SVG_ATTR_CASE_MAP = new Map([
  ['attributename', 'attributeName'],
  ['attributetype', 'attributeType'],
  ['basefrequency', 'baseFrequency'],
  ['baseprofile', 'baseProfile'],
  ['calcmode', 'calcMode'],
  ['clippathunits', 'clipPathUnits'],
  ['diffuseconstant', 'diffuseConstant'],
  ['edgemode', 'edgeMode'],
  ['filterunits', 'filterUnits'],
  ['glyphref', 'glyphRef'],
  ['gradienttransform', 'gradientTransform'],
  ['gradientunits', 'gradientUnits'],
  ['kernelmatrix', 'kernelMatrix'],
  ['kernelunitlength', 'kernelUnitLength'],
  ['keypoints', 'keyPoints'],
  ['keysplines', 'keySplines'],
  ['keytimes', 'keyTimes'],
  ['lengthadjust', 'lengthAdjust'],
  ['limitingconeangle', 'limitingConeAngle'],
  ['markerheight', 'markerHeight'],
  ['markerunits', 'markerUnits'],
  ['markerwidth', 'markerWidth'],
  ['maskcontentunits', 'maskContentUnits'],
  ['maskunits', 'maskUnits'],
  ['numoctaves', 'numOctaves'],
  ['pathlength', 'pathLength'],
  ['patterncontentunits', 'patternContentUnits'],
  ['patterntransform', 'patternTransform'],
  ['patternunits', 'patternUnits'],
  ['pointsatx', 'pointsAtX'],
  ['pointsaty', 'pointsAtY'],
  ['pointsatz', 'pointsAtZ'],
  ['preservealpha', 'preserveAlpha'],
  ['preserveaspectratio', 'preserveAspectRatio'],
  ['primitiveunits', 'primitiveUnits'],
  ['refx', 'refX'],
  ['refy', 'refY'],
  ['repeatcount', 'repeatCount'],
  ['repeatdur', 'repeatDur'],
  ['requiredextensions', 'requiredExtensions'],
  ['requiredfeatures', 'requiredFeatures'],
  ['specularconstant', 'specularConstant'],
  ['specularexponent', 'specularExponent'],
  ['spreadmethod', 'spreadMethod'],
  ['startoffset', 'startOffset'],
  ['stddeviation', 'stdDeviation'],
  ['stitchtiles', 'stitchTiles'],
  ['surfacescale', 'surfaceScale'],
  ['systemlanguage', 'systemLanguage'],
  ['tablevalues', 'tableValues'],
  ['targetx', 'targetX'],
  ['targety', 'targetY'],
  ['textlength', 'textLength'],
  ['viewbox', 'viewBox'],
  ['viewtarget', 'viewTarget'],
  ['xchannelselector', 'xChannelSelector'],
  ['ychannelselector', 'yChannelSelector'],
  ['zoomandpan', 'zoomAndPan'],
]);

// Common HTML entities
export const HTML_ENTITIES: Record<string, string> = {
  'lt': '<',
  'gt': '>',
  'amp': '&',
  'quot': '"',
  'apos': "'",
  'nbsp': '\u00A0',
  'iexcl': '¡',
  'cent': '¢',
  'pound': '£',
  'curren': '¤',
  'yen': '¥',
  'brvbar': '¦',
  'sect': '§',
  'uml': '¨',
  'copy': '©',
  'ordf': 'ª',
  'laquo': '«',
  'not': '¬',
  'shy': '\u00AD',
  'reg': '®',
  'macr': '¯',
  'deg': '°',
  'plusmn': '±',
  'sup2': '²',
  'sup3': '³',
  'acute': '´',
  'micro': 'µ',
  'para': '¶',
  'middot': '·',
  'cedil': '¸',
  'sup1': '¹',
  'ordm': 'º',
  'raquo': '»',
  'frac14': '¼',
  'frac12': '½',
  'frac34': '¾',
  'iquest': '¿',
  'times': '×',
  'divide': '÷',
  'ndash': '–',
  'mdash': '—',
  'lsquo': '\u2018',
  'rsquo': '\u2019',
  'sbquo': '‚',
  'ldquo': '\u201C',
  'rdquo': '\u201D',
  'bdquo': '„',
  'dagger': '†',
  'Dagger': '‡',
  'bull': '•',
  'hellip': '…',
  'permil': '‰',
  'prime': '′',
  'Prime': '″',
  'lsaquo': '‹',
  'rsaquo': '›',
  'oline': '‾',
  'frasl': '⁄',
  'euro': '€',
  'trade': '™',
  'larr': '←',
  'uarr': '↑',
  'rarr': '→',
  'darr': '↓',
  'harr': '↔',
  'lArr': '⇐',
  'uArr': '⇑',
  'rArr': '⇒',
  'dArr': '⇓',
  'hArr': '⇔',
};

// Reverse mapping for entity encoding
export const CHAR_TO_ENTITY: Record<string, string> = {};
for (const [name, char] of Object.entries(HTML_ENTITIES)) {
  if (!CHAR_TO_ENTITY[char]) {
    CHAR_TO_ENTITY[char] = name;
  }
}

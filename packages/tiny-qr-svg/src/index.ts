import type { QrResult } from '@levischuck/tiny-qr';

/**
 * Options for the SVG generation
 */
export interface SvgOptions {
  /**
   * Background color (default: `'white'`)
   */
  background?: string;
  /**
   * Foreground color (default: `'black'`)
   */
  color?: string;
  /**
   * Quiet zone size in modules (default: `4`)
   */
  margin?: number;
  /**
   * Size of each module in pixels (default: `4`)
   */
  moduleSize?: number;
  /**
   * Output format (default: `'svg+xml'`)
   */
  output?: 'path' | 'g' | 'svg' | 'svg+xml';
}

export interface JsxOptions {
  /**
   * Background color (default: `'white'`)
   */
  background?: string;
  /**
   * Foreground color (default: `'black'`)
   */
  color?: string;
  /**
   * Quiet zone size in modules (default: `4`)
   */
  margin?: number;
  /**
   * Size of each module in pixels (default: `4`)
   */
  moduleSize?: number;
  /**
   * Output format (default: `'svg'`)
   */
  output?: 'g' | 'svg';
}

/**
 * JSX node type, should be compatible with Hono, React, and Preact
 */
export type JsxNode = JsxElement | string | boolean | number | undefined | null | JsxNode[] | Promise<string>;

/**
 * JSX element type
 */
export interface JsxElement {
  /**
   * Element type
   */
  type: string;
  /**
   * Element properties
   */
  props: Record<string, unknown> & { children?: JsxNode };
}

function generatePathData(matrix: boolean[][], moduleSize: number): string {
  const height = matrix.length;
  const width = matrix[0]?.length ?? 0;

  const pathChunks : string[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (matrix[y]![x]) {
        pathChunks.push(`M${x * moduleSize},${y * moduleSize}l${moduleSize},0 0,${moduleSize} -${moduleSize},0 0,-${moduleSize}z`);
      }
    }
  }

  return pathChunks.join(' ')
}

/**
 * SVG with width and height
 */
export interface SvgResult<T> {
  /**
   * SVG content
   */
  svg: T;
  /**
   * Image width in pixels
   */
  width: number;
  /**
   * Image height in pixels
   */
  height: number;
}

/**
 * Converts a QR code result to an SVG string.
 * 
 * @param qr - QR code result from `@levischuck/tiny-qr`
 * @param options - Options for the SVG generation
 * @param options.margin - Quiet zone size in modules (default: `4`)
 * @param options.moduleSize - Size of each module in pixels (default: `4`)
 * @param options.background - Background color (default: `'white'`)
 * @param options.color - Foreground color (default: `'black'`)
 * @param options.output - Output format (default: `'svg+xml'`)
 * @returns SVG string in the requested format
 */
export function toSvgString(qr: QrResult, options: SvgOptions = {}): SvgResult<string> {
  const {
    background = 'white',
    color = 'black',
    margin = 4,
    moduleSize = 4,
    output = 'svg+xml'
  } = options;

  const { matrix } = qr;
  const width = matrix[0]?.length ?? 0;
  const totalSize = (width + margin * 2) * moduleSize;

  const pathData = generatePathData(matrix, moduleSize);

  if (output === 'path') {
    return {
      svg: pathData,
      width: totalSize,
      height: totalSize
    };
  }

  const pathElement = `<path d="${pathData}" stroke="transparent" fill="${color}"/>`;
  const transformAttr = margin > 0 ? ` transform="translate(${margin * moduleSize},${margin * moduleSize})"` : '';

  if (output === 'g') {
    const qrSize = width * moduleSize;
    const bgRect = background !== 'transparent'
      ? `<rect width="${qrSize}" height="${qrSize}" fill="${background}"/>`
      : '';
    return {
      svg: `<g${transformAttr}>${bgRect}${pathElement}</g>`,
      width: totalSize,
      height: totalSize
    }
  }

  const gElement = `<g${transformAttr}>${pathElement}</g>`;

  const backgroundRect = background !== 'transparent'
    ? `<rect width="${totalSize}" height="${totalSize}" fill="${background}"/>`
    : '';

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${totalSize} ${totalSize}">${backgroundRect}${gElement}</svg>`;

  if (output === 'svg') {
    return {
      svg: svgContent,
      width: totalSize,
      height: totalSize
    }
  }

  // svg+xml
  return {
    svg: `<?xml version="1.0" encoding="UTF-8"?>\n${svgContent}`,
    width: totalSize,
    height: totalSize
  }
}

/**
 * Converts a QR code result to a JSX element.
 * 
 * @param qr - QR code result from `@levischuck/tiny-qr`
 * @param options - Options for the JSX generation
 * @param options.margin - Quiet zone size in modules (default: `4`)
 * @param options.moduleSize - Size of each module in pixels (default: `4`)
 * @param options.background - Background color (default: `'white'`)
 * @param options.color - Foreground color (default: `'black'`)
 * @param options.output - Output format (default: `'svg'`)
 * @returns JSX element in the requested format
 */
export function toSvgJsx(qr: QrResult, options: JsxOptions = {}): SvgResult<JsxElement> {
  const {
    background = 'white',
    color = 'black',
    margin = 4,
    moduleSize = 4,
    output = 'svg'
  } = options;

  const { matrix } = qr;
  const width = matrix[0]?.length ?? 0;
  const totalSize = (width + margin * 2) * moduleSize;

  const pathData = generatePathData(matrix, moduleSize);

  const pathElement: JsxElement = {
    type: 'path',
    props: {
      d: pathData,
      stroke: 'transparent',
      fill: color
    }
  };

  if (output === 'g') {
    const qrSize = width * moduleSize;
    const children: JsxNode[] = [];

    if (background !== 'transparent') {
      children.push({
        type: 'rect',
        props: {
          width: qrSize,
          height: qrSize,
          fill: background
        }
      });
    }

    children.push(pathElement);

    const props: Record<string, unknown> & { children?: JsxNode } = { children };
    if (margin > 0) {
      props.transform = `translate(${margin * moduleSize},${margin * moduleSize})`;
    }

    return {
      svg: {
        type: 'g',
        props
      },
      width: totalSize,
      height: totalSize
    };
  }

  const gProps: Record<string, unknown> & { children?: JsxNode } = { children: pathElement };
  if (margin > 0) {
    gProps.transform = `translate(${margin * moduleSize},${margin * moduleSize})`;
  }

  const gElement: JsxElement = {
    type: 'g',
    props: gProps
  };

  // svg output
  const children: JsxNode[] = [];

  if (background !== 'transparent') {
    children.push({
      type: 'rect',
      props: {
        width: totalSize,
        height: totalSize,
        fill: background
      }
    });
  }

  children.push(gElement);

  return {
    svg: {
      type: 'svg',
      props: {
        xmlns: 'http://www.w3.org/2000/svg',
        version: '1.1',
        viewBox: `0 0 ${totalSize} ${totalSize}`,
        children
      }
    },
    width: totalSize,
    height: totalSize
  };
}

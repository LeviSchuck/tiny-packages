import type { QrResult } from '@levischuck/tiny-qr';

export interface SvgOptions {
  background?: string;
  color?: string;
  margin?: number;
  moduleSize?: number;
  output?: 'path' | 'g' | 'svg' | 'svg+xml';
}

export interface JsxOptions {
  background?: string;
  color?: string;
  margin?: number;
  moduleSize?: number;
  output?: 'g' | 'svg';
}

export type JsxNode = JsxElement | string | boolean | number | undefined | null | JsxNode[] | Promise<string>;

export interface JsxElement {
  type: string;
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

export function toSvgString(qr: QrResult, options: SvgOptions = {}): string {
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
    return pathData;
  }

  const pathElement = `<path d="${pathData}" stroke="transparent" fill="${color}"/>`;
  const transformAttr = margin > 0 ? ` transform="translate(${margin * moduleSize},${margin * moduleSize})"` : '';

  if (output === 'g') {
    const qrSize = width * moduleSize;
    const bgRect = background !== 'transparent'
      ? `<rect width="${qrSize}" height="${qrSize}" fill="${background}"/>`
      : '';
    return `<g${transformAttr}>${bgRect}${pathElement}</g>`;
  }

  const gElement = `<g${transformAttr}>${pathElement}</g>`;

  const backgroundRect = background !== 'transparent'
    ? `<rect width="${totalSize}" height="${totalSize}" fill="${background}"/>`
    : '';

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${totalSize} ${totalSize}">${backgroundRect}${gElement}</svg>`;

  if (output === 'svg') {
    return svgContent;
  }

  // svg+xml
  return `<?xml version="1.0" encoding="UTF-8"?>\n${svgContent}`;
}

export function toSvgJsx(qr: QrResult, options: JsxOptions = {}): JsxElement {
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
      type: 'g',
      props
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
    type: 'svg',
    props: {
      xmlns: 'http://www.w3.org/2000/svg',
      version: '1.1',
      viewBox: `0 0 ${totalSize} ${totalSize}`,
      children
    }
  };
}

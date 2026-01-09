import { Color } from './types.ts';
import type { EcLevel, Version } from './types.ts';
import { versionWidth } from './version.ts';

enum Module {
  Empty = 0,
  MaskedLight = 1,
  MaskedDark = 2,
  UnmaskedLight = 3,
  UnmaskedDark = 4,
}

function moduleIsDark(m: Module): boolean {
  return m === Module.MaskedDark || m === Module.UnmaskedDark;
}

function moduleToColor(m: Module): Color {
  return moduleIsDark(m) ? Color.Dark : Color.Light;
}

function maskModule(m: Module, shouldInvert: boolean): Module {
  if (m === Module.Empty) return shouldInvert ? Module.MaskedDark : Module.MaskedLight;
  if (m === Module.UnmaskedLight) return shouldInvert ? Module.MaskedDark : Module.MaskedLight;
  if (m === Module.UnmaskedDark) return shouldInvert ? Module.MaskedLight : Module.MaskedDark;
  return m; // Already masked
}

export interface CanvasState {
  readonly width: number;
  readonly version: Version;
  readonly ecLevel: EcLevel;
  readonly modules: Module[];
}

export function createCanvas(version: Version, ecLevel: EcLevel): CanvasState {
  const width = versionWidth(version);
  return {
    version,
    ecLevel,
    width,
    modules: new Array(width * width).fill(Module.Empty),
  };
}

function coordsToIndex(canvas: CanvasState, x: number, y: number): number {
  const wx = x < 0 ? x + canvas.width : x;
  const wy = y < 0 ? y + canvas.width : y;
  return wy * canvas.width + wx;
}

function canvasGet(canvas: CanvasState, x: number, y: number): Module {
  return canvas.modules[coordsToIndex(canvas, x, y)]!;
}

function canvasPut(canvas: CanvasState, x: number, y: number, color: Color): CanvasState {
  const module = color === Color.Dark ? Module.MaskedDark : Module.MaskedLight;
  const newModules = [...canvas.modules];
  newModules[coordsToIndex(canvas, x, y)] = module;
  return {
    ...canvas,
    modules: newModules,
  };
}

function canvasPutUnmasked(canvas: CanvasState, x: number, y: number, color: Color): CanvasState {
  const module = color === Color.Dark ? Module.UnmaskedDark : Module.UnmaskedLight;
  const newModules = [...canvas.modules];
  newModules[coordsToIndex(canvas, x, y)] = module;
  return {
    ...canvas,
    modules: newModules,
  };
}

function drawFinderPattern(canvas: CanvasState, x: number, y: number): CanvasState {
  const dxLeft = x >= 0 ? -3 : -4;
  const dxRight = x >= 0 ? 4 : 3;
  const dyTop = y >= 0 ? -3 : -4;
  const dyBottom = y >= 0 ? 4 : 3;

  let newCanvas = canvas;
  for (let j = dyTop; j <= dyBottom; j++) {
    for (let i = dxLeft; i <= dxRight; i++) {
      let color: Color;
      if (Math.abs(i) === 4 || Math.abs(j) === 4) {
        color = Color.Light;
      } else if (Math.abs(i) === 3 || Math.abs(j) === 3) {
        color = Color.Dark;
      } else if (Math.abs(i) === 2 || Math.abs(j) === 2) {
        color = Color.Light;
      } else {
        color = Color.Dark;
      }
      newCanvas = canvasPut(newCanvas, x + i, y + j, color);
    }
  }
  return newCanvas;
}

function drawAlignmentPattern(canvas: CanvasState, x: number, y: number): CanvasState {
  let newCanvas = canvas;
  for (let j = -2; j <= 2; j++) {
    for (let i = -2; i <= 2; i++) {
      const color = Math.abs(i) === 2 || Math.abs(j) === 2 || (i === 0 && j === 0) ? Color.Dark : Color.Light;
      newCanvas = canvasPut(newCanvas, x + i, y + j, color);
    }
  }
  return newCanvas;
}

export function canvasDrawAllFunctionalPatterns(canvas: CanvasState): CanvasState {
  let newCanvas = canvas;
  newCanvas = drawFinderPattern(newCanvas, 3, 3);
  newCanvas = drawFinderPattern(newCanvas, -4, 3);
  newCanvas = drawFinderPattern(newCanvas, 3, -4);

  // Timing patterns
  for (let i = 8; i < canvas.width - 8; i++) {
    const color = i % 2 === 0 ? Color.Dark : Color.Light;
    newCanvas = canvasPut(newCanvas, i, 6, color);
    newCanvas = canvasPut(newCanvas, 6, i, color);
  }

  // Dark module
  newCanvas = canvasPut(newCanvas, 8, canvas.width - 8, Color.Dark);

  // Alignment patterns
  const positions = getAlignmentPatternPositions(canvas.version);
  for (const y of positions) {
    for (const x of positions) {
      if (canvasGet(newCanvas, x, y) === Module.Empty) {
        newCanvas = drawAlignmentPattern(newCanvas, x, y);
      }
    }
  }

  // Format info placeholders
  // MAIN format info: row 8 cols 0-5,7,8 and col 8 rows 0-5,7
  for (let i = 0; i <= 8; i++) {
    if (canvasGet(newCanvas, i, 8) === Module.Empty) newCanvas = canvasPut(newCanvas, i, 8, Color.Light);
    if (canvasGet(newCanvas, 8, i) === Module.Empty) newCanvas = canvasPut(newCanvas, 8, i, Color.Light);
  }
  // SIDE format info: col 8 rows width-1 to width-7 (7 bits)
  for (let i = 0; i < 7; i++) {
    if (canvasGet(newCanvas, 8, canvas.width - 1 - i) === Module.Empty) newCanvas = canvasPut(newCanvas, 8, canvas.width - 1 - i, Color.Light);
  }
  // SIDE format info: row 8 cols width-8 to width-1 (8 bits)
  for (let i = 0; i < 8; i++) {
    if (canvasGet(newCanvas, canvas.width - 8 + i, 8) === Module.Empty) newCanvas = canvasPut(newCanvas, canvas.width - 8 + i, 8, Color.Light);
  }

  // Version info placeholders
  if (canvas.version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        newCanvas = canvasPut(newCanvas, i, canvas.width - 11 + j, Color.Light);
        newCanvas = canvasPut(newCanvas, canvas.width - 11 + j, i, Color.Light);
      }
    }
  }

  return newCanvas;
}

export function canvasDrawData(canvas: CanvasState, data: Uint8Array, ecCode: Uint8Array): CanvasState {
  const allData = new Uint8Array(data.length + ecCode.length);
  allData.set(data);
  allData.set(ecCode, data.length);

  let newCanvas = canvas;
  let bitIndex = 0;
  let upward = true;
  let col = canvas.width - 1;

  while (col > 0) {
    if (col === 6) col--;

    for (let i = 0; i < canvas.width; i++) {
      const y = upward ? canvas.width - 1 - i : i;

      for (const dx of [0, -1]) {
        const x = col + dx;
        if (canvasGet(newCanvas, x, y) === Module.Empty) {
          const bit = bitIndex < allData.length * 8 ? (allData[Math.floor(bitIndex / 8)]! >> (7 - (bitIndex % 8))) & 1 : 0;
          newCanvas = canvasPutUnmasked(newCanvas, x, y, bit === 1 ? Color.Dark : Color.Light);
          bitIndex++;
        }
      }
    }

    upward = !upward;
    col -= 2;
  }

  return newCanvas;
}

function canvasApplyMask(canvas: CanvasState, pattern: number): CanvasState {
  const newModules = [...canvas.modules];

  for (let y = 0; y < canvas.width; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const module = newModules[y * canvas.width + x]!;
      if (module === Module.UnmaskedLight || module === Module.UnmaskedDark) {
        const shouldInvert = applyMaskPattern(pattern, x, y);
        newModules[y * canvas.width + x] = maskModule(module, shouldInvert);
      }
    }
  }

  let newCanvas: CanvasState = {
    ...canvas,
    modules: newModules,
  };

  // Draw format info
  const formatInfo = getFormatInfo(canvas.ecLevel, pattern);
  newCanvas = drawFormatInfo(newCanvas, formatInfo);

  // Draw version info if needed
  if (canvas.version >= 7) {
    const versionInfo = getVersionInfo(canvas.version);
    newCanvas = drawVersionInfo(newCanvas, versionInfo);
  }

  return newCanvas;
}

function drawFormatInfo(canvas: CanvasState, formatInfo: number): CanvasState {
  let newCanvas = canvas;
  // Format info bits are placed MSB first (bit 14 at first position)
  // MAIN: first 6 bits in row 8 (x=0-5), skip x=6, then x=7,8, then column 8 (y=7, then y=5-0 skipping y=6)
  // SIDE: first 7 bits in column 8 (y=width-1 to width-7), then row 8 (x=width-8 to width-1)
  for (let i = 0; i < 15; i++) {
    const bit = (formatInfo >> (14 - i)) & 1;
    const color = bit === 1 ? Color.Dark : Color.Light;

    // MAIN format info placement
    if (i < 6) {
      newCanvas = canvasPut(newCanvas, i, 8, color);
    } else if (i < 8) {
      newCanvas = canvasPut(newCanvas, i + 1, 8, color);
    } else if (i === 8) {
      newCanvas = canvasPut(newCanvas, 8, 7, color);
    } else {
      newCanvas = canvasPut(newCanvas, 8, 14 - i, color);
    }

    // SIDE format info placement
    if (i < 7) {
      // First 7 bits go in column 8, from bottom up
      newCanvas = canvasPut(newCanvas, 8, canvas.width - 1 - i, color);
    } else {
      // Remaining 8 bits go in row 8, from left to right starting at width-8
      newCanvas = canvasPut(newCanvas, canvas.width - 15 + i, 8, color);
    }
  }
  return newCanvas;
}

function drawVersionInfo(canvas: CanvasState, versionInfo: number): CanvasState {
  let newCanvas = canvas;
  // Version info bits are placed MSB first (bit 17 at first position)
  for (let i = 0; i < 18; i++) {
    const bit = (versionInfo >> (17 - i)) & 1;
    const color = bit === 1 ? Color.Dark : Color.Light;
    // BL: x goes from 5 down to 0, y cycles through width-9, width-10, width-11
    const blX = 5 - Math.floor(i / 3);
    const blY = canvas.width - 9 - (i % 3);
    // TR: x cycles through width-9, width-10, width-11, y goes from 5 down to 0
    const trX = canvas.width - 9 - (i % 3);
    const trY = 5 - Math.floor(i / 3);
    newCanvas = canvasPut(newCanvas, blX, blY, color);
    newCanvas = canvasPut(newCanvas, trX, trY, color);
  }
  return newCanvas;
}

export function canvasApplyBestMask(canvas: CanvasState): CanvasState {
  let bestPattern = 0;
  let bestPenalty = Infinity;

  for (let pattern = 0; pattern < 8; pattern++) {
    const testCanvas = canvasApplyMask(canvas, pattern);
    const penalty = calculatePenalty(testCanvas);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestPattern = pattern;
    }
  }

  return canvasApplyMask(canvas, bestPattern);
}

function calculatePenalty(canvas: CanvasState): number {
  let penalty = 0;

  // Rule 1: Adjacent modules in row/column
  for (let y = 0; y < canvas.width; y++) {
    let lastColor: boolean | null = null;
    let count = 0;
    for (let x = 0; x < canvas.width; x++) {
      const dark = moduleIsDark(canvas.modules[y * canvas.width + x]!);
      if (dark === lastColor) {
        count++;
      } else {
        if (count >= 5) penalty += count - 2;
        lastColor = dark;
        count = 1;
      }
    }
    if (count >= 5) penalty += count - 2;
  }

  for (let x = 0; x < canvas.width; x++) {
    let lastColor: boolean | null = null;
    let count = 0;
    for (let y = 0; y < canvas.width; y++) {
      const dark = moduleIsDark(canvas.modules[y * canvas.width + x]!);
      if (dark === lastColor) {
        count++;
      } else {
        if (count >= 5) penalty += count - 2;
        lastColor = dark;
        count = 1;
      }
    }
    if (count >= 5) penalty += count - 2;
  }

  // Rule 2: 2x2 blocks
  for (let y = 0; y < canvas.width - 1; y++) {
    for (let x = 0; x < canvas.width - 1; x++) {
      const m00 = moduleIsDark(canvas.modules[y * canvas.width + x]!);
      const m01 = moduleIsDark(canvas.modules[y * canvas.width + x + 1]!);
      const m10 = moduleIsDark(canvas.modules[(y + 1) * canvas.width + x]!);
      const m11 = moduleIsDark(canvas.modules[(y + 1) * canvas.width + x + 1]!);
      if (m00 === m01 && m01 === m10 && m10 === m11) {
        penalty += 3;
      }
    }
  }

  // Rules 3 & 4 simplified
  penalty += Math.floor(canvas.width * canvas.width * 0.5);

  return penalty;
}

export function canvasIntoColors(canvas: CanvasState): Color[] {
  return canvas.modules.map(moduleToColor);
}

function applyMaskPattern(pattern: number, x: number, y: number): boolean {
  switch (pattern) {
    case 0:
      return (x + y) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (x + y) % 3 === 0;
    case 4:
      return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    case 7:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
    default:
      return false;
  }
}

// Alignment pattern center positions from ISO/IEC 18004 Annex E
const ALIGNMENT_POSITIONS: (number[] | null)[] = [
  null, // version 0 (doesn't exist)
  null, // version 1 (no alignment patterns)
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170],
];

function getAlignmentPatternPositions(version: Version): number[] {
  const positions = ALIGNMENT_POSITIONS[version];
  return positions ?? [];
}

function getFormatInfo(ecLevel: EcLevel, maskPattern: number): number {
  // EC level encoding in format info uses XOR with 1:
  // L(0) -> 01, M(1) -> 00, Q(2) -> 11, H(3) -> 10
  const data = ((ecLevel ^ 1) << 3) | maskPattern;
  let d = data << 10;
  for (let i = 0; i < 5; i++) {
    if (d & (1 << (14 - i))) {
      d ^= 0x0537 << (4 - i);
    }
  }
  return ((data << 10) | d) ^ 0x5412;
}

function getVersionInfo(version: Version): number {
  const versions = [
    0, 0, 0, 0, 0, 0, 0x07c94, 0x085bc, 0x09a99, 0x0a4d3, 0x0bbf6, 0x0c762, 0x0d847, 0x0e60d, 0x0f928, 0x10b78,
    0x1145d, 0x12a17, 0x13532, 0x149a6, 0x15683, 0x168c9, 0x177ec, 0x18ec4, 0x191e1, 0x1afab, 0x1b08e, 0x1cc1a,
    0x1d33f, 0x1ed75, 0x1f250, 0x209d5, 0x216f0, 0x228ba, 0x2379f, 0x24b0b, 0x2542e, 0x26a64, 0x27541, 0x28c69,
  ];
  return versions[version] || 0;
}


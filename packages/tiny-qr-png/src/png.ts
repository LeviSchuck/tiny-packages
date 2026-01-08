#!/usr/bin/env bun
import { toPng } from './index';
import { qrCode } from '@levischuck/tiny-qr';

// This is a simple CLI for testing QR code PNG generation
// Usage: bun run png.ts "Hello world" [output.png] [options]

// Parse CSS color to RGB tuple
function parseColor(color: string): [number, number, number] {
  const namedColors: Record<string, [number, number, number]> = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    red: [255, 0, 0],
    green: [0, 128, 0],
    blue: [0, 0, 255],
    yellow: [255, 255, 0],
    cyan: [0, 255, 255],
    magenta: [255, 0, 255],
    orange: [255, 165, 0],
    purple: [128, 0, 128],
    gray: [128, 128, 128],
    grey: [128, 128, 128],
  };

  const lowerColor = color.toLowerCase();
  if (namedColors[lowerColor]) {
    return namedColors[lowerColor]!;
  }

  // Parse hex color
  let hex = color.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return [r, g, b];
    }
  }

  throw new Error(`Invalid color: ${color}`);
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: bun run png.ts <text> [output.png] [options]');
  console.error('');
  console.error('Options:');
  console.error('  --margin <number>        Margin size (default: 4)');
  console.error('  --module-size <number>   Module size (default: 4)');
  console.error('  --background <color>     Background color (default: white)');
  console.error('  --color <color>          Module color (default: black)');
  console.error('');
  console.error('Color format: #FFAABB, FFAABB, or named colors (white, black, red, etc.)');
  console.error('');
  console.error('Examples:');
  console.error('  bun run png.ts "Hello world" hello.png');
  console.error('  bun run png.ts "Hello world"');
  console.error('  bun run png.ts "Hello world" --margin 2');
  console.error('  bun run png.ts "Hello world" hello.png --module-size 8');
  console.error('  bun run png.ts "Hello world" --background blue --color yellow');
  console.error('  bun run png.ts "Hello world" --background "#FF0000" --color white');
  process.exit(1);
}

// Parse arguments
let text: string | undefined;
let outputFile: string | undefined;
let margin = 4;
let moduleSize = 4;
let backgroundColor: [number, number, number] = [255, 255, 255];
let foregroundColor: [number, number, number] = [0, 0, 0];

for (let i = 0; i < args.length; i++) {
  const arg = args[i]!;

  if (arg === '--margin' && i + 1 < args.length) {
    margin = parseInt(args[i + 1]!, 10);
    i++;
  } else if (arg === '--module-size' && i + 1 < args.length) {
    moduleSize = parseInt(args[i + 1]!, 10);
    i++;
  } else if (arg === '--background' && i + 1 < args.length) {
    backgroundColor = parseColor(args[i + 1]!);
    i++;
  } else if (arg === '--color' && i + 1 < args.length) {
    foregroundColor = parseColor(args[i + 1]!);
    i++;
  } else if (!arg.startsWith('--')) {
    // Positional arguments: first is text, second is optional output file
    if (!text) {
      text = arg;
    } else if (!outputFile) {
      outputFile = arg;
    }
  }
}

if (!text) {
  console.error('Error: No text provided');
  console.error('');
  console.error('Usage: bun run png.ts <text> [output.png] [options]');
  console.error('');
  console.error('Options:');
  console.error('  --margin <number>        Margin size (default: 4)');
  console.error('  --module-size <number>   Module size (default: 4)');
  console.error('  --background <color>     Background color (default: white)');
  console.error('  --color <color>          Module color (default: black)');
  console.error('');
  console.error('Color format: #FFAABB, FFAABB, or named colors (white, black, red, etc.)');
  console.error('');
  console.error('Examples:');
  console.error('  bun run png.ts "Hello world" hello.png');
  console.error('  bun run png.ts "Hello world"');
  console.error('  bun run png.ts "Hello world" --margin 2');
  console.error('  bun run png.ts "Hello world" hello.png --module-size 8');
  console.error('  bun run png.ts "Hello world" --background blue --color yellow');
  console.error('  bun run png.ts "Hello world" --background "#FF0000" --color white');
  process.exit(1);
}

// Generate QR code
const qr = qrCode({ data: text });

// Convert to PNG
const { bytes, width, height } = await toPng(qr, {
  margin,
  moduleSize,
  backgroundColor,
  foregroundColor
});

// Output to file or stdout
if (outputFile) {
  await Bun.write(outputFile, bytes);
  console.error(`QR code saved to ${outputFile} (${width}x${height})`);
} else {
  // Write binary data to stdout
  await Bun.write(Bun.stdout, bytes);
}

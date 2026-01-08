#!/usr/bin/env bun
import { toSvgString } from './index.ts';
import { qrCode } from '@levischuck/tiny-qr';

// This is a simple CLI for testing QR code SVG generation
// Usage: bun run svg.ts "Hello world" [output.svg] [options]

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: bun run svg.ts <text> [output.svg] [options]');
  console.error('');
  console.error('Options:');
  console.error('  --margin <number>        Margin size (default: 4)');
  console.error('  --module-size <number>   Module size (default: 4)');
  console.error('  --background <color>     Background color (default: white)');
  console.error('  --color <color>          Foreground color (default: black)');
  console.error('');
  console.error('Examples:');
  console.error('  bun run svg.ts "Hello world" hello.svg');
  console.error('  bun run svg.ts "Hello world"');
  console.error('  bun run svg.ts "Hello world" --margin 2 --color blue');
  console.error('  bun run svg.ts "Hello world" hello.svg --background transparent --module-size 8');
  process.exit(1);
}

// Parse arguments
let text: string | undefined;
let outputFile: string | undefined;
let margin = 4;
let moduleSize = 4;
let background = 'white';
let color = 'black';

for (let i = 0; i < args.length; i++) {
  const arg = args[i]!;

  if (arg === '--margin' && i + 1 < args.length) {
    margin = parseInt(args[i + 1]!, 10);
    i++;
  } else if (arg === '--module-size' && i + 1 < args.length) {
    moduleSize = parseInt(args[i + 1]!, 10);
    i++;
  } else if (arg === '--background' && i + 1 < args.length) {
    background = args[i + 1]!;
    i++;
  } else if (arg === '--color' && i + 1 < args.length) {
    color = args[i + 1]!;
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
  console.error('Usage: bun run svg.ts <text> [output.svg] [options]');
  console.error('');
  console.error('Options:');
  console.error('  --margin <number>        Margin size (default: 4)');
  console.error('  --module-size <number>   Module size (default: 4)');
  console.error('  --background <color>     Background color (default: white)');
  console.error('  --color <color>          Foreground color (default: black)');
  console.error('');
  console.error('Examples:');
  console.error('  bun run svg.ts "Hello world" hello.svg');
  console.error('  bun run svg.ts "Hello world"');
  console.error('  bun run svg.ts "Hello world" --margin 2 --color blue');
  console.error('  bun run svg.ts "Hello world" hello.svg --background transparent --module-size 8');
  process.exit(1);
}

// Generate QR code
const qr = qrCode({ data: text });

// Convert to SVG
const svg = toSvgString(qr, {
  output: 'svg+xml',
  background,
  color,
  margin,
  moduleSize
});

// Output to file or stdout
if (outputFile) {
  await Bun.write(outputFile, svg.svg);
  console.error(`QR code saved to ${outputFile}`);
} else {
  console.log(svg);
}

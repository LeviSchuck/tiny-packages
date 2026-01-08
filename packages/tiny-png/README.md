# tiny-png

A minimal, dependency-free TypeScript PNG encoder for indexed color images.

## Usage

```typescript
import { indexedPng } from '@levischuck/tiny-png';

// Create an indexed PNG from pixel data
// Input is a Uint8Array where each byte is a palette index
const width = 100;
const height = 100;
const pixels = new Uint8Array(width * height);
// ... fill pixels with palette indices (0, 1, 2, etc.)

// Define color palette: [R, G, B] tuples
const colors: [number, number, number][] = [
  [255, 255, 255], // Index 0: white
  [0, 0, 0],       // Index 1: black
  [255, 0, 0],     // Index 2: red
];

const pngBytes = await indexedPng(pixels, width, height, colors);

// Write to file
await Bun.write('output.png', pngBytes);
```

## API

### `indexedPng(input: Uint8Array, width: number, height: number, colors: [number, number, number][]): Promise<Uint8Array>`

Generates an indexed-color PNG image.

**Parameters:**
- `input` - Pixel data as a Uint8Array where each byte is a palette index
- `width` - Image width in pixels
- `height` - Image height in pixels
- `colors` - Color palette as an array of `[R, G, B]` tuples (0-255)

**Returns:** Promise resolving to PNG file bytes as a Uint8Array

**Throws:** Error if the color palette doesn't have enough colors for the highest index in the input data.

## License

MIT Licensed.

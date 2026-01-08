# tiny-qr

A minimal, dependency-free TypeScript QR code encoder.

## Usage

```typescript
import { qrCode, EcLevel } from '@levischuck/tiny-qr';

// Create a QR code with default settings (Medium error correction)
const qr = qrCode({ data: 'HELLO WORLD' });

// With custom error correction level
const qrHighEc = qrCode({ data: 'HELLO WORLD', ec: EcLevel.H });

// Encode binary data
const qrBinary = qrCode({ data: new Uint8Array([0x01, 0x02, 0x03]) });

// Access the result
console.log('Size:', qr.width);
console.log('Version:', qr.version);

// Matrix is a 2D boolean array (true = dark, false = light)
for (let y = 0; y < qr.width; y++) {
  for (let x = 0; x < qr.width; x++) {
    const isDark = qr.matrix[y][x];
  }
}
```

This package is intended to be chained with other tiny-packages for rendering:

- `@levischuck/tiny-qr-svg` - SVG output
- `@levischuck/tiny-qr-png` - PNG output

If you're looking to manually render from the modules,
the result contains a `boolean[][]` matrix.

## API

### `qrCode(options: QrOptions): QrResult`

Generates a QR code from the given data.

**Options:**
- `data: string | Uint8Array` - The data to encode
- `ec?: EcLevel` - Error correction level (default: `EcLevel.M`)

**Result:**
- `matrix: boolean[][]` - 2D array of modules (true = dark, false = light)
- `width: number` - Width/height of the QR code in modules
- `version: Version` - QR code version (1-40)
- `ec: EcLevel` - Error correction level used
  - `EcLevel.L` or `0`
  - `EcLevel.M` or `1`
  - `EcLevel.Q` or `2`
  - `EcLevel.H` or `3`

## Rendering

## License

MIT Licensed.

This code is largely derived from [qrcode-rust](https://github.com/kennytm/qrcode-rust) by kennytm, which provides an MIT and Apache 2 license to its code.

The word "QR Code" is registered trademark of DENSO WAVE INCORPORATED
http://www.denso-wave.com/qrcode/faqpatent-e.html

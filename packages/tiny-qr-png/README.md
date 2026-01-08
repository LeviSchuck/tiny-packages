# tiny-qr-png

A minimal PNG renderer for QR codes generated with `@levischuck/tiny-qr`.

## Usage

```typescript
import { qrCode } from '@levischuck/tiny-qr';
import { toPng } from '@levischuck/tiny-qr-png';

// Generate a QR code
const qr = qrCode({ data: 'Hello, world!' });

// Convert to PNG
const { bytes, width, height } = await toPng(qr, {
  margin: 4,
  moduleSize: 4,
  backgroundColor: [255, 255, 255],
  foregroundColor: [0, 0, 0]
});

// Write to file
await Bun.write('qrcode.png', bytes);
```

## API

### `toPng(qr: QrResult, options?: PngOptions): Promise<PngResult>`

Converts a QR code result to a PNG image.

**Options:**
- `margin?: number` - Quiet zone size in modules (default: `4`)
- `moduleSize?: number` - Size of each module in pixels (default: `4`)
- `backgroundColor?: [number, number, number]` - RGB background color (default: `[255, 255, 255]`)
- `foregroundColor?: [number, number, number]` - RGB foreground color (default: `[0, 0, 0]`)

**Returns:** Promise resolving to a `PngResult` object:
- `bytes: Uint8Array` - PNG image data
- `width: number` - Image width in pixels
- `height: number` - Image height in pixels

## License

MIT Licensed.

The word "QR Code" is registered trademark of DENSO WAVE INCORPORATED
http://www.denso-wave.com/qrcode/faqpatent-e.html
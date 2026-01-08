# tiny-qr-svg

A minimal SVG renderer for QR codes generated with `@levischuck/tiny-qr`.

## Usage

### String Output

```typescript
import { qrCode } from '@levischuck/tiny-qr';
import { toSvgString } from '@levischuck/tiny-qr-svg';

const qr = qrCode({ data: 'Hello, world!' });

// Generate SVG string
const svg = toSvgString(qr, {
  margin: 4,
  moduleSize: 4,
  background: 'white',
  color: 'black',
  output: 'svg+xml' // or 'svg', 'g', 'path'
});

// Write to file
await Bun.write('qrcode.svg', svg);
```

### JSX Output

```typescript
import { qrCode } from '@levischuck/tiny-qr';
import { toSvgJsx } from '@levischuck/tiny-qr-svg';

const qr = qrCode({ data: 'Hello, world!' });

// Generate JSX element
const jsxElement = toSvgJsx(qr, {
  margin: 4,
  moduleSize: 4,
  background: 'white',
  color: 'black',
  output: 'svg' // or 'g'
});

// The JSX function is designed for Hono, but should work with React and Preact too
```

## API

### `toSvgString(qr: QrResult, options?: SvgOptions): string`

Converts a QR code result to an SVG string.

**Options:**
- `margin?: number` - Quiet zone size in modules (default: `4`)
- `moduleSize?: number` - Size of each module in pixels (default: `4`)
- `background?: string` - Background color (default: `'white'`)
- `color?: string` - Foreground color (default: `'black'`)
- `output?: 'path' | 'g' | 'svg' | 'svg+xml'` - Output format (default: `'svg+xml'`)

**Returns:** SVG string in the requested format

`'transparent'` is also a supported color for background.

### `toSvgJsx(qr: QrResult, options?: JsxOptions): JsxElement`

Converts a QR code result to a JSX element. Designed for Hono, but should work with React and Preact too.

**Options:**
- `margin?: number` - Quiet zone size in modules (default: `4`)
- `moduleSize?: number` - Size of each module in pixels (default: `4`)
- `background?: string` - Background color (default: `'white'`)
- `color?: string` - Foreground color (default: `'black'`)
- `output?: 'g' | 'svg'` - Output format (default: `'svg'`)

**Returns:** JSX element object

`'transparent'` is also a supported color for background.

## License

MIT Licensed.

The word "QR Code" is registered trademark of DENSO WAVE INCORPORATED
http://www.denso-wave.com/qrcode/faqpatent-e.html

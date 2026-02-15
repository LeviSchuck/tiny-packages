# tiny-font-ranges

Unicode range mappings for [Noto font families](https://fonts.google.com/noto/fonts) provided by Google under the [Open Font License](https://openfontlicense.org/).

If you find that you need to display internationalized text or even silly text like [Kaomoji](https://en.wikipedia.org/wiki/Kaomoji), while not importing literally every font ever, this library will help you identify which fonts to import.

The ranges in this library are specific to the referenced Noto fonts. They may not translate to similar fonts (sans vs serif in the Noto ecosystem) or across font families.

## Install

```bash
npm install @levischuck/tiny-font-ranges
```

## Usage

Use `scanTextForFontRanges` to detect which fonts are needed for a given string:

```ts
import { scanTextForFontRanges, ALL_FONTS, WITHOUT_LATIN } from "@levischuck/tiny-font-ranges";

// Scan Japanese text
const fonts = scanTextForFontRanges("こんにちは世界", ALL_FONTS);
// => ["Noto Sans JP", "Noto Sans SC"]

// Mixed content: English + Emoji + Japanese
const mixed = scanTextForFontRanges("Hello 🌍 世界", ALL_FONTS);
// => ["Noto Emoji", "Noto Sans JP", "Noto Sans SC"]

// Use WITHOUT_LATIN to skip the base Noto Sans font, in case you have your own and it's on an approximately compatible baseline.
const extra = scanTextForFontRanges("(╯°□°）╯︵ ┻━┻", WITHOUT_LATIN);
// => [ 'Noto Sans JP', 'Noto Sans KR' ] (parenthesis and such covered by Noto like just about every font ever)
```

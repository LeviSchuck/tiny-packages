import type { FontRange } from "./types.ts";

/**
 * Parses a Unicode range string (e.g., "2F800-2FA1F") and returns [start, end] as numbers
 */
export function parseUnicodeRange(range: string): [number, number] | null {
	const parts = range.split("-");
	if (parts.length !== 2 || !parts[0] || !parts[1]) {
		return null;
	}
	const start = parseInt(parts[0], 16);
	const end = parseInt(parts[1], 16);
	if (isNaN(start) || isNaN(end)) {
		return null;
	}
	return [start, end];
}

/**
 * Scans text for Unicode characters and determines which font families are needed.
 * Returns an array of font family name strings that cover characters found in the text.
 *
 * ASCII characters (U+0000-U+007F) are skipped since they are covered by most base fonts.
 */
export function scanTextForFontRanges(text: string, ranges: FontRange[]): string[] {
	const matched = new Set<string>();

	for (let i = 0; i < text.length; i++) {
		const codePoint = text.codePointAt(i);
		if (!codePoint) continue;

		// Skip ASCII
		if (codePoint < 0x0080) continue;

		// Handle surrogate pairs
		if (codePoint > 0xFFFF) i++;

		outer: for (const fontRange of ranges) {
			if (matched.has(fontRange.family)) continue;
			for (const range of fontRange.ranges) {
				const parsed = parseUnicodeRange(range);
				if (parsed) {
					const [start, end] = parsed;
					if (codePoint >= start && codePoint <= end) {
						matched.add(fontRange.family);
						break outer;
					}
				}
			}
		}
	}

	return Array.from(matched);
}

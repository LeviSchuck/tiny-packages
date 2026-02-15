import { parseUnicodeRange } from "./scan.ts";
import type { FontRange } from "./types.ts";

/**
 * Format a number as an uppercase hex string.
 * 4-char minimum for BMP (≤ 0xFFFF), 5-char for supplementary.
 */
export function formatHex(n: number): string {
	return n.toString(16).toUpperCase().padStart(n > 0xFFFF ? 5 : 4, "0");
}

/**
 * Format start/end back to a "XXXX-XXXX" range string.
 */
export function formatRange(start: number, end: number): string {
	return `${formatHex(start)}-${formatHex(end)}`;
}

/**
 * Subtract `remove` from `base`. Returns 0, 1, or 2 remaining fragments.
 */
export function subtractRange(
	base: [number, number],
	remove: [number, number],
): [number, number][] {
	const [baseStart, baseEnd] = base;
	const [removeStart, removeEnd] = remove;

	// No overlap
	if (baseStart > removeEnd || baseEnd < removeStart) {
		return [base];
	}

	const result: [number, number][] = [];
	// Left fragment
	if (baseStart < removeStart) {
		result.push([baseStart, removeStart - 1]);
	}
	// Right fragment
	if (baseEnd > removeEnd) {
		result.push([removeEnd + 1, baseEnd]);
	}
	return result;
}

/**
 * Process fonts in order. For each font, subtract all previously
 * claimed ranges from each new range, keeping only unclaimed fragments.
 */
export function deduplicateFonts(fonts: FontRange[]): FontRange[] {
	const claimed: [number, number][] = [];
	const result: FontRange[] = [];

	for (const font of fonts) {
		const deduped: string[] = [];

		for (const range of font.ranges) {
			const parsed = parseUnicodeRange(range);
			if (!parsed) continue;

			let fragments: [number, number][] = [parsed];

			for (const c of claimed) {
				const next: [number, number][] = [];
				for (const frag of fragments) {
					next.push(...subtractRange(frag, c));
				}
				fragments = next;
				if (fragments.length === 0) break;
			}

			for (const frag of fragments) {
				claimed.push(frag);
				deduped.push(formatRange(frag[0], frag[1]));
			}
		}

		if (deduped.length > 0) {
			result.push({ ranges: deduped, family: font.family });
		}
	}

	return result;
}

import { test, expect, describe } from "bun:test";
import {
	ALL_FONTS,
	WITHOUT_LATIN,
	NOTO,
	EMOJI,
	ARABIC,
	JAPANESE,
	KOREAN,
	CHINESE,
	scanTextForFontRanges,
	parseUnicodeRange,
	deduplicateFonts,
} from "./index.ts";
import { formatHex, formatRange, subtractRange } from "./dedupe.ts";
import type { FontRange } from "./types.ts";

test("ALL_FONTS contains 21 fonts", () => {
	expect(ALL_FONTS).toHaveLength(21);
});

test("WITHOUT_LATIN contains 20 fonts (excludes NOTO)", () => {
	expect(WITHOUT_LATIN).toHaveLength(20);
	expect(WITHOUT_LATIN).not.toContain(NOTO);
});

test("ALL_FONTS starts with NOTO", () => {
	expect(ALL_FONTS[0]).toBe(NOTO);
});

test("each font has ranges and family", () => {
	for (const font of ALL_FONTS) {
		expect(font.ranges).toBeInstanceOf(Array);
		expect(font.ranges.length).toBeGreaterThan(0);
		expect(typeof font.family).toBe("string");
		expect(font.family.length).toBeGreaterThan(0);
	}
});

test("ranges are valid hex format", () => {
	const rangePattern = /^[0-9A-F]{4,5}-[0-9A-F]{4,5}$/;
	for (const font of ALL_FONTS) {
		for (const range of font.ranges) {
			expect(range).toMatch(rangePattern);
		}
	}
});

test("known font families", () => {
	expect(NOTO.family).toBe("Noto Sans");
	expect(EMOJI.family).toBe("Noto Emoji");
	expect(ARABIC.family).toBe("Noto Sans Arabic");
	expect(JAPANESE.family).toBe("Noto Sans JP");
	expect(KOREAN.family).toBe("Noto Sans KR");
	expect(CHINESE.family).toBe("Noto Sans SC");
});

test("parseUnicodeRange parses valid ranges", () => {
	expect(parseUnicodeRange("0020-007E")).toEqual([0x20, 0x7E]);
	expect(parseUnicodeRange("1F600-1F64F")).toEqual([0x1F600, 0x1F64F]);
});

test("parseUnicodeRange returns null for invalid input", () => {
	expect(parseUnicodeRange("invalid")).toBeNull();
	expect(parseUnicodeRange("ZZZZ-YYYY")).toBeNull();
});

test("scanTextForFontRanges skips ASCII", () => {
	const result = scanTextForFontRanges("Hello World", ALL_FONTS);
	expect(result).toHaveLength(0);
});

test("scanTextForFontRanges matches Japanese text", () => {
	const result = scanTextForFontRanges("こんにちは", ALL_FONTS);
	expect(result).toContain("Noto Sans JP");
});

test("scanTextForFontRanges matches Korean text", () => {
	const result = scanTextForFontRanges("안녕하세요", ALL_FONTS);
	expect(result).toContain("Noto Sans KR");
});

test("scanTextForFontRanges matches Arabic text", () => {
	// Uses chars from Arabic's own range (060D-0626) not claimed by Math
	const result = scanTextForFontRanges("ءآأ", ALL_FONTS);
	expect(result).toContain("Noto Sans Arabic");
});

test("scanTextForFontRanges matches emoji", () => {
	const result = scanTextForFontRanges("Hello 🌍", ALL_FONTS);
	expect(result).toContain("Noto Emoji");
});

test("scanTextForFontRanges returns no duplicates", () => {
	const result = scanTextForFontRanges("こんにちは世界テスト", ALL_FONTS);
	expect(new Set(result).size).toBe(result.length);
});

// --- dedupe tests ---

describe("formatHex", () => {
	test("pads BMP codepoints to 4 hex chars", () => {
		expect(formatHex(0x0020)).toBe("0020");
		expect(formatHex(0x007E)).toBe("007E");
		expect(formatHex(0xFFFF)).toBe("FFFF");
	});

	test("pads supplementary codepoints to 5 hex chars", () => {
		expect(formatHex(0x10000)).toBe("10000");
		expect(formatHex(0x1F600)).toBe("1F600");
		expect(formatHex(0x10780)).toBe("10780");
	});

	test("handles zero", () => {
		expect(formatHex(0)).toBe("0000");
	});
});

describe("formatRange", () => {
	test("formats a range with different start and end", () => {
		expect(formatRange(0x2190, 0x2195)).toBe("2190-2195");
	});

	test("formats a single codepoint as start-end", () => {
		expect(formatRange(0x20E3, 0x20E3)).toBe("20E3-20E3");
	});

	test("formats supplementary ranges", () => {
		expect(formatRange(0x1F600, 0x1F64F)).toBe("1F600-1F64F");
	});
});

describe("subtractRange", () => {
	test("returns base unchanged when no overlap", () => {
		expect(subtractRange([10, 20], [30, 40])).toEqual([[10, 20]]);
	});

	test("returns base unchanged when remove is entirely before", () => {
		expect(subtractRange([30, 40], [10, 20])).toEqual([[30, 40]]);
	});

	test("returns empty when base is fully removed", () => {
		expect(subtractRange([10, 20], [5, 25])).toEqual([]);
	});

	test("returns empty when base equals remove", () => {
		expect(subtractRange([10, 20], [10, 20])).toEqual([]);
	});

	test("trims left (remove overlaps start)", () => {
		expect(subtractRange([10, 20], [5, 15])).toEqual([[16, 20]]);
	});

	test("trims right (remove overlaps end)", () => {
		expect(subtractRange([10, 20], [15, 25])).toEqual([[10, 14]]);
	});

	test("punches middle hole — returns two fragments", () => {
		expect(subtractRange([10, 30], [15, 20])).toEqual([
			[10, 14],
			[21, 30],
		]);
	});
});

describe("deduplicateFonts", () => {
	test("gives priority to earlier font in list", () => {
		const fonts: FontRange[] = [
			{ ranges: ["0010-0020"], family: "First" },
			{ ranges: ["0015-0025"], family: "Second" },
		];
		const result = deduplicateFonts(fonts);
		expect(result).toEqual([
			{ ranges: ["0010-0020"], family: "First" },
			{ ranges: ["0021-0025"], family: "Second" },
		]);
	});

	test("removes font entirely when all ranges are claimed", () => {
		const fonts: FontRange[] = [
			{ ranges: ["0010-0030"], family: "First" },
			{ ranges: ["0015-0020"], family: "Second" },
		];
		const result = deduplicateFonts(fonts);
		expect(result).toHaveLength(1);
		expect(result[0]!.family).toBe("First");
	});

	test("handles non-overlapping fonts", () => {
		const fonts: FontRange[] = [
			{ ranges: ["0010-0020"], family: "First" },
			{ ranges: ["0030-0040"], family: "Second" },
		];
		const result = deduplicateFonts(fonts);
		expect(result).toEqual(fonts);
	});

	test("splits range when middle is claimed", () => {
		const fonts: FontRange[] = [
			{ ranges: ["0015-0020"], family: "First" },
			{ ranges: ["0010-0030"], family: "Second" },
		];
		const result = deduplicateFonts(fonts);
		expect(result).toEqual([
			{ ranges: ["0015-0020"], family: "First" },
			{ ranges: ["0010-0014", "0021-0030"], family: "Second" },
		]);
	});
});

describe("ALL_FONTS integration", () => {
	test("no overlapping ranges across all fonts", () => {
		const allRanges: { start: number; end: number; family: string }[] = [];
		for (const font of ALL_FONTS) {
			for (const range of font.ranges) {
				const parsed = parseUnicodeRange(range);
				if (!parsed) continue;
				allRanges.push({ start: parsed[0], end: parsed[1], family: font.family });
			}
		}

		allRanges.sort((a, b) => a.start - b.start || a.end - b.end);

		for (let i = 1; i < allRanges.length; i++) {
			const prev = allRanges[i - 1]!;
			const curr = allRanges[i]!;
			if (curr.start <= prev.end) {
				throw new Error(
					`Overlap: ${prev.family} [${formatRange(prev.start, prev.end)}] ` +
					`and ${curr.family} [${formatRange(curr.start, curr.end)}]`,
				);
			}
		}
	});

	test("deduplicateFonts is idempotent", () => {
		const fonts: FontRange[] = [
			{ ranges: ["0010-0030", "0050-0070"], family: "A" },
			{ ranges: ["0020-0040", "0060-0080"], family: "B" },
			{ ranges: ["0035-0055"], family: "C" },
		];
		const once = deduplicateFonts(fonts);
		const twice = deduplicateFonts(once);
		expect(twice).toEqual(once);
	});
});

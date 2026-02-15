import { test, expect } from "bun:test";
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
} from "./index.ts";

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
	const result = scanTextForFontRanges("مرحبا", ALL_FONTS);
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

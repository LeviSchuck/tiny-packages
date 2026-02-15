export type { FontRange } from "./types.ts";
export { parseUnicodeRange, scanTextForFontRanges } from "./scan.ts";

export { NOTO } from "./noto.ts";
export { EMOJI } from "./emoji.ts";
export { MUSIC } from "./music.ts";
export { MATH } from "./math.ts";
export { SYMBOLS1 } from "./symbol.ts";
export { SYMBOLS2 } from "./symbol2.ts";
export { RUNIC } from "./runic.ts";
export { JAPANESE } from "./japanese.ts";
export { KOREAN } from "./korean.ts";
export { CHINESE } from "./chinese.ts";
export { ARABIC } from "./arabic.ts";
export { CANADIAN_ABORIGINAL } from "./canAboriginal.ts";
export { COPTIC } from "./coptic.ts";
export { GURMUKHI } from "./gurmukhi.ts";
export { TAI_THAM } from "./taiTham.ts";
export { THAI } from "./thai.ts";
export { BUGINESE } from "./buginese.ts";
export { ORIYA } from "./oriya.ts";
export { LINEAR_A } from "./linearA.ts";
export { LINEAR_B } from "./linearB.ts";
export { TIBETAN } from "./tibetan.ts";

import { NOTO } from "./noto.ts";
import { EMOJI } from "./emoji.ts";
import { MUSIC } from "./music.ts";
import { MATH } from "./math.ts";
import { SYMBOLS1 } from "./symbol.ts";
import { SYMBOLS2 } from "./symbol2.ts";
import { RUNIC } from "./runic.ts";
import { JAPANESE } from "./japanese.ts";
import { KOREAN } from "./korean.ts";
import { CHINESE } from "./chinese.ts";
import { ARABIC } from "./arabic.ts";
import { CANADIAN_ABORIGINAL } from "./canAboriginal.ts";
import { COPTIC } from "./coptic.ts";
import { GURMUKHI } from "./gurmukhi.ts";
import { TAI_THAM } from "./taiTham.ts";
import { THAI } from "./thai.ts";
import { BUGINESE } from "./buginese.ts";
import { ORIYA } from "./oriya.ts";
import { LINEAR_A } from "./linearA.ts";
import { LINEAR_B } from "./linearB.ts";
import { TIBETAN } from "./tibetan.ts";

import type { FontRange } from "./types.ts";

export const ALL_FONTS: FontRange[] = [
	NOTO,
	EMOJI,
	MUSIC,
	MATH,
	SYMBOLS1,
	SYMBOLS2,
	RUNIC,
	JAPANESE,
	KOREAN,
	CHINESE,
	ARABIC,
	CANADIAN_ABORIGINAL,
	COPTIC,
	GURMUKHI,
	TAI_THAM,
	THAI,
	BUGINESE,
	ORIYA,
	LINEAR_A,
	LINEAR_B,
	TIBETAN,
];

export const WITHOUT_LATIN: FontRange[] = [
	EMOJI,
	MUSIC,
	MATH,
	SYMBOLS1,
	SYMBOLS2,
	RUNIC,
	JAPANESE,
	KOREAN,
	CHINESE,
	ARABIC,
	CANADIAN_ABORIGINAL,
	COPTIC,
	GURMUKHI,
	TAI_THAM,
	THAI,
	BUGINESE,
	ORIYA,
	LINEAR_A,
	LINEAR_B,
	TIBETAN,
];

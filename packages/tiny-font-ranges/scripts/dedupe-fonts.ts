import { ALL_FONTS } from "../src/index.ts";
import { deduplicateFonts } from "../src/dedupe.ts";
import { readdirSync } from "fs";
import { join } from "path";

const fontDir = join(import.meta.dir, "../src");

// Run deduplication
const deduped = deduplicateFonts(ALL_FONTS);

// Build family -> new ranges map
const familyToRanges = new Map<string, string[]>();
for (const font of deduped) {
	familyToRanges.set(font.family, font.ranges);
}

// Build family -> old ranges map
const oldFamilyToRanges = new Map<string, string[]>();
for (const font of ALL_FONTS) {
	oldFamilyToRanges.set(font.family, font.ranges);
}

// Font data files (exclude index, test, scan, types, dedupe)
const SKIP = new Set(["index.ts", "index.test.ts", "scan.ts", "types.ts", "dedupe.ts"]);
const files = readdirSync(fontDir).filter(f => f.endsWith(".ts") && !SKIP.has(f));
let changedCount = 0;

for (const file of files) {
	const filePath = join(fontDir, file);
	const content = await Bun.file(filePath).text();

	// Extract export name
	const exportMatch = content.match(/export\s+const\s+(\w+)/);
	const exportName = exportMatch?.[1];
	if (!exportName) continue;

	// Extract family name
	const familyMatch = content.match(/"family":\s*"([^"]+)"/);
	const family = familyMatch?.[1];
	if (!family) continue;

	const newRanges = familyToRanges.get(family);
	const oldRanges = oldFamilyToRanges.get(family);
	if (!newRanges || !oldRanges) continue;

	// Skip unchanged files
	if (JSON.stringify(newRanges) === JSON.stringify(oldRanges)) continue;

	// Rewrite file with new ranges
	const newContent = `export const ${exportName}: { ranges: string[]; family: string } = {\n  "ranges": [\n${newRanges.map(r => `    "${r}"`).join(",\n")}\n  ],\n  "family": "${family}"\n};\n`;

	await Bun.write(filePath, newContent);
	changedCount++;

	const diff = newRanges.length - oldRanges.length;
	console.log(`  ${file}: ${oldRanges.length} -> ${newRanges.length} ranges (${diff >= 0 ? "+" : ""}${diff})`);
}

console.log(`\nDone! Changed ${changedCount} font files.`);

#!/usr/bin/env bun
// Update version in package.json and jsr.json
// Usage: bun run scripts/update-version.ts <version>
// Example: bun run scripts/update-version.ts 1.0.0

const version = Bun.argv[2];

if (!version) {
  console.error("Error: Version is required");
  console.error("Usage: bun run scripts/update-version.ts <version>");
  process.exit(1);
}

// Update package.json
const packageJsonPath = "package.json";
if (await Bun.file(packageJsonPath).exists()) {
  const packageJson = await Bun.file(packageJsonPath).json();
  packageJson.version = version;
  await Bun.write(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
  console.log(`Updated version to ${version} in ${packageJsonPath}`);
}

// Update jsr.json if it exists
const jsrJsonPath = "jsr.json";
if (await Bun.file(jsrJsonPath).exists()) {
  const jsrJson = await Bun.file(jsrJsonPath).json();
  jsrJson.version = version;
  await Bun.write(jsrJsonPath, JSON.stringify(jsrJson, null, 2) + "\n");
  console.log(`Updated version to ${version} in ${jsrJsonPath}`);
}

#!/usr/bin/env bun

const workspace = await Bun.file("./workspace.json").json();
const packages = workspace.packages;

let hasErrors = false;

for (const pkg of packages) {
  console.log(`\nType checking ${pkg}...`);
  const proc = Bun.spawn(["bun", "run", "type-check"], {
    cwd: `./packages/${pkg}`,
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    console.error(`Type check failed for ${pkg}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exit(1);
}

console.log("\n✓ All type checks passed");

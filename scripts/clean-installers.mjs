import { rmSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dirs = [
  join(root, "src-tauri", "target", "release", "bundle", "msi"),
  join(root, "src-tauri", "target", "release", "bundle", "nsis"),
];

for (const dir of dirs) {
  if (existsSync(dir)) {
    for (const name of readdirSync(dir)) {
      rmSync(join(dir, name), { force: true, recursive: true });
    }
  } else {
    mkdirSync(dir, { recursive: true });
  }
  console.log(`cleaned ${dir}`);
}

import { execSync } from "child_process";
import fs from "fs";

export function run(cmd: string, verbose = true) {
  // Show output when verbose, otherwise suppress stdout/stderr.
  execSync(cmd, { stdio: verbose ? "inherit" : "ignore" });
}

export function quotePath(p: string) {
  return `"${p.replace(/\\/g, "/")}"`;
}

export function isEmptyDir(dir: string) {
  if (!fs.existsSync(dir)) return true; // Direktori tidak ada
  const files = fs.readdirSync(dir); // Baca semua file dalam direktori
  return files.length === 0; // Return true jika tidak ada file
}

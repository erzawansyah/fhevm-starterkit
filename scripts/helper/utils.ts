import { execSync } from "child_process";

export function run(cmd: string) {
  execSync(cmd, { stdio: "inherit" });
}

export function quotePath(p: string) {
  return `"${p.replace(/\\/g, "/")}"`;
}

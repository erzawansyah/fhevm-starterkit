// scripts/template-update.ts
// @script `npm run template-update`

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// CommonJS require karena starterkit.config.js formatnya module.exports
// eslint-disable-next-line @typescript-eslint/no-var-requires
const starterkitConfig = require("../starterkit.config");

const TEMPLATE_DIR = path.join(__dirname, "..", starterkitConfig.template.dir);

function quotePath(p: string) {
  return `"${p.replace(/\\/g, "/")}"`;
}

function run(cmd: string) {
  execSync(cmd, { stdio: "inherit" });
}

function main() {
  if (!fs.existsSync(TEMPLATE_DIR)) {
    console.error(
      "Template folder not found. Run `npm run template-init` first."
    );
    process.exit(1);
  }

  const gitFolder = path.join(TEMPLATE_DIR, ".git");
  if (!fs.existsSync(gitFolder)) {
    console.error("Template folder exists but is NOT a git repository.");
    console.error("Delete it manually and run `npm run template-init`.");
    process.exit(1);
  }

  console.log("Updating FHEVM Hardhat Template via git pull...");
  run(`git -C ${quotePath(TEMPLATE_DIR)} pull`);
  console.log("Template update complete.");
}

main();

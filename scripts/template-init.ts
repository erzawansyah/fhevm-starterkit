// scripts/template-init.ts
// @script `npm run template-init`

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const starterkitConfig = require("../starterkit.config");

const TEMPLATE_REPO: string = starterkitConfig.template.repo;
const TEMPLATE_DIR = path.join(__dirname, "..", starterkitConfig.template.dir);
const UPDATE_SCRIPT: string = starterkitConfig.template.updateScript;

const EXCLUDED_SCRIPT_FILES: string[] =
  starterkitConfig.template.excludedScriptFiles || [];

function quotePath(p: string) {
  return `"${p.replace(/\\/g, "/")}"`;
}

function run(cmd: string) {
  execSync(cmd, { stdio: "inherit" });
}

function isEmptyDir(dir: string) {
  if (!fs.existsSync(dir)) return true;
  const files = fs.readdirSync(dir);
  return files.length === 0;
}

function cloneTemplate() {
  console.log("Cloning FHEVM Hardhat Template...");
  run(`git clone ${TEMPLATE_REPO} ${quotePath(TEMPLATE_DIR)}`);
  console.log("Clone complete.");
}

function updateTemplate() {
  console.log("Template exists. Running template update script...");
  run(`npm run ${UPDATE_SCRIPT}`);
}

function copyScripts() {
  console.log("Copying scripts into template directory...");

  const SCRIPTS_DIR = __dirname;
  const scriptFiles = fs.readdirSync(SCRIPTS_DIR);

  scriptFiles.forEach((file) => {
    const ext = path.extname(file);
    const base = path.basename(file);

    if (
      (ext === ".ts" || ext === ".js") &&
      !EXCLUDED_SCRIPT_FILES.includes(base)
    ) {
      const srcPath = path.join(SCRIPTS_DIR, file);
      const destPath = path.join(TEMPLATE_DIR, file);

      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✓ ${file} -> ${starterkitConfig.template.dir}/${file}`);
    }
  });
}

function main() {
  console.log("Running template-init...");

  if (!fs.existsSync(TEMPLATE_DIR)) {
    console.log("Template folder not found. Cloning fresh copy...");
    cloneTemplate();
    copyScripts();
    return;
  }

  if (isEmptyDir(TEMPLATE_DIR)) {
    console.log("Template folder is empty. Cloning fresh copy...");
    cloneTemplate();
    copyScripts();
    return;
  }

  updateTemplate();
  copyScripts();
}

main();

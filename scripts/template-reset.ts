// scripts/template-reset.ts
// @script `npm run template:reset`
// Script untuk mereset template FHEVM Hardhat ke kondisi awal (fresh clone)

import fs from "fs";
import path from "path";
import { quotePath, run, isEmptyDir } from "./helper/utils";
import { logger } from "./helper/logger";
const config = require("../starterkit.config");

// Konfigurasi template dari starterkit.config
const TEMPLATE_REPO: string = config.template.fhevmHardhat.repo; // URL repository template
const TEMPLATE_DIR = path.join(
  __dirname,
  "..",
  config.template.fhevmHardhat.dir
); // Direktori tujuan template

function main() {
  if (!fs.existsSync(TEMPLATE_DIR) || isEmptyDir(TEMPLATE_DIR)) {
    logger.info(
      "Template directory does not exist or is empty. Initializing new template..."
    );
  } else {
    logger.info("Removing existing template directory...");
    fs.rmSync(TEMPLATE_DIR, { recursive: true, force: true });
  }
  logger.info("Cloning fresh template from repository...");
  run(`git clone ${TEMPLATE_REPO} ${quotePath(TEMPLATE_DIR)}`);
  logger.success("Template has been reset to fresh clone.");
}

main();

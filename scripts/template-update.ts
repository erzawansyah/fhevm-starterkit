// scripts/template-update.ts
// @script `npm run template-update`
// Script untuk memperbarui template FHEVM Hardhat yang sudah ada

import fs from "fs";
import path from "path";
import { quotePath, run } from "./helper/utils";
import { logger } from "./helper/logger";
const config = require("../starterkit.config");

const TEMPLATE_DIR = path.join(
  __dirname,
  "..",
  config.template.fhevmHardhat.dir
);

function main() {
  if (!fs.existsSync(TEMPLATE_DIR)) {
    logger.error(
      "Template folder not found. Run `npm run template-init` first."
    );
    process.exit(1);
  }

  const gitFolder = path.join(TEMPLATE_DIR, ".git");
  if (!fs.existsSync(gitFolder)) {
    logger.error("Template folder exists but is NOT a git repository.");
    logger.error("Delete it manually and run `npm run template-init`.");
    process.exit(1);
  }

  logger.info("Updating FHEVM Hardhat Template via git pull...");
  run(`git -C ${quotePath(TEMPLATE_DIR)} pull`);
  logger.success("Template update complete.");
}

main();

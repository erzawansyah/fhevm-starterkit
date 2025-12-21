// scripts/template-reset.ts
// @script `npm run template:reset`
// Script untuk mereset template FHEVM Hardhat ke kondisi awal (fresh clone)

import fs from "fs";
import path from "path";
import { quotePath, run, isEmptyDir } from "./helper/utils";
import { logger } from "./helper/logger";
import config from "../starterkit.config";

const HARDHAT_TARGET_DIR = config.template.hardhat.dir;
const FRONTEND_TARGET_DIR = config.template.frontend.dir;

// Empty hardhat template directory
function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Directory did not exist, created: ${dir}`);
    return;
  }

  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const entryPath = path.join(dir, entry);
    try {
      const stat = fs.lstatSync(entryPath);
      if (stat.isDirectory()) {
        fs.rmSync(entryPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(entryPath);
      }
    } catch (err) {
      // If any entry cannot be removed, log and continue
      logger.info(`Failed to remove ${entryPath}: ${err}`);
    }
  }
  logger.info(`Emptied directory contents: ${dir}`);
}

function main() {
  logger.info("Resetting Hardhat template...");
  emptyDir(HARDHAT_TARGET_DIR);
  emptyDir(FRONTEND_TARGET_DIR);
  logger.success(
    "Hardhat template reset complete. You can now run `npm run template:init` to re-initialize the templates."
  );
}

main();

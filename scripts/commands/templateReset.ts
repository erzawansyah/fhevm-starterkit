import fs from "fs";
import path from "path";
import config from "../../starterkit.config";
import { logger } from "../helper/logger";
import { GlobalOptions } from "../cli";

const HARDHAT_TARGET_DIR = config.template.hardhat.dir;
const FRONTEND_TARGET_DIR = config.template.frontend.dir;

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
      logger.info(`Failed to remove ${entryPath}: ${String(err)}`);
    }
  }

  logger.info(`Emptied directory contents: ${dir}`);
}

export async function runTemplateReset(
  input: { yes: boolean } & GlobalOptions
) {
  if (input.verbose)
    logger.info(`[debug] template:reset ${JSON.stringify(input)}`);

  logger.info("Resetting templates...");

  if (!input.yes) {
    logger.error("Refusing to reset without confirmation.");
    logger.info("Run again with: npm run template:reset -- --yes");
    process.exit(1);
  }

  emptyDir(HARDHAT_TARGET_DIR);
  emptyDir(FRONTEND_TARGET_DIR);

  logger.success(
    "Template reset complete. You can now run `npm run template:init` to re-initialize the templates."
  );
}

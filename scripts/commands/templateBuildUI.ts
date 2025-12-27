/**
 * @path scripts/commands/setupFrontend.ts
 * @script `npm run setup:frontend`
 * @description Script to set up the Frontend template in the ./base/frontend-template folder
 *
 * What actually does this script do?
 * - Ensures the Frontend template is already cloned into the ./base/frontend-template folder
 * - Ensures .env.local has been created inside the frontend-template folder (copied from .env.local at root)
 * - Runs `npm install` to install the required dependencies
 * - Runs `npm run build` to build the frontend application
 * - After completion, the frontend is ready to use in the starter kit
 */

import fs from "fs";
import path from "path";
import { logger } from "../../lib/helper/logger";
import { quotePath, run } from "../../lib/helper/utils";
import config from "../../starterkit.config";
import { GlobalOptions } from "../cli";

const FRONTEND_TARGET_DIR = path.join(
  __dirname,
  "..",
  "..",
  config.template.frontend.dir,
);
const FRONTEND_ENV_SOURCE = path.join(__dirname, "..", "..", ".env.local");
const FRONTEND_ENV_TARGET = path.join(FRONTEND_TARGET_DIR, ".env.local");

export async function runTemplateBuildUI(opts: GlobalOptions) {
  // Check if the frontend template has been cloned
  if (!fs.existsSync(FRONTEND_TARGET_DIR)) {
    logger.error(
      `Frontend template not found at ${quotePath(
        FRONTEND_TARGET_DIR,
      )}. Run template:init first.`,
    );
    process.exit(1);
  }

  // Check if .env.local exists in the frontend template and is not empty
  if (!fs.existsSync(FRONTEND_ENV_SOURCE)) {
    logger.error(
      `File .env.local not found at ${quotePath(
        FRONTEND_ENV_SOURCE,
      )}. Please create .env.local file at the project root first.`,
    );
    process.exit(1);
  }

  // Copy .env.local to the frontend template folder
  fs.copyFileSync(FRONTEND_ENV_SOURCE, FRONTEND_ENV_TARGET);
  logger.info(`Copying .env.local to ${quotePath(FRONTEND_ENV_TARGET)}...`);

  // Run npm install in the frontend template folder
  logger.info("Running npm install in the frontend template...");
  logger.loading(
    "Installing dependencies... (This may take several minutes)",
  );
  await run("npm ci", {
    cwd: FRONTEND_TARGET_DIR,
    silent: !opts.verbose,
  });
  logger.success("Frontend dependencies successfully installed.");

  // Run npm run build in the frontend template folder
  logger.info("Running npm run build in the frontend template...");
  logger.loading(
    "Building frontend application... (This may take several minutes)",
  );
  await run("npm run build", {
    cwd: FRONTEND_TARGET_DIR,
    silent: !opts.verbose,
  });

  // Done
  logger.success("Frontend application successfully built and ready to use.");
}

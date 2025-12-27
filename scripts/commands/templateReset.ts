/**
 * @path scripts/commands/templateReset.ts
 * @script `npm run template:reset`
 * @description Script to empty FHEVM Hardhat and Frontend templates from the ./base folder
 *
 * What actually does this script do?
 * - Checks if ./base/hardhat and ./base/frontend folders exist and are not empty
 * - If they have content, asks user for confirmation to empty those folders
 * - If user confirms, empties the ./base/hardhat and ./base/frontend folders
 * - If user does not confirm, cancels the operation
 * - If folders are already empty, informs user that there's nothing to delete
 * - Provides one parameter that can be used:
 * - --yes: Skips confirmation and directly empties the folders
 */

import fs from "fs";
import config from "../../starterkit.config";
import { logger } from "../../lib/helper/logger";
import { emptyDir } from "../../lib/helper/utils";
import { GlobalOptions } from "../cli";
import { prompt } from "enquirer";

// Inisialisasi konstanta direktori template dari konfigurasi
const HARDHAT_TARGET_DIR = config.template.hardhat.dir;
const FRONTEND_TARGET_DIR = config.template.frontend.dir;

type TemplateResetOptions = {
  yes: boolean;
} & GlobalOptions;

/**
 * Function to empty the contents of a directory without deleting the directory itself.
 * @param dir Directory to be emptied
 * @returns null
 */
// use shared `emptyDir` from lib/helper/utils

/**
 * Function to check if ./base/hardhat and ./base/frontend folders exist and are not empty
 * @returns boolean
 */
function baseTemplatesExist(): boolean {
  const hardhatExists =
    fs.existsSync(HARDHAT_TARGET_DIR) &&
    fs.readdirSync(HARDHAT_TARGET_DIR).length > 0;
  const frontendExists =
    fs.existsSync(FRONTEND_TARGET_DIR) &&
    fs.readdirSync(FRONTEND_TARGET_DIR).length > 0;
  return hardhatExists || frontendExists;
}

/**
 * Main function to run the template:reset command
 * @param input Input options from CLI. Must contain 'yes' property for deletion confirmation.
 */
export async function runTemplateReset(input: TemplateResetOptions) {
  if (input.verbose) {
    logger.info(`[debug] template:reset ${JSON.stringify(input)}`);
  }

  if (!baseTemplatesExist()) {
    logger.info("Folder ./base is already empty. Nothing to delete.");
    return;
  }

  if (!input.yes) {
    const ok = await prompt<{ confirmReset: boolean }>({
      type: "confirm",
      name: "confirmReset",
      message:
        "Are you sure you want to empty all templates in ./base folder? This action cannot be undone.",
      initial: false,
    }).then((answer) => answer.confirmReset);
    if (!ok) {
      logger.warning("Operation cancelled by user.");
      return;
    }
  }

  logger.info("Emptying ./base folder...");
  emptyDir(HARDHAT_TARGET_DIR);
  emptyDir(FRONTEND_TARGET_DIR);
  logger.info("All templates in ./base folder have been deleted.");

  // Ask user for deletion confirmation. If user chooses 'yes' or 'Y', continue.
}

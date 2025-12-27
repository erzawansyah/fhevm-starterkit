/**
 * @path scripts/commands/templateUpdate.ts
 * @script `npm run template:update`
 * @description Script to update FHEVM Hardhat and Frontend templates in the ./base folder
 *
 * What actually does this script do?
 * - Updates Hardhat and Frontend templates in the ./base folder to the latest version from the main branch of their respective repositories
 * - Ensures templates are already initialized before updating
 * - Provides one parameter that can be added in the future
 */

import fs from "fs";
import { execSync } from "child_process";

import config from "../../starterkit.config";
import { logger } from "../../lib/helper/logger";
import {
  getRemoteHeadCommitHash,
  checkoutRepoCommit,
} from "../../lib/helper/utils";
import { GlobalOptions } from "../cli";
import { prompt } from "enquirer";

// Inisialisasi konstanta untuk repositori template dan direktori target
const HARDHAT_TEMPLATE_REPO = config.template.hardhat.repo;
const HARDHAT_TARGET_DIR = config.template.hardhat.dir;
const HARDHAT_TEMPLATE_COMMITHASH = config.template.hardhat.commit;
const FRONTEND_TEMPLATE_REPO = config.template.frontend.repo;
const FRONTEND_TARGET_DIR = config.template.frontend.dir;
const FRONTEND_TEMPLATE_COMMITHASH = config.template.frontend.commit;

// Type for template update options
type TemplateUpdateOptions = {
  // If additional parameters will be added in the future, they can be added here
} & GlobalOptions;

/**
 * Function to ensure templates are already initialized.
 * If not, stop the process with an error message.
 * @returns void
 */
function ensureTemplateInitialized() {
  logger.info("Checking if templates are already initialized...");
  if (
    !fs.existsSync(HARDHAT_TARGET_DIR) ||
    !fs.existsSync(FRONTEND_TARGET_DIR)
  ) {
    logger.error(
      "Templates not yet initialized! Run `npm run template:init` first.",
    );
    process.exit(1);
  }
  logger.info("Templates are already initialized.");
}

/**
 * Function to get the commit hash from the remote HEAD of a git repository.
 * @param repo Git repository
 * @param branch Branch whose HEAD commit will be retrieved (default: "main")
 * @returns string Commit hash from remote HEAD
 */
// git helpers (getRemoteHeadCommitHash, checkoutRepoCommit) moved to lib/helper/utils

/**
 * Function to update template in target directory to a specific commit.
 * @param params Parameters for template update
 * @returns Promise<void>
 */
async function updateTemplate(params: {
  label: string;
  repo: string;
  targetDir: string;
  pinnedCommit?: string;
  branch?: string;
  verbose?: boolean;
}) {
  const { label, repo, targetDir, branch = "main", verbose = true } = params;

  logger.info(`Updating ${label} template...`);

  // Get target commit from remote
  const targetCommit = getRemoteHeadCommitHash(repo, branch);

  // Get current commit in local (if repo is valid)
  let currentCommit = "";
  try {
    currentCommit = execSync("git rev-parse HEAD", { cwd: targetDir })
      .toString()
      .trim();
  } catch {
    // if folder is not a valid git repo, leave it empty
  }

  // If there's no target commit, stop the process with an error
  if (!targetCommit) {
    // Check if pinnedCommit matches currentCommit
    // If same, it means already up-to-date
    // If not, there's a problem

    if (params.pinnedCommit && currentCommit === params.pinnedCommit) {
      logger.info(
        `${label} template is already at pinned commit. Nothing to update.`,
      );
      return;
    }

    if (params.pinnedCommit && params.pinnedCommit !== currentCommit) {
      logger.warning(
        `${label} template has no target commit, but current commit differs from pinned commit. Check starterkit configuration.`,
      );
      process.exit(1);
    }

    logger.warning(
      `No target commit for ${label} template. Check starterkit config.`,
    );
    process.exit(1);
  }

  if (currentCommit && currentCommit === targetCommit) {
    logger.info(
      `${label} template is already at target commit. Nothing to update.`,
    );
    return;
  }

  logger.info(`Checking out ${label} template to commit ${targetCommit}...`);
  await checkoutRepoCommit(targetDir, targetCommit, !!verbose);

  logger.success(`${label} template successfully updated.`);
}

// Confirm update
async function confirmUpdate(): Promise<boolean> {
  const answer = (await prompt({
    type: "confirm",
    name: "confirmation",
    message:
      "Are you sure you want to update templates to the latest version from the official repository? (local changes will be lost)",
    initial: false,
  })) as { confirmation: boolean };

  return answer.confirmation;
}

export async function runTemplateUpdate(input: TemplateUpdateOptions) {
  if (input.verbose)
    logger.info(`[debug] template:update ${JSON.stringify(input)}`);

  logger.info("▶ template:update");

  const userConfirmed = await confirmUpdate();
  if (!userConfirmed) {
    logger.warning("Update operation cancelled by user.");
    return;
  }

  // Ensure templates are already initialized
  // Exit if not yet initialized
  ensureTemplateInitialized();

  try {
    await updateTemplate({
      label: "Hardhat",
      repo: HARDHAT_TEMPLATE_REPO,
      targetDir: HARDHAT_TARGET_DIR,
      pinnedCommit: HARDHAT_TEMPLATE_COMMITHASH,
      branch: "main",
      verbose: !!input.verbose,
    });

    await updateTemplate({
      label: "Frontend",
      repo: FRONTEND_TEMPLATE_REPO,
      targetDir: FRONTEND_TARGET_DIR,
      pinnedCommit: FRONTEND_TEMPLATE_COMMITHASH,
      branch: "main",
      verbose: !!input.verbose,
    });

    logger.success("Template update completed.");
  } catch (error) {
    logger.error("An error occurred while updating templates:", error);
    process.exit(1);
  }
}

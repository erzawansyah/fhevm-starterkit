/**
 * @path scripts/commands/templateInit.ts
 * @script `npm run template:init`
 * @description Script to initialize FHEVM Hardhat and Frontend templates into the ./base folder
 *
 * What actually does this script do?
 * - Clones Hardhat and Frontend templates from specified repositories into the ./base folder
 * - By default, checks out to pinned commit to ensure consistency (based on commit hash in starterkit.config)
 * - Provides two parameters that can be used:
 * - --latest: Skips checkout to pinned commit and uses the latest version from the main branch
 * - --force: Empties the ./base folder if it already has content before cloning templates
 */

import fs from "fs";

import config from "../../starterkit.config";
import { logger } from "../../lib/helper/logger";
import { quotePath, run, isEmptyDir, emptyDir } from "../../lib/helper/utils";
import { GlobalOptions } from "../cli";
import { prompt } from "enquirer";

// Skrip CLI untuk clone template Hardhat & frontend ke ./base dengan opsi pinned commit atau latest.
const HARDHAT_TEMPLATE_REPO = config.template.hardhat.repo;
const HARDHAT_TARGET_DIR = config.template.hardhat.dir;
const HARDHAT_TEMPLATE_COMMITHASH = config.template.hardhat.commit;

const FRONTEND_TEMPLATE_REPO = config.template.frontend.repo;
const FRONTEND_TARGET_DIR = config.template.frontend.dir;
const FRONTEND_TEMPLATE_COMMITHASH = config.template.frontend.commit;

type TemplateInitOptions = {
  latest: boolean;
  force: boolean;
} & GlobalOptions;

/**
 * Function to delete all contents in a directory without deleting the directory itself.
 * @param dir Directory whose contents will be deleted
 * @returns void
 */
/**
 * Function to ensure a directory is empty or create it new.
 * @param dir Directory to ensure is empty or created new
 * @param force If true, will empty the directory if it's not empty
 * @returns void
 */
function ensureEmptyDir(dir: string, force: boolean) {
  logger.info(`Checking if target directory ${dir} is ready to use...`);

  if (!fs.existsSync(dir)) {
    logger.info(`Creating target directory ${dir}...`);
    fs.mkdirSync(dir, { recursive: true });
    return;
  }

  if (isEmptyDir(dir)) return;

  if (!force) {
    logger.error(`Target directory ${dir} is not empty!`);
    logger.error(
      "Delete the directory contents and try again, or re-run with --force flag.",
    );
    process.exit(1);
  }

  logger.warning(
    `Target directory ${dir} is not empty. --force active, emptying directory contents...`,
  );
  emptyDir(dir);
}

/**
 * Function to get confirmation from user whether to continue with latest mode
 * @returns boolean Whether user confirmed to continue with latest mode
 */
async function confirmLatestMode(): Promise<boolean> {
  const answer = await prompt<{ confirmLatest: boolean }>({
    type: "confirm",
    name: "confirmLatest",
    message:
      "You chose --latest. Using the latest template version may cause\nresult differences and conflicts during updates. Continue without checking out to pinned commit?",
    initial: false,
  });
  return answer.confirmLatest;
}

// Clone template repository with option to checkout pinned commit or not
async function cloneRepo(params: {
  repo: string;
  targetDir: string;
  pinnedCommit?: string;
  skipCheckout: boolean;
  force: boolean;
  label: string;
  verbose?: boolean;
}) {
  const { repo, targetDir, pinnedCommit, skipCheckout, force, label, verbose } =
    params;

  // Ensure target directory is ready
  ensureEmptyDir(targetDir, force);

  logger.info(`Cloning ${label} template...`);
  // Clone repository
  await run(`git clone ${quotePath(repo)} ${quotePath(targetDir)}`, !!verbose);

  // Checkout to pinned commit if needed
  if (pinnedCommit && !skipCheckout) {
    logger.info(`Checking out ${label} template to commit ${pinnedCommit}...`);
    await run(
      `cd ${quotePath(targetDir)} && git checkout ${pinnedCommit}`,
      !!verbose,
    );
  } else if (pinnedCommit && skipCheckout) {
    logger.info(
      `Skipping commit checkout for ${label} template because --latest was confirmed.`,
    );
  }

  logger.success(`${label} template successfully cloned.`);
}

// Main function to run template initialization
export const runTemplateInit = async (options: TemplateInitOptions) => {
  const latest = !!options.latest;
  const force = !!options.force;

  let skipCheckout = false;

  if (latest) {
    const ok = await confirmLatestMode();
    if (!ok) {
      logger.info(
        "Cancelled by user. No changes were made.",
      );
      process.exit(0);
    }
    skipCheckout = true;
    logger.info(
      "Confirmation received: will use latest version and skip pinned commit checkout.",
    );
  }

  await cloneRepo({
    repo: HARDHAT_TEMPLATE_REPO,
    targetDir: HARDHAT_TARGET_DIR,
    pinnedCommit: HARDHAT_TEMPLATE_COMMITHASH,
    skipCheckout,
    force,
    label: "Hardhat",
    verbose: !!options.verbose,
  });

  await cloneRepo({
    repo: FRONTEND_TEMPLATE_REPO,
    targetDir: FRONTEND_TARGET_DIR,
    pinnedCommit: FRONTEND_TEMPLATE_COMMITHASH,
    skipCheckout,
    force,
    label: "Frontend",
    verbose: !!options.verbose,
  });

  logger.success("Template initialization completed.");
  process.exit(0);
};

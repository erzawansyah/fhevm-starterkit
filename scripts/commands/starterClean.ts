import path from "path";
import fs from "fs";
import { GlobalOptions } from "../cli";
import { logger } from "../../lib/helper/logger";
import { prompt } from "enquirer";
import { resolveWorkspaceDir } from "../../lib/helper/path-utils";

type RunStarterCleanOpts = {
  force: boolean;
} & GlobalOptions;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryableDeleteError(err: any) {
  const code = err?.code;
  return (
    code === "EBUSY" ||
    code === "EPERM" ||
    code === "ENOTEMPTY" ||
    code === "EACCES"
  );
}

function rmSyncWithRetry(targetPath: string, retries = 10, baseDelayMs = 80) {
  const absTarget = path.resolve(targetPath);

  const cwd = process.cwd();
  if (cwd === absTarget || cwd.startsWith(absTarget + path.sep)) {
    throw new Error(
      `Refusing to delete because current working directory is inside target: ${absTarget}`,
    );
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      fs.rmSync(absTarget, { recursive: true, force: true });
      return;
    } catch (err: any) {
      if (!isRetryableDeleteError(err) || attempt === retries) {
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delay);
    }
  }
}

function renameThenRmSync(targetPath: string, retries = 10, baseDelayMs = 80) {
  const absTarget = path.resolve(targetPath);

  if (!fs.existsSync(absTarget)) return;

  const parent = path.dirname(absTarget);
  const base = path.basename(absTarget);
  const tmpName = `.deleting-${base}-${Date.now()}`;
  const tmpPath = path.join(parent, tmpName);

  try {
    fs.renameSync(absTarget, tmpPath);
    rmSyncWithRetry(tmpPath, retries, baseDelayMs);
  } catch {
    rmSyncWithRetry(absTarget, retries, baseDelayMs);
  }
}

export async function runStarterClean(
  starterName: string[],
  opts: RunStarterCleanOpts,
) {
  const workspaceDir = resolveWorkspaceDir();

  if (!starterName || starterName.length === 0) {
    logger.error("No starter names provided.");
    logger.info("Usage: npm run starter:clean <starterName...>");
    process.exit(1);
  }

  logger.info(`Workspace directory: ${workspaceDir}`);
  logger.info(`Starters to clean: ${starterName.join(", ")}`);

  const existingStarters: string[] = [];
  const missingStarters: string[] = [];

  for (const name of starterName) {
    const starterPath = path.join(workspaceDir, name);
    if (fs.existsSync(starterPath) && fs.lstatSync(starterPath).isDirectory()) {
      existingStarters.push(name);
    } else {
      missingStarters.push(name);
    }
  }

  if (missingStarters.length > 0) {
    logger.warning("The following starters do not exist in workspace:");
    missingStarters.forEach((name) => logger.warning(`  - ${name}`));
  }

  if (existingStarters.length === 0) {
    logger.error("No starters found in workspace to clean.");
    process.exit(1);
  }

  logger.info("The following starters will be removed from workspace:");
  logger.table(existingStarters.map((name) => ({ Starter: name })));

  if (!opts.force) {
    const confirmed = await prompt<{ confirm: boolean }>({
      type: "confirm",
      name: "confirm",
      message:
        "Are you sure you want to delete the above starter(s)? This action cannot be undone.",
      initial: false,
    }).then((answer) => answer.confirm);

    if (!confirmed) {
      logger.info("Operation cancelled.");
      process.exit(0);
    }
  }

  let successCount = 0;
  let errorCount = 0;

  for (const name of existingStarters) {
    const starterPath = path.join(workspaceDir, name);

    try {
      logger.info(`Deleting ${name}...`);

      // Extra small delay can reduce transient Windows locks after build/install steps.
      // Not mandatory, but helps in practice.
      await sleep(25);

      // Most robust approach on Windows:
      // 1) rename quickly
      // 2) delete the renamed path with retries
      renameThenRmSync(starterPath, 10, 80);

      logger.success(`✓ Successfully deleted ${name}`);
      successCount++;
    } catch (error) {
      logger.error(
        `✗ Failed to delete ${name}: ${error instanceof Error ? error.message : String(error)
        }`,
      );
      errorCount++;
    }
  }

  logger.success(`Successfully cleaned: ${successCount} starter(s)`);
  if (errorCount > 0) {
    logger.error(`Failed to clean: ${errorCount} starter(s)`);
  }
}

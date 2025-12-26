import path from "path";
import fs from "fs";
import { GlobalOptions } from "../cli";
import { logger } from "../../lib/helper/logger";
import { prompt } from "enquirer";
import { resolveWorkspaceDir } from "../../lib/helper/path-utils";

type RunStarterCleanOpts = {
    force: boolean;
} & GlobalOptions;

export async function runStarterClean(starterName: string[], opts: RunStarterCleanOpts) {
    const workspaceDir = resolveWorkspaceDir();

    // If no starter names provided, show error
    if (!starterName || starterName.length === 0) {
        logger.error("No starter names provided.");
        logger.info("Usage: npm run starter:clean <starterName...>");
        process.exit(1);
    }

    logger.info(`Workspace directory: ${workspaceDir}`);
    logger.info(`Starters to clean: ${starterName.join(", ")}`);

    // Check which starters exist in workspace
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

    // Report missing starters
    if (missingStarters.length > 0) {
        logger.warning(`The following starters do not exist in workspace:`);
        missingStarters.forEach((name) => logger.warning(`  - ${name}`));
    }

    // If no starters to clean, exit
    if (existingStarters.length === 0) {
        logger.error("No starters found in workspace to clean.");
        process.exit(1);
    }

    // Show what will be deleted
    logger.info(`The following starters will be removed from workspace:`);
    logger.table(
        existingStarters.map((name) => ({ Starter: name })),
    );

    // Ask for confirmation unless --force flag is set
    if (!opts.force) {
        const confirmed = await prompt<{ confirm: boolean }>({
            type: "confirm",
            name: "confirm",
            message: "Are you sure you want to delete the above starter(s)? This action cannot be undone.",
            initial: false,
        }).then((answer) => answer.confirm);
        if (!confirmed) {
            logger.info("Operation cancelled.");
            process.exit(0);
        }
    }

    // Delete each starter
    let successCount = 0;
    let errorCount = 0;

    for (const name of existingStarters) {
        const starterPath = path.join(workspaceDir, name);
        try {
            logger.info(`Deleting ${name}...`);
            fs.rmSync(starterPath, { recursive: true, force: true });
            logger.success(`✓ Successfully deleted ${name}`);
            successCount++;
        } catch (error) {
            logger.error(`✗ Failed to delete ${name}: ${error instanceof Error ? error.message : String(error)}`);
            errorCount++;
        }
    }

    // Summary
    logger.success(`Successfully cleaned: ${successCount} starter(s)`);
    if (errorCount > 0) {
        logger.error(`Failed to clean: ${errorCount} starter(s)`);
    }
}

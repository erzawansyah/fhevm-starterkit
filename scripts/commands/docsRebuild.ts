import * as fs from "fs";
import * as path from "path";
import { logger } from "../../lib/helper/logger";
import { renderHbsFile } from "../../lib/helper/renderHbs";
import { GlobalOptions } from "../cli";
import { runBuildMetadata } from "./buildMetadata";

export type DocsRebuildOptions = GlobalOptions & {
    root?: string;
    template?: string;
    dryRun?: boolean;
};

/**
 * Rebuild metadata and README.md documentation for all starters under a root directory.
 */
export async function runDocsRebuild(opts: DocsRebuildOptions) {
    try {
        const startersRoot = opts.root || "starters";
        const templatePath = opts.template || "base/markdown-template/CONTRACT_DOCUMENTATION.md.hbs";

        logger.info("Rebuilding metadata and documentation for starters...");
        logger.debug(`Starters root: ${startersRoot}`);
        logger.debug(`Template: ${templatePath}`);

        if (!fs.existsSync(startersRoot)) {
            logger.error(`Starters directory not found: ${startersRoot}`);
            return;
        }

        if (!fs.existsSync(templatePath)) {
            logger.error(`Template not found: ${templatePath}`);
            return;
        }

        const starterDirs = fs
            .readdirSync(startersRoot)
            .map((name) => ({ name, dir: path.join(startersRoot, name) }))
            .filter(({ dir }) => fs.existsSync(dir) && fs.statSync(dir).isDirectory());

        if (starterDirs.length === 0) {
            logger.warning("No starters found to rebuild.");
            return;
        }

        let rebuilt = 0;
        let skipped = 0;

        for (const { name, dir } of starterDirs) {
            try {
                logger.info("");
                logger.info(`▶ ${name}`);

                const metadataPath = path.join(dir, "metadata.json");
                const contractsDir = path.join(dir, "contracts");
                const readmePath = path.join(dir, "README.md");

                // Regenerate metadata from contract when possible
                let metadata: any | null = null;

                const hasContracts = fs.existsSync(contractsDir);
                const solFiles = hasContracts
                    ? fs.readdirSync(contractsDir).filter((f) => f.endsWith(".sol"))
                    : [];

                if (solFiles.length > 0) {
                    const contractFile = solFiles[0];
                    const contractPath = path.join(contractsDir, contractFile);
                    logger.info(`  • Parsing contract: contracts/${contractFile}`);

                    if (opts.dryRun) {
                        logger.debug("  (dry-run) Skipping metadata write");
                        // If dry-run, try to read existing metadata for rendering preview
                        metadata = fs.existsSync(metadataPath)
                            ? JSON.parse(fs.readFileSync(metadataPath, "utf-8"))
                            : null;
                    } else {
                        // Build fresh metadata from the contract
                        await runBuildMetadata({
                            contractPath,
                            output: metadataPath,
                            verbose: opts.verbose,
                            cwd: opts.cwd,
                            json: opts.json,
                        });

                        if (fs.existsSync(metadataPath)) {
                            metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
                            logger.success("  ✓ metadata.json regenerated");
                        } else {
                            logger.warning("  ⚠ metadata.json was not generated as expected");
                        }
                    }
                } else {
                    logger.warning("  ⚠ No .sol contracts found; using existing metadata if present");
                    if (fs.existsSync(metadataPath)) {
                        metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
                    }
                }

                // If we still don't have metadata, skip this starter
                if (!metadata) {
                    logger.warning("  ⚠ Skipping: metadata is missing");
                    skipped++;
                    continue;
                }

                // Render README.md from template
                logger.info("  • Rendering README.md from template");
                const content = renderHbsFile(templatePath, metadata);

                if (opts.dryRun) {
                    logger.info("  (dry-run) README.md not written");
                } else {
                    fs.writeFileSync(readmePath, content, "utf-8");
                    logger.success("  ✓ README.md updated");

                    // Also publish documentation to docs/starters/<name>.md
                    const docsRoot = path.join("docs", "starters");
                    if (!fs.existsSync(docsRoot)) {
                        fs.mkdirSync(docsRoot, { recursive: true });
                        logger.debug(`  ✓ Created docs directory: ${docsRoot}`);
                    }
                    const docsTarget = path.join(docsRoot, `${name}.md`);
                    fs.copyFileSync(readmePath, docsTarget);
                    logger.info(`  ✓ Documentation published: ${docsTarget}`);
                }

                rebuilt++;
            } catch (e) {
                logger.error(`  ✗ Failed to rebuild '${name}': ${e}`);
                if (opts.verbose) {
                    console.error(e);
                }
                skipped++;
            }
        }

        logger.info("");
        logger.success("Rebuild complete");
        logger.info(`  ✓ Updated starters: ${rebuilt}`);
        logger.info(`  ⚠ Skipped starters: ${skipped}`);
    } catch (error) {
        logger.error(`Error rebuilding docs: ${error}`);
        if (opts.verbose) {
            console.error(error);
        }
    }
}

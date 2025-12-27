import * as fs from "fs";
import * as path from "path";
import { logger } from "../../lib/helper/logger";
import { GlobalOptions } from "../cli";
import config from "../../starterkit.config";

export type StarterPublishOptions = GlobalOptions & {
    draftDir?: string;
    starterName?: string;
    force?: boolean;
};

/**
 * Publish a built starter from workspace/draft/dist to starters/
 */
export async function runStarterPublish(opts: StarterPublishOptions) {
    try {
        const draftDir = opts.draftDir || path.join(config.workingDir, "draft");
        const distDir = path.join(draftDir, "dist");

        logger.info("Publishing starter...");
        logger.debug(`Draft directory: ${draftDir}`);

        // Check if dist directory exists
        if (!fs.existsSync(distDir)) {
            logger.error(
                `Dist directory not found: ${distDir}\n` +
                "Run: npm run starter:build first to generate dist/",
            );
            return;
        }

        logger.success("✓ Dist directory found");

        // Check if metadata.json exists
        const metadataPath = path.join(distDir, "metadata.json");
        if (!fs.existsSync(metadataPath)) {
            logger.error(`metadata.json not found in: ${distDir}`);
            return;
        }

        // Read and validate metadata
        let metadata;
        try {
            const content = fs.readFileSync(metadataPath, "utf-8");
            metadata = JSON.parse(content);
        } catch (error) {
            logger.error(`Failed to parse metadata.json: ${error}`);
            return;
        }

        // Determine starter name
        const starterName = opts.starterName || metadata.name;
        if (!starterName) {
            logger.error("Starter name not found in metadata.json");
            return;
        }

        const starterDir = path.join(config.startersDir, starterName);

        logger.info(`Publishing to: ${starterDir}`);

        // Check if starter already exists
        if (fs.existsSync(starterDir) && !opts.force) {
            logger.warning(`Starter already exists: ${starterDir}`);
            logger.warning("Run with --force to overwrite, or provide --starter-name to use a different name");
            return;
        }

        // Create starter directory
        if (fs.existsSync(starterDir)) {
            logger.warning("Overwriting existing starter...");
            fs.rmSync(starterDir, { recursive: true });
        }

        fs.mkdirSync(starterDir, { recursive: true });
        logger.debug("✓ Created starter directory");

        // Copy files from dist to starter
        const filesToCopy = fs.readdirSync(distDir);

        for (const file of filesToCopy) {
            const srcPath = path.join(distDir, file);
            const destPath = path.join(starterDir, file);

            if (fs.statSync(srcPath).isDirectory()) {
                // Copy directory recursively
                copyDirRecursive(srcPath, destPath);
            } else {
                // Copy file
                fs.copyFileSync(srcPath, destPath);
            }

            logger.debug(`  ✓ Copied: ${file}`);
        }

        // Ensure required directories exist
        const requiredDirs = ["contracts", "test"];
        for (const dir of requiredDirs) {
            const dirPath = path.join(starterDir, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                logger.debug(`  ✓ Created directory: ${dir}`);
            }
        }

        // Ensure README.md exists (if not, copy from metadata)
        const readmePath = path.join(starterDir, "README.md");
        if (!fs.existsSync(readmePath)) {
            const readmeContent = `# ${metadata.label}\n\n${metadata.description}\n\nSee DOCUMENTATION.md for complete contract documentation.\n`;
            fs.writeFileSync(readmePath, readmeContent, "utf-8");
            logger.debug("  ✓ Created README.md");
        }

        logger.success("✓ Files copied");

        // Also publish documentation to docs/starters/<starterName>.md
        try {
            const docsRoot = path.join("docs", "starters");
            if (!fs.existsSync(docsRoot)) {
                fs.mkdirSync(docsRoot, { recursive: true });
                logger.debug(`  ✓ Created docs directory: ${docsRoot}`);
            }

            // Prefer README.md from dist (generated from template)
            const distReadme = path.join(distDir, "README.md");
            const starterReadme = path.join(starterDir, "README.md");
            const docSource = fs.existsSync(distReadme)
                ? distReadme
                : fs.existsSync(starterReadme)
                    ? starterReadme
                    : "";

            if (docSource) {
                const docsTarget = path.join(docsRoot, `${starterName}.md`);
                fs.copyFileSync(docSource, docsTarget);
                logger.info(`✓ Documentation published: ${docsTarget}`);
            } else {
                logger.warning("No documentation source found to publish (README.md missing).");
            }
        } catch (err) {
            logger.warning(`Failed to publish documentation: ${err}`);
        }

        logger.info("");
        logger.success("✅ Starter published successfully!");
        logger.info(`   Name: ${starterName}`);
        logger.info(`   Location: ${starterDir}`);
        logger.info("");
        logger.info("Next steps:");
        logger.info(`  1. Review files in: ${starterDir}`);
        logger.info("  2. Test the starter:");
        logger.info(`     npm run starter:create ${starterName} -- --dir test-${starterName}`);
        logger.info("  3. Commit to git when ready");
    } catch (error) {
        logger.error(`Error publishing starter: ${error}`);
        if (opts.verbose) {
            console.error(error);
        }
    }
}

/**
 * Recursively copy directory
 */
function copyDirRecursive(src: string, dest: string) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);

        if (fs.statSync(srcPath).isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

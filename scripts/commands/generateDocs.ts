import * as fs from "fs";
import * as path from "path";
import { logger } from "../../lib/helper/logger";
import { renderHbsFile } from "../../lib/helper/renderHbs";
import { GlobalOptions } from "../cli";

export type GenerateDocsOptions = GlobalOptions & {
    metadataPath: string;
    output?: string;
    template?: string;
};

/**
 * Generate documentation from metadata JSON using Handlebars template
 */
export async function runGenerateDocs(opts: GenerateDocsOptions) {
    try {
        logger.info("Generating documentation from metadata...");
        logger.debug(`Metadata path: ${opts.metadataPath}`);

        // Check if metadata file exists
        if (!fs.existsSync(opts.metadataPath)) {
            logger.error(`Metadata file not found: ${opts.metadataPath}`);
            return;
        }

        // Read metadata
        let metadata;
        try {
            const content = fs.readFileSync(opts.metadataPath, "utf-8");
            metadata = JSON.parse(content);
            logger.debug("✓ Metadata loaded successfully");
        } catch (error) {
            logger.error(`Failed to parse metadata JSON: ${error}`);
            return;
        }

        // Determine template path
        const templatePath =
            opts.template || "base/markdown-template/CONTRACT_DOCUMENTATION.md.hbs";

        logger.debug(`Template: ${templatePath}`);

        if (!fs.existsSync(templatePath)) {
            logger.error(`Template not found: ${templatePath}`);
            return;
        }

        // Render documentation
        logger.info("Rendering template...");
        const documentation = renderHbsFile(templatePath, metadata);

        // Determine output path
        const outputPath =
            opts.output ||
            path.join(
                path.dirname(opts.metadataPath),
                "DOCUMENTATION.md"
            );

        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            logger.debug(`Created output directory: ${outputDir}`);
        }

        // Write documentation
        fs.writeFileSync(outputPath, documentation, "utf-8");

        logger.success("✓ Documentation generated successfully!");
        logger.info(`Output: ${outputPath}`);

        // Print summary
        const lines = documentation.split("\n").length;
        const contracts = metadata.contract_name || "N/A";
        const functions = (metadata.functions || []).length;
        const events = (metadata.events || []).length;

        logger.info("");
        logger.info("Generated documentation:");
        logger.info(`  Contract: ${contracts}`);
        logger.info(`  Functions: ${functions}`);
        logger.info(`  Events: ${events}`);
        logger.info(`  Total lines: ${lines}`);
    } catch (error) {
        logger.error(`Error generating documentation: ${error}`);
        if (opts.verbose) {
            console.error(error);
        }
    }
}

import * as fs from "fs";
import * as path from "path";
import { logger } from "../../lib/helper/logger";
import { renderHbsFile } from "../../lib/helper/renderHbs";
import { GlobalOptions } from "../cli";
import config from "../../starterkit.config";

export type StarterBuildOptions = GlobalOptions & {
    draftDir?: string;
};

/**
 * Build a starter from workspace/draft directory
 * Steps:
 * 1. Check if workspace/draft exists and is active
 * 2. Find and validate contract file
 * 3. Generate metadata
 * 4. Validate metadata
 * 5. Generate documentation
 * 6. Copy contract and test files to dist/
 */
export async function runStarterBuild(opts: StarterBuildOptions) {
    try {
        const draftDir = opts.draftDir || path.join(config.workingDir, "draft");

        logger.info("Building starter from draft...");
        logger.debug(`Draft directory: ${draftDir}`);

        // Step 1: Check if draft directory exists
        if (!fs.existsSync(draftDir)) {
            logger.error(
                `Draft directory not found: ${draftDir}\n` +
                "Create a starter project first using: npm run starter:create <starter-name> -- --dir draft",
            );
            return;
        }

        logger.success("✓ Draft directory found");

        // Step 2: Find contract file
        const contractsDir = path.join(draftDir, "contracts");
        if (!fs.existsSync(contractsDir)) {
            logger.error(`Contracts directory not found: ${contractsDir}`);
            return;
        }

        const solFiles = fs
            .readdirSync(contractsDir)
            .filter((f) => f.endsWith(".sol"));

        if (solFiles.length === 0) {
            logger.error(`No .sol files found in: ${contractsDir}`);
            return;
        }

        if (solFiles.length > 1) {
            logger.warning(`Multiple contracts found. Using first one: ${solFiles[0]}`);
        }

        const contractFile = solFiles[0];
        const contractPath = path.join(contractsDir, contractFile);
        const metadataPath = path.join(draftDir, "metadata.json");

        logger.success(`✓ Contract found: ${contractFile}`);

        // Step 3: Generate metadata
        logger.info("Generating metadata...");

        // Generate metadata from contract
        const metadata = generateMetadataFromContract(contractPath);
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf-8");

        logger.success("✓ Metadata generated");

        // Step 4: Validate metadata
        logger.info("Validating metadata...");
        validateMetadata(metadata);
        logger.success("✓ Metadata valid");

        // Step 5: Generate documentation
        logger.info("Generating documentation...");
        const docPath = path.join(draftDir, "README.md");
        const templatePath = "base/markdown-template/CONTRACT_DOCUMENTATION.md.hbs";
        const documentation = renderHbsFile(templatePath, metadata);
        fs.writeFileSync(docPath, documentation, "utf-8");

        logger.success("✓ Documentation generated");

        // Step 6: Copy files to dist/
        logger.info("Building dist directory...");
        const distDir = path.join(draftDir, "dist");

        // Create dist directory structure
        if (fs.existsSync(distDir)) {
            fs.rmSync(distDir, { recursive: true });
        }
        fs.mkdirSync(distDir, { recursive: true });
        fs.mkdirSync(path.join(distDir, "contracts"), { recursive: true });
        fs.mkdirSync(path.join(distDir, "test"), { recursive: true });

        // Copy contract file to dist/contracts/
        fs.copyFileSync(contractPath, path.join(distDir, "contracts", contractFile));
        logger.debug(`  ✓ Copied contract: contracts/${contractFile}`);

        // Copy test files to dist/test/
        const testDir = path.join(draftDir, "test");
        if (fs.existsSync(testDir)) {
            const testFiles = fs.readdirSync(testDir);
            for (const testFile of testFiles) {
                const srcTestPath = path.join(testDir, testFile);
                const destTestPath = path.join(distDir, "test", testFile);
                if (fs.statSync(srcTestPath).isFile()) {
                    fs.copyFileSync(srcTestPath, destTestPath);
                    logger.debug(`  ✓ Copied test: test/${testFile}`);
                }
            }
        }

        // Copy metadata to dist root
        fs.copyFileSync(metadataPath, path.join(distDir, "metadata.json"));
        logger.debug("  ✓ Copied metadata.json");

        // Copy documentation as README.md to dist root
        fs.copyFileSync(docPath, path.join(distDir, "README.md"));
        logger.debug("  ✓ Copied README.md");

        logger.success("✓ Dist directory created");

        logger.info("");
        logger.success("✅ Starter built successfully!");
        logger.info("");
        logger.info("Next steps:");
        logger.info(`  1. Review the generated files in: ${distDir}`);
        logger.info(`  2. Run: npm run starter:publish -- --draft ${draftDir}`);
        logger.info("         to publish as a new starter");
    } catch (error) {
        logger.error(`Error building starter: ${error}`);
        if (opts.verbose) {
            console.error(error);
        }
    }
}

/**
 * Validate starter metadata
 */
function validateMetadata(metadata: any) {
    const required = [
        "name",
        "contract_name",
        "label",
        "category",
        "chapter",
        "authors",
    ];

    for (const field of required) {
        if (!metadata[field]) {
            throw new Error(`Missing required metadata field: ${field}`);
        }
    }

    if (!["fundamental", "patterns", "applied", "advanced"].includes(metadata.category)) {
        throw new Error(`Invalid category: ${metadata.category}`);
    }

    logger.debug("  ✓ All required fields present");
}

/**
 * Generate basic metadata from contract
 * (Simplified version - in production would call buildMetadata)
 */
function generateMetadataFromContract(contractPath: string): any {
    const content = fs.readFileSync(contractPath, "utf-8");
    const contractName = extractContractName(content);

    return {
        name: contractName.toLowerCase().replace(/([A-Z])/g, "-$1").toLowerCase(),
        contract_name: contractName,
        contract_filename: path.basename(contractPath),
        label: contractName.replace(/([A-Z])/g, " $1").trim(),
        description: "Auto-generated starter project",
        category: "fundamental",
        chapter: "basics",
        authors: [
            {
                name: "Developer",
            },
        ],
        has_ui: false,
        version: "1.0.0",
        fhevm_version: "0.9.1",
        state_variables: [],
        functions: [],
        structs: [],
        enums: [],
        events: [],
    };
}

/**
 * Extract contract name from Solidity file
 */
function extractContractName(content: string): string {
    const match = content.match(/contract\s+(\w+)/);
    return match ? match[1] : "Contract";
}

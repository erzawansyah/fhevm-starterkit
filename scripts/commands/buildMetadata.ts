import * as fs from "fs";
import * as path from "path";
import { logger } from "../../lib/helper/logger";
import { GlobalOptions } from "../cli";
import config from "../../starterkit.config";
import { StarterMetadataType } from "../../lib/types/starterMetadata.schema";

export type BuildMetadataOptions = GlobalOptions & {
    contractPath: string;
    output?: string;
    starterName?: string;
    category?: string;
    chapter?: string;
};

/**
 * Parse NatSpec comments from Solidity contract
 */
function parseNatSpec(contractContent: string): {
    title: string;
    notice: string;
    dev: string;
    authors: Array<{ name: string; email?: string; url?: string }>;
    security: string[];
    limitations: string[];
    customTags: Record<string, string[]>;
} {
    const result = {
        title: "",
        notice: "",
        dev: "",
        authors: [] as Array<{ name: string; email?: string; url?: string }>,
        security: [] as string[],
        limitations: [] as string[],
        customTags: {} as Record<string, string[]>,
    };

    // Extract contract-level NatSpec - more specific pattern
    const contractDocMatch = contractContent.match(
        /\/\*\*([\s\S]*?)\*\/\s*(?:abstract\s+)?contract\s+(\w+)/
    );

    if (!contractDocMatch) {
        logger.warning("No contract-level NatSpec found");
        return result;
    }

    const docComment = contractDocMatch[1];

    // Helper to clean up comment text
    const cleanCommentText = (text: string): string => {
        return text
            .replace(/^\s*\*\s?/gm, "") // Remove leading * from each line
            .replace(/\r\n/g, "\n") // Normalize line endings
            .replace(/\r/g, "\n") // Handle remaining \r
            .trim();
    };

    // Parse @title - single line only
    const titleMatch = docComment.match(/@title\s+([^\n]+)/);
    if (titleMatch) {
        result.title = cleanCommentText(titleMatch[1]);
    }

    // Parse @notice - single line only
    const noticeMatch = docComment.match(/@notice\s+([^\n]+)/);
    if (noticeMatch) {
        result.notice = cleanCommentText(noticeMatch[1]);
    }

    // Parse @dev (get first occurrence only, before @custom tags)
    const devMatch = docComment.match(/@dev\s+(.+?)(?=\n\s*@|\n\s*\*\/|$)/s);
    if (devMatch) {
        result.dev = cleanCommentText(devMatch[1]);
    }

    // Parse @author
    const authorMatches = docComment.match(/@author\s+([^\n]+)/g);
    if (authorMatches) {
        authorMatches.forEach((match) => {
            const authorText = match.replace(/@author\s+/, "").trim();
            // Try to parse email and URL from author text
            // Support formats: "Name <email> (url)" or "Name <email>" or "Name (url)" or just "Name"
            const emailMatch = authorText.match(/<([^>]+)>/);
            const urlMatch = authorText.match(/\(([^)]+)\)/);
            const name = authorText
                .replace(/<[^>]+>/, "")
                .replace(/\([^)]+\)/, "")
                .trim();

            result.authors.push({
                name,
                email: emailMatch?.[1],
                url: urlMatch?.[1],
            });
        });
    }

    // Parse @custom:security
    const securityMatches = docComment.match(
        /@custom:security\s+(.+?)(?=\n\s*[-*]|\n\s*@|\n\s*\*\/|$)/gs
    );
    if (securityMatches) {
        securityMatches.forEach((match) => {
            const text = cleanCommentText(match.replace(/@custom:security\s+/, ""));
            result.security.push(text);
        });
    }

    // Parse @custom:limitations
    const limitMatches = docComment.match(
        /@custom:limitations\s+(.+?)(?=\n\s*[-*]|\n\s*@|\n\s*\*\/|$)/gs
    );
    if (limitMatches) {
        limitMatches.forEach((match) => {
            const text = cleanCommentText(match.replace(/@custom:limitations\s+/, ""));
            result.limitations.push(text);
        });
    }

    // Parse other @custom tags
    const customMatches = docComment.match(/@custom:(\w+)\s+(.+?)(?=\n\s*@|\n\s*\*\/|$)/gs);
    if (customMatches) {
        customMatches.forEach((match) => {
            const tagMatch = match.match(/@custom:(\w+)\s+(.+)/s);
            if (tagMatch && tagMatch[1] !== "security" && tagMatch[1] !== "limitations") {
                const tagName = tagMatch[1];
                const tagValue = cleanCommentText(tagMatch[2]);
                if (!result.customTags[tagName]) {
                    result.customTags[tagName] = [];
                }
                result.customTags[tagName].push(tagValue);
            }
        });
    }

    return result;
}

/**
 * Detect FHE operations used in the contract
 */
function detectFHEOperations(contractContent: string): string[] {
    const concepts: string[] = [];
    const conceptMap = config.taxonomy.concepts;

    for (const [conceptName, operations] of Object.entries(conceptMap)) {
        for (const operation of operations) {
            // Check if the operation is used in the contract
            if (contractContent.includes(operation)) {
                if (!concepts.includes(conceptName)) {
                    concepts.push(conceptName);
                }
            }
        }
    }

    return concepts;
}

/**
 * Extract contract name from Solidity file
 */
function extractContractName(contractContent: string): string {
    // Match contract declaration, excluding abstract contracts and interfaces
    const contractMatch = contractContent.match(/(?:^|\n)\s*contract\s+(\w+)/m);
    return contractMatch ? contractMatch[1] : "";
}

/**
 * Extract constructor arguments from contract
 */
function extractConstructorArgs(contractContent: string): string[] {
    const constructorMatch = contractContent.match(
        /constructor\s*\(([^)]*)\)/
    );

    if (!constructorMatch || !constructorMatch[1].trim()) {
        return [];
    }

    const params = constructorMatch[1].split(",");
    return params.map((param) => {
        const parts = param.trim().split(/\s+/);
        return parts[parts.length - 1]; // Get the parameter name
    });
}

/**
 * Build metadata JSON from contract file
 */
export async function runBuildMetadata(opts: BuildMetadataOptions) {
    try {
        logger.info("Building metadata from contract...");
        logger.debug(`Contract path: ${opts.contractPath}`);

        // Check if contract file exists
        if (!fs.existsSync(opts.contractPath)) {
            logger.error(`Contract file not found: ${opts.contractPath}`);
            return;
        }

        // Read contract content
        const contractContent = fs.readFileSync(opts.contractPath, "utf-8");

        // Parse NatSpec comments
        const natspec = parseNatSpec(contractContent);

        // Detect FHE operations
        const concepts = detectFHEOperations(contractContent);

        // Extract contract name
        const contractName = extractContractName(contractContent);

        // Extract constructor args
        const constructorArgs = extractConstructorArgs(contractContent);

        // Get contract filename
        const contractFilename = path.basename(opts.contractPath);

        // Determine starter name
        const starterName =
            opts.starterName ||
            contractName
                .replace(/([A-Z])/g, "-$1")
                .toLowerCase()
                .replace(/^-/, "");

        // Build metadata object
        const metadata: StarterMetadataType = {
            name: starterName,
            contract_name: contractName,
            contract_filename: contractFilename,
            label: natspec.title || `${contractName} Starter`,
            description: natspec.notice || natspec.dev || "",
            version: "1.0.0",
            fhevm_version: "0.9.1",
            category: opts.category || "fundamental",
            tags: [],
            concepts: concepts,
            chapter: opts.chapter || "basics",
            has_ui: false,
            authors:
                natspec.authors.length > 0
                    ? natspec.authors
                    : [
                        {
                            name: "Unknown",
                            email: "",
                            url: "",
                        },
                    ],
            constructor_args: constructorArgs,
        };

        // Determine output path
        const outputPath = opts.output || path.join(process.cwd(), "metadata.json");

        // Write metadata to file
        fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2), "utf-8");

        logger.success("✓ Metadata generated successfully!");
        logger.info(`Output: ${outputPath}`);

        // Log extracted information
        if (opts.verbose) {
            logger.debug("\nExtracted information:");
            logger.debug(`  Title: ${natspec.title || "(not found)"}`);
            logger.debug(`  Notice: ${natspec.notice || "(not found)"}`);
            logger.debug(
                `  Authors: ${natspec.authors.map((a) => a.name).join(", ") || "(not found)"}`
            );
            logger.debug(`  Concepts detected: ${concepts.join(", ") || "(none)"}`);
            logger.debug(
                `  Constructor args: ${constructorArgs.join(", ") || "(none)"}`
            );
            logger.debug(`  Security notes: ${natspec.security.length} found`);
            logger.debug(`  Limitations: ${natspec.limitations.length} found`);
        }

        // Display metadata preview
        if (opts.json) {
            console.log(JSON.stringify(metadata, null, 2));
        } else {
            logger.info("\nGenerated metadata:");
            logger.info(`  Name: ${metadata.name}`);
            logger.info(`  Contract: ${metadata.contract_name}`);
            logger.info(`  Label: ${metadata.label}`);
            logger.info(`  Category: ${metadata.category}`);
            logger.info(`  Chapter: ${metadata.chapter}`);
            logger.info(`  Concepts: ${metadata.concepts?.join(", ") || "(none)"}`);
        }
    } catch (error) {
        logger.error(`Failed to build metadata: ${error}`);
        throw error;
    }
}

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
function parseContractLevelNatSpec(contractContent: string): {
    title: string;
    notice: string;
    dev: string;
    details: string;
    authors: Array<{ name: string; email?: string; url?: string }>;
    category: string;
    chapter: string;
    tags: string[];
    version: string;
    fhevmVersion: string;
    hasUi: boolean;
    additionalPackages: Array<{ name: string; version: string }>;
    security: string[];
    limitations: string[];
    customTags: Record<string, string[]>;
} {
    const result = {
        title: "",
        notice: "",
        dev: "",
        details: "",
        authors: [] as Array<{ name: string; email?: string; url?: string }>,
        category: "",
        chapter: "",
        tags: [] as string[],
        version: "",
        fhevmVersion: "",
        hasUi: false,
        additionalPackages: [] as Array<{ name: string; version: string }>,
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

    // Parse @dev (first occurrence for general dev notes)
    const devMatch = docComment.match(/@dev\s+(?!Details:)(.+?)(?=\n\s*@|\n\s*\*\/|$)/s);
    if (devMatch) {
        result.dev = cleanCommentText(devMatch[1]);
    }

    // Parse @dev Details: specifically for longer description
    const detailsMatch = docComment.match(/@dev\s+Details:\s*\n([\s\S]*?)(?=\n\s*@dev\s+(?!Details:)|\n\s*@|\n\s*\*\/|$)/);
    if (detailsMatch) {
        result.details = cleanCommentText(detailsMatch[1]);
    }

    // Parse @author - support multiple authors
    const authorMatches = docComment.match(/@author\s+([^\n]+)/g);
    if (authorMatches) {
        let currentAuthorEmail = "";
        let currentAuthorUrl = "";

        // Process all lines sequentially to match @custom:author-* with nearest @author
        const lines = docComment.split("\n");
        let lastAuthorName = "";

        for (const line of lines) {
            const authorMatch = line.match(/@author\s+(.+)/);
            if (authorMatch) {
                // Save previous author if exists
                if (lastAuthorName) {
                    result.authors.push({
                        name: lastAuthorName,
                        email: currentAuthorEmail || undefined,
                        url: currentAuthorUrl || undefined,
                    });
                }

                // Parse inline format: Name <email> (url)
                const authorText = authorMatch[1].trim();
                const emailMatch = authorText.match(/<([^>]+)>/);
                const urlMatch = authorText.match(/\(([^)]+)\)/);
                lastAuthorName = authorText
                    .replace(/<[^>]+>/, "")
                    .replace(/\([^)]+\)/, "")
                    .trim();
                currentAuthorEmail = emailMatch?.[1] || "";
                currentAuthorUrl = urlMatch?.[1] || "";
            }

            const emailTagMatch = line.match(/@custom:author-email\s+(.+)/);
            if (emailTagMatch && lastAuthorName) {
                currentAuthorEmail = emailTagMatch[1].trim();
            }

            const urlTagMatch = line.match(/@custom:author-url\s+(.+)/);
            if (urlTagMatch && lastAuthorName) {
                currentAuthorUrl = urlTagMatch[1].trim();
            }
        }

        // Add last author
        if (lastAuthorName) {
            result.authors.push({
                name: lastAuthorName,
                email: currentAuthorEmail || undefined,
                url: currentAuthorUrl || undefined,
            });
        }
    }

    // Parse @custom:category
    const categoryMatch = docComment.match(/@custom:category\s+(\w+)/);
    if (categoryMatch) {
        result.category = categoryMatch[1];
    }

    // Parse @custom:chapter
    const chapterMatch = docComment.match(/@custom:chapter\s+([\w\-]+)/);
    if (chapterMatch) {
        result.chapter = chapterMatch[1];
    }

    // Parse @custom:tags (comma-separated)
    const tagsMatch = docComment.match(/@custom:tags\s+([^\n]+)/);
    if (tagsMatch) {
        result.tags = tagsMatch[1].split(",").map((t) => t.trim()).filter((t) => t);
    }

    // Parse @custom:version
    const versionMatch = docComment.match(/@custom:version\s+([\d.]+)/);
    if (versionMatch) {
        result.version = versionMatch[1];
    }

    // Parse @custom:fhevm-version
    const fhevmVersionMatch = docComment.match(/@custom:fhevm-version\s+([\d.]+)/);
    if (fhevmVersionMatch) {
        result.fhevmVersion = fhevmVersionMatch[1];
    }

    // Parse @custom:ui (boolean)
    const uiMatch = docComment.match(/@custom:ui\s+(true|false)/i);
    if (uiMatch) {
        result.hasUi = uiMatch[1].toLowerCase() === "true";
    }

    // Parse @custom:additional-pkg
    const pkgMatch = docComment.match(/@custom:additional-pkg\s+([^\n]+)/);
    if (pkgMatch) {
        const packages = pkgMatch[1].split(",").map((p) => p.trim());
        result.additionalPackages = packages.map((pkg) => {
            const parts = pkg.split("@");
            const name = parts.slice(0, -1).join("@");
            const version = parts[parts.length - 1];
            return { name, version: version || "latest" };
        }).filter((p) => p.name);
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
            if (
                tagMatch &&
                !["security", "limitations", "category", "chapter", "tags", "version", "fhevm-version", "ui", "additional-pkg", "author-email", "author-url"].includes(
                    tagMatch[1]
                )
            ) {
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
 * Parse state variables from contract
 */
function parseStateVariables(contractContent: string): Array<{
    name: string;
    type: string;
    visibility?: "public" | "private" | "internal";
    notice?: string;
    dev?: string;
}> {
    const variables: Array<any> = [];

    // Match state variable declarations with optional NatSpec
    // Exclude function returns by checking we're not inside a function or after "returns" keyword
    const varPattern = /(?:\/\/\/\s*@notice\s+([^\n]+)\n)?(?:\/\/\/\s*@dev\s+([^\n]+)\n)?^\s*(euint\d+|uint\d+|int\d+|address|bool|string|bytes\d*|[\w\[\]]+)\s+(public|private|internal)?\s+(\w+);/gm;

    let match;
    while ((match = varPattern.exec(contractContent)) !== null) {
        const type = match[3];
        const visibility = match[4];
        const name = match[5];

        // Skip if this looks like it's in a function (contains "return" before the match)
        const precedingText = contractContent.substring(Math.max(0, match.index - 100), match.index);
        if (precedingText.includes("return") || precedingText.includes("returns")) {
            continue;
        }

        variables.push({
            name,
            type,
            visibility: visibility as any,
            notice: match[1]?.trim(),
            dev: match[2]?.trim(),
        });
    }

    return variables;
}

/**
 * Parse functions from contract
 */
function parseFunctions(contractContent: string): Array<{
    name: string;
    signature: string;
    visibility: "public" | "external" | "internal" | "private";
    state_mutability?: "pure" | "view" | "payable" | "nonpayable";
    notice?: string;
    dev?: string;
    params?: Array<{ name: string; type: string; description?: string }>;
    returns?: Array<{ name?: string; type: string; description?: string }>;
    custom_tags?: Array<{ tag: string; value: string }>;
}> {
    const functions: Array<any> = [];

    // First, remove contract-level NatSpec
    const contractStart = contractContent.search(/contract\s+\w+/);
    const contentInContract = contractStart >= 0 ? contractContent.substring(contractStart) : contractContent;

    // Match functions with their NatSpec comments - limit NatSpec to 500 chars before function
    const functionPattern = /\/\*\*([\s\S]{0,500}?)\*\/\s*function\s+(\w+)\s*\(([\s\S]*?)\)\s*(public|external|internal|private)\s*(pure|view|payable)?\s*(?:returns\s*\(([\s\S]*?)\))?/g;

    let match;
    while ((match = functionPattern.exec(contentInContract)) !== null) {
        const natspec = match[1];
        const name = match[2];
        const paramsStr = match[3];
        const visibility = match[4] as any;
        const stateMutability = match[5] as any;
        const returnsStr = match[6];

        // Parse NatSpec
        const noticeMatch = natspec.match(/@notice\s+([^\n*]+)/);
        const devMatch = natspec.match(/@dev\s+([^\n*]+)/);

        // Parse @param tags
        const params: Array<any> = [];
        const paramMatches = natspec.matchAll(/@param\s+(\w+)\s+([^\n*]+)/g);
        for (const pm of paramMatches) {
            params.push({
                name: pm[1],
                type: "", // Will be filled from signature
                description: pm[2].trim(),
            });
        }

        // Parse @return tags
        const returns: Array<any> = [];
        const returnMatches = natspec.matchAll(/@return\s+(?:(\w+)\s+)?([^\n*]+)/g);
        for (const rm of returnMatches) {
            returns.push({
                name: rm[1] || "",
                type: "", // Will be filled from signature
                description: rm[2].trim(),
            });
        }

        // Parse custom tags (exclude contract-level tags)
        const customTags: Array<{ tag: string; value: string }> = [];
        const customMatches = natspec.matchAll(/@custom:(\w+)\s+([^\n*]+)/g);
        for (const cm of customMatches) {
            // Only include function-specific custom tags
            if (!["category", "chapter", "tags", "version", "fhevm-version", "ui", "additional-pkg", "author-email", "author-url"].includes(cm[1])) {
                customTags.push({
                    tag: cm[1],
                    value: cm[2].trim(),
                });
            }
        }

        functions.push({
            name,
            signature: `${name}(${paramsStr})${returnsStr ? ` returns (${returnsStr})` : ""}`,
            visibility,
            state_mutability: stateMutability,
            notice: noticeMatch?.[1].trim(),
            dev: devMatch?.[1].trim(),
            params: params.length > 0 ? params : undefined,
            returns: returns.length > 0 ? returns : undefined,
            custom_tags: customTags.length > 0 ? customTags : undefined,
        });
    }

    return functions;
}

/**
 * Parse structs from contract
 */
function parseStructs(contractContent: string): Array<{
    name: string;
    notice?: string;
    dev?: string;
    fields?: Array<{ name: string; type: string; notice?: string }>;
}> {
    const structs: Array<any> = [];

    // First, remove contract-level NatSpec by finding the contract definition
    const contractStart = contractContent.search(/contract\s+\w+/);
    const contentInContract = contractStart >= 0 ? contractContent.substring(contractStart) : contractContent;

    // Match struct definitions with optional NatSpec IMMEDIATELY before struct (max 200 chars)
    const structPattern = /(?:\/\*\*([\s\S]{0,200}?)\*\/)?\s*struct\s+(\w+)\s*\{([\s\S]*?)\}/g;

    let match;
    while ((match = structPattern.exec(contentInContract)) !== null) {
        const natspec = match[1] || "";
        const name = match[2];
        const body = match[3];

        const noticeMatch = natspec.match(/@notice\s+([^\n*]+)/);
        const devMatch = natspec.match(/@dev\s+([^\n*]+)/);

        // Parse struct fields
        const fields: Array<any> = [];
        const fieldPattern = /(?:\/\/\/\s*@notice\s+([^\n]+)\n)?\s*([\w\[\]]+)\s+(\w+);/g;
        let fieldMatch;
        while ((fieldMatch = fieldPattern.exec(body)) !== null) {
            fields.push({
                name: fieldMatch[3],
                type: fieldMatch[2],
                notice: fieldMatch[1]?.trim(),
            });
        }

        structs.push({
            name,
            notice: noticeMatch?.[1].trim(),
            dev: devMatch?.[1].trim(),
            fields: fields.length > 0 ? fields : undefined,
        });
    }

    return structs;
}

/**
 * Parse enums from contract
 */
function parseEnums(contractContent: string): Array<{
    name: string;
    notice?: string;
    dev?: string;
    values?: string[];
}> {
    const enums: Array<any> = [];

    // First, remove contract-level NatSpec
    const contractStart = contractContent.search(/contract\s+\w+/);
    const contentInContract = contractStart >= 0 ? contractContent.substring(contractStart) : contractContent;

    // Match enum definitions with optional NatSpec IMMEDIATELY before enum (max 200 chars)
    const enumPattern = /(?:\/\*\*([\s\S]{0,200}?)\*\/|\/\/\/\s*@notice\s+([^\n]+)\n)?\s*enum\s+(\w+)\s*\{([\s\S]*?)\}/g;

    let match;
    while ((match = enumPattern.exec(contentInContract)) !== null) {
        const natspec = match[1] || "";
        const notice = match[2];
        const name = match[3];
        const body = match[4];

        const noticeFromDoc = natspec.match(/@notice\s+([^\n*]+)/);
        const devMatch = natspec.match(/@dev\s+([^\n*]+)/);

        // Parse enum values - remove comments
        const cleanBody = body.replace(/\/\/.*$/gm, ""); // Remove line comments
        const values = cleanBody
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v && v !== "" && !v.startsWith("//"));

        enums.push({
            name,
            notice: notice?.trim() || noticeFromDoc?.[1].trim(),
            dev: devMatch?.[1].trim(),
            values: values.length > 0 ? values : undefined,
        });
    }

    return enums;
}

/**
 * Parse events from contract
 */
function parseEvents(contractContent: string): Array<{
    name: string;
    signature: string;
    notice?: string;
    dev?: string;
    params?: Array<{
        name: string;
        type: string;
        indexed?: boolean;
        description?: string;
    }>;
}> {
    const events: Array<any> = [];

    // First, remove contract-level NatSpec
    const contractStart = contractContent.search(/contract\s+\w+/);
    const contentInContract = contractStart >= 0 ? contractContent.substring(contractStart) : contractContent;

    // Match event definitions with optional NatSpec (max 300 chars before event)
    const eventPattern = /(?:\/\*\*([\s\S]{0,300}?)\*\/)?\s*event\s+(\w+)\s*\(([\s\S]*?)\);/g;

    let match;
    while ((match = eventPattern.exec(contentInContract)) !== null) {
        const natspec = match[1] || "";
        const name = match[2];
        const paramsStr = match[3];

        const noticeMatch = natspec.match(/@notice\s+([^\n*]+)/);
        const devMatch = natspec.match(/@dev\s+([^\n*]+)/);

        // Parse @param tags
        const params: Array<any> = [];
        const paramMatches = natspec.matchAll(/@param\s+(\w+)\s+([^\n]+)/g);
        const paramDescMap = new Map();
        for (const pm of paramMatches) {
            paramDescMap.set(pm[1], pm[2].trim());
        }

        // Parse parameters from signature
        if (paramsStr.trim()) {
            const paramList = paramsStr.split(",");
            for (const param of paramList) {
                const paramMatch = param.trim().match(/(?:(indexed)\s+)?([\w\[\]]+)\s+(\w+)/);
                if (paramMatch) {
                    params.push({
                        name: paramMatch[3],
                        type: paramMatch[2],
                        indexed: paramMatch[1] === "indexed",
                        description: paramDescMap.get(paramMatch[3]),
                    });
                }
            }
        }

        events.push({
            name,
            signature: `${name}(${paramsStr})`,
            notice: noticeMatch?.[1].trim(),
            dev: devMatch?.[1].trim(),
            params: params.length > 0 ? params : undefined,
        });
    }

    return events;
}

/**
 * Parse constructor documentation
 */
function parseConstructorDoc(contractContent: string): {
    notice?: string;
    dev?: string;
    params?: Array<{ name: string; type: string; description?: string }>;
} | undefined {
    // First, remove contract-level NatSpec
    const contractStart = contractContent.search(/contract\s+\w+/);
    const contentInContract = contractStart >= 0 ? contractContent.substring(contractStart) : contractContent;

    // Match constructor with NatSpec (max 400 chars before constructor)
    const constructorPattern = /\/\*\*([\s\S]{0,400}?)\*\/\s*constructor\s*\(([\s\S]*?)\)/;
    const match = contentInContract.match(constructorPattern);

    if (!match) return undefined;

    const natspec = match[1];
    const paramsStr = match[2];

    const noticeMatch = natspec.match(/@notice\s+([^\n*]+)/);
    const devMatch = natspec.match(/@dev\s+([^\n*]+)/);

    // Parse @param tags
    const params: Array<any> = [];
    const paramMatches = natspec.matchAll(/@param\s+(\w+)\s+([^\n]+)/g);
    const paramDescMap = new Map();
    for (const pm of paramMatches) {
        paramDescMap.set(pm[1], pm[2].trim());
    }

    // Parse parameters from signature
    if (paramsStr.trim()) {
        const paramList = paramsStr.split(",");
        for (const param of paramList) {
            const paramMatch = param.trim().match(/([\w\[\]]+)\s+(?:memory\s+|calldata\s+)?(\w+)/);
            if (paramMatch) {
                params.push({
                    name: paramMatch[2],
                    type: paramMatch[1],
                    description: paramDescMap.get(paramMatch[2]),
                });
            }
        }
    }

    return {
        notice: noticeMatch?.[1].trim(),
        dev: devMatch?.[1].trim(),
        params: params.length > 0 ? params : undefined,
    };
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
    const constructorMatch = contractContent.match(/constructor\s*\(([^)]*)\)/);

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

        // Parse contract-level NatSpec comments
        const natspec = parseContractLevelNatSpec(contractContent);

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

        // Parse all code elements
        const stateVariables = parseStateVariables(contractContent);
        const functions = parseFunctions(contractContent);
        const structs = parseStructs(contractContent);
        const enums = parseEnums(contractContent);
        const events = parseEvents(contractContent);
        const constructorDoc = parseConstructorDoc(contractContent);

        // Build metadata object with fallbacks
        const metadata: StarterMetadataType = {
            name: starterName,
            contract_name: contractName,
            contract_filename: contractFilename,
            label: natspec.title || `${contractName} Starter`,
            description: natspec.notice || "",
            details: natspec.details || undefined,
            version: natspec.version || "1.0.0",
            fhevm_version: natspec.fhevmVersion || "0.9.1",
            category: (opts.category || natspec.category || "fundamental") as any,
            tags: natspec.tags.length > 0 ? natspec.tags : undefined,
            concepts: concepts.length > 0 ? (concepts as any[]) : undefined,
            chapter: (opts.chapter || natspec.chapter || "basics") as any,
            has_ui: natspec.hasUi,
            authors:
                natspec.authors.length > 0
                    ? natspec.authors
                    : [{ name: "Unknown", email: undefined, url: undefined }],
            constructor_args: constructorArgs.length > 0 ? constructorArgs : undefined,
            additional_packages:
                natspec.additionalPackages.length > 0
                    ? natspec.additionalPackages
                    : undefined,
            state_variables:
                stateVariables.length > 0 ? stateVariables : undefined,
            functions: functions.length > 0 ? functions : undefined,
            structs: structs.length > 0 ? structs : undefined,
            enums: enums.length > 0 ? enums : undefined,
            events: events.length > 0 ? events : undefined,
            constructor_doc: constructorDoc,
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
            logger.debug(`  Category: ${metadata.category}`);
            logger.debug(`  Chapter: ${metadata.chapter}`);
            logger.debug(`  UI: ${metadata.has_ui}`);
            logger.debug(`  Tags: ${metadata.tags?.join(", ") || "(none)"}`);
            logger.debug(`  Concepts detected: ${concepts.join(", ") || "(none)"}`);
            logger.debug(
                `  Constructor args: ${constructorArgs.join(", ") || "(none)"}`
            );
            logger.debug(`  State variables: ${stateVariables.length} found`);
            logger.debug(`  Functions: ${functions.length} found`);
            logger.debug(`  Structs: ${structs.length} found`);
            logger.debug(`  Enums: ${enums.length} found`);
            logger.debug(`  Events: ${events.length} found`);
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
            logger.info(`  State Variables: ${stateVariables.length}`);
            logger.info(`  Functions: ${functions.length}`);
            logger.info(`  Structs: ${structs.length}`);
            logger.info(`  Enums: ${enums.length}`);
            logger.info(`  Events: ${events.length}`);
        }
    } catch (error) {
        logger.error(`Failed to build metadata: ${error}`);
        throw error;
    }
}

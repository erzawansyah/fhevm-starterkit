import fs from "fs";
import path from "path";
import config from "../../starterkit.config";
import { logger } from "./logger";
import { StarterMetadataType } from "../types/starterMetadata.schema";
import { resolveFrontendTemplateDir, resolveHardhatTemplateDir, resolveOverridesTemplateDir, resolveStarterDir, resolveStarterMetadataFile, resolveStartersDir, resolveUiStarterDir, resolveWorkspaceDir, resolveWorkspaceStarterDir } from "./path-utils";
import { quotePath } from "./utils";

/**
 * Get all available starter project names from the starters directory.
 * @param resolve If true, return absolute paths; otherwise, return names only.
 * @returns Array of starter project names or absolute paths.
 */
export async function getAllStarters(returnAbsolutePaths: boolean = false): Promise<string[]> {
    const baseDir = resolveStartersDir();
    logger.info(`Loading starters from ${baseDir}`);

    // List all directories in starters/
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    const starterDirs = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    if (returnAbsolutePaths) {
        return starterDirs.map((name) => path.join(baseDir, name));
    } else {
        return starterDirs;
    }
}

/**
 * Check if a starter project exists in the starters directory.
 * @param starterName Name of the starter project
 * @returns True if the starter exists; otherwise, false.
 */
export async function checkStarterExists(starterName: string): Promise<boolean> {
    const starterDir = resolveStarterDir(starterName);
    return fs.existsSync(starterDir) && fs.lstatSync(starterDir).isDirectory();
}


/** List all available metadata of a starter project. */
export async function getAllStarterMetadata(): Promise<StarterMetadataType[]> {
    const starterNames = await getAllStarters();
    const allMetadata: StarterMetadataType[] = [];
    for (const name of starterNames) {
        const metadataFile = resolveStarterMetadataFile(name);
        if (fs.existsSync(metadataFile)) {
            const metadataContent = fs.readFileSync(metadataFile, "utf-8");
            const metadata = JSON.parse(metadataContent) as StarterMetadataType;
            if (metadata.name !== name) {
                logger.warning(`Metadata name mismatch for starter: ${name} (found: ${metadata.name})`);
                continue;
            }
            allMetadata.push(metadata);
        } else {
            logger.warning(`Metadata file not found for starter: ${name}`);
        }
    }
    return allMetadata;
}


/**
 * Fetch metadata with specific field from a starter's metadata file.
 * @param starterName Name of the starter project
 * @param field Specific metadata field to retrieve
 * @returns Value of the specified metadata field, or undefined if not found.
 */
export async function getStarterMetadataField(starterName: string, field: string | string[]): Promise<Record<string, any>> {
    const metadataFile = resolveStarterMetadataFile(starterName);
    if (!fs.existsSync(metadataFile)) {
        logger.error(`Metadata file not found for starter: ${starterName}`);
        return {};
    }

    const metadataContent = fs.readFileSync(metadataFile, "utf-8");
    const metadata = JSON.parse(metadataContent) as StarterMetadataType;

    if (Array.isArray(field)) {
        const result: Record<string, any> = {};
        for (const f of field) {
            result[f] = (metadata as any)[f];
        }
        return result;
    } else {
        return { [field]: (metadata as any)[field] };
    }
}


export async function getFilteredStarter(
    field: "category" | "chapter" | "concepts" | "tags",
    values: string
): Promise<string[]> {
    const filter = values.toLowerCase().trim().split(",").map((v) => v.trim())
    // Get all starter metadata
    const data = await getAllStarterMetadata();
    if (field === "category" || field === "chapter") {
        const filteredStarters = data.filter((meta) => {
            const v = (meta as any)[field];
            if (typeof v !== "string") return false;
            return filter.includes(String(v).toLowerCase());
        });
        return filteredStarters.map((meta) => meta.name);
    }
    // For tags and concepts, filter starters that include all specified tags/concepts (case-insensitive)
    const filteredStarters = data.filter((meta) => {
        const itemValues = (meta as any)[field] as string[] | undefined;
        if (!itemValues || !Array.isArray(itemValues)) return false;
        const lowerValues = itemValues.map((x) => String(x).toLowerCase());
        return filter.every((f) => lowerValues.includes(f));
    });
    return filteredStarters.map((meta) => meta.name);
}


/**
 * Copy template to starter
 * 
 * @param targetDir string directory of the target starter project (not absolute path)
 * @param skipUi boolean Whether to skip copying the frontend template or not (default: false)
 */
export function copyTemplateToStarter(targetDir: string, skipUi: boolean = false): void {
    const hardhatTemplate = resolveHardhatTemplateDir(); // /base/hardhat-template
    const frontendTemplate = resolveFrontendTemplateDir() // /base/frontend-template
    const overridesTemplate = resolveOverridesTemplateDir(); // /base/overrides
    const workspaceStarter = resolveWorkspaceStarterDir(targetDir)
    const workspaceUiStarterDir = resolveUiStarterDir(targetDir)
    const actions = config.template.actions;


    // Create workspace/<starter-name> directory if not exists
    if (!fs.existsSync(workspaceStarter)) {
        fs.mkdirSync(workspaceStarter, { recursive: true });
    }

    // Filter function to exclude unwanted directories and files from config
    const excludeDirs = actions.excludeDirs || [];
    const excludeFiles = actions.excludeFiles || [];

    // Create filter function for specific source directory
    const createFilterFunc =
        (sourceDir: string) =>
            (src: string, dest: string): boolean => {
                const absSourceDir = path.resolve(sourceDir);
                const absSrc = path.resolve(src);

                // Normalize relative path (posix style) from source directory
                const relRaw = path.relative(absSourceDir, absSrc);

                // If src is the root itself, always include
                if (!relRaw) return true;

                const rel = relRaw.split(path.sep).join("/"); // Windows-safe to POSIX
                const parts = rel.split("/");

                // Exclude directory names anywhere in the path
                // Example: node_modules/... should be excluded even if it's nested
                if (parts.some((p) => excludeDirs.includes(p))) {
                    return false;
                }

                // Exclude exact relative file path
                // Example: contracts/FHECounter.sol
                if (excludeFiles.includes(rel)) {
                    return false;
                }

                return true;
            };

    // Copy hardhat template
    // from /base/hardhat-template to /workspace/<starter-name>
    logger.info(`Menyalin template Hardhat ke ${quotePath(workspaceStarter)}...`);
    fs.cpSync(hardhatTemplate, workspaceStarter, {
        recursive: true,
        filter: createFilterFunc(hardhatTemplate)
    });

    // Copy overrides (merge into starter directory)
    // from /base/overrides to /workspace/<starter-name>
    logger.info(`Menyalin overrides ke ${quotePath(workspaceStarter)}...`);
    fs.cpSync(overridesTemplate, workspaceStarter, {
        recursive: true,
    });

    // Copy frontend template if not skipped
    if (!skipUi) {
        // from /base/frontend-template to /workspace/<starter-name>/ui
        logger.info(`Menyalin template Frontend ke ${quotePath(workspaceUiStarterDir)}...`);
        const builtUiDir = path.join(frontendTemplate, 'dist');
        fs.cpSync(builtUiDir, workspaceUiStarterDir, {
            recursive: true,
            filter: createFilterFunc(frontendTemplate)
        });
        // Build index.json for frontend (ui/contracts/index.json)
        const indexJsonPath = path.join(workspaceUiStarterDir, 'contracts', 'index.json');
        // Content is array of available starters (e.g. ["basic-defi", "intermediate-nft"])
        const availableStarters = fs.readdirSync(path.join(__dirname, "..", "..", "starters"))
            .filter(name => fs.lstatSync(path.join(__dirname, "..", "..", "starters", name)).isDirectory());
        fs.writeFileSync(indexJsonPath, JSON.stringify(availableStarters, null, 2), 'utf-8');
        logger.info(`Generated ${quotePath(indexJsonPath)} for frontend starter.`);

    }
}

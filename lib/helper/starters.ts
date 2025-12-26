import fs from "fs";
import path from "path";
import config from "../../starterkit.config";
import { logger } from "./logger";
import { StarterMetadataType } from "../types/starterMetadata.schema";

const STARTERS_DIR = config.startersDir;
const WORKSPACE_DIR = config.workingDir;
const METADATA_FILE = config.metadataFile;

/**
 * Resolve the absolute path to the `starters` directory inside the project.
 *
 * This helper centralizes how the script locates the bundled starter templates.
 * @returns Absolute path to the `starters` folder.
 */
export function resolveStartersDir(): string {
    return path.resolve(__dirname, "..", "..", STARTERS_DIR);
}

/**
 * Resolve the absolute path to the working directory where starters will be
 * created.
 * @returns Absolute path to the working directory.
 */
export function resolveWorkspaceDir(): string {
    return path.resolve(__dirname, "..", "..", WORKSPACE_DIR);
}

/**
 * Resolve the absolute path to a metadata file inside the starters directory.
 * 
 * @param starterName Name of the starter project
 * @returns Absolute path to the metadata file 
 */
export function resolveStarterDir(starterName: string): string {
    return path.join(resolveStartersDir(), starterName);
}

/**
 * Resolve the absolute path to a metadata file inside the starters directory.
 * 
 * @param starterName Name of the starter project
 * @returns Absolute path to the metadata file 
 */
export function resolveStarterMetadataFile(starterName: string): string {
    return path.join(resolveStartersDir(), starterName, METADATA_FILE);
}

/**
 * Resolve the absolute path to a destination directory for creating starter(s).
 * @param dir Optional relative path provided by user
 * @returns Absolute path to the destination directory
 */
export function resolveDestinationDir(dir: string): string {
    return path.join(resolveWorkspaceDir(), dir);
}

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

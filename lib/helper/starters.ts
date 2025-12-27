import fs from "fs";
import path from "path";
import config from "../../starterkit.config";
import { logger } from "./logger";
import { StarterMetadataType } from "../types/starterMetadata.schema";
import { resolveFrontendTemplateDir, resolveHardhatTemplateDir, resolveMarkdownTemplateDir, resolveOverridesTemplateDir, resolveStarterDir, resolveStarterMetadataFile, resolveStartersDir, resolveUiStarterDir, resolveWorkspaceStarterDir } from "./path-utils";
import { quotePath, removeLinesFromFile, safeReadJson } from "./utils";
import { renderHbsFile } from "./renderHbs";
import { ReadmeContractEntry, ReadmeTemplateData } from "../types/markdownFile.schema";

type AdditionalPackages = {
    dependencies?: string[];
    devDependencies?: string[];
    scripts?: Record<string, string>;
};

function normalizeScripts(input: unknown): Record<string, string> {
    if (!input || typeof input !== "object") return {};
    const entries = Object.entries(input as Record<string, unknown>).filter(([, v]) => typeof v === "string");
    const out: Record<string, string> = {};
    for (const [k, v] of entries) {
        out[k] = v as string;
    }
    return out;
}

function readGlobalAdditionalPackages(): AdditionalPackages {
    const pkg = config.template.actions.additionalPackages;
    const scripts = normalizeScripts(config.template.actions.additionalScripts);
    return {
        dependencies: Array.isArray(pkg?.dependencies)
            ? pkg?.dependencies.filter(Boolean)
            : [],
        devDependencies: Array.isArray(pkg?.devDependencies)
            ? pkg?.devDependencies.filter(Boolean)
            : [],
        scripts,
    };
}

function readAdditionalPackages(sourceDir: string): AdditionalPackages {
    const manifestPath = path.join(sourceDir, "packages.extra.json");
    if (!fs.existsSync(manifestPath)) return {};

    const parsed = safeReadJson<AdditionalPackages>(manifestPath);
    if (!parsed.ok) {
        logger.warning(`Gagal membaca packages.extra.json di ${quotePath(manifestPath)}: ${parsed.error}`);
        return {};
    }

    const deps = Array.isArray(parsed.data.dependencies)
        ? parsed.data.dependencies.filter(Boolean)
        : [];
    const devDeps = Array.isArray(parsed.data.devDependencies)
        ? parsed.data.devDependencies.filter(Boolean)
        : [];
    const scripts = normalizeScripts(parsed.data.scripts);

    return {
        dependencies: deps,
        devDependencies: devDeps,
        scripts,
    };
}

function parsePackageSpec(spec: string): { name: string; version: string } {
    const trimmed = spec.trim();
    if (!trimmed) return { name: "", version: "" };

    // Scoped package: split on last "@"
    if (trimmed.startsWith("@")) {
        const at = trimmed.lastIndexOf("@");
        if (at > 0) {
            return {
                name: trimmed.slice(0, at),
                version: trimmed.slice(at + 1) || "*",
            };
        }
        return { name: trimmed, version: "*" };
    }

    const at = trimmed.indexOf("@");
    if (at > 0) {
        return {
            name: trimmed.slice(0, at),
            version: trimmed.slice(at + 1) || "*",
        };
    }

    return { name: trimmed, version: "*" };
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
    const filter = values
        .toLowerCase()
        .trim()
        .split(",")
        .map((v) => v.trim());
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
 * Hanlde skipUi option for starter project setup.
 * @param skipUi boolean | undefined
 * @returns boolean
 */
export function handleSkipUi(skipUi: boolean | undefined): void {
    const builtUiDir = path.join(resolveFrontendTemplateDir(), "dist");
    // Jika skipUi true, maka tidak perlu cek dist
    // Jika false atau undefined, maka cek dist
    if (!skipUi) {
        // Check apakah dist direktori ada di frontend template
        if (!fs.existsSync(builtUiDir)) {
            logger.error(`Direktori dist tidak ditemukan di template frontend: ${quotePath(builtUiDir)}`);
            logger.error(`Silakan jalankan ${quotePath("npm start")} atau ${quotePath("npm run template:build-ui")} dari root project terlebih dahulu.`);
            process.exit(1);
        }
    }
}


/**
 * Copy template to starter
 * 
 * @param targetDir string directory of the target starter project (not absolute path)
 * @param skipUi boolean Whether to skip copying the frontend template or not (default: false)
 */
export async function copyTemplateToWorkspace(targetDir: string, skipUi: boolean = false): Promise<void> {
    const hardhatTemplate = resolveHardhatTemplateDir(); // /base/hardhat-template
    const frontendTemplate = resolveFrontendTemplateDir(); // /base/frontend-template
    const overridesTemplate = resolveOverridesTemplateDir(); // /base/overrides
    const workspaceStarter = resolveWorkspaceStarterDir(targetDir);
    const workspaceUiStarterDir = resolveUiStarterDir(targetDir);
    const builtUiDir = path.join(frontendTemplate, "dist");
    const actions = config.template.actions;
    handleSkipUi(skipUi);


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
            (src: string): boolean => {
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

    // Create additional directories
    const createDirs = actions.createDirs || [];
    for (const dirRel of createDirs) {
        const dirPath = path.join(workspaceStarter, dirRel);
        if (!fs.existsSync(dirPath)) {
            logger.info(`Membuat direktori tambahan: ${quotePath(dirPath)}...`);
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    // Create additional files
    const createFiles = actions.createFiles || [];
    for (const file of createFiles) {
        const filePath = path.join(workspaceStarter, file.path);
        logger.info(`Membuat file tambahan: ${quotePath(filePath)}...`);
        fs.writeFileSync(filePath, file.content, { encoding: "utf-8" });
    }

    // Remove unwanted text in specified files
    // In this case, we want to remove `import "./tasks/FHECounter"`,
    // from base/hardhat-template/hardhat.config.ts
    // TODO: Remove hardcoded path. Make it configurable from config file.
    // Menghapus baris di file tertentu
    removeLinesFromFile(
        "base/hardhat-template/hardhat.config.ts",
        "import \"./tasks/FHECounter\"",
        { exact: false }
    );

    // Copy frontend template if not skipped
    if (!skipUi) {
        // from /base/frontend-template to /workspace/<starter-name>/ui
        logger.info(`Menyalin template Frontend ke ${quotePath(workspaceUiStarterDir)}...`);
        fs.cpSync(builtUiDir, workspaceUiStarterDir, {
            recursive: true,
        });
    }
}

/**
 * Copy starter project files to workspace directory.
 * 
 * @param starterName string Name of the starter project
 * @param targetDir string Directory of the target starter project (not absolute path)
 * @param skipUi boolean Whether to skip copying the frontend files or not (default: false)
 */
export async function copyStarterToWorkspace(starterNames: string[], destinationDir: string, skipUi: boolean = false): Promise<void> {
    handleSkipUi(skipUi);
    const targetDir = resolveWorkspaceStarterDir(destinationDir);
    const contractList: {
        slug: string;
        name: string;
        file: string;
    }[] = [];
    const depSet = new Set<string>();
    const devDepSet = new Set<string>();
    const scriptsMap = new Map<string, string>();
    const globalPackages = readGlobalAdditionalPackages();
    globalPackages.dependencies?.forEach((pkg) => depSet.add(pkg));
    globalPackages.devDependencies?.forEach((pkg) => devDepSet.add(pkg));
    if (globalPackages.scripts) {
        Object.entries(globalPackages.scripts).forEach(([k, v]) => scriptsMap.set(k, v));
    }

    // Create workspace/<destinationDir> directory if not exists
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    // Loop through each starter name
    for (const starterName of starterNames) {
        // Get a starter's source directory
        const sourceDir = resolveStarterDir(starterName);
        const sourceReadmeFile = path.join(sourceDir, "README.md"); // ini akan menjadi disimpan ke dalam docs
        const extraPackages = readAdditionalPackages(sourceDir);
        extraPackages.dependencies?.forEach((pkg) => depSet.add(pkg));
        extraPackages.devDependencies?.forEach((pkg) => devDepSet.add(pkg));
        if (extraPackages.scripts) {
            Object.entries(extraPackages.scripts).forEach(([k, v]) => scriptsMap.set(k, v));
        }

        // Copy starters/<starter-name>/contracts to workspace/<destinationDir>/contracts
        const sourceContractsDir = path.join(sourceDir, "contracts");
        const targetContractsDir = path.join(targetDir, "contracts");
        logger.info(`Menyalin contracts dari starter ${quotePath(starterName)} ke ${quotePath(targetContractsDir)}...`);
        fs.cpSync(sourceContractsDir, targetContractsDir, {
            recursive: true,
        });

        // Copy starters/<starter-name>/tests to workspace/<destinationDir>/tests
        const sourceTestsDir = path.join(sourceDir, "test");
        const targetTestsDir = path.join(targetDir, "test");
        logger.info(`Menyalin tests dari starter ${quotePath(starterName)} ke ${quotePath(targetTestsDir)}...`);
        fs.cpSync(sourceTestsDir, targetTestsDir, {
            recursive: true,
        });

        // Jika tidak skipUi, copy metadata ke workspace/<destinationDir>/ui/metadata.json
        if (!skipUi) {
            const sourceMetadataFile = resolveStarterMetadataFile(starterName);
            const targetUiMetadataDir = path.join(targetDir, "ui", "contracts", starterName);
            // Create target ui/<starter-name> directory if not exists
            if (!fs.existsSync(targetUiMetadataDir)) {
                fs.mkdirSync(targetUiMetadataDir, { recursive: true });
            }
            const targetUiMetadataFile = path.join(targetUiMetadataDir, "metadata.json");
            logger.info(`Menyalin metadata ke UI dari starter ${quotePath(starterName)} ke ${quotePath(targetUiMetadataFile)}...`);
            fs.copyFileSync(sourceMetadataFile, targetUiMetadataFile);
        }
        // push to contract list
        contractList.push({
            slug: (await getStarterMetadataField(starterName, "name")).name,
            name: (await getStarterMetadataField(starterName, "contract_name")).contract_name,
            file: (await getStarterMetadataField(starterName, "contract_filename")).contract_filename,
        });


        // Copy README.md to workspace/<destinationDir>/docs/<starter-name>.md
        if (fs.existsSync(sourceReadmeFile)) {
            const targetDocsDir = path.join(targetDir, "docs");
            if (!fs.existsSync(targetDocsDir)) {
                fs.mkdirSync(targetDocsDir, { recursive: true });
            }
            const targetReadmeFile = path.join(targetDocsDir, `${starterName}.md`);
            logger.info(`Menyalin README.md dari starter ${quotePath(starterName)} ke ${quotePath(targetReadmeFile)}...`);
            fs.copyFileSync(sourceReadmeFile, targetReadmeFile);
        }
        // 
    }

    // Copy contractList to workspace/<destinationDir>/contract-list.json
    const contractListFile = path.join(targetDir, "contract-list.json");
    fs.writeFileSync(contractListFile, JSON.stringify(contractList, null, 2), { encoding: "utf-8" });
    logger.info(`✔ Semua starter telah disalin ke workspace/${destinationDir}`);

    const deps = Array.from(depSet);
    const devDeps = Array.from(devDepSet);
    const hasDeps = deps.length > 0;
    const hasDevDeps = devDeps.length > 0;
    const scripts = scriptsMap.size > 0 ? Object.fromEntries(scriptsMap.entries()) : undefined;

    if (hasDeps || hasDevDeps) {
        const pkgPath = path.join(targetDir, "package.json");
        const parsedPkg = safeReadJson<Record<string, unknown>>(pkgPath);
        if (!parsedPkg.ok) {
            logger.warning(`package.json tidak ditemukan/invalid di ${quotePath(pkgPath)}; lewati penambahan deps tambahan.`);
            return;
        }

        const pkgJson = parsedPkg.data as Record<string, unknown>;
        const existingDeps = (pkgJson.dependencies as Record<string, string> | undefined) || {};
        const existingDevDeps = (pkgJson.devDependencies as Record<string, string> | undefined) || {};
        const existingScripts = (pkgJson.scripts as Record<string, string> | undefined) || {};

        const upsert = (target: Record<string, string>, specs: string[]): void => {
            for (const spec of specs) {
                const { name, version } = parsePackageSpec(spec);
                target[name] = version;
            }
        };

        upsert(existingDeps, deps);
        upsert(existingDevDeps, devDeps);
        if (scripts) {
            Object.entries(scripts).forEach(([k, v]) => {
                existingScripts[k] = v;
            });
        }

        const updated = {
            ...pkgJson,
            dependencies: existingDeps,
            devDependencies: existingDevDeps,
            scripts: existingScripts,
        };

        fs.writeFileSync(pkgPath, `${JSON.stringify(updated, null, 2)}\n`, "utf-8");
        logger.success("Paket dan script tambahan telah ditambahkan ke package.json (tanpa install otomatis).");
    }
}


/**
 * Generate readme for workspace/starter projects using the starter's README.md.hbs template.
 * // TODO: Logika ini harus diganti. Begitu juga yang ada di /base/markdown-templates/README.md.hbs
 * 
 * @param fileName string Name of the output readme file (e.g., README.md)
 * @param starterNames string[] List of starter project names to include in the readme
 */
export function generateWorkspaceReadmeFromStarters(fileName: string, destinationDir: string, starterNames: string[]): void {
    const targetDir = resolveWorkspaceStarterDir(destinationDir);
    const markdownTemplateDir = resolveMarkdownTemplateDir();
    const sourceFile = path.join(markdownTemplateDir, fileName);
    if (!fs.existsSync(sourceFile)) {
        logger.error(`Template file ${quotePath(sourceFile)} tidak ditemukan.`);
        return;
    }
    const targetReadmeFile = path.join(targetDir, "README.md");
    let contracts: ReadmeContractEntry[] = [];

    for (const starterName of starterNames) {
        const metadataFile = resolveStarterMetadataFile(starterName);

        if (fs.existsSync(metadataFile)) {
            const raw = fs.readFileSync(metadataFile, "utf-8");
            const metadata = JSON.parse(raw) as StarterMetadataType;
            const docsPath = path.join(targetDir, "docs", `${starterName}.md`);
            const docsLink = fs.existsSync(docsPath)
                ? `[${metadata.label || metadata.contract_name || starterName} Guide](./docs/${starterName}.md)`
                : undefined;

            contracts.push({
                name: metadata.contract_name,
                file: metadata.contract_filename,
                description: metadata.description,
                category: metadata.category,
                chapter: metadata.chapter,
                tags: metadata.tags,
                concepts: metadata.concepts,
                details: metadata.details,
                docs: docsLink,
            });
        } else {
            logger.warning(`Metadata file not found for starter: ${starterName}. README will contain default placeholders.`);
            contracts.push({
                name: starterName,
                file: "contracts/Contract.sol",
                description: "Starter smart contract.",
                details: "This is a placeholder. Update metadata.json to populate contract details.",
            });
        }
    }

    const templateContent = renderHbsFile<ReadmeTemplateData>(sourceFile, {
        workspaceName: destinationDir,
        title: `FHEVM StarterKit Project (${destinationDir.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")})`,
        description: "This project is a self-contained learning unit generated from FHEVM StarterKit.",
        hasFrontend: fs.existsSync(resolveUiStarterDir(destinationDir)),
        contracts,
    });

    fs.writeFileSync(targetReadmeFile, templateContent, { encoding: "utf-8" });
}

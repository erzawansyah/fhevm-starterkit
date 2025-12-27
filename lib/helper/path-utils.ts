import path from "path";
import config from "../../starterkit.config";

const STARTERS_CATALOGUE_DIR = config.startersDir; // dir name of catalogue e.g. 'starters'
const WORKSPACE_DIR = config.workingDir; // dir name of workspace e.g. 'workspace'
const METADATA_FILE = config.metadataFile; // metadata file name e.g. 'metadata.json'
const HARDHAT_TEMPLATE_DIR = config.template.hardhat.dir; // dir name of hardhat template e.g. 'base/hardhat-template'
const FRONTEND_TEMPLATE_DIR = config.template.frontend.dir; // dir name of frontend template e.g. 'base/frontend-template'
const OVERRIDES_TEMPLATE_DIR = config.template.overrides; // dir name of overrides template e.g. 'base/overrides'
const UI_STARTER_DIR = config.starterFrontendDir || "ui"; // dir name of frontend inside each starter e.g. 'ui'
const MARKDOWN_TEMPLATE_DIR = config.template.markdown || "markdown-template"; // markdown template file name e.g. 'README_TEMPLATE.md'

/**
 * Resolve the absolute path to the `starters` directory inside the project.
 *
 * This helper centralizes how the script locates the bundled starter templates.
 * @returns Absolute path to the `starters` folder.
 */
export function resolveStartersDir(): string {
  return path.resolve(__dirname, "..", "..", STARTERS_CATALOGUE_DIR);
}

/**
 * Resolve the absolute path to a all necessary file inside each starter.
 *
 * @param starterName Name of the starter project
 * @returns Absolute path to the all necessary file
 */
export function resolveStarterDir(starterName: string): string {
  return path.join(resolveStartersDir(), starterName);
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
 * Resolve the absolute path to selected starter in workspace directory.
 *
 * @param starterName Name of the starter project
 */
export function resolveWorkspaceStarterDir(starterName: string): string {
  return path.join(resolveWorkspaceDir(), starterName);
}

/**
 * Resolve the absolute path to a metadata file inside the starters directory.
 *
 * @param starterName Name of the starter project
 */
export function resolveStarterMetadataFile(starterName: string): string {
  return path.join(resolveStartersDir(), starterName, METADATA_FILE);
}

/**
 * Resolve the absolute path to a metadata file inside the workspace directory.
 *
 * @param starterName Name of the starter project
 */
export function resolveWorkspaceStarterMetadataFile(
  starterName: string,
): string {
  return path.join(resolveWorkspaceDir(), starterName, METADATA_FILE);
}

/**
 * Resolve the absolute path to the hardhat template directory
 * @returns {string} Absolute path to hardhat template directory
 */
export function resolveHardhatTemplateDir(): string {
  return path.join(__dirname, "..", "..", HARDHAT_TEMPLATE_DIR);
}

/**
 * Resolve the absolute path to the frontend template directory
 * @returns {string} Absolute path to frontend template directory
 */
export function resolveFrontendTemplateDir(): string {
  return path.join(__dirname, "..", "..", FRONTEND_TEMPLATE_DIR);
}

/**
 * Resolve the absolute path to the overrides template directory
 * @returns {string} Absolute path to overrides template directory
 */
export function resolveOverridesTemplateDir(): string {
  return path.join(__dirname, "..", "..", OVERRIDES_TEMPLATE_DIR);
}

/**
 * Resolve the absolute path to the UI starter directory inside a starter workspace.
 *
 * @param starterName Name of the starter project
 */
export function resolveUiStarterDir(starterName: string): string {
  const workspace = resolveWorkspaceDir();
  return path.join(workspace, starterName, UI_STARTER_DIR);
}

/**
 * Resolve the absolute path to the markdown template file
 *
 * @returns {string} Absolute path to markdown template file
 */
export function resolveMarkdownTemplateDir(): string {
  return path.join(__dirname, "..", "..", MARKDOWN_TEMPLATE_DIR);
}

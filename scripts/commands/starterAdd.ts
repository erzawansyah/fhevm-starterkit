/**
 * @path scripts/commands/starterAdd.ts
 * @script npm run starter:add [contract-name]
 * @description Membuat draft starter baru untuk development.
 *
 * What this script does:
 * - Membuat starter template baru di workspace dengan struktur dasar untuk development
 * - Menggunakan template draft yang berisi contract dasar untuk development
 * - Menginisialisasi struktur folder (contracts/, test/, metadata.json, README.md)
 *
 * What this script does NOT do:
 * - Tidak menyalin dari starters/ yang sudah ada
 * - Tidak mengubah isi folder starters/
 */

import { logger } from "../../lib/helper/logger";
import { GlobalOptions } from "../cli";
// import path from "path";
// import fs from "fs";
// import { resolveWorkspaceStarterDir } from "../../lib/helper/path-utils";

// Options for adding a new draft starter
export type StarterAddOptions = GlobalOptions & {
    contractName?: string; // nama contract yang akan dibuat (opsional)
    dir?: string; // destination directory (default: workspace/draft-{timestamp})
    skipUI?: boolean; // skip copying frontend files
    force?: boolean; // overwrite existing files in target directory
};

/**
 * Main function untuk command starter:add
 * 
 * Fungsi ini akan:
 * 1. Membuat struktur folder draft starter
 * 2. Menginisialisasi contract dasar
 * 3. Membuat test boilerplate
 * 4. Generate metadata.json dan README.md
 * 
 * @param opts - Options dari CLI
 */
export async function runStarterAdd(opts: StarterAddOptions) {
    try {
        logger.section("🚀 Starting starter:add command...");

        // TODO: Implement logic here
        // Anda dapat mengisi logicnya di sini

        const targetDir = opts.dir || `draft-${Date.now()}`;
        const contractName = opts.contractName || "DraftContract";

        logger.info(`Contract name: ${contractName}`);
        logger.info(`Target directory: ${targetDir}`);

        // Placeholder: Di sini Anda akan menambahkan logic untuk:
        // 1. Membuat struktur folder
        // 2. Generate contract template
        // 3. Generate test template
        // 4. Generate metadata.json
        // 5. Generate README.md

        logger.success("✅ Draft starter created successfully!");
        logger.info(`📂 Location: ${targetDir}`);
        logger.info("📝 Next steps:");
        logger.info(`   1. Navigate to ${targetDir}`);
        logger.info("   2. Run npm install");
        logger.info("   3. Start developing your contract");

    } catch (error) {
        logger.error("Failed to create draft starter:");
        if (error instanceof Error) {
            logger.error(error.message);
            if (opts.verbose) {
                logger.debug(error.stack || "No stack trace available");
            }
        } else {
            logger.error(String(error));
        }
        process.exit(1);
    }
}

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

import path from "path";
import fs from "fs";
import { logger } from "../../lib/helper/logger";
import { resolveWorkspaceDir } from "../../lib/helper/path-utils";
import { CategoryEnumType, ChapterEnumType, TagsEnumType } from "../../lib/types/starterMetadata.schema";
import { GlobalOptions } from "../cli";
import { prompt } from "enquirer";
import { copyTemplateToWorkspace } from "../../lib/helper/starters";
import { renderHbsFile } from "../../lib/helper/renderHbs";
import { DraftContractMetadata, DraftTestMetadata } from "../../lib/types/markdownFile.schema";

// Options for adding a new draft starter
export type StarterAddOptions = GlobalOptions & {
  contractDir?: string; // direktori contract yang akan dibuat (opsional)
  contractName?: string; // nama contract yang akan dibuat (opsional)
  label?: string; // label untuk contract
  category?: CategoryEnumType; // category draft starter
  chapter?: ChapterEnumType; // chapter draft starter
  tags?: TagsEnumType[]; // tags draft starter
  force?: boolean; // overwrite existing files
};


/**
 * Fungsi untuk merender author name dari package.json, user git config, atau default value
 * 
 **/
async function renderAuthorName(): Promise<string> {
  // Coba ambil dari package.json
  const workspaceDir = resolveWorkspaceDir();
  const packageJsonPath = path.join(workspaceDir, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    if (packageJson.author) {
      if (typeof packageJson.author === "string") {
        return packageJson.author;
      } else if (typeof packageJson.author === "object" && packageJson.author.name) {
        return packageJson.author.name;
      }
    }
  }

  // Coba ambil dari git config
  try {
    const { execSync } = await import("child_process");
    const gitName = execSync("git config user.name", { cwd: workspaceDir }).toString().trim();
    if (gitName) {
      return gitName;
    }
  } catch (error) {
    logger.warning("Could not retrieve author name from git config:", error);
  }

  // Default value
  return "FHEVM Starterkit Developer";

}

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
    logger.info("🚀 Starting starter:add command...");
    const sourceDir = path.resolve(__dirname, "../../base/draft-template");
    const sourceContractFile = path.join(sourceDir, "DraftContract.sol.hbs");
    const sourceTestFile = path.join(sourceDir, "DraftContract.test.ts.hbs");
    const workspaceDir = resolveWorkspaceDir();
    const draftDir = path.join(
      workspaceDir,
      "draft"
    );
    const isEmpty = fs.existsSync(workspaceDir) && fs.readdirSync(workspaceDir).length === 0;
    // Cek apakah draftDir sudah ada
    if (fs.existsSync(draftDir) && !isEmpty) {
      // Jika tidak --force, tampilkan error dan keluar
      if (!opts.force) {
        throw new Error(`Directory ${draftDir} already exists. Use --force to overwrite.`);
      } else {
        logger.warning(`Directory ${draftDir} already exists. Overwriting due to --force option.`);
        const response = await prompt<{ continue: boolean }>({
          type: "confirm",
          name: "continue",
          message: `Are you sure you want to overwrite the existing directory ${draftDir}?`,
          initial: false,
        });
        if (!response.continue) {
          throw new Error("Operation cancelled by user.");
        } else {
          // Jangan hapus folder; cukup timpa file-file yang relevan
          logger.warning(
            `Overwriting files in ${draftDir} due to --force option (no deletion).`,
          );
          // Lanjutkan proses: penyalinan template dan penulisan file akan menimpa yang ada
        }
      }
    }

    // Copy base template draft starter
    logger.section("Copying draft starter template...");
    await copyTemplateToWorkspace("draft", false);
    logger.success("✅ Base template copied.");


    const contractContent = renderHbsFile<DraftContractMetadata>(sourceContractFile, {
      contractDir: opts.contractDir || "draft-contract",
      contractName: opts.contractName || "DraftContract",
      contractLabel: opts.label ? opts.label : (opts.contractDir ? opts.contractDir.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ") : "Draft Contract"),
      authorName: await renderAuthorName(),
      category: opts.category || "fundamental",
      chapter: opts.chapter || "basics",
      tags: opts.tags || ["fhe", "basic", "draft"],
    });

    const testContent = renderHbsFile<DraftTestMetadata>(sourceTestFile, {
      starterId: opts.contractDir || "draft-contract",
      contractName: opts.contractName || "DraftContract",
      testGoal: "Memastikan fungsi dasar contract berjalan sesuai harapan.",
      scenarioName: "Dasar FHEVM",
      scenarioDescription: "Pengujian fungsi dasar pada contract FHEVM.",
      testCaseName: "Inisialisasi dan Penyimpanan Nilai",
      testCaseDescription: "Memastikan contract dapat diinisialisasi dan menyimpan nilai terenkripsi dengan benar.",
    });

    // Tulis contract yang sudah dirender ke folder draft/contracts/
    logger.section("Creating draft contract file...");
    const targetContractDir = path.join(draftDir, "contracts");
    fs.mkdirSync(targetContractDir, { recursive: true });
    const contractFileName = opts.contractName ? `${opts.contractName}.sol` : "DraftContract.sol";
    fs.writeFileSync(path.join(targetContractDir, contractFileName), contractContent, { encoding: "utf-8" });
    logger.success(`✅ Draft contract ${contractFileName} created.`);

    // Tulis test yang sudah dirender ke folder draft/test/
    logger.section("Creating draft test file...");
    const targetTestDir = path.join(draftDir, "test");
    fs.mkdirSync(targetTestDir, { recursive: true });
    const testFileName = opts.contractName ? `${opts.contractName}.test.ts` : "DraftContract.test.ts";
    fs.writeFileSync(path.join(targetTestDir, testFileName), testContent, { encoding: "utf-8" });
    logger.success(`✅ Draft test ${testFileName} created.`);

    logger.success("🎉 Draft starter created successfully!");

    logger.section("Next Steps:");
    logger.info(`- Navigate to your draft starter: cd ${path.relative(process.cwd(), draftDir)}`);
    logger.info("- Start developing your FHEVM contract!");
    logger.info("- Run tests with: npx hardhat test");

    // Ganti contract-list.json untuk menambahkan draft starter
    const existingContractListPath = path.join(workspaceDir, "draft", "contract-list.json");
    console.log("Updating contract-list.json to include the new draft starter...");
    console.log(`Path to contract-list.json: ${existingContractListPath}`);


    if (fs.existsSync(existingContractListPath)) {
      fs.writeFileSync(existingContractListPath, JSON.stringify([{
        file: opts.contractName ? `${opts.contractName}.sol` : "DraftContract.sol",
        name: opts.contractName || "DraftContract",
        slug: opts.contractDir || "draft-contract",
      }]));
    }
  } catch (error) {
    logger.error("❌ Error in starter:add command:", error);
    process.exit(1);
  }
}

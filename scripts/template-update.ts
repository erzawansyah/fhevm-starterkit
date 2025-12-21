// scripts/template-update.ts
// @script `npm run template-update`
// Script untuk memperbarui template FHEVM Hardhat yang sudah ada

import fs from "fs";
import path from "path";
import { quotePath, run } from "./helper/utils";
import { execSync } from "child_process";
import { logger } from "./helper/logger";
import config from "../starterkit.config";

const HARDHAT_TEMPLATE_REPO = config.template.hardhat.repo;
const HARDHAT_TARGET_DIR = config.template.hardhat.dir;
const HARDHAT_TEMPLATE_COMMITHASH = config.template.hardhat.commit;

const FRONTEND_TEMPLATE_REPO = config.template.frontend.repo;
const FRONTEND_TARGET_DIR = config.template.frontend.dir;
const FRONTEND_TEMPLATE_COMMITHASH = config.template.frontend.commit;

// Update hanya bisa dijalankan apabila template sudah diinisialisasi
function ensureTemplateInitialized() {
  logger.info("Memeriksa apakah template sudah diinisialisasi...");
  if (
    !fs.existsSync(HARDHAT_TARGET_DIR) ||
    !fs.existsSync(FRONTEND_TARGET_DIR)
  ) {
    logger.error(
      "Template belum diinisialisasi! Jalankan `npm run template:init` terlebih dahulu."
    );
    process.exit(1);
  }
  logger.info("Template sudah diinisialisasi.");
}

// Cari commit hash terbaru dari remote repository
async function getLatestCommitHash(repo: string, branch: string = "main") {
  logger.info(
    `Mengambil commit hash terbaru dari ${repo} (branch: ${branch})...`
  );
  const tempDir = path.join(__dirname, "temp-repo");
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  await run(
    `git clone --depth 1 --branch ${branch} ${quotePath(repo)} ${quotePath(
      tempDir
    )}`
  );
  // capture the commit hash output directly to avoid run() returning undefined
  const commitOutput = execSync("git rev-parse HEAD", {
    cwd: tempDir,
  }).toString();
  const commitHash = commitOutput.trim();
  fs.rmSync(tempDir, { recursive: true, force: true });
  return commitHash;
}

// Perbarui template Hardhat
async function updateHardhatTemplate() {
  logger.info("Memperbarui template Hardhat...");
  const latestCommitHash = await getLatestCommitHash(
    HARDHAT_TEMPLATE_REPO,
    "main"
  );
  if (latestCommitHash === HARDHAT_TEMPLATE_COMMITHASH) {
    logger.info(
      "Template Hardhat sudah terbaru. Tidak ada yang perlu diperbarui."
    );
    return;
  }
  logger.info(
    `Checkout template Hardhat ke commit terbaru ${latestCommitHash}...`
  );
  await run(
    `cd ${quotePath(
      HARDHAT_TARGET_DIR
    )} && git fetch && git checkout ${latestCommitHash}`
  );
  logger.success("Template Hardhat berhasil diperbarui.");
}

// Perbarui template Frontend
async function updateFrontendTemplate() {
  logger.info("Memperbarui template Frontend...");
  const latestCommitHash = await getLatestCommitHash(
    FRONTEND_TEMPLATE_REPO,
    "main"
  );
  if (latestCommitHash === FRONTEND_TEMPLATE_COMMITHASH) {
    logger.info(
      "Template Frontend sudah terbaru. Tidak ada yang perlu diperbarui."
    );
    return;
  }
  logger.info(
    `Checkout template Frontend ke commit terbaru ${latestCommitHash}...`
  );
  await run(
    `cd ${quotePath(
      FRONTEND_TARGET_DIR
    )} && git fetch && git checkout ${latestCommitHash}`
  );
  logger.success("Template Frontend berhasil diperbarui.");
}

// Eksekusi pembaruan template
async function main() {
  ensureTemplateInitialized();
  try {
    await updateHardhatTemplate();
    await updateFrontendTemplate();
    logger.success("Pembaruan template selesai.");
  } catch (error) {
    logger.error("Terjadi kesalahan saat memperbarui template:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Jalankan skrip utama
if (require.main === module) {
  main().catch((error) => {
    logger.error("Terjadi kesalahan tak terduga:", error);
    process.exit(1);
  });
}

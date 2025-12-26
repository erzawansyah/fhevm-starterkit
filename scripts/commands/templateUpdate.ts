/**
 * @path scripts/commands/templateUpdate.ts
 * @script `npm run template:update`
 * @description Script untuk memperbarui template FHEVM Hardhat dan Frontend di dalam folder ./base
 *
 * What actually does this script do?
 * - Memperbarui template Hardhat dan Frontend di dalam folder ./base ke versi terbaru dari branch utama repositori masing-masing
 * - Memastikan template sudah diinisialisasi sebelum memperbarui
 * - Menyediakan satu parameter yang bisa ditambahkan di masa mendatang
 */

import fs from "fs";
import { execSync } from "child_process";
import { stdin as input, stdout as output } from "process";

import config from "../../starterkit.config";
import { logger } from "../../lib/helper/logger";
import {
  quotePath,
  run,
  getRemoteHeadCommitHash,
  checkoutRepoCommit,
} from "../../lib/helper/utils";
import { GlobalOptions } from "../cli";
import { prompt } from "enquirer";

// Inisialisasi konstanta untuk repositori template dan direktori target
const HARDHAT_TEMPLATE_REPO = config.template.hardhat.repo;
const HARDHAT_TARGET_DIR = config.template.hardhat.dir;
const HARDHAT_TEMPLATE_COMMITHASH = config.template.hardhat.commit;
const FRONTEND_TEMPLATE_REPO = config.template.frontend.repo;
const FRONTEND_TARGET_DIR = config.template.frontend.dir;
const FRONTEND_TEMPLATE_COMMITHASH = config.template.frontend.commit;

// Type untuk opsi pembaruan template
type TemplateUpdateOptions = {
  // Jika di masa mendatang akan ada parameter tambahan, bisa ditambahkan di sini
} & GlobalOptions;

/**
 * Fungsi untuk memastikan template sudah diinisialisasi.
 * Jika belum, hentikan proses dengan pesan error.
 * @returns void
 */
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

/**
 * Fungsi untuk mendapatkan commit hash dari remote HEAD sebuah repositori git.
 * @param repo Repositori git
 * @param branch Branch yang ingin diambil commit HEAD-nya (default: "main")
 * @returns string Commit hash dari remote HEAD
 */
// git helpers (getRemoteHeadCommitHash, checkoutRepoCommit) moved to lib/helper/utils

/**
 * Fungsi untuk memperbarui template di direktori target ke commit tertentu.
 * @param params Parameter untuk pembaruan template
 * @returns Promise<void>
 */
async function updateTemplate(params: {
  label: string;
  repo: string;
  targetDir: string;
  pinnedCommit?: string;
  branch?: string;
  verbose?: boolean;
}) {
  const { label, repo, targetDir, branch = "main", verbose = true } = params;

  logger.info(`Memperbarui template ${label}...`);

  // Ambil commit target dari remote
  const targetCommit = getRemoteHeadCommitHash(repo, branch);

  // Ambil commit saat ini di local (kalau repo valid)
  let currentCommit = "";
  try {
    currentCommit = execSync("git rev-parse HEAD", { cwd: targetDir })
      .toString()
      .trim();
  } catch {
    // kalau folder bukan repo git yang valid, biarkan kosong
  }

  // Kalau tidak ada target commit, hentikan proses dengan error
  if (!targetCommit) {
    // Cek apakah pinnedCommit dengan currentCommit sama
    // Kalau sama, berarti sudah up-to-date
    // Kalau tidak, berarti ada masalah

    if (params.pinnedCommit && currentCommit === params.pinnedCommit) {
      logger.info(
        `Template ${label} sudah di commit pinned. Tidak ada yang perlu diperbarui.`
      );
      return;
    }

    if (params.pinnedCommit && params.pinnedCommit !== currentCommit) {
      logger.warning(
        `Template ${label} tidak memiliki commit target, tetapi commit saat ini berbeda dari commit pinned. Cek konfigurasi starterkit.`
      );
      process.exit(1);
    }

    logger.warning(
      `Tidak ada commit target untuk template ${label}. Cek config starterkit.`
    );
    process.exit(1);
  }

  if (currentCommit && currentCommit === targetCommit) {
    logger.info(
      `Template ${label} sudah di commit target. Tidak ada yang perlu diperbarui.`
    );
    return;
  }

  logger.info(`Checkout template ${label} ke commit ${targetCommit}...`);
  await checkoutRepoCommit(targetDir, targetCommit, !!verbose);

  logger.success(`Template ${label} berhasil diperbarui.`);
}

// Confirm update
async function confirmUpdate(): Promise<boolean> {
  const answer = await prompt({
    type: "confirm",
    name: "confirmation",
    message:
      "Apakah Anda yakin ingin memperbarui template ke versi terbaru dari repositori resmi? (perubahan lokal akan hilang)",
    initial: false,
  }) as { confirmation: boolean };

  return answer.confirmation;
}

export async function runTemplateUpdate(input: TemplateUpdateOptions) {
  if (input.verbose)
    logger.info(`[debug] template:update ${JSON.stringify(input)}`);

  logger.info("▶ template:update");

  const userConfirmed = await confirmUpdate();
  if (!userConfirmed) {
    logger.warning("Operasi pembaruan dibatalkan oleh user.");
    return;
  }

  // Pastikan template sudah diinisialisasi
  // Exit jika belum diinisialisasi
  ensureTemplateInitialized();

  try {
    await updateTemplate({
      label: "Hardhat",
      repo: HARDHAT_TEMPLATE_REPO,
      targetDir: HARDHAT_TARGET_DIR,
      pinnedCommit: HARDHAT_TEMPLATE_COMMITHASH,
      branch: "main",
      verbose: !!input.verbose,
    });

    await updateTemplate({
      label: "Frontend",
      repo: FRONTEND_TEMPLATE_REPO,
      targetDir: FRONTEND_TARGET_DIR,
      pinnedCommit: FRONTEND_TEMPLATE_COMMITHASH,
      branch: "main",
      verbose: !!input.verbose,
    });

    logger.success("Pembaruan template selesai.");
  } catch (error) {
    logger.error("Terjadi kesalahan saat memperbarui template:", error);
    process.exit(1);
  }
}

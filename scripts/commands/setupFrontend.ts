/**
 * @path scripts/commands/setupFrontend.ts
 * @script `npm run setup:frontend`
 * @description Script untuk menyiapkan (setup) template Frontend di dalam folder ./base/frontend-template
 *
 * What actually does this script do?
 * - Memastikan template Frontend sudah di-clone ke dalam folder ./base/frontend-template
 * - Memastikan .env.local sudah dibuat di dalam folder frontend-template (copy dari .env.local di root)
 * - Menjalankan `npm install` untuk menginstal dependensi yang diperlukan
 * - Menjalankan `npm run build` untuk membangun (build) aplikasi frontend
 * - Setelah selesai, frontend siap digunakan di dalam starter kit
 */

import fs from "fs";
import path from "path";
import { logger } from "../../lib/helper/logger";
import { quotePath, run } from "../../lib/helper/utils";
import config from "../../starterkit.config";
import { GlobalOptions } from "../cli";

const FRONTEND_TARGET_DIR = config.template.frontend.dir;
const FRONTEND_ENV_SOURCE = path.join(process.cwd(), ".env.local");
const FRONTEND_ENV_TARGET = path.join(FRONTEND_TARGET_DIR, ".env.local");

export async function runSetupFrontend(opts: GlobalOptions) {
  // Cek apakah template frontend sudah di-clone
  if (!fs.existsSync(FRONTEND_TARGET_DIR)) {
    logger.error(
      `Template frontend tidak ditemukan di ${quotePath(
        FRONTEND_TARGET_DIR
      )}. Jalankan template:init terlebih dahulu.`
    );
    process.exit(1);
  }

  // Cek apakah .env.local sudah ada di dalam template frontend dan bukan file kosong
  if (!fs.existsSync(FRONTEND_ENV_SOURCE)) {
    logger.error(
      `File .env.local tidak ditemukan di ${quotePath(
        FRONTEND_ENV_SOURCE
      )}. Silakan buat file .env.local di root project terlebih dahulu.`
    );
    process.exit(1);
  }

  // Salin .env.local ke dalam folder template frontend
  fs.copyFileSync(FRONTEND_ENV_SOURCE, FRONTEND_ENV_TARGET);
  logger.info(`Menyalin .env.local ke ${quotePath(FRONTEND_ENV_TARGET)}...`);

  // Jalankan npm install di dalam folder template frontend
  logger.info("Menjalankan npm install di dalam template frontend...");
  logger.loading("Menginstal dependensi...");

  logger.info(`Menjalankan npm install di dalam template frontend...`);
  logger.loading("Menginstal dependensi... (Bisa memakan waktu beberapa menit)");
  await run(`npm install`, {
    cwd: FRONTEND_TARGET_DIR,
    silent: !opts.verbose,
  });
  logger.success("Dependensi frontend berhasil diinstal.");

  // Jalankan npm run build di dalam folder template frontend
  logger.info("Menjalankan npm run build di dalam template frontend...");
  logger.loading("Membangun aplikasi frontend... (Bisa memakan waktu beberapa menit)");
  await run(`npm run build`, {
    cwd: FRONTEND_TARGET_DIR,
    silent: !opts.verbose,
  });
  // Remove node_modules installed to reduce size
  const nodeModulesPath = path.join(FRONTEND_TARGET_DIR, "node_modules");
  if (fs.existsSync(nodeModulesPath)) {
    logger.info("Menghapus folder node_modules untuk mengurangi ukuran...");
    logger.loading("Membersihkan node_modules...");
    fs.rmSync(nodeModulesPath, { recursive: true, force: true });
  }
  logger.success("Aplikasi frontend berhasil dibangun dan siap digunakan.");
}

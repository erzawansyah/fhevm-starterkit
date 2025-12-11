// scripts/template-init.ts
// @script `npm run template-init`
// Script untuk menginisialisasi template FHEVM Hardhat ke dalam proyek

import fs from "fs";
import path from "path";
import { logger } from "./helper/logger";
import { quotePath, run } from "./helper/utils";
const config = require("../starterkit.config");

// Konfigurasi template dari starterkit.config
const TEMPLATE_REPO: string = config.template.fhevmHardhat.repo; // URL repository template
const TEMPLATE_DIR = path.join(
  __dirname,
  "..",
  config.template.fhevmHardhat.dir
); // Direktori tujuan template
const UPDATE_SCRIPT: string = config.template.updateScript; // Script untuk update template
const EXCLUDED_SCRIPT_FILES: string[] =
  config.template.excludedScriptFiles || []; // File script yang tidak perlu dicopy // File script yang tidak perlu dicopy

/**
 * Memeriksa apakah direktori kosong atau tidak ada
 * @param dir - Path direktori yang akan diperiksa
 * @returns true jika direktori tidak ada atau kosong
 */
function isEmptyDir(dir: string) {
  if (!fs.existsSync(dir)) return true; // Direktori tidak ada
  const files = fs.readdirSync(dir); // Baca semua file dalam direktori
  return files.length === 0; // Return true jika tidak ada file
}

/**
 * Menyalin file-file script dari direktori scripts ke dalam direktori template
 * Hanya menyalin file .ts dan .js yang tidak ada dalam daftar excluded
 */
function copyScripts() {
  logger.info("Copying scripts into template directory...");

  const SCRIPTS_DIR = __dirname; // Direktori scripts saat ini
  const scriptFiles = fs.readdirSync(SCRIPTS_DIR); // Baca semua file dalam direktori scripts

  // Loop setiap file dalam direktori scripts
  scriptFiles.forEach((file) => {
    const ext = path.extname(file); // Ambil ekstensi file
    const base = path.basename(file); // Ambil nama file

    // Cek apakah file adalah TypeScript atau JavaScript dan tidak dalam daftar excluded
    if (
      (ext === ".ts" || ext === ".js") &&
      !EXCLUDED_SCRIPT_FILES.includes(base)
    ) {
      const srcPath = path.join(SCRIPTS_DIR, file); // Path sumber
      const destPath = path.join(TEMPLATE_DIR, file); // Path tujuan

      fs.copyFileSync(srcPath, destPath); // Salin file
      logger.success(`  ✓ ${file} -> ${config.template.dir}/${file}`);
    }
  });
}

/**
 * Fungsi utama yang menjalankan alur inisialisasi template
 * Alur:
 * 1. Cek apakah direktori template ada
 * 2. Jika tidak ada atau kosong -> clone template baru
 * 3. Jika sudah ada dan berisi -> update template yang ada
 * 4. Setelah itu, copy script-script ke dalam template
 */
function main() {
  // Template Initialization
  logger.section("🚀 Template Initialization");
  logger.info("Running template-init...");

  // Cek 1: Apakah direktori template ada?
  if (!fs.existsSync(TEMPLATE_DIR)) {
    logger.warning("Template folder not found. Cloning fresh copy...");
    logger.info("Cloning FHEVM Hardhat Template...");
    // Jalankan perintah git clone untuk mengunduh template
    run(`git clone ${TEMPLATE_REPO} ${quotePath(TEMPLATE_DIR)}`);
    logger.success("Clone complete.");
    copyScripts(); // Copy scripts ke template
    return;
  }

  // Cek 2: Apakah direktori template kosong?
  if (isEmptyDir(TEMPLATE_DIR)) {
    logger.warning("Template folder is empty. Cloning fresh copy...");
    logger.info("Cloning FHEVM Hardhat Template...");
    // Jalankan perintah git clone untuk mengunduh template
    run(`git clone ${TEMPLATE_REPO} ${quotePath(TEMPLATE_DIR)}`);
    logger.success("Clone complete.");
    copyScripts(); // Copy scripts ke template
    return;
  }

  // Jika template sudah ada dan tidak kosong
  logger.info("Template exists. Running template update script...");
  // Jalankan script npm untuk update template (biasanya git pull)
  run(`npm run ${UPDATE_SCRIPT}`);

  copyScripts(); // Copy scripts ke template
}

// Jalankan fungsi utama
main();

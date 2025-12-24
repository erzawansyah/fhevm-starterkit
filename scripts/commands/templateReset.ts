/**
 * @path scripts/commands/templateReset.ts
 * @script `npm run template:reset`
 * @description Script untuk mengosongkan template FHEVM Hardhat dan Frontend dari folder ./base
 *
 * What actually does this script do?
 * - Mengecek apakah folder ./base/hardhat dan ./base/frontend exist dan tidak kosong
 * - Jika ada isinya, meminta konfirmasi dari user untuk mengosongkan folder tersebut
 * - Jika user mengonfirmasi, mengosongkan isi folder ./base/hardhat dan ./base/frontend
 * - Jika user tidak mengonfirmasi, membatalkan operasi
 * - Jika folder sudah kosong, memberitahu user bahwa tidak ada yang perlu dihapus
 * - Menyediakan satu parameter yang bisa digunakan:
 * - --yes: Melewati konfirmasi dan langsung mengosongkan folder
 */

import fs from "fs";
import path from "path";
import readline from "readline/promises";
import config from "../../starterkit.config";
import { logger } from "../../lib/helper/logger";
import { GlobalOptions } from "../cli";

// Inisialisasi konstanta direktori template dari konfigurasi
const HARDHAT_TARGET_DIR = config.template.hardhat.dir;
const FRONTEND_TARGET_DIR = config.template.frontend.dir;

type TemplateResetOptions = {
  yes: boolean;
} & GlobalOptions;

/**
 * Fungsi untuk mengosongkan isi sebuah direktori tanpa menghapus direktori itu sendiri.
 * @param dir Direktori yang akan dikosongkan
 * @returns null
 */
function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Directory did not exist, created: ${dir}`);
    return;
  }

  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const entryPath = path.join(dir, entry);
    try {
      const stat = fs.lstatSync(entryPath);
      if (stat.isDirectory()) {
        fs.rmSync(entryPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(entryPath);
      }
    } catch (err) {
      logger.info(`Failed to remove ${entryPath}: ${String(err)}`);
    }
  }

  logger.info(`Emptied directory contents: ${dir}`);
}

/**
 * Fungsi untuk mengecek apakah folder ./base/hardhat dan ./base/frontend exist dan tidak kosong
 * @returns boolean
 */
function baseTemplatesExist(): boolean {
  const hardhatExists =
    fs.existsSync(HARDHAT_TARGET_DIR) &&
    fs.readdirSync(HARDHAT_TARGET_DIR).length > 0;
  const frontendExists =
    fs.existsSync(FRONTEND_TARGET_DIR) &&
    fs.readdirSync(FRONTEND_TARGET_DIR).length > 0;
  return hardhatExists || frontendExists;
}

/**
 * Fungsi utama untuk menjalankan perintah template:reset
 * @param input Opsi input dari CLI. Harus berisi properti 'yes' untuk konfirmasi penghapusan.
 */
export async function runTemplateReset(input: TemplateResetOptions) {
  if (input.verbose) {
    logger.info(`[debug] template:reset ${JSON.stringify(input)}`);
  }

  if (!baseTemplatesExist()) {
    logger.info("Folder ./base sudah kosong. Tidak ada yang perlu dihapus.");
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  if (!input.yes) {
    const answer = await rl.question(
      `Anda yakin ingin menghapus semua template di dari folder base berikut?
- ${HARDHAT_TARGET_DIR}
- ${FRONTEND_TARGET_DIR}
Ini TIDAK DAPAT DIBATALKAN! (type 'yes' or 'y' to confirm): `
    );
    if (answer.toLowerCase() !== "yes" && answer.toLowerCase() !== "y") {
      logger.warning("Operasi dibatalkan oleh user.");
      rl.close();
      return;
    }
  }
  rl.close();

  logger.info("Mengosongkan folder ./base...");
  emptyDir(HARDHAT_TARGET_DIR);
  emptyDir(FRONTEND_TARGET_DIR);
  logger.info("Semua template di folder ./base telah dihapus.");

  // Tanyakan ke user untuk konfirmasi penghapusan. Jika user memilih 'yes' atau 'Y', lanjutkan.
}

/**
 * @path scripts/commands/templateInit.ts
 * @script `npm run template:init`
 * @description Script untuk menginisialisasi template FHEVM Hardhat dan Frontend ke dalam folder ./base
 *
 * What actually does this script do?
 * - Mengkloning template Hardhat dan Frontend dari repositori yang ditentukan ke dalam folder ./base
 * - Secara default, checkout ke commit pinned untuk memastikan konsistensi (berdasarkan hash commit di starterkit.config)
 * - Menyediakan dua parameter yang bisa digunakan:
 * - --latest: Melewati checkout ke commit pinned dan menggunakan versi terbaru dari branch utama
 * - --force: Mengosongkan folder ./base jika sudah ada isinya sebelum mengkloning template
 */

import fs from "fs";

import config from "../../starterkit.config";
import { logger } from "../../lib/helper/logger";
import { quotePath, run, isEmptyDir, emptyDir } from "../../lib/helper/utils";
import { GlobalOptions } from "../cli";
import { prompt } from "enquirer";

// Skrip CLI untuk clone template Hardhat & frontend ke ./base dengan opsi pinned commit atau latest.
const HARDHAT_TEMPLATE_REPO = config.template.hardhat.repo;
const HARDHAT_TARGET_DIR = config.template.hardhat.dir;
const HARDHAT_TEMPLATE_COMMITHASH = config.template.hardhat.commit;

const FRONTEND_TEMPLATE_REPO = config.template.frontend.repo;
const FRONTEND_TARGET_DIR = config.template.frontend.dir;
const FRONTEND_TEMPLATE_COMMITHASH = config.template.frontend.commit;

type TemplateInitOptions = {
  latest: boolean;
  force: boolean;
} & GlobalOptions;

/**
 * Fungsi untuk menghapus semua isi dalam sebuah direktori tanpa menghapus direktori itu sendiri.
 * @param dir Direktori yang akan dihapus isinya
 * @returns void
 */
/**
 * Fungsi untuk memastikan sebuah direktori kosong atau membuatnya baru.
 * @param dir Direktori yang akan dipastikan kosong atau dibuat baru
 * @param force Jika true, akan mengosongkan direktori jika tidak kosong
 * @returns void
 */
function ensureEmptyDir(dir: string, force: boolean) {
  logger.info(`Cek apakah direktori target ${dir} siap digunakan...`);

  if (!fs.existsSync(dir)) {
    logger.info(`Membuat direktori target ${dir}...`);
    fs.mkdirSync(dir, { recursive: true });
    return;
  }

  if (isEmptyDir(dir)) return;

  if (!force) {
    logger.error(`Direktori target ${dir} tidak kosong!`);
    logger.error(
      "Hapus isi direktori tersebut dan coba lagi, atau jalankan ulang dengan flag --force.",
    );
    process.exit(1);
  }

  logger.warning(
    `Direktori target ${dir} tidak kosong. --force aktif, mengosongkan isi direktori...`,
  );
  emptyDir(dir);
}

/**
 * Fungsi untuk mengonfirmasi dari user apakah ingin melanjutkan dengan mode latest
 * @returns boolean Apakah user mengonfirmasi untuk melanjutkan dengan mode latest
 */
async function confirmLatestMode(): Promise<boolean> {
  const answer = await prompt<{ confirmLatest: boolean }>({
    type: "confirm",
    name: "confirmLatest",
    message:
      "Anda memilih --latest. Menggunakan template versi latest bisa menyebabkan\nperbedaan hasil dan konflik saat update. Lanjutkan tanpa checkout ke commit pinned?",
    initial: false,
  });
  return answer.confirmLatest;
}

// Kloning repositori template dengan opsi checkout commit pinned atau tidak
async function cloneRepo(params: {
  repo: string;
  targetDir: string;
  pinnedCommit?: string;
  skipCheckout: boolean;
  force: boolean;
  label: string;
  verbose?: boolean;
}) {
  const { repo, targetDir, pinnedCommit, skipCheckout, force, label, verbose } =
    params;

  // Pastikan direktori target siap
  ensureEmptyDir(targetDir, force);

  logger.info(`Mengkloning template ${label}...`);
  // Kloning repositori
  await run(`git clone ${quotePath(repo)} ${quotePath(targetDir)}`, !!verbose);

  // Checkout ke commit pinned jika diperlukan
  if (pinnedCommit && !skipCheckout) {
    logger.info(`Checkout template ${label} ke commit ${pinnedCommit}...`);
    await run(
      `cd ${quotePath(targetDir)} && git checkout ${pinnedCommit}`,
      !!verbose,
    );
  } else if (pinnedCommit && skipCheckout) {
    logger.info(
      `Lewati checkout commit untuk template ${label} karena --latest dikonfirmasi.`,
    );
  }

  logger.success(`Template ${label} berhasil dikloning.`);
}

// Fungsi utama untuk menjalankan inisialisasi template
export const runTemplateInit = async (options: TemplateInitOptions) => {
  const latest = !!options.latest;
  const force = !!options.force;

  let skipCheckout = false;

  if (latest) {
    const ok = await confirmLatestMode();
    if (!ok) {
      logger.info(
        "Dibatalkan oleh pengguna. Tidak ada perubahan yang dilakukan.",
      );
      process.exit(0);
    }
    skipCheckout = true;
    logger.info(
      "Konfirmasi diterima: akan menggunakan versi latest dan melewati checkout commit pinned.",
    );
  }

  await cloneRepo({
    repo: HARDHAT_TEMPLATE_REPO,
    targetDir: HARDHAT_TARGET_DIR,
    pinnedCommit: HARDHAT_TEMPLATE_COMMITHASH,
    skipCheckout,
    force,
    label: "Hardhat",
    verbose: !!options.verbose,
  });

  await cloneRepo({
    repo: FRONTEND_TEMPLATE_REPO,
    targetDir: FRONTEND_TARGET_DIR,
    pinnedCommit: FRONTEND_TEMPLATE_COMMITHASH,
    skipCheckout,
    force,
    label: "Frontend",
    verbose: !!options.verbose,
  });

  logger.success("Inisialisasi template selesai.");
  process.exit(0);
};

// scripts/template-init.ts
// @script `npm run template-init`
// Script untuk menginisialisasi template FHEVM Hardhat ke dalam proyek

import fs from "fs";
import { logger } from "./helper/logger";
import { quotePath, run, isEmptyDir } from "./helper/utils";
import config from "../starterkit.config";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

const HARDHAT_TEMPLATE_REPO = config.template.hardhat.repo;
const HARDHAT_TARGET_DIR = config.template.hardhat.dir;
const HARDHAT_TEMPLATE_COMMITHASH = config.template.hardhat.commit;

const FRONTEND_TEMPLATE_REPO = config.template.frontend.repo;
const FRONTEND_TARGET_DIR = config.template.frontend.dir;
const FRONTEND_TEMPLATE_COMMITHASH = config.template.frontend.commit;

// CLI flag handling
const ARGS = process.argv.slice(2);
const USE_LATEST_FLAG = ARGS.includes("--latest") || ARGS.includes("-l");
let SKIP_CHECKOUT = false;

const ACTIONS = config.template.actions || {};

// Pastikan direktori target ada dan kosong
function ensureEmptyDir(dir: string) {
  logger.info(`Cek apakah direktori target ${dir} ada dan kosong...`);
  if (!fs.existsSync(dir)) {
    logger.info(`Membuat direktori target ${dir}...`);
    fs.mkdirSync(dir, { recursive: true });
  } else if (!isEmptyDir(dir)) {
    logger.error(`Direktori target ${dir} tidak kosong!`);
    logger.error(
      "Hapus isi direktori tersebut dan coba lagi atau jalankan script `npm run template:clean` terlebih dahulu."
    );
    process.exit(1);
  }
}

// Kloning template Hardhat
async function cloneHardhatTemplate() {
  ensureEmptyDir(HARDHAT_TARGET_DIR);
  logger.info("Mengkloning template Hardhat...");
  await run(
    `git clone ${quotePath(HARDHAT_TEMPLATE_REPO)} ${quotePath(
      HARDHAT_TARGET_DIR
    )}`
  );

  // Checkout ke commit tertentu jika disediakan
  if (HARDHAT_TEMPLATE_COMMITHASH && !SKIP_CHECKOUT) {
    logger.info(
      `Checkout template Hardhat ke commit ${HARDHAT_TEMPLATE_COMMITHASH}...`
    );
    await run(
      `cd ${quotePath(
        HARDHAT_TARGET_DIR
      )} && git checkout ${HARDHAT_TEMPLATE_COMMITHASH}`
    );
  } else if (HARDHAT_TEMPLATE_COMMITHASH && SKIP_CHECKOUT) {
    logger.info(
      "Lewati checkout commit untuk template Hardhat karena --latest dikonfirmasi."
    );
  }
  logger.success("Template Hardhat berhasil dikloning.");
}

// Kloning template Frontend
async function cloneFrontendTemplate() {
  ensureEmptyDir(FRONTEND_TARGET_DIR);
  logger.info("Mengkloning template Frontend...");
  await run(
    `git clone ${quotePath(FRONTEND_TEMPLATE_REPO)} ${quotePath(
      FRONTEND_TARGET_DIR
    )}`
  );
  // Checkout ke commit tertentu jika disediakan
  if (FRONTEND_TEMPLATE_COMMITHASH && !SKIP_CHECKOUT) {
    logger.info(
      `Checkout template Frontend ke commit ${FRONTEND_TEMPLATE_COMMITHASH}...`
    );
    await run(
      `cd ${quotePath(
        FRONTEND_TARGET_DIR
      )} && git checkout ${FRONTEND_TEMPLATE_COMMITHASH}`
    );
  } else if (FRONTEND_TEMPLATE_COMMITHASH && SKIP_CHECKOUT) {
    logger.info(
      "Lewati checkout commit untuk template Frontend karena --latest dikonfirmasi."
    );
  }
  logger.success("Template Frontend berhasil dikloning.");
}

const main = async () => {
  if (USE_LATEST_FLAG) {
    const rl = readline.createInterface({ input, output });
    const answer = await rl.question(
      "Anda memilih --latest. Menggunakan base 'latest' bisa menyebabkan konflik. Lanjutkan tanpa melakukan checkout ke commit tertentu? (y/N): "
    );
    rl.close();
    const normalized = (answer || "").trim().toLowerCase();
    if (normalized === "y" || normalized === "yes") {
      SKIP_CHECKOUT = true;
      logger.info(
        "Konfirmasi diterima: akan menggunakan versi latest dan melewati checkout commit."
      );
    } else {
      logger.info(
        "Dibatalkan oleh pengguna. Tidak ada perubahan yang dilakukan."
      );
      process.exit(0);
    }
  }

  await cloneHardhatTemplate();
  await cloneFrontendTemplate();
};

main()
  .then(() => {
    logger.success("Inisialisasi template selesai.");
  })
  .catch((error) => {
    logger.error("Terjadi kesalahan selama inisialisasi template:");
    console.error(error);
    process.exit(1);
  });

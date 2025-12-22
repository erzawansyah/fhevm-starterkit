// scripts/template-init.ts
// @script `npm run template:init`
// Script untuk menginisialisasi template FHEVM Hardhat dan Frontend ke dalam folder ./base

import fs from "fs";
import path from "path";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

import config from "../../starterkit.config";
import { logger } from "../helper/logger";
import { quotePath, run, isEmptyDir } from "../helper/utils";
import { GlobalOptions } from "../cli";

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

function removeDirContents(dir: string) {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
}

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
      "Hapus isi direktori tersebut dan coba lagi, atau jalankan ulang dengan flag --force."
    );
    process.exit(1);
  }

  logger.warning(
    `Direktori target ${dir} tidak kosong. --force aktif, mengosongkan isi direktori...`
  );
  removeDirContents(dir);
}

async function confirmLatestMode(): Promise<boolean> {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(
    "Anda memilih --latest. Menggunakan template versi latest bisa menyebabkan perbedaan hasil dan konflik saat update. Lanjutkan tanpa checkout ke commit pinned? (y/N): "
  );
  rl.close();

  const normalized = (answer || "").trim().toLowerCase();
  return normalized === "y" || normalized === "yes";
}

async function cloneRepo(params: {
  repo: string;
  targetDir: string;
  pinnedCommit?: string;
  skipCheckout: boolean;
  force: boolean;
  label: string;
}) {
  const { repo, targetDir, pinnedCommit, skipCheckout, force, label } = params;

  ensureEmptyDir(targetDir, force);

  logger.info(`Mengkloning template ${label}...`);
  await run(`git clone ${quotePath(repo)} ${quotePath(targetDir)}`);

  if (pinnedCommit && !skipCheckout) {
    logger.info(`Checkout template ${label} ke commit ${pinnedCommit}...`);
    await run(`cd ${quotePath(targetDir)} && git checkout ${pinnedCommit}`);
  } else if (pinnedCommit && skipCheckout) {
    logger.info(
      `Lewati checkout commit untuk template ${label} karena --latest dikonfirmasi.`
    );
  }

  logger.success(`Template ${label} berhasil dikloning.`);
}

export const runTemplateInit = async (options: TemplateInitOptions) => {
  const latest = !!options.latest;
  const force = !!options.force;

  let skipCheckout = false;

  if (latest) {
    const ok = await confirmLatestMode();
    if (!ok) {
      logger.info(
        "Dibatalkan oleh pengguna. Tidak ada perubahan yang dilakukan."
      );
      process.exit(0);
    }
    skipCheckout = true;
    logger.info(
      "Konfirmasi diterima: akan menggunakan versi latest dan melewati checkout commit pinned."
    );
  }

  await cloneRepo({
    repo: HARDHAT_TEMPLATE_REPO,
    targetDir: HARDHAT_TARGET_DIR,
    pinnedCommit: HARDHAT_TEMPLATE_COMMITHASH,
    skipCheckout,
    force,
    label: "Hardhat",
  });

  await cloneRepo({
    repo: FRONTEND_TEMPLATE_REPO,
    targetDir: FRONTEND_TARGET_DIR,
    pinnedCommit: FRONTEND_TEMPLATE_COMMITHASH,
    skipCheckout,
    force,
    label: "Frontend",
  });

  logger.success("Inisialisasi template selesai.");
  process.exit(0);
};

import fs from "fs";
import path from "path";
import config from "../../../starterkit.config";
import { GlobalOptions } from "../../cli";
import { logger } from "../../../lib/helper/logger";
import { isEmptyDir, run, quotePath } from "../../../lib/helper/utils";

const HARDHAT_TEMPLATE_DIR = config.template.hardhat.dir;
const FRONTEND_TEMPLATE_DIR = config.template.frontend.dir;
const FRONTEND_TARGET_DIRNAME = config.path.frontendDir || "ui";

type StarterInitOptions = {
  dir?: string;
  skipUi: boolean;
  dryRun: boolean;
} & GlobalOptions;

function ensureTemplateReady(label: string, dir: string) {
  if (!fs.existsSync(dir) || isEmptyDir(dir)) {
    logger.error(
      `Template ${label} belum tersedia di ${dir}. Jalankan "npm run template:init" terlebih dahulu.`
    );
    process.exit(1);
  }
}

function ensureStarterReady(starterName: string, starterDir: string) {
  if (!fs.existsSync(starterDir)) {
    logger.error(`Starter ${starterName} tidak ditemukan di ${starterDir}.`);
    logger.info(`Pastikan nama starter benar atau cek folder ./starters.`);
    process.exit(1);
  }

  const requiredFiles = config.validation.requiredFiles || [];
  const requiredFolders = config.validation.requiredFolders || [];

  for (const file of requiredFiles) {
    const filePath = path.join(starterDir, file);
    if (!fs.existsSync(filePath)) {
      logger.error(`File wajib starter hilang: ${filePath}`);
      process.exit(1);
    }
  }

  for (const folder of requiredFolders) {
    const folderPath = path.join(starterDir, folder);
    if (!fs.existsSync(folderPath) || isEmptyDir(folderPath)) {
      logger.error(`Folder wajib starter hilang/kosong: ${folderPath}`);
      process.exit(1);
    }
  }
}

function ensureTargetWritable(targetDir: string, dryRun: boolean) {
  if (fs.existsSync(targetDir) && !isEmptyDir(targetDir)) {
    logger.error(
      `Direktori target ${targetDir} sudah ada dan tidak kosong. Hapus atau pilih --dir lain.`
    );
    process.exit(1);
  }

  if (!dryRun && !fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
}

function ensureFrontendBuilt(
  templateDir: string,
  dryRun: boolean,
  verbose = true
) {
  const distDir = path.join(templateDir, "dist");
  const hasDist = fs.existsSync(distDir) && !isEmptyDir(distDir);

  if (hasDist) return;

  logger.info(
    `${
      dryRun ? "[dry-run] " : ""
    }Build frontend template karena dist belum tersedia.`
  );

  if (dryRun) return;
  run(`cd ${quotePath(templateDir)} && npm install`, !!verbose);
  run(`cd ${quotePath(templateDir)} && npm run build`, !!verbose);
}

function copyDirectory(
  source: string,
  destination: string,
  options?: { skip?: string[]; cleanDest?: boolean }
) {
  const skipList = options?.skip ?? [];
  const skip = new Set(skipList);

  if (!fs.existsSync(source)) {
    throw new Error(`Source directory not found: ${source}`);
  }

  if (options?.cleanDest && fs.existsSync(destination)) {
    fs.rmSync(destination, { recursive: true, force: true });
  }

  fs.mkdirSync(destination, { recursive: true });

  for (const entry of fs.readdirSync(source)) {
    if (skip.has(entry)) continue;

    const srcPath = path.join(source, entry);
    const destPath = path.join(destination, entry);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath, { skip: skipList });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyStarterFiles(
  starterDir: string,
  projectDir: string,
  dryRun: boolean
) {
  const copyPairs = [
    {
      src: path.join(starterDir, "contracts"),
      dest: path.join(projectDir, "contracts"),
      label: "contracts",
      clean: true,
    },
    {
      src: path.join(starterDir, "test"),
      dest: path.join(projectDir, "test"),
      label: "test",
      clean: true,
    },
    {
      src: path.join(starterDir, "README.md"),
      dest: path.join(projectDir, "README.md"),
      label: "README.md",
      clean: false,
    },
    {
      src: path.join(starterDir, "metadata.json"),
      dest: path.join(projectDir, "metadata.json"),
      label: "metadata.json",
      clean: false,
    },
  ];

  for (const pair of copyPairs) {
    if (!fs.existsSync(pair.src)) continue;

    logger.info(
      `${dryRun ? "[dry-run] " : ""}Copy starter ${pair.label} -> ${pair.dest}`
    );
    if (dryRun) continue;

    if (pair.clean) {
      copyDirectory(pair.src, pair.dest, { cleanDest: true });
    } else {
      fs.mkdirSync(path.dirname(pair.dest), { recursive: true });
      fs.copyFileSync(pair.src, pair.dest);
    }
  }
}

export async function runStarterInit(
  starterName: string,
  input: StarterInitOptions
) {
  const targetDirName = input.dir ?? starterName;
  const starterDir = path.join("starters", starterName);
  const projectDir = path.join("projects", targetDirName);
  const uiTargetDir = path.join(projectDir, FRONTEND_TARGET_DIRNAME);

  if (input.verbose)
    logger.info(
      `[debug] starter:init ${JSON.stringify({
        starterName,
        ...input,
        targetDir: targetDirName,
      })}`
    );

  logger.info("starter:init");
  logger.table({
    starter: starterName,
    dir: targetDirName,
    "skip-ui": input.skipUi ? "yes" : "no",
    "dry-run": input.dryRun ? "yes" : "no",
  });

  ensureTemplateReady("Hardhat", HARDHAT_TEMPLATE_DIR);
  if (!input.skipUi) ensureTemplateReady("Frontend", FRONTEND_TEMPLATE_DIR);
  ensureStarterReady(starterName, starterDir);
  ensureTargetWritable(projectDir, input.dryRun);

  logger.info(
    `${
      input.dryRun ? "[dry-run] " : ""
    }Copy base Hardhat template -> ${projectDir}`
  );
  if (!input.dryRun) {
    copyDirectory(HARDHAT_TEMPLATE_DIR, projectDir, { skip: [".git"] });
  }

  if (!input.skipUi) {
    ensureFrontendBuilt(FRONTEND_TEMPLATE_DIR, input.dryRun, !!input.verbose);
    const distDir = path.join(FRONTEND_TEMPLATE_DIR, "dist");

    logger.info(
      `${input.dryRun ? "[dry-run] " : ""}Copy frontend dist -> ${uiTargetDir}`
    );
    if (!input.dryRun) {
      copyDirectory(distDir, uiTargetDir, { cleanDest: true });
    }
  }

  copyStarterFiles(starterDir, projectDir, input.dryRun);

  logger.success(
    input.dryRun
      ? "Dry-run selesai. Tidak ada file yang diubah."
      : `Starter berhasil diinisialisasi di ${projectDir}.`
  );
  process.exit(0);
}

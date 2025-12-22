import fs from "fs";
import path from "path";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

import config from "../../starterkit.config";
import { logger } from "../helper/logger";
import { GlobalOptions } from "../cli";

function escapeRegExe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ensureDirExists(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function runSetupFrontend(
  opts: { force: boolean } & GlobalOptions
) {
  if (opts.verbose)
    logger.info(`[debug] setup:frontend ${JSON.stringify(opts)}`);

  const FRONTEND_TARGET_DIR = config.template.frontend.dir;

  // Lokasi template frontend di base
  const baseFrontendDir = path.resolve(process.cwd(), FRONTEND_TARGET_DIR);

  // Lokasi root .env.local (opsional) yang kamu ingin copy kalau sudah ada
  const rootEnvLocalPath = path.resolve(process.cwd(), ".env.local");

  const envExamplePath = path.join(baseFrontendDir, ".env.example");
  const envLocalPath = path.join(baseFrontendDir, ".env.local");

  logger.info("Mengatur template Frontend...");

  if (!fs.existsSync(baseFrontendDir)) {
    logger.error(
      `Folder template frontend tidak ditemukan: ${baseFrontendDir}`
    );
    logger.error("Jalankan `npm run template:init` terlebih dahulu.");
    process.exit(1);
  }

  if (fs.existsSync(rootEnvLocalPath)) {
    // copy .env.local dari root ke base template
    if (fs.existsSync(envLocalPath) && !opts.force) {
      logger.error(`File target sudah ada: ${envLocalPath}`);
      logger.info("Jalankan ulang dengan --force untuk overwrite.");
      process.exit(1);
    }

    ensureDirExists(baseFrontendDir);
    fs.copyFileSync(rootEnvLocalPath, envLocalPath);

    logger.info(`.env.local sudah ada di root, menyalin ke template frontend.`);
    logger.info(`From: ${rootEnvLocalPath}`);
    logger.info(`To:   ${envLocalPath}`);
    logger.success("Template Frontend telah diatur.");
    return;
  }

  // Kalau tidak ada root .env.local, buat berdasarkan .env.example
  if (!fs.existsSync(envExamplePath)) {
    logger.error(`File .env.example tidak ditemukan: ${envExamplePath}`);
    logger.error("Pastikan template frontend memiliki .env.example.");
    process.exit(1);
  }

  if (fs.existsSync(envLocalPath) && !opts.force) {
    logger.error(`File .env.local sudah ada: ${envLocalPath}`);
    logger.info("Jalankan ulang dengan --force untuk overwrite.");
    process.exit(1);
  }

  // Copy example -> local terlebih dulu
  fs.copyFileSync(envExamplePath, envLocalPath);

  const envExampleContent = fs.readFileSync(envExamplePath, "utf8");
  const lines = envExampleContent.split("\n");

  const vars: Array<{ key: string; defaultValue?: string }> = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    const idx = line.indexOf("=");
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim();
    const defaultValue = line.slice(idx + 1).trim();

    if (key) vars.push({ key, defaultValue });
  }

  if (vars.length === 0) {
    logger.info("Tidak ada variabel yang perlu dikonfigurasi di .env.example.");
    logger.success("Template Frontend telah diatur.");
    return;
  }

  const rl = readline.createInterface({ input, output });

  try {
    console.log("\n=== Konfigurasi .env.local — Frontend ===");
    console.log("Tekan Enter untuk menerima nilai default yang ditampilkan.\n");

    const answers: Record<string, string> = {};

    for (let i = 0; i < vars.length; i++) {
      const { key, defaultValue } = vars[i];
      const prompt =
        `[${i + 1}/${vars.length}] ${key}` +
        (defaultValue ? ` (default: ${defaultValue})` : "") +
        ": ";

      const userInput = await rl.question(prompt);
      const valueToSet =
        userInput.trim() === "" ? defaultValue ?? "" : userInput.trim();
      answers[key] = valueToSet;
    }

    console.log("\nSummary:");
    for (const [k, v] of Object.entries(answers)) {
      console.log(`- ${k}=${v}`);
    }

    const confirm = await rl.question(
      "\nTerapkan nilai di atas ke .env.local? (Y/n): "
    );
    const confirmNorm = (confirm || "").trim().toLowerCase();
    if (confirmNorm === "n" || confirmNorm === "no") {
      logger.info("Batal oleh pengguna. Tidak ada perubahan yang diterapkan.");
      return;
    }

    let fileContent = fs.readFileSync(envLocalPath, "utf8");
    for (const [key, value] of Object.entries(answers)) {
      const re = new RegExp(`^${escapeRegExe(key)}=.*$`, "m");
      if (re.test(fileContent)) {
        fileContent = fileContent.replace(re, `${key}=${value}`);
      } else {
        fileContent += `\n${key}=${value}`;
      }
    }

    fs.writeFileSync(envLocalPath, fileContent, "utf8");
    logger.success("Template Frontend telah diatur.");
  } finally {
    rl.close();
  }
}

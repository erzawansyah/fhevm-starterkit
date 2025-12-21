import { execSync } from "child_process";
import { logger } from "./helper/logger";
import fs from "fs";
import config from "../starterkit.config";
import path from "path";

function escapeRegExe(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// cp /base/frontend-template/.env.example ./frontend-template/.env.local

// kalau ./.env.local sudah ada, langsung copy ke ./base/frontend-template/.env.local
const FRONTEND_TEMPLATE_REPO = config.template.frontend.repo;
const isEnvLocalExists = fs.existsSync(
  path.join(__dirname, "..", ".env.local")
);

// Kalau belum, jalankan script di bawah untuk membuatnya dengan prompt interaktif
const FRONTEND_TARGET_DIR = config.template.frontend.dir;

// Buat prompt interaktif untuk memasukkan variabel lingkungan
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (question: string) => {
  return new Promise<string>((resolve) => {
    readline.question(question, (answer: string) => {
      resolve(answer);
    });
  });
};

async function setupFrontend() {
  logger.info("Mengatur template Frontend...");

  // baca isi dari .env.example dan tanyakan nilai untuk setiap variabel lingkungan
  const envExamplePath = path.join(
    __dirname,
    "..",
    FRONTEND_TARGET_DIR,
    ".env.example"
  );
  const envLocalPath = path.join(
    __dirname,
    "..",
    FRONTEND_TARGET_DIR,
    ".env.local"
  );
  console.log(`Membuat file .env.local berdasarkan ${envExamplePath}...`);
  console.log(`Menyalin ${envExamplePath} ke ${envLocalPath}...`);

  // copy using Node API (cross-platform)
  fs.copyFileSync(envExamplePath, envLocalPath);

  const envExampleContent = fs.readFileSync(envExamplePath, "utf8");
  const lines = envExampleContent.split("\n");

  // Parse variables first
  const vars: Array<{ key: string; defaultValue: string | undefined }> = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const defaultValue = line.slice(idx + 1).trim();
    vars.push({ key, defaultValue });
  }

  if (vars.length === 0) {
    logger.info("Tidak ada variabel yang perlu dikonfigurasi di .env.example.");
    readline.close();
    return;
  }

  console.log("\n=== Konfigurasi .env.local — Frontend ===");
  console.log(
    "Tekan Enter untuk menerima nilai default ditampilkan di sebelah kanan.\n"
  );

  const answers: Record<string, string> = {};
  for (let i = 0; i < vars.length; i++) {
    const { key, defaultValue } = vars[i];
    const prompt =
      `[${i + 1}/${vars.length}] ${key}` +
      (defaultValue ? ` (default: ${defaultValue})` : "") +
      ": ";
    const userInput = await askQuestion(prompt);
    const valueToSet =
      userInput.trim() === "" ? defaultValue ?? "" : userInput.trim();
    answers[key] = valueToSet;
  }

  // Summary
  console.log("\nSummary:");
  for (const key of Object.keys(answers)) {
    console.log(`- ${key}=${answers[key]}`);
  }
  const confirm = await askQuestion(
    "\nTerapkan nilai di atas ke .env.local? (Y/n): "
  );
  const confirmNorm = (confirm || "").trim().toLowerCase();
  if (confirmNorm === "n" || confirmNorm === "no") {
    logger.info("Batal oleh pengguna. Tidak ada perubahan yang diterapkan.");
    readline.close();
    return;
  }

  // Apply changes in one pass
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
  readline.close();
}

const main = async () => {
  if (isEnvLocalExists) {
    // langsung copy .env.local yang sudah ada ke frontend template
    const existingEnvLocalPath = path.join(__dirname, "..", ".env.local");

    const targetEnvLocalPath = path.join(
      __dirname,
      "..",
      FRONTEND_TARGET_DIR,
      ".env.local"
    );

    fs.copyFileSync(existingEnvLocalPath, targetEnvLocalPath);
    logger.info(
      `.env.local sudah ada, menyalin dari ${existingEnvLocalPath} ke ${targetEnvLocalPath}`
    );
    return;
  }
  await setupFrontend();
};

main()
  .then(() => {
    logger.success("Pengaturan Frontend selesai.");
  })
  .catch((error) => {
    logger.error("Terjadi kesalahan selama pengaturan Frontend:");
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });

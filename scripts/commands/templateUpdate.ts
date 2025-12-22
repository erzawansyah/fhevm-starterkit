import fs from "fs";
import { execSync } from "child_process";
import config from "../../starterkit.config";
import { logger } from "../helper/logger";
import { quotePath, run } from "../helper/utils";
import { GlobalOptions } from "../cli";

const HARDHAT_TEMPLATE_REPO = config.template.hardhat.repo;
const HARDHAT_TARGET_DIR = config.template.hardhat.dir;
const HARDHAT_TEMPLATE_COMMITHASH = config.template.hardhat.commit;

const FRONTEND_TEMPLATE_REPO = config.template.frontend.repo;
const FRONTEND_TARGET_DIR = config.template.frontend.dir;
const FRONTEND_TEMPLATE_COMMITHASH = config.template.frontend.commit;

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

function getRemoteHeadCommitHash(repo: string, branch = "main"): string {
  // output: "<sha>\trefs/heads/main"
  const out = execSync(`git ls-remote ${quotePath(repo)} refs/heads/${branch}`)
    .toString()
    .trim();
  const sha = out.split(/\s+/)[0];
  if (!sha || sha.length < 7) {
    throw new Error(
      `Gagal mengambil remote HEAD commit untuk ${repo} (branch: ${branch}).`
    );
  }
  return sha;
}

async function checkoutRepoCommit(targetDir: string, commitHash: string) {
  await run(
    `cd ${quotePath(
      targetDir
    )} && git fetch --all --prune && git checkout ${commitHash}`
  );
}

async function updateTemplate(params: {
  label: string;
  repo: string;
  targetDir: string;
  pinnedCommit?: string;
  useLatest: boolean;
  branch?: string;
}) {
  const {
    label,
    repo,
    targetDir,
    pinnedCommit,
    useLatest,
    branch = "main",
  } = params;

  logger.info(`Memperbarui template ${label}...`);

  const targetCommit = useLatest
    ? getRemoteHeadCommitHash(repo, branch)
    : pinnedCommit;

  if (!targetCommit) {
    logger.error(
      `Tidak ada commit target untuk template ${label}. Cek config starterkit.`
    );
    process.exit(1);
  }

  // Ambil commit saat ini di local (kalau repo valid)
  let currentCommit = "";
  try {
    currentCommit = execSync("git rev-parse HEAD", { cwd: targetDir })
      .toString()
      .trim();
  } catch {
    // kalau folder bukan repo git yang valid, biarkan kosong
  }

  if (currentCommit && currentCommit === targetCommit) {
    logger.info(
      `Template ${label} sudah di commit target. Tidak ada yang perlu diperbarui.`
    );
    return;
  }

  logger.info(`Checkout template ${label} ke commit ${targetCommit}...`);
  await checkoutRepoCommit(targetDir, targetCommit);

  logger.success(`Template ${label} berhasil diperbarui.`);
}

export async function runTemplateUpdate(
  input: { latest: boolean } & GlobalOptions
) {
  if (input.verbose)
    logger.info(`[debug] template:update ${JSON.stringify(input)}`);

  logger.info("▶ template:update");
  logger.info(`Mode: ${input.latest ? "latest" : "pinned"}`);

  ensureTemplateInitialized();

  try {
    await updateTemplate({
      label: "Hardhat",
      repo: HARDHAT_TEMPLATE_REPO,
      targetDir: HARDHAT_TARGET_DIR,
      pinnedCommit: HARDHAT_TEMPLATE_COMMITHASH,
      useLatest: input.latest,
      branch: "main",
    });

    await updateTemplate({
      label: "Frontend",
      repo: FRONTEND_TEMPLATE_REPO,
      targetDir: FRONTEND_TARGET_DIR,
      pinnedCommit: FRONTEND_TEMPLATE_COMMITHASH,
      useLatest: input.latest,
      branch: "main",
    });

    logger.success("Pembaruan template selesai.");
  } catch (error) {
    logger.error("Terjadi kesalahan saat memperbarui template:", error);
    process.exit(1);
  }
}

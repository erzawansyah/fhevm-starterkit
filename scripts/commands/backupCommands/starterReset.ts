import fs from "fs";
import path from "path";
import { logger } from "../../../lib/helper/logger";
import { GlobalOptions } from "../../cli";

const PROJECTS_DIR = "projects";

function removeProjects(dir: string) {
  if (!fs.existsSync(dir)) {
    logger.info(`Folder projects tidak ditemukan: ${dir}`);
    return;
  }

  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const entryPath = path.join(dir, entry);
    try {
      fs.rmSync(entryPath, { recursive: true, force: true });
    } catch (err) {
      logger.warning(`Gagal menghapus ${entryPath}: ${String(err)}`);
    }
  }

  logger.info(`Isi folder ${dir} sudah dihapus.`);
}

export async function runStarterReset(input: { yes: boolean } & GlobalOptions) {
  if (input.verbose)
    logger.info(`[debug] starter:reset ${JSON.stringify(input)}`);

  logger.info("starter:reset");

  if (!input.yes) {
    logger.error("Menolak menghapus projek tanpa konfirmasi --yes.");
    logger.info("Jalankan lagi dengan: npm run starter:reset -- --yes");
    process.exit(1);
  }

  removeProjects(PROJECTS_DIR);

  logger.success("Semua proyek di ./projects sudah dihapus.");
  process.exit(0);
}

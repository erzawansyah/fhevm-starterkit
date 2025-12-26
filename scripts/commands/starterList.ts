/**
 * @path scripts/commands/starterList.ts
 * @script npm run starter:list
 * @description Menampilkan daftar proyek starter yang tersedia (read-only)
 *
 * What actually does this script do?
 * - Membaca folder ./starters untuk menemukan semua proyek starter yang tersedia
 * - Untuk setiap proyek starter, mencoba membaca file metadata.json (jika ada) untuk mendapatkan informasi seperti nama, deskripsi, versi, kategori, dan tag
 * - Menampilkan daftar proyek starter dalam format yang dapat dibaca manusia, dengan opsi output compact, verbose, atau JSON
 * - Menyediakan opsi untuk hanya menampilkan jumlah proyek starter dan peringatan metadata
 * - Menyediakan beberapa parameter opsional:
 * - --mode: Menentukan mode output (compact, verbose, json, count)
 * -   -- compact: Output ringkas (1 baris per starter)
 * -   -- verbose: Output detail (subsection + keyValue per starter)
 * -   -- json: Output JSON (cocok untuk CI)
 * -   -- count: Hanya menampilkan --count starter (tetap menghitung peringatan)
 *
 * What actually doesn't this script do?
 * - Tidak memodifikasi file atau folder apa pun (read-only)
 * - Tidak mengunduh atau mengkloning template starter apa pun
 */
import fs from "fs";
import { logger } from "../../lib/helper/logger";
import { GlobalOptions } from "../cli";
import {
  parseCount,
} from "../../lib/helper/utils";
import { StarterMetadataType } from "../../lib/types/starterMetadata.schema";
import { getAllStarterMetadata } from "../../lib/helper/starters";
import { resolveStartersDir } from "../../lib/helper/path-utils";

// Definisikan tipe mode output
export type Mode = "detailed" | "compact" | "json" | "table";

// Definisikan tipe opsi untuk perintah starter:list
type StarterListOptions = GlobalOptions & {
  mode: Mode;
  count?: number | string; // biar aman kalau parser ngasih string
};


function outputDetailed(
  rows: StarterMetadataType[],
  meta: {
    startersDir: string;
    total: number;
    showing: number;
    warningCount: number;
  }
) {
  logger.section("Starter Projects");
  logger.keyValue("Path", meta.startersDir);
  logger.keyValue("Showing", meta.showing);
  logger.keyValue("Total", meta.total);
  if (meta.warningCount > 0)
    logger.keyValue("Metadata warnings", meta.warningCount);
  logger.separator();

  if (rows.length === 0) {
    logger.warning("No starter projects found.");
    return;
  }

  for (const r of rows) {
    logger.subsection(r.name);

    logger.keyValue("Label", r.label);
    logger.keyValue("Name", r.name);
    logger.keyValue("Description", r.description);
    if (r.category) logger.keyValue("Category", r.category);
    if (r.tags && r.tags.length > 0) logger.keyValue("Tags", r.tags.join(", "));
    if (r.chapter) logger.keyValue("Chapter", r.chapter);
    if (r.version) logger.keyValue("Version", r.version);
  }

  logger.separator();
  logger.info("Done.");
}

function outputJson(
  rows: StarterMetadataType[],
  meta: {
    startersDir: string;
    total: number;
    showing: number;
    warningCount: number;
  }
) {
  // JSON output should be clean: no section/separator.
  // Use logger.log (plain) to avoid colored prefixes affecting parsing.
  const payload = {
    path: meta.startersDir,
    total: meta.total,
    showing: meta.showing,
    warnings: meta.warningCount,
    starters: rows.map((r) => ({
      name: r.name,
      label: r.label,
      description: r.description,
      version: r.version,
      category: r.category,
      tags: r.tags,
      chapter: r.chapter,
      concepts: r.concepts,
    })),
  };

  logger.log(JSON.stringify(payload, null, 2));
}

function outputTable(
  rows: StarterMetadataType[],
) {
  logger.table(
    rows.map((r) => ({
      Name: `${r.label} (${r.name})`,
      Category: r.category || "-",
      Chapter: r.chapter || "-",
      Concepts: r.concepts && r.concepts.length > 0 ? r.concepts.join(", ") : "-",
      Tags: r.tags && r.tags.length > 0 ? r.tags.join(", ") : "-",
    }))
  );
}


export async function runStarterList(opts: StarterListOptions) {
  const startersDir = resolveStartersDir();
  const mode = opts.mode || "detailed";
  const count = parseCount(opts.count);

  if (!fs.existsSync(startersDir)) {
    if (mode === "json") {
      logger.log(
        JSON.stringify(
          {
            path: startersDir,
            total: 0,
            showing: 0,
            warnings: 0,
            error: `Directory not found: ${startersDir}`,
            starters: [],
          },
          null,
          2
        )
      );
      return;
    }

    logger.section("Starter Projects");
    logger.error(`Directory not found: ${startersDir}`);
    logger.info(
      "Hint: jalankan command dari root project (yang punya folder 'starters')."
    );
    return;
  }

  const allRows = await getAllStarterMetadata();
  const warningCount = 0;

  const rows = typeof count === "number" ? allRows.slice(0, count) : allRows;

  const meta = {
    startersDir,
    total: allRows.length,
    showing: rows.length,
    warningCount,
  };

  if (mode === "json") return outputJson(rows, meta);
  if (mode === "table") return outputTable(rows);

  // default: verbose
  return outputDetailed(rows, meta);
}

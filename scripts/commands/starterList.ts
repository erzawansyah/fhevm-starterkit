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
 * Behavior:
 * - Read-only: tidak memodifikasi file/folder apa pun
 */
import fs from "fs";
import path from "path";
import { logger } from "../../lib/helper/logger";
import { GlobalOptions } from "../cli";
import { StarterMetadataType } from "../../lib/types/StarterMetadataType";

// Definisikan tipe mode output
export type Mode = "detailed" | "compact" | "json";

// Definisikan tipe opsi untuk perintah starter:list
type StarterListOptions = GlobalOptions & {
  mode: Mode;
  count?: number | string; // biar aman kalau parser ngasih string
};

type StarterRow = {
  slug: string;
  path: string;
  metadataPath: string;
  hasMetadata: boolean;
  metadataError?: string;

  name: string;
  description: string;
  version?: string;
  category?: string;
  tags?: string[];
};

function safeReadJson(
  filePath: string
): { ok: true; data: any } | { ok: false; error: string } {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return { ok: true, data: JSON.parse(raw) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)) + "…";
}

function padRight(text: string, width: number): string {
  if (text.length >= width) return text;
  return text + " ".repeat(width - text.length);
}

function formatTags(tags?: string[], maxTags = 5): string {
  if (!tags || tags.length === 0) return "";
  const shown = tags.slice(0, maxTags);
  const more = tags.length > maxTags ? ` +${tags.length - maxTags}` : "";
  return `[${shown.join(", ")}${more}]`;
}

function getStartersDir(): string {
  return path.resolve(process.cwd(), "starters");
}

function parseCount(count: StarterListOptions["count"]): number | undefined {
  if (count === undefined || count === null) return undefined;

  const n = typeof count === "number" ? count : Number(String(count).trim());
  if (Number.isNaN(n)) return undefined;

  const fixed = Math.floor(n);
  if (fixed < 0) return undefined;

  return fixed;
}

function loadStarters(startersDir: string) {
  const entries = fs.readdirSync(startersDir, { withFileTypes: true });
  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  const rows: StarterRow[] = [];
  let warningCount = 0;

  for (const slug of folders.sort((a, b) => a.localeCompare(b))) {
    const starterPath = path.join(startersDir, slug);
    const metadataPath = path.join(starterPath, "metadata.json");

    let meta: StarterMetadataType = {};
    let hasMetadata = false;
    let metadataError: string | undefined;

    if (fs.existsSync(metadataPath)) {
      const res = safeReadJson(metadataPath);
      if (res.ok) {
        meta = res.data ?? {};
        hasMetadata = true;
      } else {
        warningCount++;
        metadataError = res.error;
      }
    }

    const name = (meta.label || meta.name || slug).toString().trim() || slug;
    const description =
      (meta.description || "No description available.").toString().trim() ||
      "No description available.";

    rows.push({
      slug,
      path: starterPath,
      metadataPath,
      hasMetadata,
      metadataError,
      name,
      description,
      version: meta.version ? String(meta.version) : undefined,
      category: meta.category ? String(meta.category) : undefined,
      tags: Array.isArray(meta.tags) ? meta.tags.map(String) : undefined,
    });
  }

  return { rows, warningCount };
}

function outputDetailed(
  rows: StarterRow[],
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

    logger.keyValue("Slug", r.slug);
    logger.keyValue("Path", r.path);
    logger.keyValue("Description", r.description);

    if (r.version) logger.keyValue("Version", r.version);
    if (r.category) logger.keyValue("Category", r.category);
    if (r.tags && r.tags.length > 0) logger.keyValue("Tags", r.tags.join(", "));
  }

  logger.separator();
  logger.info("Done.");
}

function outputCompact(
  rows: StarterRow[],
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

  const slugW = Math.min(26, Math.max(8, ...rows.map((r) => r.slug.length)));
  const nameW = Math.min(26, Math.max(10, ...rows.map((r) => r.name.length)));

  logger.log(
    `${padRight("Slug", slugW)}  ${padRight("Name", nameW)}  Description`
  );
  logger.log(`${"-".repeat(Math.min(110, slugW + nameW + 14))}`);

  for (const r of rows) {
    const desc = truncate(r.description, 80);
    const tags = formatTags(r.tags);
    const metaMark = r.hasMetadata ? "" : " (no-metadata)";

    const line =
      `${padRight(truncate(r.slug, slugW), slugW)}  ` +
      `${padRight(truncate(r.name, nameW), nameW)}  ` +
      `${desc}${tags ? " " + tags : ""}${metaMark}`;

    if (!r.hasMetadata || r.metadataError) logger.warning(line);
    else logger.info(line);
  }

  logger.separator();
  logger.info("Tip: tambahkan --verbose untuk detail per starter.");
}

function outputJson(
  rows: StarterRow[],
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
      slug: r.slug,
      name: r.name,
      description: r.description,
      version: r.version,
      category: r.category,
      tags: r.tags,
      hasMetadata: r.hasMetadata,
      metadataPath: r.metadataPath,
      metadataError: r.metadataError,
    })),
  };

  logger.log(JSON.stringify(payload, null, 2));
}

export async function runStarterList(opts: StarterListOptions) {
  const startersDir = getStartersDir();
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

  const { rows: allRows, warningCount } = loadStarters(startersDir);

  const rows = typeof count === "number" ? allRows.slice(0, count) : allRows;

  const meta = {
    startersDir,
    total: allRows.length,
    showing: rows.length,
    warningCount,
  };

  if (mode === "json") return outputJson(rows, meta);
  if (mode === "compact") return outputCompact(rows, meta);

  // default: verbose
  return outputDetailed(rows, meta);
}

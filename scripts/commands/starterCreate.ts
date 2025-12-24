/**
 * @path scripts/commands/starterCreate.ts
 * @script
 *   - npm run starter:create <starterName...> [dir]
 *   - npm run starter:create -- --category ... --chapter ... --tags ... --concepts ... [--dir ...]
 * @description Membuat proyek baru dengan menyalin folder template dari `/starters`.
 *
 * What this script does:
 * - Mendukung 3 mode pemilihan starter:
 *   1) Positional: pilih 1 atau banyak starter via argumen posisi `<starterName...>`
 *   2) Filter: pilih starter via taksonomi metadata (category, chapter, tags, concepts)
 *   3) Interaktif: jika tidak ada input yang cukup, user dipandu memilih starter
 * - Memvalidasi agar mode positional dan filter tidak dipakai bersamaan
 * - Menyalin folder starter ke direktori tujuan (membuat folder baru)
 *
 * What this script does NOT do:
 * - Tidak mengunduh atau meng-clone template dari internet
 * - Tidak mengubah isi starter di folder `/starters`
 */

import fs from "fs";
import path from "path";

import { listStarters } from "../../lib/helper/getStarters";
import { logger } from "../../lib/helper/logger";
import {
  askCheckboxChoices,
  askConfirm,
  askInput,
  askListChoice,
} from "../../lib/helper/prompter";
import { GlobalOptions } from "../cli";
import { StarterMetadataType } from "../../lib/types/starterMetadata.schema";
import config from "../../starterkit.config";

const METADATA_FILE = "metadata.json";
const STARTERS_DIR = config.startersDir;
const WORKSPACE_DIR = config.workingDir;

type StarterCreateOptions = GlobalOptions & {
  starterName?: string[]; // positional list
  dir?: string; // destination directory

  // filter
  category?: string;
  chapter?: string;
  tags?: string; // comma-separated
  concepts?: string; // comma-separated
};

type CreatePlan =
  | {
      mode: "positional";
      starterNames: string[];
      baseDir?: string;
    }
  | {
      mode: "filter";
      starterNames: string[]; // resolved to 1 chosen starter for now
      baseDir?: string;
      filters: Record<string, string>;
    }
  | {
      mode: "interactive";
      starterNames: string[];
      baseDir?: string;
    };

/**
 * Resolve the absolute path to the `starters` directory inside the project.
 *
 * This helper centralizes how the script locates the bundled starter templates.
 * @returns Absolute path to the `starters` folder.
 */
function resolveStartersDir(): string {
  return path.resolve(__dirname, "..", "..", "starters");
}

/**
 * Normalize a comma-separated string into a cleaned array of values.
 *
 * Trims whitespace and filters out empty segments. Returns an empty array
 * for undefined or empty input.
 * @param input Comma-separated values (e.g. "a, b, c").
 * @returns Array of trimmed, non-empty values.
 */
function normalizeCsv(input?: string): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Determine whether any filter option is present in the provided options.
 *
 * Checks `category`, `chapter`, `tags`, and `concepts` fields.
 */
function hasAnyFilter(opts: StarterCreateOptions): boolean {
  return !!(opts.category || opts.chapter || opts.tags || opts.concepts);
}

/**
 * Read and parse a JSON file safely.
 *
 * Returns a success object with the parsed data or an error object with the
 * error message. This avoids throwing and simplifies callers that want to
 * handle absent/invalid JSON gracefully.
 * @param filePath Path to the JSON file.
 */
function readJsonSafe<T = unknown>(
  filePath: string
): { ok: true; data: T } | { ok: false; error: string } {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw) as T;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Load the lightweight metadata for a starter directory.
 *
 * Reads `metadata.json` inside the starter folder and returns a normalized
 * `StarterMetadataType` object (ensuring `tags` and `concepts` are arrays).
 * Returns `null` if the metadata file doesn't exist or can't be parsed.
 */
function getStarterMetadataType(
  starterDir: string
): StarterMetadataType | null {
  const metaPath = path.join(starterDir, METADATA_FILE);
  if (!fs.existsSync(metaPath)) return null;

  const res = readJsonSafe<StarterMetadataType>(metaPath);
  if (!res.ok) return null;

  // normalize arrays just in case
  const meta = res.data ?? {};
  return {
    ...meta,
    tags: Array.isArray(meta.tags) ? meta.tags : [],
    concepts: Array.isArray(meta.concepts) ? meta.concepts : [],
  };
}

/**
 * Check whether a starter with the given name exists under `startersDir`.
 * @returns `true` if the path exists and is a directory.
 */
function starterExists(startersDir: string, name: string): boolean {
  const p = path.join(startersDir, name);
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

/**
 * From a list of candidate names, pick the first one that actually exists
 * in the `startersDir`. Returns `null` if none of the names match.
 */
function pickFirstExistingStarter(
  startersDir: string,
  names: string[]
): string | null {
  const starters = listStarters(startersDir);
  for (const n of names) {
    if (starters.includes(n)) return n;
  }
  return null;
}

/**
 * Determine whether a starter's metadata matches the provided filter set.
 *
 * Matching semantics:
 * - Filters are grouped by key; a starter must match all provided keys (AND
 *   across groups).
 * - Within a group, multiple values act as OR (e.g. tags="defi,game" matches
 *   if any tag matches).
 * @param meta Starter metadata to test.
 * @param filters Map of filterName -> csv string.
 */
function matchFilter(
  meta: StarterMetadataType,
  filters: Record<string, string>
): boolean {
  const category = (meta.category ?? "").toLowerCase();
  const chapter = (meta.chapter ?? "").toLowerCase();
  const tags = (meta.tags ?? []).map((t) => String(t).toLowerCase());
  const concepts = (meta.concepts ?? []).map((c) => String(c).toLowerCase());

  // OR across filter groups, AND inside each group values
  // Contoh:
  // - category="fundamental" -> harus match category
  // - tags="defi,game" -> match salah satu tag
  // Jika user memilih beberapa jenis filter, starter dianggap match jika memenuhi semua jenis filter yang dipilih.
  for (const [k, raw] of Object.entries(filters)) {
    const values = normalizeCsv(raw).map((v) => v.toLowerCase());
    if (values.length === 0) continue;

    if (k === "category") {
      if (!values.includes(category)) return false;
      continue;
    }

    if (k === "chapter") {
      if (!values.includes(chapter)) return false;
      continue;
    }

    if (k === "tags") {
      const ok = values.some((v) => tags.includes(v));
      if (!ok) return false;
      continue;
    }

    if (k === "concepts") {
      const ok = values.some((v) => concepts.includes(v));
      if (!ok) return false;
      continue;
    }
  }

  return true;
}

/**
 * Find starter names under `startersDir` whose metadata matches the given
 * filters. Returns a sorted array of matching starter folder names.
 */
function findMatchesByMetadata(
  startersDir: string,
  filters: Record<string, string>
): string[] {
  const starters = listStarters(startersDir);
  const matches: string[] = [];

  for (const s of starters) {
    const sDir = path.join(startersDir, s);
    const meta = getStarterMetadataType(sDir);
    if (!meta) continue;

    if (matchFilter(meta, filters)) matches.push(s);
  }

  return matches.sort((a, b) => a.localeCompare(b));
}

/**
 * Resolve the user-provided `--dir` option to an absolute path, or
 * return `undefined` when not provided.
 */
function resolveDestinationBaseDir(
  opts: StarterCreateOptions
): string | undefined {
  if (!opts.dir) return undefined;
  return path.resolve(process.cwd(), opts.dir);
}

/**
 * Run interactive prompts to build a `CreatePlan` when the user did not
 * provide sufficient non-interactive inputs. The function will ask whether
 * the user wants to pick a starter directly or filter by metadata, and then
 * collect the required values.
 * @returns Resolved `CreatePlan`.
 */
async function interactiveResolvePlan(
  startersDir: string,
  opts: StarterCreateOptions
): Promise<CreatePlan> {
  const starters = listStarters(startersDir);
  if (starters.length === 0) {
    throw new Error("Tidak ada starter tersedia di folder 'starters'.");
  }

  const mode = await askListChoice("Pilih jalur pembuatan starter:", [
    { name: "Pilih starter langsung", value: "starter" },
    {
      name: "Pilih berdasarkan filter (category/chapter/tags/concepts)",
      value: "filter",
    },
  ]);

  if (mode === "starter") {
    const chosen = await askListChoice(
      "Pilih starter:",
      starters.map((s) => ({ name: s, value: s }))
    );

    const dirName = await askInput(
      "Nama direktori tujuan (enter untuk gunakan nama starter):",
      chosen
    );

    return {
      mode: "interactive",
      starterNames: [chosen],
      baseDir: dirName ? path.resolve(process.cwd(), dirName) : undefined,
    };
  }

  const selectedFilters = await askCheckboxChoices(
    "Pilih taksonomi untuk memfilter starter (akan minta nilai untuk tiap yang dipilih):",
    [
      { name: "category", value: "category" },
      { name: "chapter", value: "chapter" },
      { name: "tags", value: "tags" },
      { name: "concepts", value: "concepts" },
    ]
  );

  const filters: Record<string, string> = {};
  for (const f of selectedFilters) {
    // eslint-disable-next-line no-await-in-loop
    const val = await askInput(
      `Masukkan nilai untuk ${f} (pisahkan koma untuk beberapa):`
    );
    filters[f] = val;
  }

  const matches = findMatchesByMetadata(startersDir, filters);

  if (matches.length === 0) {
    throw new Error(
      "Tidak ditemukan starter yang cocok dengan filter yang diberikan."
    );
  }

  const chosen = await askListChoice(
    "Pilih salah satu starter yang ditemukan:",
    matches.map((m) => ({ name: m, value: m }))
  );

  const dirName = await askInput(
    "Nama direktori tujuan (enter untuk gunakan nama starter):",
    chosen
  );

  return {
    mode: "interactive",
    starterNames: [chosen],
    baseDir: dirName ? path.resolve(process.cwd(), dirName) : undefined,
  };
}

/**
 * Resolve a creation plan from CLI options without interacting. Supports
 * positional names, metadata filters, or returns an interactive-mode plan
 * when input is insufficient.
 *
 * Throws when conflicting options are provided or when filters match zero
 * or multiple starters in non-interactive mode.
 */
function resolveCreatePlan(
  startersDir: string,
  opts: StarterCreateOptions
): CreatePlan {
  const names = opts.starterName ?? [];
  const usingFilters = hasAnyFilter(opts);

  if (names.length > 0 && usingFilters) {
    throw new Error(
      "Tidak boleh menggunakan positional starterName bersamaan dengan filter (--category/--chapter/--tags/--concepts)."
    );
  }

  if (names.length > 0) {
    return {
      mode: "positional",
      starterNames: names,
      baseDir: resolveDestinationBaseDir(opts),
    };
  }

  if (usingFilters) {
    const filters: Record<string, string> = {};
    if (opts.category) filters.category = opts.category;
    if (opts.chapter) filters.chapter = opts.chapter;
    if (opts.tags) filters.tags = opts.tags;
    if (opts.concepts) filters.concepts = opts.concepts;

    const matches = findMatchesByMetadata(startersDir, filters);
    if (matches.length === 0) {
      throw new Error(
        "Tidak ditemukan starter yang cocok dengan filter yang diberikan."
      );
    }

    // Non-interactive filter: jika match lebih dari 1, paksa user memilih via interactive
    // Biar deterministik dan tidak bikin kejutan.
    if (matches.length > 1) {
      throw new Error(
        `Filter menghasilkan lebih dari 1 kandidat: ${matches.join(
          ", "
        )}. Perjelas filter atau jalankan tanpa argumen agar mode interaktif membantu memilih.`
      );
    }

    const chosen = matches[0];

    // Jika dir tidak diberikan, default: pakai nama starter
    const baseDir =
      resolveDestinationBaseDir(opts) ?? path.resolve(process.cwd(), chosen);

    return {
      mode: "filter",
      starterNames: [chosen],
      baseDir,
      filters,
    };
  }

  // no meaningful input
  return {
    mode: "interactive",
    starterNames: [],
    baseDir: undefined,
  };
}

/**
 * Build a small summary object for user confirmation based on the `CreatePlan`.
 */
function buildSummary(plan: CreatePlan): Record<string, unknown> {
  const summary: Record<string, unknown> = {
    mode: plan.mode,
    starterNames: plan.starterNames,
  };
  if (plan.baseDir) summary.baseDir = plan.baseDir;
  if (plan.mode === "filter") summary.filters = plan.filters;
  return summary;
}

/**
 * Synchronously copy files and directories recursively from `src` to `dest`.
 *
 * This is a small utility replacement for recursive copy. It creates any
 * missing destination directories and copies files verbatim.
 */
function copyRecursiveSync(src: string, dest: string) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    }
    return;
  }

  fs.copyFileSync(src, dest);
}

/**
 * Resolve the final destination path for a given starter according to the
 * provided `CreatePlan`.
 *
 * Rules:
 * - Single starter: `baseDir` (if provided) is the final destination;
 *   otherwise `./<starterName>` in current working directory.
 * - Multiple starters: `baseDir` (if provided) acts as parent folder and the
 *   final path becomes `<baseDir>/<starterName>`; otherwise `./<starterName>`.
 */
function resolveDestForStarter(plan: CreatePlan, starterName: string): string {
  // Rules:
  // - jika hanya 1 starter:
  //   - baseDir jika diberikan adalah destinasi final
  //   - kalau baseDir tidak ada, default: ./<starterName>
  // - jika multi starter:
  //   - baseDir jika diberikan jadi folder induk: <baseDir>/<starterName>
  //   - kalau baseDir tidak ada, default: ./<starterName>
  const isSingle = plan.starterNames.length === 1;

  if (isSingle) {
    return plan.baseDir ?? path.resolve(process.cwd(), starterName);
  }

  const base = plan.baseDir ?? process.cwd();
  return path.join(base, starterName);
}

/**
 * CLI entry point: orchestrate resolving a plan (positional, filter or
 * interactive), confirm with the user, and create the chosen starter(s).
 *
 * This function performs validation, resolves typos to existing starter
 * names when possible, prompts for confirmation, and delegates the actual
 * copying to `createStarterFromPlan`.
 */
export async function runStarterCreate(options: StarterCreateOptions) {
  const startersDir = resolveStartersDir();
  logger.info(`Mencari starter di folder: ${startersDir}`);

  if (!fs.existsSync(startersDir)) {
    logger.error(`Folder starters tidak ditemukan: ${startersDir}`);
    return;
  }

  let plan: CreatePlan;
  try {
    plan = resolveCreatePlan(startersDir, options);

    if (plan.mode === "interactive" && plan.starterNames.length === 0) {
      plan = await interactiveResolvePlan(startersDir, options);
    }
  } catch (e) {
    logger.error(e instanceof Error ? e.message : String(e));
    return;
  }

  // Validasi starter name benar-benar ada, plus fallback simple (kalau ada typo)
  const finalNames: string[] = [];
  for (const n of plan.starterNames) {
    if (starterExists(startersDir, n)) {
      finalNames.push(n);
      continue;
    }

    const found = pickFirstExistingStarter(startersDir, [n]);
    if (!found) {
      logger.error(`Starter tidak ditemukan: ${n}`);
      return;
    }

    finalNames.push(found);
  }
  plan = { ...plan, starterNames: finalNames };

  const summary = buildSummary(plan);

  const confirm = await askConfirm(
    `Konfirmasi pilihan: ${JSON.stringify(summary)}. Lanjut?`,
    true
  );

  if (!confirm) {
    logger.info("Dibatalkan oleh pengguna.");
    return;
  }

  try {
    await createStarterFromPlan(plan, startersDir, false);
    logger.info("Selesai membuat starter.");
  } catch (err) {
    logger.error(
      `Gagal membuat starter: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}

/**
 * Execute copying of starter templates according to the resolved `plan`.
 *
 * When `dryRun` is true the function only logs intended operations without
 * making filesystem changes. Throws on errors such as missing starter or
 * existing destination directory.
 */
async function createStarterFromPlan(
  plan: CreatePlan,
  startersDir: string,
  dryRun = true
) {
  const names = plan.starterNames;
  if (names.length === 0) throw new Error("Tidak ada starterName diberikan.");

  for (const n of names) {
    const starterPath = path.join(startersDir, n);
    if (!starterExists(startersDir, n)) {
      throw new Error(`Starter tidak ditemukan: ${n}`);
    }

    const dest = resolveDestForStarter(plan, n);

    logger.info(
      `Menyalin template '${n}' -> '${dest}'${dryRun ? " (dry run)" : ""}`
    );

    if (dryRun) continue;

    if (fs.existsSync(dest)) {
      throw new Error(`Direktori tujuan sudah ada: ${dest}`);
    }

    copyRecursiveSync(starterPath, dest);
  }
}

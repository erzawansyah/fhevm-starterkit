/**
 * @path scripts/commands/starterCreate.ts
 * @script npm run starter:create <starterName> [dir] OR npm run starter:create -- --category ... --chapter ...
 * @description Membuat proyek starter baru berdasarkan template yang tersedia
 *
 * What actually does this script do?
 * - Menyediakan dua jalur pembuatan proyek starter:
 *   1) Jalur single create: Menggunakan argumen posisi <starterName> dan [dir] untuk menentukan template starter dan direktori tujuan
 *   2) Jalur conditional create: Menggunakan opsi --category dan/atau --chapter untuk memilih template starter berdasarkan kategori atau bab
 * - Memvalidasi input pengguna untuk memastikan bahwa hanya satu jalur yang digunakan pada satu waktu
 * - Menampilkan pesan kesalahan yang sesuai jika input tidak valid atau argumen kurang
 * - Menginisialisasi proses pembuatan proyek starter berdasarkan jalur yang dipilih
 *
 * What actually doesn't this script do?
 * - Tidak memodifikasi file atau folder apa pun secara langsung
 * - Tidak mengunduh atau mengkloning template starter apa pun secara langsung
 */

import { logger } from "../../lib/helper/logger";
import { GlobalOptions } from "../cli";
import fs from "fs";
import path from "path";
import * as readline from "readline";

type StarterCreateOptions = GlobalOptions & {
  starterName?: string[];
  dir?: string;
  category?: string;
  chapter?: string;
  tags?: string;
  concepts?: string;
};

/**
 * Fungsi pembantu untuk menanyakan input dari pengguna sekali saja
 * @param promptText  Teks prompt yang ditampilkan kepada pengguna
 * @returns  Jawaban pengguna sebagai string
 */
async function askOnce(promptText: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(promptText, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Menanyakan input teks dari pengguna dengan nilai default opsional
 * @param message  Teks pesan yang ditampilkan kepada pengguna
 * @param defaultVal  Nilai default yang digunakan jika pengguna tidak memasukkan apa pun
 * @returns  Jawaban pengguna sebagai string
 */
async function askInput(message: string, defaultVal?: string): Promise<string> {
  const suffix = defaultVal ? ` (enter untuk gunakan: ${defaultVal})` : "";
  const ans = await askOnce(`${message}${suffix}\n> `);
  const trimmed = ans.trim();
  return trimmed || (defaultVal ?? "");
}

/**
 * Menanyakan pilihan dari daftar opsi yang diberikan
 * @param message Teks pesan yang ditampilkan kepada pengguna
 * @param choices Daftar pilihan yang tersedia
 * @returns Nilai pilihan yang dipilih oleh pengguna
 */
async function askListChoice<T extends string | number>(
  message: string,
  choices: { name: string; value: T }[]
): Promise<T> {
  console.log(message);
  choices.forEach((c, i) => console.log(`${i + 1}) ${c.name}`));
  while (true) {
    const ans = (await askOnce("Pilih nomor:\n> ")).trim();
    const idx = parseInt(ans, 10);
    if (!Number.isNaN(idx) && idx >= 1 && idx <= choices.length) {
      return choices[idx - 1].value;
    }
    console.log("Pilihan tidak valid, coba lagi.");
  }
}

/**
 * Menanyakan beberapa pilihan dari daftar opsi yang diberikan
 * @param message Teks pesan yang ditampilkan kepada pengguna
 * @param choices Daftar pilihan yang tersedia
 * @returns Daftar nilai pilihan yang dipilih oleh pengguna
 */
async function askCheckboxChoices(
  message: string,
  choices: { name: string; value: string }[]
): Promise<string[]> {
  console.log(message);
  choices.forEach((c, i) => console.log(`${i + 1}) ${c.name}`));
  const ans = (
    await askOnce(
      "Masukkan nomor yang dipilih, pisahkan dengan koma (contoh: 1,3):\n> "
    )
  ).trim();
  if (!ans) return [];
  const parts = ans
    .split(",")
    .map((p) => parseInt(p.trim(), 10))
    .filter((n) => !Number.isNaN(n) && n >= 1 && n <= choices.length);
  const unique = Array.from(new Set(parts));
  return unique.map((i) => choices[i - 1].value);
}

/**
 * Menanyakan konfirmasi ya/tidak kepada pengguna
 * @param message Teks pesan yang ditampilkan kepada pengguna
 * @param defaultYes Apakah default adalah 'ya'
 * @returns True jika pengguna mengonfirmasi, false jika tidak
 */
async function askConfirm(
  message: string,
  defaultYes = true
): Promise<boolean> {
  const hint = defaultYes ? "Y/n" : "y/N";
  const ans = (await askOnce(`${message} (${hint})\n> `)).trim().toLowerCase();
  if (!ans) return defaultYes;
  return ["y", "yes"].includes(ans);
}

/**
 * Mendapatkan daftar nama starter yang tersedia dari direktori starters
 * @param startersDir Path ke direktori starters
 * @returns Daftar nama starter yang tersedia
 */
function listStarters(startersDir: string): string[] {
  try {
    const entries = fs.readdirSync(startersDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((d) => d.name)
      .sort();
  } catch (e) {
    return [];
  }
}

/**
 * Jalur interaktif untuk membuat starter
 * @param startersDir Path ke direktori starters
 * @param options Opsi pembuatan starter
 * @returns  Promise yang menyelesaikan proses pembuatan starter
 */
async function interactiveStarterCreate(
  startersDir: string,
  options: StarterCreateOptions
) {
  // Tampilkan pilihan untuk memilih jalur pembuatan starter
  const starters = listStarters(startersDir);

  // Tanyakan jalur pembuatan starter
  const mode = await askListChoice("Pilih jalur pembuatan starter:", [
    { name: "Pilih starter langsung", value: "starter" },
    {
      name: "Pilih berdasarkan filter (category/chapter/tags/concepts)",
      value: "filter",
    },
  ]);

  // Tergantung mode, lanjutkan sesuai pilihan
  // Jika mode 'starter', maka tanyakan nama starter dan direktori tujuan (jika belum diberikan)
  if (mode === "starter") {
    // Pastikan apakah
    if (starters.length === 0) {
      logger.error("Tidak ada starter tersedia di folder 'starters'.");
      return;
    }
    const chosen = await askListChoice(
      "Pilih starter:",
      starters.map((s) => ({ name: s, value: s }))
    );

    options.starterName = [chosen];
    if (!options.dir) {
      const dirName = await askInput(
        "Nama direktori tujuan (enter untuk gunakan nama starter):",
        chosen
      );
      options.dir = dirName || chosen;
    }
  } else {
    // filter flow: ask for which filters to apply and show matching starters (simple OR across metadata files if present)
    const filters = await askCheckboxChoices(
      "Pilih taksonomi untuk memfilter starter (akan minta nilai untuk tiap yang dipilih):",
      [
        { name: "category", value: "category" },
        { name: "chapter", value: "chapter" },
        { name: "tags", value: "tags" },
        { name: "concepts", value: "concepts" },
      ]
    );

    const filterValues: Record<string, string> = {};
    for (const f of filters) {
      // ask value for each selected filter (comma-separated values allowed)
      // eslint-disable-next-line no-await-in-loop
      const val = await askInput(
        `Masukkan nilai untuk ${f} (OR across values, pisahkan koma untuk beberapa):`
      );
      filterValues[f] = val;
    }

    // Simple matching: look for starter folders that contain a starter metadata file (starter.json or package.json) and match text
    const startersList = listStarters(startersDir);
    const matches: string[] = [];

    // Periksa setiap starter terhadap filter yang diberikan
    for (const s of startersList) {
      // Baca metadata file(s) jika ada
      const metadataFile = "metadata.json";
      let metaContent = "";
      try {
        const metaPath = path.join(startersDir, s, metadataFile);
        metaContent = fs.readFileSync(metaPath, "utf8");
      } catch (e) {
        // Jika tidak ada file metadata, lewati starter ini
        continue;
      }

      // Jika metadata ada, lowercase dan periksa kecocokan dengan filter
      const lowered = metaContent.toLowerCase();
      logger.info(`Memeriksa starter '${s}' dengan metadata: ${metaContent}`);

      // Cek kecocokan dengan filter (OR across all filter values)
      // @TODO: Bisa diperluas ke AND logic jika diperlukan
      let matched = false;
      for (const [, v] of Object.entries(filterValues)) {
        if (!v) continue;
        const parts = v
          .split(",")
          .map((p) => p.trim().toLowerCase())
          .filter(Boolean);
        for (const p of parts) {
          if (lowered.includes(p)) {
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
      if (matched) matches.push(s);
    }

    if (matches.length === 0) {
      logger.warning(
        "Tidak ditemukan starter yang cocok dengan filter yang diberikan."
      );
      process.exit(0);
    }

    const chosen = await askListChoice(
      "Pilih salah satu starter yang ditemukan:",
      matches.map((m) => ({ name: m, value: m }))
    );
    options.starterName = [chosen];
    const dirName = await askInput("Nama direktori tujuan:", chosen);
    options.dir = dirName;
  }
}

export async function runStarterCreate(options: StarterCreateOptions) {
  // helper: list available starter names from `starters/` directory
  const startersDir = path.resolve(__dirname, "..", "..", "starters");
  logger.info(`Mencari starter di folder: ${startersDir}`);

  // Apakah script memberikan satu atau lebih nama starter dan/atau filter?
  const providedStarterNames = options.starterName ?? [];

  // Apakah script memberikan filter taksonomi?
  const providedFilters = !!(
    options.category ||
    options.chapter ||
    options.tags ||
    options.concepts
  );
  logger.info(
    `Parameter starterName diberikan: ${
      providedStarterNames.length > 0
    }, filter diberikan: ${providedFilters}`
  );

  // Determine whether `dir` is required
  let dirRequired = false;
  if (providedStarterNames.length > 1) dirRequired = true;
  if (providedFilters) dirRequired = true;

  // If a single starterName provided, dir is optional; if not provided, fill from starterName
  if (providedStarterNames.length === 1 && !options.dir) {
    options.dir = providedStarterNames[0];
  }

  // Interactive flow when no meaningful parameters provided (using readline-based helpers)
  if (providedStarterNames.length === 0 && !providedFilters) {
    await interactiveStarterCreate(startersDir, options);
  }

  // Validate dir requirement now
  if (dirRequired && !options.dir) {
    logger.error(
      "Parameter 'dir' wajib ketika memilih banyak starter atau menggunakan filter."
    );
    return;
  }

  // Final confirmation
  const summary: Record<string, any> = {};
  if (options.starterName) summary.starterName = options.starterName;
  if (options.dir) summary.dir = options.dir;
  if (options.category) summary.category = options.category;
  if (options.chapter) summary.chapter = options.chapter;
  if (options.tags) summary.tags = options.tags;
  if (options.concepts) summary.concepts = options.concepts;

  const confirm = await askConfirm(
    `Konfirmasi pilihan: ${JSON.stringify(summary)}. Lanjut?`,
    true
  );

  if (!confirm) {
    logger.info("Dibatalkan oleh pengguna.");
    return;
  }

  // At this point, we would proceed to create the starter. For now, just log the final choices.
  logger.info("Menjalankan pembuatan starter dengan opsi:");
  for (const key of Object.keys(options)) {
    if (options[key as keyof StarterCreateOptions]) {
      logger.keyValue(key, options[key as keyof StarterCreateOptions]);
    }
  }
}

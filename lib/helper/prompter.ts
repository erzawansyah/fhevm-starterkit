import * as readline from "readline";

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

export { askInput, askListChoice, askCheckboxChoices, askConfirm };

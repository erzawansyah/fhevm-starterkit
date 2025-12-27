# Get Started dengan FHEVM StarterKit

Selamat datang di panduan quick start untuk FHEVM StarterKit! Di sini Anda akan menemukan langkah-langkah dasar untuk mulai menggunakan proyek ini, termasuk instalasi, konfigurasi, dan menjalankan contoh pertama.

## Prasyarat

Pastikan Anda sudah menginstal:

- **Node.js** (versi 20+)
- **npm** atau **yarn**
- **Git**

---

## Langkah 1: Clone Repository

Clone repository FHEVM StarterKit dari GitHub:

```bash
git clone https://github.com/erzawansyah/fhevm-starterkit.git
cd fhevm-starterkit
```

---

## Langkah 2: Install Dependencies

Install semua dependensi yang dibutuhkan:

```bash
npm install
```

---

## Langkah 3: Initialize Base Templates

Inisialisasi base templates dengan menjalankan:

```bash
npm run template:init
```

Perintah ini akan:

- Clone template Hardhat resmi dari Zama ke folder `base/hardhat-template/`
- Clone template UI relayer ke folder `base/frontend-template/`
- Setup markdown templates dan overrides

Proses inisialisasi ini **hanya perlu dilakukan sekali**. Jika Anda ingin menggunakan versi terbaru dari templates, gunakan:

```bash
npm run template:update
```

---

## Langkah 4: Build Frontend Template (Optional)

Jika Anda ingin menggunakan UI relayer, build frontend template:

```bash
npm run template:build-ui
```

Ini akan setup environment dan dependencies untuk frontend template.

---

## Langkah 5: Explore Available Starters

List semua starter yang tersedia:

```bash
npm run starter:list
```

Anda akan melihat output seperti:

```
Available Starters:

  fhe-add               - Encrypted addition example (fundamental)
  fhe-counter           - Encrypted counter example (fundamental)
  encrypt-multiple-values - Multiple value encryption (fundamental)
```

---

## Langkah 6: Create Project dari Starter

Ada dua cara membuat project baru dari starter:

### Cara 1: Direct dengan positional argument

```bash
npm run starter:create fhe-add -- --dir my-fhe-add
```

Ini akan membuat folder `workspace/my-fhe-add` berisi:

- Contract FHEAdd.sol (dari starter)
- Test file FHEAdd.ts
- Hardhat configuration dan dependencies

### Cara 2: Interactive mode

Jika tidak memberikan argument:

```bash
npm run starter:create
```

Script akan menampilkan menu interaktif untuk:

1. Pilih starter dari list
2. Filter by category, chapter, tags, atau concepts
3. Tentukan destination directory
4. Confirm sebelum create

### Contoh lainnya:

```bash
# Create dengan custom dir
npm run starter:create fhe-counter -- --dir ./my-project

# Create multiple starters
npm run starter:create fhe-add fhe-counter -- --dir ./multi-starters

# Filter by category
npm run starter:create -- --category fundamental --dir ./basics

# Filter by concepts
npm run starter:create -- --concepts "encrypted-add" --dir ./my-starter
```

Untuk penjelasan lengkap semua opsi, lihat [02_USING_STARTER_SCRIPT.md](02_USING_STARTER_SCRIPT.md).

---

## Langkah 7: Setup Project di Workspace

Setelah project tercipta, masuk ke directory project:

```bash
cd workspace/my-fhe-add
```

---

## Langkah 8: Install Project Dependencies

```bash
npm install
```

---

## Langkah 9: Compile & Test Contract

Compile kontrak Solidity:

```bash
npx hardhat compile
```

Jalankan test:

```bash
npx hardhat test
```

---

## Langkah 10: Deploy Contract (Optional)

### Deploy ke Hardhat Network (localhost)

Start Hardhat node di terminal pertama:

```bash
npx hardhat node
```

Di terminal kedua, deploy:

```bash
npx hardhat deploy
```

### Deploy ke Testnet (Sepolia)

```bash
npx hardhat deploy --network sepolia
```

> **Note:** Pastikan Anda sudah setup environment variables untuk Infura API key dan mnemonic jika ingin deploy ke testnet.

---

## Langkah 11: Interaksi dengan UI (Optional)

Jika Anda telah build frontend template, Anda bisa menjalankan UI untuk interaksi dengan kontrak:

```bash
npm run starter:start-ui
```

Buka browser ke `http://localhost:3000` untuk mengakses UI.

---

## Perintah Berguna

**List semua starter:**

```bash
npm run starter:list
```

**Create starter baru:**

```bash
npm run starter:create <name> -- --dir <destination>
```

**Update templates:**

```bash
npm run template:update
```

**Clean up (delete) generated projects:**

```bash
npm run starter:clean <project-name>
```

**Lint & format code:**

```bash
npm run lint
npm run format
```

**Generate schema (after modifying Zod schemas):**

```bash
npm run generate:schema
```

---

## Troubleshooting

**Template init gagal:**

- Pastikan Git sudah terinstall
- Check koneksi internet
- Run `npm run template:reset` kemudian `npm run template:init` lagi

**Starter create gagal:**

- Pastikan `npm run template:init` sudah selesai
- Check apakah folder `base/hardhat-template/` ada
- Run dengan `--verbose` flag untuk melihat detail error

**Test gagal:**

- Pastikan semua dependencies terinstall (`npm install`)
- Check bahwa kontrak compile tanpa error (`npx hardhat compile`)

---

## Next Steps

1. Baca [00_README.md](00_README.md) untuk overview lengkap struktur proyek
2. Lihat [02_USING_STARTER_SCRIPT.md](02_USING_STARTER_SCRIPT.md) untuk penjelasan command `starter:create`
3. Pelajari [03_AUTOMATION_SCRIPT.md](03_AUTOMATION_SCRIPT.md) untuk semua CLI commands yang tersedia
4. Check [04_COMMENTING_GUIDELINES.md](04_COMMENTING_GUIDELINES.md) untuk standar dokumentasi kontrak

---

## Kontribusi

Jika Anda ingin membuat starter baru atau berkontribusi, baca [AGENTS.md](../AGENTS.md) untuk development guidelines dan best practices.

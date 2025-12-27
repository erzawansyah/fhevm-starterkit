# FHEVM StarterKit

Dokumen ini menjelaskan **overview** dari proyek FHEVM StarterKit, termasuk fitur-fitur utama, teknologi yang digunakan, dan cara memulai.

Untuk panduan quick start, lihat [01_GET_STARTED.md](01_GET_STARTED.md).

## Penjelasan Struktur Project

Proyek FHEVM StarterKit memiliki struktur direktori sebagai berikut:

```plaintext
fhevm-starterkit/
├── base/                    # Local template clones (generated)
│   ├── hardhat-template/    # Official Zama Hardhat template
│   ├── frontend-template/   # Relayer UI template
│   ├── markdown-template/   # README generation template
│   ├── draft-template/      # Draft/experimental template
│   └── overrides/           # Custom override files
├── docs/                    # Project documentation
│   ├── 00_README.md
│   ├── 01_GET_STARTED.md
│   ├── 02_USING_STARTER_SCRIPT.md
│   ├── 03_AUTOMATION_SCRIPT.md
│   ├── 04_COMMENTING_GUIDELINES.md
│   └── starters/            # Generated starter docs
├── lib/                     # Core library & helpers
│   ├── helper/              # Utility functions
│   ├── types/               # TypeScript schemas
│   ├── schemas/             # JSON schema files
│   └── devtools/            # Development utilities
├── scripts/                 # CLI commands
│   ├── cli.ts              # Main entry point
│   └── commands/            # Individual commands
├── starters/                # Official FHEVM starters
│   ├── fhe-add/            # Encrypted addition example
│   ├── fhe-counter/        # Encrypted counter example
│   └── encrypt-multiple-values/
├── workspace/               # Generated projects (temp)
├── starterkit.config.ts     # Configuration file
├── package.json
├── AGENTS.md                # Development guidelines
└── README.md
```

### `base/` — Template Clones (Generated Locally)

Direktori ini berisi **local clones** dari template eksternal dan internal. Folder ini **tidak ada di git** dan di-generate dengan menjalankan `npm run template:init`.

**Struktur:**

- `hardhat-template/` — Template Hardhat resmi dari Zama (clone dari git)
- `frontend-template/` — Template UI relayer untuk interaksi kontrak FHEVM (clone dari git)
- `markdown-template/` — Template Handlebars untuk generate README
- `draft-template/` — Template draft/eksperimental
- `overrides/` — File-file custom untuk override pada saat copy

**Catatan penting:**

- Folder ini **di-generate lokal saja**, bukan commit ke git
- Gunakan `npm run template:update` untuk mengupdate ke versi terbaru
- Gunakan `npm run template:reset` untuk menghapus dan reinisialisasi

---

### `docs/` — Project Documentation

Dokumentasi utama proyek yang dirancang untuk **mudah digenerate** dan **siap diintegrasikan ke GitBook**.

**Struktur:**

- `00_README.md` — Overview proyek (file ini)
- `01_GET_STARTED.md` — Quick start guide
- `02_USING_STARTER_SCRIPT.md` — Penjelasan command `starter:create`
- `03_AUTOMATION_SCRIPT.md` — Penjelasan semua CLI commands
- `04_COMMENTING_GUIDELINES.md` — Standar anotasi kontrak untuk auto-doc
- `starters/` — Folder untuk dokumentasi hasil generate

---

### `lib/` — Core Library

Berisi **library internal** yang dipakai lintas script dan tooling.

**Struktur:**

- `helper/` — Utility functions (logger, path resolution, starters ops, validation, dll)
- `types/` — TypeScript schemas dengan Zod validation
- `schemas/` — JSON schema files (generated dari TypeScript schemas)
- `devtools/` — Development utilities (schema generator, dll)

**Prinsip:**

> Script boleh tipis; logika berat masuk ke `lib/` untuk maintainability.

---

### `scripts/` — CLI Commands

Berisi **seluruh tooling automation** yang menjadi inti nilai proyek.

**Struktur:**

- `cli.ts` — Main CLI entry point (Commander.js)
- `commands/` — Individual command implementations:
  - `templateInit.ts` — Clone base templates
  - `templateUpdate.ts` — Update templates to latest
  - `templateReset.ts` — Delete templates
  - `templateBuildUI.ts` — Build frontend template
  - `starterList.ts` — List available starters
  - `starterCreate.ts` — Create new projects dari starters
  - `starterAdd.ts` — Add new starter ke collection
  - `starterClean.ts` — Clean up generated projects

**Tersedia commands:**

- `npm run template:init` — Clone base templates
- `npm run template:update` — Update templates
- `npm run template:reset` — Delete templates
- `npm run template:build-ui` — Build frontend
- `npm run starter:list` — List starters
- `npm run starter:create` — Create project from starter
- `npm run starter:add` — Add new starter
- `npm run starter:clean` — Clean up projects

Lihat [03_AUTOMATION_SCRIPT.md](03_AUTOMATION_SCRIPT.md) untuk penjelasan lengkap.

---

### `starters/` — Official Starter Collection

Berisi **starter resmi FHEVM StarterKit** yang siap pakai.

Setiap folder adalah **satu unit pembelajaran** dengan struktur konsisten:

```plaintext
starter-name/
├── contracts/               # Solidity contracts
│   └── ContractName.sol
├── test/                    # Hardhat tests
│   └── ContractName.ts
├── README.md               # Starter documentation
└── metadata.json           # Metadata & taxonomy
```

**Klasifikasi starter:**

- **Category:** fundamental, patterns, applied, advanced
- **Chapter:** basics, encryption, decryption, access-control, dll
- **Tags:** DeFi, InfoFi, DeSci, dll (custom tags)
- **Concepts:** FHE operations & concepts yang diajarkan

**Contoh starters:**

- `fhe-add/` — Encrypted addition (fundamental)
- `fhe-counter/` — Encrypted counter (fundamental)
- `encrypt-multiple-values/` — Multiple value encryption (fundamental)

---

### `workspace/` — Generated Projects (Temporary)

Berisi **project hasil generate** dari command `starter:create`. Folder ini **bersifat temporary** dan **tidak ada di git**.

**Fungsi:**

- Output dari `npm run starter:create`
- User bebas mengembangkan lebih lanjut
- Pemisahan ini menjaga starter tetap clean

**Catatan:**

- Folder ini boleh dihapus kapan saja (tidak ada data penting)
- Git ignore file ini (.gitignore: `workspace/`)

---

## Tech Stack

- **Language:** TypeScript, Solidity
- **Runtime:** Node.js 20+
- **Package manager:** npm
- **Frameworks:** Hardhat (smart contracts), Vite (frontend)
- **Testing:** Hardhat test framework
- **Template Management:** Commander (CLI), Handlebars (templates), Zod (validation)
- **Linting/Formatting:** ESLint, Prettier

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Initialize base templates (required once)
npm run template:init

# List available starters
npm run starter:list

# Create a new project from a starter
npm run starter:create fhe-add -- --dir my-fhe-project

# Build frontend template
npm run template:build-ui

# Lint and format code
npm run lint
npm run format
```

Untuk panduan lengkap, lihat [01_GET_STARTED.md](01_GET_STARTED.md) dan [02_USING_STARTER_SCRIPT.md](02_USING_STARTER_SCRIPT.md).

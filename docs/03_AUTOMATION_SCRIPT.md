# Automation Scripts & CLI Commands

Dokumen ini menjelaskan **semua CLI commands** yang tersedia dalam FHEVM StarterKit untuk mengotomasi tugas-tugas umum.

---

## Template Management Commands

### `template:init` — Initialize Base Templates

Menginisialisasi base templates dengan meng-clone dari repository eksternal.

```bash
npm run template:init
```

**Apa yang terjadi:**

- Clone Hardhat template dari Zama ke `base/hardhat-template/`
- Clone relayer UI template ke `base/frontend-template/`
- Copy markdown templates ke `base/markdown-template/`
- Setup overrides di `base/overrides/`

**Options:**

- `--latest` — Clone latest branch HEAD instead of pinned commit
- `--force` — Overwrite existing templates jika sudah ada

**Catatan:**

- Hanya perlu dijalankan **sekali** saat setup
- Folder `base/` tidak di-commit ke git
- Commit hash untuk templates di-set di `starterkit.config.ts`

---

### `template:update` — Update Base Templates

Update templates ke versi terbaru dari branch HEAD.

```bash
npm run template:update
```

**Apa yang terjadi:**

- Pull latest changes dari hardhat-template repo
- Pull latest changes dari frontend-template repo
- Preserve local modifications (jika ada di overrides/)

**Kapan gunakan:**

- Ketika ada bug fix atau feature baru di template resmi
- Regular maintenance untuk tetap up-to-date

---

### `template:reset` (or `template:clean`) — Delete Base Templates

Menghapus seluruh folder `base/templates`. **DANGEROUS** — requires confirmation.

```bash
npm run template:reset
```

atau

```bash
npm run template:clean
```

**Options:**

- `--yes` — Skip confirmation dan langsung delete

**Kapan gunakan:**

- Troubleshooting jika template corrupt
- Cleanup sebelum `template:init` ulang

**Catatan:**

- Folder `workspace/` tidak terhapus (hanya `base/`)
- Run `template:init` lagi setelah delete

---

### `template:build-ui` — Build Frontend Template

Setup dan build frontend template untuk digunakan dalam projects.

```bash
npm run template:build-ui
```

**Apa yang terjadi:**

- Install dependencies di `base/frontend-template/`
- Compile/build frontend assets
- Generate distribution files di `base/frontend-template/dist/`

**Kapan gunakan:**

- Setup awal setelah `template:init`
- Ketika ingin gunakan UI relayer di generated projects

**Catatan:**

- Hanya perlu dijalankan jika ingin gunakan UI
- Build ini akan di-copy otomatis ke projects saat create

---

## Starter Management Commands

### `starter:list` — List Available Starters

Menampilkan semua starter yang tersedia dengan informasi metadata.

```bash
npm run starter:list
```

**Output format (default):**

```
Available Starters:

  fhe-add                  - Encrypted addition example
    Category: fundamental
    Chapter: basics, encryption
    Tags: math
    Concepts: encrypted-add

  fhe-counter              - Encrypted counter example
    Category: fundamental
    Chapter: basics, encryption
    Tags: state-management
    Concepts: encrypted-store

  encrypt-multiple-values  - Multiple value encryption
    Category: fundamental
    Chapter: encryption
    Tags: arrays
    Concepts: encrypted-array
```

**Options:**

- `--json` — Output dalam JSON format (untuk parsing)
- `--category <category>` — Filter by category
- `--verbose` — Show additional metadata (full paths, timestamps, dll)

**Kapan gunakan:**

- Explore available starters
- Check metadata sebelum `starter:create`
- CI/automation untuk list starters programmatically

---

### `starter:create` — Create Project dari Starter

Membuat project baru dengan menyalin starter dan base template.

```bash
npm run starter:create <starterName> -- --dir <destination>
```

**Mode:**

1. **Positional** — `npm run starter:create fhe-add -- --dir my-project`
2. **Filter** — `npm run starter:create -- --category fundamental --dir basics`
3. **Interactive** — `npm run starter:create` (tanpa arguments)

**Options:**

- `--dir <dir>` — Destination directory (wajib untuk multiple/filter)
- `--category <category>` — Filter by category
- `--chapter <chapter>` — Filter by chapter
- `--tags <tags>` — Filter by tags
- `--concepts <concepts>` — Filter by concepts
- `--skip-ui` — Skip copying UI/frontend files
- `--force` — Overwrite existing without prompt
- `--merge` — Merge dengan existing files
- `--yes` — Auto-confirm semua prompts

**Output:**

```plaintext
workspace/
└── my-project/
    ├── contracts/
    ├── test/
    ├── ui/
    ├── hardhat.config.ts
    └── package.json
```

**Catatan:**

- Require `template:init` sudah selesai
- Project ditempatkan di `workspace/` folder
- Support multiple starters dalam satu command

**Lihat:** [02_USING_STARTER_SCRIPT.md](02_USING_STARTER_SCRIPT.md) untuk penjelasan lengkap.

---

### `starter:add` — Add New Starter

Menambahkan starter baru ke collection di folder `starters/`.

```bash
npm run starter:add <starterName>
```

**Apa yang terjadi:**

- Prompt untuk metadata (category, chapter, tags, concepts)
- Create folder structure: `starters/<starterName>/`
- Generate `metadata.json`
- Prompt untuk copy contracts, tests

**Struktur hasil:**

```plaintext
starters/my-starter/
├── contracts/
│   └── MyContract.sol
├── test/
│   └── MyContract.ts
├── README.md
└── metadata.json
```

**Options:**

- `--interactive` (default) — Interactive prompt
- `--dir <path>` — Copy contracts dari directory lain

**Catatan:**

- Validate metadata terhadap schema
- Run `npm run check` setelah create untuk validate

---

### `starter:clean` — Clean Generated Projects

Menghapus project yang sudah di-generate di folder `workspace/`.

```bash
npm run starter:clean <projectName>
```

**Apa yang terjadi:**

- Delete folder `workspace/<projectName>/`
- Confirm sebelum delete

**Options:**

- `--force` — Delete tanpa prompt
- `--all` — Delete semua projects (hati-hati!)

**Contoh:**

```bash
npm run starter:clean my-project     # Delete workspace/my-project/
npm run starter:clean --all --force  # Delete semua di workspace/
```

---

## Utility Commands

### `check` — Validate All Starters

Mengecek konsistensi dan validitas semua starter di folder `starters/`.

```bash
npm run check
```

**Checks:**

- ✓ Setiap starter punya `metadata.json`
- ✓ Metadata valid terhadap schema
- ✓ Setiap starter punya `contracts/` folder
- ✓ Setiap starter punya `test/` folder
- ✓ Setiap starter punya `README.md`
- ✓ Category, chapter, tags dalam taxonomy

**Output:**

```
Checking starters...

✓ fhe-add - Valid
✓ fhe-counter - Valid
✗ my-starter - Missing contracts/ folder

2/3 starters valid. 1 error found.
```

**Kapan gunakan:**

- Sebelum commit changes ke git
- Setelah menambah/modify starter
- CI/automation untuk quality checks

---

### `generate:schema` — Generate JSON Schemas

Generate JSON schema files dari TypeScript Zod schemas.

```bash
npm run generate:schema
```

**Apa yang terjadi:**

- Read Zod schemas dari `lib/types/*.schema.ts`
- Generate corresponding JSON schema files di `lib/schemas/`
- Update documentation dari schema definitions

**Kapan gunakan:**

- Setelah memodify Zod schemas di `lib/types/`
- Untuk generate documentation otomatis

**Output:**

```
Generated:
  ✓ lib/schemas/starterMetadata.schema.json
  ✓ lib/schemas/starterkitConfig.schema.json
  ✓ docs/schemas/ (auto-docs)
```

---

### `lint` — Lint Code

Jalankan ESLint untuk check code quality.

```bash
npm run lint
```

**Scope:**

- TypeScript files di `scripts/`, `lib/`
- Exclude `base/` dan `workspace/`

**Options:**

```bash
npm run lint -- --fix      # Auto-fix formatting issues
npm run lint -- src/file   # Lint specific file
```

---

### `format` — Format Code

Format code menggunakan Prettier.

```bash
npm run format
```

**Scope:**

- TypeScript, Markdown, JSON files
- Exclude `base/` dan `workspace/`

---

### `debug:logger` — Test Logger Utility

Test logger dengan berbagai log levels.

```bash
npm run debug:logger
```

**Output:**

```
[INFO] This is an info message
[WARN] This is a warning
[ERROR] This is an error
[DEBUG] This is debug info (if enabled)
```

**Gunakan untuk:**

- Debug logger output format
- Test log level configuration

---

## Global Options (Available untuk semua commands)

| Option         | Type    | Description                         | Example                                    |
| -------------- | ------- | ----------------------------------- | ------------------------------------------ |
| `--cwd <path>` | string  | Run command dari directory lain     | `npm run starter:list -- --cwd ~/projects` |
| `--verbose`    | boolean | Show detailed logs dan debug info   | `npm run template:init -- --verbose`       |
| `--json`       | boolean | Output dalam JSON format (untuk CI) | `npm run starter:list -- --json`           |

---

## Workflow Examples

### Setup Baru

```bash
# 1. Install dependencies
npm install

# 2. Initialize templates
npm run template:init

# 3. Build UI template (optional)
npm run template:build-ui

# 4. Check everything is valid
npm run check
```

### Create Starter Project

```bash
# 1. List available starters
npm run starter:list

# 2. Create project
npm run starter:create fhe-add -- --dir my-fhe-project

# 3. Navigate dan develop
cd workspace/my-fhe-project
npm install
npm test
```

### Add Custom Starter

```bash
# 1. Add new starter
npm run starter:add my-custom-starter

# 2. Validate
npm run check

# 3. Can now use it
npm run starter:create my-custom-starter -- --dir test-my-starter
```

### CI/Automation

```bash
# 1. Setup
npm install
npm run template:init

# 2. Validate
npm run check
npm run lint

# 3. List in JSON
npm run starter:list -- --json > starters.json

# 4. Create test project
npm run starter:create fhe-add -- --dir test --force --verbose
```

---

## Troubleshooting

**Command not found:**

```bash
npm run template:init
# bash: template:init: command not found

# Solution: Use proper npm syntax
npm run template:init  # Correct
npx ts-node scripts/cli.ts template:init  # Alternative
```

**Template directory not found:**

```bash
npm run starter:create fhe-add -- --dir test
# Error: Base template not found

# Solution: Initialize templates first
npm run template:init
```

**Invalid metadata:**

```bash
npm run check
# Error: Starter 'my-starter' has invalid metadata

# Solution: Check metadata.json against schema
npm run generate:schema
# See lib/schemas/starterMetadata.schema.json
```

---

## Related Documentation

- [01_GET_STARTED.md](01_GET_STARTED.md) — Quick start guide
- [02_USING_STARTER_SCRIPT.md](02_USING_STARTER_SCRIPT.md) — Detailed `starter:create` reference
- [04_COMMENTING_GUIDELINES.md](04_COMMENTING_GUIDELINES.md) — Contract documentation standards
- [../AGENTS.md](../AGENTS.md) — Development guidelines & architecture

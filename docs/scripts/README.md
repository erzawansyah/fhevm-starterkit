# Dokumentasi Command FHEVM StarterKit

Dokumentasi lengkap untuk semua command yang tersedia di FHEVM StarterKit CLI.

## 📚 Daftar Isi

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Template Commands](#template-commands)
- [Starter Commands](#starter-commands)
- [Command Reference](#command-reference)
- [Workflow Examples](#workflow-examples)
- [Troubleshooting](#troubleshooting)

## Overview

FHEVM StarterKit menyediakan CLI untuk memudahkan pembuatan proyek smart contract dengan Fully Homomorphic Encryption (FHE). CLI ini memiliki 2 kategori command utama:

### 1. Template Commands

Command untuk mengelola template dasar (Hardhat dan Frontend):

- `template:init` - Inisialisasi template base
- `template:build-ui` - Build frontend template
- `template:update` - Update template ke versi terbaru
- `template:reset` / `template:clean` - Hapus template (reset ke state awal)

### 2. Starter Commands

Command untuk mengelola starter projects:

- `starter:list` - List starter projects yang tersedia
- `starter:create` - Buat workspace baru dari starter template
- `starter:clean` / `starter:reset` - Hapus workspace yang sudah dibuat

## Quick Start

### Setup Awal (First Time)

```bash
# 1. Clone atau download project
git clone <repo-url>
cd starterkit

# 2. Install dependencies
npm install

# 3. Setup templates (all-in-one)
npm run start
# Ini menjalankan: template:init + template:build-ui

# 4. Lihat starter yang tersedia
npm run starter:list

# 5. Buat project pertama
npm run starter:create fhe-counter --dir my-first-project

# 6. Mulai development
cd workspace/my-first-project
npm install
npm test
```

### Workflow Sehari-hari

```bash
# Explore starters
npm run starter:list

# Create workspace
npm run starter:create <starter-name> --dir <project-name>

# Development
cd workspace/<project-name>
npm install
npm run compile
npm test
npm run deploy
```

## Template Commands

Template commands mengelola base templates di folder `./base`.

### Overview Template Commands

| Command             | Purpose              | Frequency           | Destructive       |
| ------------------- | -------------------- | ------------------- | ----------------- |
| `template:init`     | Clone base templates | Once (setup)        | No                |
| `template:build-ui` | Build frontend       | Once (setup)        | No                |
| `template:update`   | Update to latest     | Occasional          | Semi (overwrites) |
| `template:reset`    | Clean templates      | Rare (troubleshoot) | Yes               |

### 1. template:init

**Purpose**: Inisialisasi base templates (Hardhat & Frontend) ke folder `./base`

**Dokumentasi**: [template-init.md](./template-init.md)

**Usage**:

```bash
npm run template:init [options]
```

**Options**:

- `--latest` - Gunakan versi terbaru (skip pinned commit)
- `--force` - Overwrite existing templates

**Kapan Digunakan**:

- Setup awal project
- Setelah `template:reset`
- Fresh installation

**Example**:

```bash
# Normal init (recommended)
npm run template:init

# Latest version
npm run template:init -- --latest

# Force overwrite
npm run template:init -- --force
```

### 2. template:build-ui

**Purpose**: Setup dan build frontend template

**Dokumentasi**: [template-build-ui.md](./template-build-ui.md)

**Usage**:

```bash
npm run template:build-ui [options]
```

**Prasyarat**:

- Template sudah di-init (`npm run template:init`)
- File `.env.local` ada di root project

**Kapan Digunakan**:

- Setelah `template:init`
- Setelah update `.env.local`
- After template:update (jika frontend berubah)

**Example**:

```bash
# Normal build
npm run template:build-ui

# With verbose logs
npm run template:build-ui -- --verbose
```

### 3. template:update

**Purpose**: Update templates ke versi terbaru dari repository

**Dokumentasi**: [template-update.md](./template-update.md)

**Usage**:

```bash
npm run template:update [options]
```

**Kapan Digunakan**:

- Update berkala (weekly/monthly)
- Setelah announcement update penting
- Untuk mendapatkan bug fixes & improvements

**Warning**: ⚠️ Perubahan lokal akan hilang!

**Example**:

```bash
# Update templates
npm run template:update

# With verbose logs
npm run template:update -- --verbose
```

### 4. template:reset / template:clean

**Purpose**: Hapus semua template dari folder `./base`

**Dokumentasi**: [template-reset.md](./template-reset.md)

**Usage**:

```bash
npm run template:reset [options]
# atau
npm run template:clean [options]
```

**Options**:

- `--yes` - Skip konfirmasi (dangerous!)

**Kapan Digunakan**:

- Template corrupt
- Clean slate development
- Troubleshooting

**Warning**: ⚠️ **DESTRUCTIVE** - tidak bisa di-undo!

**Example**:

```bash
# With confirmation (safe)
npm run template:reset

# Force without confirmation (dangerous!)
npm run template:reset -- --yes
```

## Starter Commands

Starter commands mengelola workspace projects di folder `./workspace`.

### Overview Starter Commands

| Command          | Purpose                 | Frequency   | Destructive |
| ---------------- | ----------------------- | ----------- | ----------- |
| `starter:list`   | List available starters | As needed   | No          |
| `starter:create` | Create new workspace    | Per project | No          |
| `starter:clean`  | Delete workspace        | Cleanup     | Yes         |

### 1. starter:list

**Purpose**: Menampilkan daftar starter projects yang tersedia

**Dokumentasi**: [starter-list.md](./starter-list.md)

**Usage**:

```bash
npm run starter:list [options]
```

**Options**:

- `--mode <mode>` - Output mode: `table`, `json`, `detailed`
- `--category <category>` - Filter by category
- `--chapter <chapter>` - Filter by chapter
- `--tags <tags>` - Filter by tags (comma-separated)
- `--concepts <concepts>` - Filter by concepts
- `--count <number>` - Limit results

**Example**:

```bash
# List all (table view)
npm run starter:list

# Detailed view
npm run starter:list -- --mode detailed

# JSON output
npm run starter:list -- --mode json

# Filter by category
npm run starter:list -- --category fundamental

# Filter by tags
npm run starter:list -- --tags defi,token

# Combine filters
npm run starter:list -- --category patterns --chapter intermediate
```

### 2. starter:create

**Purpose**: Membuat workspace baru dari starter template(s)

**Dokumentasi**: [starter-create.md](./starter-create.md)

**Usage**:

```bash
# Positional mode
npm run starter:create <starterName...> [options]

# Filter mode
npm run starter:create -- --category <category> [options]

# Interactive mode
npm run starter:create
```

**Options**:

- `-d, --dir <dir>` - Target directory name
- `--category <category>` - Filter: by category
- `--chapter <chapter>` - Filter: by chapter
- `--tags <tags...>` - Filter: by tags
- `--concepts <concepts...>` - Filter: by concepts
- `--and` - Use AND operator for filters
- `--skip-ui` - Skip frontend files
- `--force` - Overwrite existing workspace

**3 Mode Pemilihan**:

1. **Positional Mode** - Pilih by name:

   ```bash
   npm run starter:create fhe-counter
   npm run starter:create fhe-counter simple-voting --dir my-workspace
   ```

2. **Filter Mode** - Pilih by metadata:

   ```bash
   npm run starter:create -- --category fundamental
   npm run starter:create -- --tags defi token --chapter intermediate
   npm run starter:create -- --tags defi token --and  # AND logic
   ```

3. **Interactive Mode** - Guided prompts:
   ```bash
   npm run starter:create
   # Follow prompts...
   ```

**Example**:

```bash
# Single starter
npm run starter:create fhe-counter

# Custom directory
npm run starter:create fhe-counter --dir my-project

# Multiple starters
npm run starter:create fhe-counter simple-voting --dir multi-starter-workspace

# Filter by category
npm run starter:create -- --category fundamental --dir fundamentals

# Skip frontend
npm run starter:create fhe-counter --skip-ui --dir backend-only

# Force overwrite
npm run starter:create fhe-counter --dir my-project --force
```

### 3. starter:clean / starter:reset

**Purpose**: Hapus workspace yang sudah dibuat

**Dokumentasi**: [starter-clean.md](./starter-clean.md)

**Usage**:

```bash
npm run starter:clean <starterName...> [options]
# atau
npm run starter:reset <starterName...> [options]
```

**Options**:

- `--force` - Skip konfirmasi (dangerous!)

**Warning**: ⚠️ **DESTRUCTIVE** - tidak bisa di-undo!

**Example**:

```bash
# Clean single workspace (with confirmation)
npm run starter:clean fhe-counter

# Clean multiple workspaces
npm run starter:clean test-1 test-2 test-3

# Force without confirmation
npm run starter:clean old-project --force
```

## Command Reference

### Quick Reference Table

| Command             | Alias            | Category | Purpose              | Destructive |
| ------------------- | ---------------- | -------- | -------------------- | ----------- |
| `template:init`     | -                | Template | Clone base templates | No          |
| `template:build-ui` | -                | Template | Build frontend       | No          |
| `template:update`   | -                | Template | Update templates     | Semi        |
| `template:reset`    | `template:clean` | Template | Delete templates     | Yes         |
| `starter:list`      | -                | Starter  | List starters        | No          |
| `starter:create`    | -                | Starter  | Create workspace     | No          |
| `starter:clean`     | `starter:reset`  | Starter  | Delete workspace     | Yes         |

### Global Options

Berlaku untuk semua command:

| Option         | Type    | Description       |
| -------------- | ------- | ----------------- |
| `--cwd <path>` | string  | Working directory |
| `--verbose`    | boolean | Detailed logs     |
| `--json`       | boolean | JSON output mode  |

## Workflow Examples

### 1. First Time Setup

```bash
# Clone repository
git clone <repo-url>
cd starterkit

# Install dependencies
npm install

# Setup templates (all-in-one)
npm run start

# Explore available starters
npm run starter:list

# Create first project
npm run starter:create fhe-counter --dir my-first-project

# Start developing
cd workspace/my-first-project
npm install
npm run compile
npm test
```

### 2. Create Multiple Projects

```bash
# Setup once
npm run start

# Project 1: Basic counter
npm run starter:create fhe-counter --dir counter-app

# Project 2: Voting system
npm run starter:create simple-voting --dir voting-dao

# Project 3: Token with access control
npm run starter:create erc20-token access-control-role --dir token-with-acl
```

### 3. Exploration Workflow

```bash
# List all starters
npm run starter:list

# Filter by use case
npm run starter:list -- --tags defi

# See details
npm run starter:list -- --mode detailed

# Create selected starter
npm run starter:create erc20-token --dir my-defi-app
```

### 4. Update Workflow

```bash
# Update templates
npm run template:update

# Rebuild frontend if needed
npm run template:build-ui

# Create fresh project dengan updated templates
npm run starter:create fhe-counter --dir updated-project
```

### 5. Cleanup Workflow

```bash
# List workspaces
ls workspace/

# Clean old test workspaces
npm run starter:clean test-1 test-2 test-3 --force

# Clean and recreate
npm run starter:clean my-project
npm run starter:create fhe-counter --dir my-project
```

### 6. Troubleshooting Workflow

```bash
# If templates corrupt
npm run template:reset -- --yes
npm run template:init
npm run template:build-ui

# If workspace has issues
npm run starter:clean problematic-workspace --force
npm run starter:create fhe-counter --dir problematic-workspace
```

## Troubleshooting

### Common Issues & Solutions

#### 1. "Template tidak ditemukan"

**Problem**: Running `starter:create` before `template:init`

**Solution**:

```bash
npm run template:init
npm run template:build-ui
# Lalu create starter
npm run starter:create fhe-counter
```

#### 2. ".env.local tidak ditemukan"

**Problem**: Running `template:build-ui` tanpa `.env.local`

**Solution**:

```bash
# Buat file .env.local di root
touch .env.local

# Isi dengan env variables
echo "VITE_BLOCKCHAIN_RPC_URL=https://..." >> .env.local
echo "VITE_CHAIN_ID=8009" >> .env.local

# Lalu build
npm run template:build-ui
```

#### 3. "Destination directory already exists"

**Problem**: Workspace sudah ada

**Solution**:

```bash
# Option A: Use different name
npm run starter:create fhe-counter --dir fhe-counter-v2

# Option B: Force overwrite
npm run starter:create fhe-counter --dir fhe-counter --force

# Option C: Clean first
npm run starter:clean fhe-counter
npm run starter:create fhe-counter
```

#### 4. "Starter not found"

**Problem**: Typo atau starter tidak ada

**Solution**:

```bash
# List available starters
npm run starter:list

# Create dengan nama yang benar
npm run starter:create <correct-name>
```

#### 5. npm install gagal di workspace

**Problem**: Dependencies error setelah create workspace

**Solution**:

```bash
cd workspace/my-project

# Clean install
rm -rf node_modules package-lock.json
npm install

# Atau gunakan cache clear
npm cache clean --force
npm install
```

#### 6. Template update conflict

**Problem**: Local changes conflict saat update

**Solution**:

```bash
# Option A: Commit changes first
cd ./base/hardhat-template
git add .
git commit -m "my changes"
git branch my-changes  # backup

# Lalu update
cd ../..
npm run template:update

# Option B: Reset dan init ulang
npm run template:reset -- --yes
npm run template:init
```

## Best Practices

### 1. Setup Workflow

```bash
# ✅ Correct order
npm install           # Dependencies
npm run start         # Templates
npm run starter:list  # Explore
npm run starter:create <name>  # Create

# ❌ Wrong order
npm run starter:create <name>  # ERROR: template not found
```

### 2. Version Control

```bash
# Commit workspace setelah create
npm run starter:create fhe-counter --dir my-project
cd workspace/my-project
git init
git add .
git commit -m "Initial commit from starter"
```

### 3. Testing Before Production

```bash
# Create test workspace
npm run starter:create fhe-counter --dir test-counter
cd workspace/test-counter
npm install
npm test

# If OK, create production
cd ../..
npm run starter:create fhe-counter --dir production-counter
```

### 4. Regular Updates

```bash
# Update templates monthly
npm run template:update
npm run template:build-ui

# Test dengan workspace baru
npm run starter:create fhe-counter --dir test-updated
cd workspace/test-updated
npm install && npm test
```

### 5. Cleanup Test Workspaces

```bash
# Regular cleanup
npm run starter:clean test-1 test-2 test-3 --force

# Keep workspace directory clean
ls workspace/  # Should only have active projects
```

## Integration dengan Tools Lain

### Git

```bash
# Track templates (optional)
git add ./base
git commit -m "chore: update templates"

# Track workspaces
git add workspace/my-project
git commit -m "feat: create new workspace"

# .gitignore recommendations:
# /workspace/*/node_modules
# /workspace/*/.env
# /workspace/*/dist
```

### VS Code

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Setup Templates",
      "type": "shell",
      "command": "npm run start"
    },
    {
      "label": "List Starters",
      "type": "shell",
      "command": "npm run starter:list"
    },
    {
      "label": "Create Starter",
      "type": "shell",
      "command": "npm run starter:create ${input:starterName} --dir ${input:dirName}"
    }
  ],
  "inputs": [
    {
      "id": "starterName",
      "type": "promptString",
      "description": "Starter name"
    },
    {
      "id": "dirName",
      "type": "promptString",
      "description": "Directory name"
    }
  ]
}
```

### CI/CD

```yaml
# .github/workflows/test-starters.yml
name: Test Starters
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
      - name: Install
        run: npm install
      - name: Setup Templates
        run: npm run start
      - name: Create & Test Workspace
        run: |
          npm run starter:create fhe-counter --dir test-workspace
          cd workspace/test-workspace
          npm install
          npm test
```

## Additional Resources

### Dokumentasi Detail

- [template-init.md](./template-init.md) - Template initialization
- [template-build-ui.md](./template-build-ui.md) - Frontend build
- [template-update.md](./template-update.md) - Template updates
- [template-reset.md](./template-reset.md) - Template cleanup
- [starter-list.md](./starter-list.md) - List starters
- [starter-create.md](./starter-create.md) - Create workspace
- [starter-clean.md](./starter-clean.md) - Clean workspace

### Project Documentation

- `../00_README.md` - Project overview
- `../01_GET_STARTED.md` - Getting started guide
- `../02_USING_STARTER_SCRIPT.md` - Starter script usage
- `../03_AUTOMATION_SCRIPT.md` - Automation guidelines
- `../04_COMMENTING_GUIDELINES.md` - Code commenting

### External Links

- FHEVM Documentation: https://docs.zama.ai/fhevm
- Hardhat Documentation: https://hardhat.org/docs
- Vite Documentation: https://vitejs.dev/guide

## Support & Contribution

### Getting Help

1. Check dokumentasi command specific
2. Review troubleshooting section
3. Check project issues/discussions
4. Contact maintainer

### Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintainer**: M.E.W

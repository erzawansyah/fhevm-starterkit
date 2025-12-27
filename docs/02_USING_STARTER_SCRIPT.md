# Using the Starter Create Command

## Overview

Command `starter:create` adalah command utama untuk membuat project baru dari starter templates yang tersedia di folder `starters/`. Command ini support tiga mode:

1. **Positional** — Select starter via nama di command line
2. **Filter** — Select starter via taxonomy (category, chapter, tags, concepts)
3. **Interactive** — Interactive menu jika tidak ada arguments

---

## Quick Syntax

### Mode 1: Positional (Direct nama starter)

```bash
# Single starter (--dir opsional, default = starter name)
npm run starter:create fhe-add

# Single starter dengan custom dir
npm run starter:create fhe-add -- --dir ./my-project

# Multiple starters (--dir wajib)
npm run starter:create fhe-add fhe-counter -- --dir ./my-projects
```

### Mode 2: Filter (By taxonomy)

```bash
# Filter by category
npm run starter:create -- --category fundamental --dir ./basics

# Filter by chapter
npm run starter:create -- --chapter encryption --dir ./encryption-starters

# Filter by tags
npm run starter:create -- --tags DeFi --dir ./defi-examples

# Filter by concepts
npm run starter:create -- --concepts "encrypted-add" --dir ./math-examples

# Multiple filters (OR logic — pilih starter yang match ANY filter)
npm run starter:create -- --category fundamental --tags DeFi --dir ./filtered
```

### Mode 3: Interactive

```bash
# Tidak ada arguments = interactive mode
npm run starter:create
```

---

## Parameters & Flags

### Positional Arguments

| Argument            | Description                  | Required?                                |
| ------------------- | ---------------------------- | ---------------------------------------- |
| `<starterNames...>` | Satu atau lebih nama starter | No (opsional di mode filter/interactive) |

### Options

| Option                  | Shorthand | Type    | Description                                      |
| ----------------------- | --------- | ------- | ------------------------------------------------ |
| `--dir <dir>`           | `-d`      | string  | Destination directory (inside `workspace/`)      |
| `--category <category>` |           | string  | Filter by category (repeatable)                  |
| `--chapter <chapter>`   |           | string  | Filter by chapter (repeatable)                   |
| `--tags <tags>`         |           | string  | Filter by tags, comma-separated (repeatable)     |
| `--concepts <concepts>` |           | string  | Filter by concepts, comma-separated (repeatable) |
| `--force`               | `-f`      | boolean | Overwrite existing directory tanpa prompt        |
| `--skip-ui`             |           | boolean | Skip copying frontend/UI files                   |

### Global Options (available untuk semua commands)

| Option         | Type    | Description                                 |
| -------------- | ------- | ------------------------------------------- |
| `--cwd <path>` | string  | Run command dari directory lain             |
| `--verbose`    | boolean | Show detailed logs                          |
| `--json`       | boolean | Output in JSON format (untuk CI/automation) |

---

## Rules & Validation

### Directory (`--dir`) Requirements

| Scenario                    | `--dir` Required? | Default               |
| --------------------------- | ----------------- | --------------------- |
| Single starter (positional) | No                | Starter name          |
| Multiple starters           | Yes               | —                     |
| Any filter usage            | Yes               | —                     |
| Interactive mode            | Asked during flow | Single = starter name |

### Filter Semantics

- Filters digabung dengan **OR logic**
- Contoh: `--category fundamental --tags DeFi` = starter yang category=fundamental **OR** tags=DeFi
- Jika ingin AND logic, run multiple commands atau use positional arguments

### Validation

- Jika `--dir` tidak diberikan dan required, command akan error dan exit
- Jika starter tidak ditemukan, error dan suggestion alternatives
- Jika target directory sudah ada, prompt tanya: overwrite/merge/rename (kecuali `--force`)

---

## Interactive Flow (Detailed)

Ketika `npm run starter:create` dijalankan tanpa arguments:

```
1. Choose selection method:
   [1] Pick starter directly from list
   [2] Pick by filters (category, chapter, tags, concepts)

2. (If option 1) Select starter(s):
   - Display list dari starters/
   - User pilih satu atau lebih

   (If option 2) Enter filter values:
   - Prompt: Category? (optional)
   - Prompt: Chapter? (optional)
   - Prompt: Tags? (optional)
   - Prompt: Concepts? (optional)
   - Script scan dan display matching starters

3. Select destination directory:
   - Prompt: Where to create? (default = starter name jika single)
   - Validate path

4. Review & confirm:
   - Show summary (selected starters, destination, action)
   - Prompt: Create? [y/n]

5. Create project(s):
   - Copy starters ke workspace/<dir>/
   - Show success message
```

---

## Examples

### Create Single Starter

```bash
# Gunakan default dir (= starter name)
npm run starter:create fhe-add

# Result: workspace/fhe-add/

# Custom dir
npm run starter:create fhe-add -- --dir ./my-encrypted-add

# Result: workspace/my-encrypted-add/
```

### Create Multiple Starters

```bash
# Create beberapa starter ke satu dir
npm run starter:create fhe-add fhe-counter -- --dir ./my-examples

# Result:
#   workspace/my-examples/fhe-add/
#   workspace/my-examples/fhe-counter/
```

### Filter by Category

```bash
# Get all fundamental starters
npm run starter:create -- --category fundamental --dir ./basics

# Result: workspace/basics/ berisi semua fundamental starters
```

### Filter by Multiple Criteria

```bash
# Starters yang category=applied OR tags=DeFi
npm run starter:create -- --category applied --tags DeFi --dir ./advanced

# Result: workspace/advanced/ berisi starters yang match
```

### Interactive Mode

```bash
npm run starter:create

# Output:
# ? Choose selection method: (Use arrow keys)
# ❯ Pick starter directly from list
#   Pick by filters
```

### With Flags

```bash
# Overwrite tanpa prompt
npm run starter:create fhe-add -- --dir ./existing --force

# Skip UI files
npm run starter:create fhe-counter -- --dir ./no-ui --skip-ui

# Verbose logging
npm run starter:create fhe-add -- --dir ./debug --verbose

# JSON output (untuk CI/automation)
npm run starter:create -- --category fundamental --dir ./json --json
```

---

## Output Structure

Setelah `starter:create` sukses, struktur workspace:

```plaintext
workspace/
└── my-fhe-project/          (destination dir)
    ├── contracts/           (dari starter)
    │   └── FHEAdd.sol
    ├── test/                (dari starter)
    │   └── FHEAdd.ts
    ├── ui/                  (dari template, jika --skip-ui tidak dipakai)
    │   ├── src/
    │   ├── public/
    │   └── ...
    ├── hardhat.config.ts    (dari template)
    ├── package.json         (merged dengan starter + template)
    ├── README.md            (dari starter atau generated)
    └── ...
```

---

## Troubleshooting

### Starter tidak ditemukan

```bash
npm run starter:create non-existent -- --dir test
# Error: Starter 'non-existent' not found
# Did you mean: fhe-add, fhe-counter, encrypt-multiple-values?
```

**Solution:** List available starters:

```bash
npm run starter:list
```

### Directory sudah ada

```bash
npm run starter:create fhe-add -- --dir ./existing
# Error: Directory workspace/existing already exists
# Options: [o]verwrite, [m]erge, [r]ename, [c]ancel
```

**Solution:** Use `--force` untuk auto-overwrite, atau `--dir` beda:

```bash
npm run starter:create fhe-add -- --dir ./existing --force
npm run starter:create fhe-add -- --dir ./existing-v2
```

### Filter tidak match

```bash
npm run starter:create -- --category nonexistent --dir test
# Error: No starters found matching filters
# Check category, chapter, tags, concepts
```

**Solution:** Run `starter:list` untuk available values

### Template tidak initialized

```bash
npm run starter:create fhe-add -- --dir test
# Error: Base template not found (base/hardhat-template/)
# Run: npm run template:init
```

**Solution:** Initialize templates first:

```bash
npm run template:init
```

---

## Related Commands

| Command                        | Purpose                       |
| ------------------------------ | ----------------------------- |
| `npm run starter:list`         | List all available starters   |
| `npm run starter:add`          | Add new starter ke collection |
| `npm run starter:clean <name>` | Delete generated project      |
| `npm run template:init`        | Initialize base templates     |
| `npm run template:update`      | Update base templates         |

---

## Notes for CI/Automation

Untuk automation (GitHub Actions, CI/CD), gunakan JSON output:

```bash
npm run starter:create fhe-add -- --dir test --json
```

Output:

```json
{
  "success": true,
  "starterName": "fhe-add",
  "destination": "workspace/test",
  "message": "Project created successfully"
}
```

Gunakan `--force` untuk skip prompts dan auto-overwrite.

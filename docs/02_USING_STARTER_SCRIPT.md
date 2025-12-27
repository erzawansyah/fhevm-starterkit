# Using the Starter Create Command

## Overview

The `starter:create` command is the main command for creating new projects from starter templates available in the `starters/` folder. This command supports three modes:

1. **Positional** — Select starter via name in command line
2. **Filter** — Select starter via taxonomy (category, chapter, tags, concepts)
3. **Interactive** — Interactive menu if no arguments provided

---

## Quick Syntax

### Mode 1: Positional (Direct starter name)

```bash
# Single starter (--dir optional, default = starter name)
npm run starter:create fhe-add

# Single starter with custom dir
npm run starter:create fhe-add -- --dir ./my-project

# Multiple starters (--dir required)
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

# Multiple filters (OR logic — select starters matching ANY filter)
npm run starter:create -- --category fundamental --tags DeFi --dir ./filtered
```

### Mode 3: Interactive

```bash
# No arguments = interactive mode
npm run starter:create
```

---

## Parameters & Flags

### Positional Arguments

| Argument            | Description               | Required?                                |
| ------------------- | ------------------------- | ---------------------------------------- |
| `<starterNames...>` | One or more starter names | No (optional in filter/interactive mode) |

### Options

| Option                  | Shorthand | Type    | Description                                      |
| ----------------------- | --------- | ------- | ------------------------------------------------ |
| `--dir <dir>`           | `-d`      | string  | Destination directory (inside `workspace/`)      |
| `--category <category>` |           | string  | Filter by category (repeatable)                  |
| `--chapter <chapter>`   |           | string  | Filter by chapter (repeatable)                   |
| `--tags <tags>`         |           | string  | Filter by tags, comma-separated (repeatable)     |
| `--concepts <concepts>` |           | string  | Filter by concepts, comma-separated (repeatable) |
| `--force`               | `-f`      | boolean | Overwrite existing directory without prompt      |
| `--skip-ui`             |           | boolean | Skip copying frontend/UI files                   |

### Global Options (available for all commands)

| Option         | Type    | Description                               |
| -------------- | ------- | ----------------------------------------- |
| `--cwd <path>` | string  | Run command from different directory      |
| `--verbose`    | boolean | Show detailed logs                        |
| `--json`       | boolean | Output in JSON format (for CI/automation) |

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

- Filters are combined with **OR logic**
- Example: `--category fundamental --tags DeFi` = starters with category=fundamental **OR** tags=DeFi
- If you want AND logic, run multiple commands or use positional arguments

### Validation

- If `--dir` is not provided and required, command will error and exit
- If starter not found, error with suggested alternatives
- If target directory exists, prompt to: overwrite/merge/rename (unless `--force`)

---

## Interactive Flow (Detailed)

When `npm run starter:create` is run without arguments:

```
1. Choose selection method:
   [1] Pick starter directly from list
   [2] Pick by filters (category, chapter, tags, concepts)

2. (If option 1) Select starter(s):
   - Display list from starters/
   - User picks one or more

   (If option 2) Enter filter values:
   - Prompt: Category? (optional)
   - Prompt: Chapter? (optional)
   - Prompt: Tags? (optional)
   - Prompt: Concepts? (optional)
   - Script scans and displays matching starters

3. Select destination directory:
   - Prompt: Where to create? (default = starter name if single)
   - Validate path

4. Review & confirm:
   - Show summary (selected starters, destination, action)
   - Prompt: Create? [y/n]

5. Create project(s):
   - Copy starters to workspace/<dir>/
   - Show success message
```

---

## Examples

### Create Single Starter

```bash
# Use default dir (= starter name)
npm run starter:create fhe-add

# Result: workspace/fhe-add/

# Custom dir
npm run starter:create fhe-add -- --dir ./my-encrypted-add

# Result: workspace/my-encrypted-add/
```

### Create Multiple Starters

```bash
# Create several starters to one dir
npm run starter:create fhe-add fhe-counter -- --dir ./my-examples

# Result:
#   workspace/my-examples/fhe-add/
#   workspace/my-examples/fhe-counter/
```

### Filter by Category

```bash
# Get all fundamental starters
npm run starter:create -- --category fundamental --dir ./basics

# Result: workspace/basics/ contains all fundamental starters
```

### Filter by Multiple Criteria

```bash
# Starters with category=applied OR tags=DeFi
npm run starter:create -- --category applied --tags DeFi --dir ./advanced

# Result: workspace/advanced/ contains matching starters
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
# Overwrite without prompt
npm run starter:create fhe-add -- --dir ./existing --force

# Skip UI files
npm run starter:create fhe-counter -- --dir ./no-ui --skip-ui

# Verbose logging
npm run starter:create fhe-add -- --dir ./debug --verbose

# JSON output (for CI/automation)
npm run starter:create -- --category fundamental --dir ./json --json
```

---

## Output Structure

After `starter:create` succeeds, workspace structure:

```plaintext
workspace/
└── my-fhe-project/          (destination dir)
    ├── contracts/           (from starter)
    │   └── FHEAdd.sol
    ├── test/                (from starter)
    │   └── FHEAdd.ts
    ├── ui/                  (from template, if --skip-ui not used)
    │   ├── src/
    │   ├── public/
    │   └── ...
    ├── hardhat.config.ts    (from template)
    ├── package.json         (merged with starter + template)
    ├── README.md            (from starter or generated)
    └── ...
```

---

## Troubleshooting

### Starter not found

```bash
npm run starter:create non-existent -- --dir test
# Error: Starter 'non-existent' not found
# Did you mean: fhe-add, fhe-counter, encrypt-multiple-values?
```

**Solution:** List available starters:

```bash
npm run starter:list
```

### Directory already exists

```bash
npm run starter:create fhe-add -- --dir ./existing
# Error: Directory workspace/existing already exists
# Options: [o]verwrite, [m]erge, [r]ename, [c]ancel
```

**Solution:** Use `--force` to auto-overwrite, or different `--dir`:

```bash
npm run starter:create fhe-add -- --dir ./existing --force
npm run starter:create fhe-add -- --dir ./existing-v2
```

### Filter doesn't match

```bash
npm run starter:create -- --category nonexistent --dir test
# Error: No starters found matching filters
# Check category, chapter, tags, concepts
```

**Solution:** Run `starter:list` for available values

### Template not initialized

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
| `npm run starter:add`          | Add new starter to collection |
| `npm run starter:clean <name>` | Delete generated project      |
| `npm run template:init`        | Initialize base templates     |
| `npm run template:update`      | Update base templates         |

---

## Notes for CI/Automation

For automation (GitHub Actions, CI/CD), use JSON output:

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

Use `--force` to skip prompts and auto-overwrite.

# Automation Scripts & CLI Commands

This document explains **all CLI commands** available in FHEVM StarterKit for automating common tasks.

---

## Template Management Commands

### `template:init` — Initialize Base Templates

Initialize base templates by cloning from external repositories.

```bash
npm run template:init
```

**What happens:**

- Clone Hardhat template from Zama to `base/hardhat-template/`
- Clone relayer UI template to `base/frontend-template/`
- Copy markdown templates to `base/markdown-template/`
- Setup overrides in `base/overrides/`

**Options:**

- `--latest` — Clone latest branch HEAD instead of pinned commit
- `--force` — Overwrite existing templates if they already exist

**Notes:**

- Only needs to be run **once** during setup
- `base/` folder is not committed to git
- Commit hash for templates is set in `starterkit.config.ts`

---

### `template:update` — Update Base Templates

Update templates to latest version from branch HEAD.

```bash
npm run template:update
```

**What happens:**

- Pull latest changes from hardhat-template repo
- Pull latest changes from frontend-template repo
- Preserve local modifications (if any in overrides/)

**When to use:**

- When there are bug fixes or new features in official template
- Regular maintenance to stay up-to-date

---

### `template:reset` (or `template:clean`) — Delete Base Templates

Deletes the entire `base/templates` folder. **DANGEROUS** — requires confirmation.

```bash
npm run template:reset
```

or

```bash
npm run template:clean
```

**Options:**

- `--yes` — Skip confirmation and delete immediately

**When to use:**

- Troubleshooting if templates are corrupt
- Cleanup before `template:init` again

**Notes:**

- `workspace/` folder is not deleted (only `base/`)
- Run `template:init` again after deletion

---

### `template:build-ui` — Build Frontend Template

Setup and build frontend template for use in projects.

```bash
npm run template:build-ui
```

**What happens:**

- Install dependencies in `base/frontend-template/`
- Compile/build frontend assets
- Generate distribution files in `base/frontend-template/dist/`

**When to use:**

- Initial setup after `template:init`
- When you want to use relayer UI in generated projects

**Notes:**

- Only needs to be run if you want to use UI
- This build will be copied automatically to projects on create

---

## Starter Management Commands

### `starter:list` — List Available Starters

Display all available starters with metadata information.

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

- `--json` — Output in JSON format (for parsing)
- `--category <category>` — Filter by category
- `--verbose` — Show additional metadata (full paths, timestamps, etc.)

**When to use:**

- Explore available starters
- Check metadata before `starter:create`
- CI/automation to list starters programmatically

---

### `starter:create` — Create Project from Starter

Create a new project by copying starter and base template.

```bash
npm run starter:create <starterName> -- --dir <destination>
```

**Modes:**

1. **Positional** — `npm run starter:create fhe-add -- --dir my-project`
2. **Filter** — `npm run starter:create -- --category fundamental --dir basics`
3. **Interactive** — `npm run starter:create` (without arguments)

**Options:**

- `--dir <dir>` — Destination directory (required for multiple/filter)
- `--category <category>` — Filter by category
- `--chapter <chapter>` — Filter by chapter
- `--tags <tags>` — Filter by tags
- `--concepts <concepts>` — Filter by concepts
- `--skip-ui` — Skip copying UI/frontend files
- `--force` — Overwrite existing without prompt
- `--merge` — Merge with existing files
- `--yes` — Auto-confirm all prompts

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

**Notes:**

- Requires `template:init` to be completed
- Projects are placed in `workspace/` folder
- Supports multiple starters in a single command

**See:** [02_USING_STARTER_SCRIPT.md](02_USING_STARTER_SCRIPT.md) for complete explanation.

---

### `starter:add` — Add New Starter

Add a new starter to the collection in the `starters/` folder.

```bash
npm run starter:add <starterName>
```

**What happens:**

- Prompt for metadata (category, chapter, tags, concepts)
- Create folder structure: `starters/<starterName>/`
- Generate `metadata.json`
- Prompt to copy contracts, tests

**Result structure:**

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

- `--interactive` (default) — Interactive prompts
- `--dir <path>` — Copy contracts from another directory

**Notes:**

- Validates metadata against schema
- Run `npm run check` after creation to validate

---

### `starter:clean` — Clean Generated Projects

Delete generated projects in the `workspace/` folder.

```bash
npm run starter:clean <projectName>
```

**What happens:**

- Delete `workspace/<projectName>/` folder
- Confirm before deleting

**Options:**

- `--force` — Delete without prompt
- `--all` — Delete all projects (be careful!)

**Examples:**

```bash
npm run starter:clean my-project     # Delete workspace/my-project/
npm run starter:clean --all --force  # Delete everything in workspace/
```

---

## Utility Commands

### `check` — Validate All Starters

Check the consistency and validity of all starters in the `starters/` folder.

```bash
npm run check
```

**Checks:**

- ✓ Each starter has `metadata.json`
- ✓ Metadata is valid against schema
- ✓ Each starter has `contracts/` folder
- ✓ Each starter has `test/` folder
- ✓ Each starter has `README.md`
- ✓ Category, chapter, tags are in taxonomy

**Output:**

```
Checking starters...

✓ fhe-add - Valid
✓ fhe-counter - Valid
✗ my-starter - Missing contracts/ folder

2/3 starters valid. 1 error found.
```

**When to use:**

- Before committing changes to git
- After adding/modifying starters
- CI/automation for quality checks

---

### `generate:schema` — Generate JSON Schemas

Generate JSON schema files from TypeScript Zod schemas.

```bash
npm run generate:schema
```

**What happens:**

- Read Zod schemas from `lib/types/*.schema.ts`
- Generate corresponding JSON schema files in `lib/schemas/`
- Update documentation from schema definitions

**When to use:**

- After modifying Zod schemas in `lib/types/`
- To generate automatic documentation

**Output:**

```
Generated:
  ✓ lib/schemas/starterMetadata.schema.json
  ✓ lib/schemas/starterkitConfig.schema.json
  ✓ docs/schemas/ (auto-docs)
```

---

### `lint` — Lint Code

Run ESLint to check code quality.

```bash
npm run lint
```

**Scope:**

- TypeScript files in `scripts/`, `lib/`
- Excludes `base/` and `workspace/`

**Options:**

```bash
npm run lint -- --fix      # Auto-fix formatting issues
npm run lint -- src/file   # Lint specific file
```

---

### `format` — Format Code

Format code using Prettier.

```bash
npm run format
```

**Scope:**

- TypeScript, Markdown, JSON files
- Excludes `base/` and `workspace/`

---

### `debug:logger` — Test Logger Utility

Test logger with various log levels.

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

**Use for:**

- Debug logger output format
- Test log level configuration

---

## Global Options (Available for all commands)

| Option         | Type    | Description                          | Example                                    |
| -------------- | ------- | ------------------------------------ | ------------------------------------------ |
| `--cwd <path>` | string  | Run command from different directory | `npm run starter:list -- --cwd ~/projects` |
| `--verbose`    | boolean | Show detailed logs and debug info    | `npm run template:init -- --verbose`       |
| `--json`       | boolean | Output in JSON format (for CI)       | `npm run starter:list -- --json`           |

---

## Workflow Examples

### New Setup

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

# 3. Navigate and develop
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

# Using the Starter Script

## Overview

The starter script helps you initialize project templates from the `starters/` folder. It supports non-interactive use (via positional arguments and flags) and an interactive mode when no parameters are provided.

## Quick Syntax

### Positional starter name(s):

```bash
npm run starter:create <starterName> [<starterName> ...] [-- --dir <dir>]
```

### Filters (use `--` to pass flags to the script):

```bash
`npm run starter:create -- --category <categoryName> [--tags <tag>] [--chapter <name>] --dir <dir>
```

## Parameters

Use simple flags and positional names. Common parameters: `starterName` (positional), `--dir <dir>`, `--category`, `--chapter`, `--tags`, `--concepts`, and the helper flags `--force`, `--merge`, `--yes`.

## Rules

Single starter: `--dir` is optional (defaults to the starter name). Multiple starters or any filter usage require `--dir`. Filters are combined with OR logic. If no arguments are given, the script opens an interactive menu.

## Interactive flow

The interactive mode offers two paths: pick directly from a list or pick by filters. After selection you are asked for the destination `--dir` (default applies when a single starter is chosen). If the target exists, choose overwrite/merge/rename unless overridden by `--force`/`--merge`/`--yes`. A final summary is shown before any changes.

## Examples

### Single starter (dir optional — default = starter name)

```bash
# positional starter name; --dir optional
npm run starter:create ExampleStarter

# explicit dir
npm run starter:create ExampleStarter -- --dir ./ExampleStarter
```

### Multiple starters (dir required)

```bash
# multiple positional starters; --dir required
npm run starter:create StarterA StarterB -- --dir ./my-examples
```

### Using filters (dir required; OR semantics across filters)

````bash
# pick starters by tag OR category
npm run starter:create -- --tags token --category tutorials --dir ./filtered-starters

# example using category only
## Using the Starter Script

This document explains how to use the `starter:create` command exposed by the project's CLI and describes the behaviour implemented in
`scripts/commands/starterCreate.ts` when invoked via `scripts/cli.ts`.

**Location:** [docs/02_USING_STARTER_SCRIPT.md](docs/02_USING_STARTER_SCRIPT.md)

Purpose
- Provide a concise reference for the `starter:create` command.
- Explain required/optional flags, interactive behaviour, and current implementation notes.

Quick synopsis
- Non-interactive (positional):

```bash
npm run starter:create <starterName> [<starterName> ...] -- --dir <targetDir>
````

- Non-interactive (filters):

```bash
npm run starter:create -- --category <name> --chapter <name> --tags <tag1,tag2> --concepts <name> -- --dir <targetDir>
```

- Interactive: run without positional args or filters:

```bash
npm run starter:create
```

Supported flags (CLI-level)

- Global flags (available to all commands): `--cwd <path>`, `--verbose`, `--json` (defined in `scripts/cli.ts`).
- `starter:create` flags (declared in `scripts/cli.ts`):
  - `-d, --dir <dir>` : Target directory for created starter(s).
  - `--category <category...>` : Filter by category (repeatable).
  - `--chapter <chapter...>` : Filter by chapter (repeatable).
  - `--tags <tags...>` : Filter by tags (repeatable).
  - `--concepts <concepts...>` : Filter by concepts (repeatable).
  - `--layout <layout>` : CLI accepts this, but it is not used by the current implementation in `starterCreate.ts`.
  - `--non-interactive` : CLI accepts this flag (fail instead of prompting) but the current `starterCreate.ts` implementation does not fully honour it.

Behaviour and validation rules (implemented in `scripts/commands/starterCreate.ts`)

- The command supports two creation paths:
  1. Positional creation: provide one or more `starterName` positional arguments.
  2. Filter-based creation: provide one or more of `--category`, `--chapter`, `--tags`, or `--concepts` to select starters.
- Directory (`--dir`) requirements:
  - Single `starterName`: `--dir` is optional. If omitted, the implementation sets `dir` to the name of the provided starter.
  - Multiple `starterName`s: `--dir` is required (all selected starters will be placed under the specified directory).
  - Any filter usage: `--dir` is required.
- If no positional names or filters are provided, the script runs an interactive flow (console prompts) implemented using `readline` helpers in the file.

Interactive flow (what happens)

- The interactive mode offers two choices:
  1. Pick a starter directly from the `starters/` folder.

2.  Pick by filter: choose which taxonomy fields to filter by, enter values for each, then the script finds matching starter folders by scanning `starter.json` or `package.json` inside each starter folder.

- After selection the script asks for `dir` (defaults to the starter name when a single starter is chosen).
- The script shows a JSON summary of chosen options and asks for confirmation before proceeding.

Current implementation notes (important)

- The current `scripts/commands/starterCreate.ts`:
  - Performs parameter validation, interactive prompts, and final confirmation.
  - Scans `starters/` for available starter folders and reads `starter.json` / `package.json` for basic filtering.
  - At the final step it only logs the choices (it does not yet create files, copy templates or modify the workspace). The comment in the file reads: "At this point, we would proceed to create the starter. For now, just log the final choices."
- The `--layout` and `--non-interactive` flags are accepted by the CLI but not used by the script; document or implement accordingly if you want those flags to affect behaviour.

Examples

- Single starter (dir optional — defaults to starter name):

```bash
npm run starter:create fhe-add
npm run starter:create fhe-add -- --dir ./my-fhe-add
```

- Multiple starters (dir required):

```bash
npm run starter:create fhe-add fhe-counter -- --dir ./my-starters
```

- Using filters (dir required):

```bash
npm run starter:create -- --tags token --category fundamental -- --dir ./filtered
```

- Interactive mode:

```bash
npm run starter:create
```

Notes & troubleshooting

- When running via `npm run`, pass command flags to the script using `--` (example above). If you run the CLI directly (node), you can omit the outer `--`.
- If you plan to enable non-interactive automation, implement honoring of `--non-interactive` and add an explicit exit code on validation failure.
- To make `starter:create` actually create files, implement the copy/templating logic after the final confirmation block in `scripts/commands/starterCreate.ts`.

If you'd like, I can:

- Add an interactive transcript example to this doc.
- Implement the actual creation/copy logic in `starterCreate.ts`.
- Update the CLI to remove or wire `--layout` / `--non-interactive` to the implementation.

---

File references

- CLI entry: [scripts/cli.ts](scripts/cli.ts)
- Command implementation: [scripts/commands/starterCreate.ts](scripts/commands/starterCreate.ts)

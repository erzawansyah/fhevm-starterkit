// scripts/cli.ts
import { Command } from "commander";
import { runTemplateInit } from "./commands/templateInit";
import { runTemplateReset } from "./commands/templateReset";
import { runTemplateUpdate } from "./commands/templateUpdate";
import { type Mode, runStarterList } from "./commands/starterList";
import { runStarterCreate } from "./commands/starterCreate";

export type GlobalOptions = {
  cwd?: string;
  verbose?: boolean;
  json?: boolean;
};

function applyCwd(cwd?: string) {
  if (!cwd) return;
  process.chdir(cwd);
}

function normalizeError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) return { message: err.message, stack: err.stack };
  if (typeof err === "string") return { message: err };
  try {
    return { message: JSON.stringify(err) };
  } catch {
    return { message: "Unknown error" };
  }
}

async function main() {
  const program = new Command();

  program
    .name("starterkit")
    .description("FHEVM StarterKit CLI")
    .showHelpAfterError(true)
    .showSuggestionAfterError(true);

  // Global options
  program
    .option("--cwd <path>", "Run as if executed in this directory")
    .option("--verbose", "Verbose logs", false)
    .option("--json", "JSON output mode (for CI/log parsing)", false);

  // template:init
  program
    .command("template:init")
    .description("Clone base templates into ./base")
    .option(
      "--latest",
      "Use latest branch HEAD instead of pinned commit",
      false
    )
    .option(
      "--force",
      "Overwrite existing ./base templates if already present",
      false
    )
    .action(async (opts: { latest?: boolean; force?: boolean }) => {
      const g = program.opts<GlobalOptions>();
      applyCwd(g.cwd);
      await runTemplateInit({
        latest: !!opts.latest,
        force: !!opts.force,
        ...g,
      });
    });

  // template:reset
  program
    .command("template:reset")
    .description("Delete ./base templates (DANGEROUS)")
    .option("--yes", "Confirm deletion of ./base", false)
    .action(async (opts: { yes?: boolean }) => {
      const g = program.opts<GlobalOptions>();
      applyCwd(g.cwd);
      await runTemplateReset({ yes: !!opts.yes, ...g });
    });

  // template:update
  program
    .command("template:update")
    .description("Update templates in ./base to the latest branch HEAD")
    .action(async () => {
      const g = program.opts<GlobalOptions>();
      applyCwd(g.cwd);
      await runTemplateUpdate({ ...g });
    });

  program
    .command("starter:list")
    .description("List available starter projects")
    .option("--category <category>", "Category (e.g. fundamental, patterns)")
    .option("--chapter <chapter>", "Chapter (e.g. basic, intermediate)")
    .option(
      "--tags <tags>",
      "Comma-separated tags to filter by (e.g. defi, nft)"
    )
    .option(
      "--concepts <concepts>",
      "Filter by concepts (e.g. fhe-operations, fhe-encryption)"
    )
    .option("--mode <mode>", "Output mode: json, compact, detailed", "detailed")
    .option("--count <number>", "Limit number of starters listed", undefined)
    .action(
      async (opts: {
        category?: string;
        chapter?: string;
        tags?: string;
        concepts?: string;
        mode?: string;
        count?: number;
      }) => {
        const g = program.opts<GlobalOptions>();
        applyCwd(g.cwd);
        await runStarterList({
          mode: (opts.mode as Mode | "compact" | "json") || "detailed",
          count: opts.count,
          ...g,
        });
      }
    );

  program
    .command("starter:create [starterName...]")
    .description("Create starter project(s) from the hub")
    .option("-d, --dir <dir>", "Target directory")
    .option("--category <category...>", "Filter by category (repeatable)")
    .option("--chapter <chapter...>", "Filter by chapter (repeatable)")
    .option("--tags <tags...>", "Filter by tags (repeatable)")
    .option("--concepts <concepts...>", "Filter by concepts (repeatable)")
    .option("--layout <layout>", "single | workspace", "single")
    .option("--non-interactive", "Fail instead of prompting", false)
    .action(async (starterName: string[], opts) => {
      await runStarterCreate({ starterName, ...opts, ...program.opts() });
    });

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  const { message, stack } = normalizeError(err);

  console.error(`❌ Error: ${message}`);
  if (process.env.DEBUG && stack) console.error(stack);

  process.exit(1);
});

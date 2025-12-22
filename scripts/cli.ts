// scripts/cli.ts
import { Command } from "commander";
import { runTemplateInit } from "./commands/templateInit";
import { runTemplateReset } from "./commands/templateReset";
import { runTemplateUpdate } from "./commands/templateUpdate";
import { runSetupHardhat } from "./commands/setupHardhat";
import { runSetupFrontend } from "./commands/setupFrontend";
import { runStarterInit } from "./commands/starterInit";

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
    .description(
      "Update templates in ./base (pinned by default, or latest with --latest)"
    )
    .option(
      "--latest",
      "Update to latest branch HEAD instead of pinned commit",
      false
    )
    .action(async (opts: { latest?: boolean }) => {
      const g = program.opts<GlobalOptions>();
      applyCwd(g.cwd);
      await runTemplateUpdate({ latest: !!opts.latest, ...g });
    });

  // setup:hardhat
  program
    .command("setup:hardhat")
    .description("Configure Hardhat vars (MNEMONIC, INFURA_API_KEY)")
    .option("--force", "Overwrite existing Hardhat vars", false)
    .action(async (opts: { force?: boolean }) => {
      const g = program.opts<GlobalOptions>();
      applyCwd(g.cwd);
      await runSetupHardhat({ force: !!opts.force, ...g });
    });

  program
    .command("setup:frontend")
    .description("Configure frontend env (.env.local) for base UI template")
    .option("--force", "Overwrite existing .env.local in base template", false)
    .action(async (o: { force?: boolean }) => {
      const g = program.opts<GlobalOptions>();
      applyCwd(g.cwd);
      await runSetupFrontend({ force: !!o.force, ...g });
    });

  // starter:init
  program
    .command("starter:init <starterName>")
    .description("Initialize a starter project into ./projects/<dir>")
    .option("--dir <name>", "Target directory name (default: starterName)")
    .option("--skip-ui", "Skip ensuring/building frontend dist", false)
    .option(
      "--dry-run",
      "Do not write files, only print planned operations",
      false
    )
    .action(
      async (
        starterName: string,
        opts: { dir?: string; skipUi?: boolean; dryRun?: boolean }
      ) => {
        const g = program.opts<GlobalOptions>();
        applyCwd(g.cwd);
        await runStarterInit(starterName, {
          dir: opts.dir,
          skipUi: !!opts.skipUi,
          dryRun: !!opts.dryRun,
          ...g,
        });
      }
    );

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  const { message, stack } = normalizeError(err);

  console.error(`❌ Error: ${message}`);
  if (process.env.DEBUG && stack) console.error(stack);

  process.exit(1);
});

// scripts/cli.ts
import { Command } from "commander";
import { runTemplateInit } from "./commands/templateInit";
import { runTemplateReset } from "./commands/templateReset";
import { runTemplateUpdate } from "./commands/templateUpdate";
import { type Mode, runStarterList } from "./commands/starterList";
import {
  runStarterCreate,
  StarterCreateOptions,
} from "./commands/starterCreate";
import { runStarterClean } from "./commands/starterClean";
import { runTemplateBuildUI } from "./commands/templateBuildUI";
import { runStarterAdd, StarterAddOptions } from "./commands/starterAdd";
import {
  runBuildMetadata,
  BuildMetadataOptions,
} from "./commands/buildMetadata";
import {
  runGenerateDocs,
  GenerateDocsOptions,
} from "./commands/generateDocs";
import {
  runStarterBuild,
  StarterBuildOptions,
} from "./commands/starterBuild";
import {
  runStarterPublish,
  StarterPublishOptions,
} from "./commands/starterPublish";

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
      false,
    )
    .option(
      "--force",
      "Overwrite existing ./base templates if already present",
      false,
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

  program
    .command("template:build-ui")
    .description("Setup the frontend template")
    .action(async () => {
      const g = program.opts<GlobalOptions>();
      applyCwd(g.cwd);
      await runTemplateBuildUI({ ...g });
    });

  // template:reset
  program
    .command("template:reset")
    // alias for template:reset
    .alias("template:clean")
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
      "Comma-separated tags to filter by (e.g. defi, nft)",
    )
    .option(
      "--concepts <concepts>",
      "Filter by concepts (e.g. fhe-operations, fhe-encryption)",
    )
    .option("--mode <mode>", "Output mode: table, json, detailed", "table")
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
      },
    );

  program
    .command("starter:create [starterNames...]")
    .description("Create starter project(s) from the hub")
    .option("-d, --dir <dir>", "Target directory")
    .option("--category <category>", "Filter by category")
    .option("--chapter <chapter>", "Filter by chapter")
    .option("--tags <tags...>", "Filter by tags")
    .option("--concepts <concepts...>", "Filter by concepts")
    .option(
      "--and",
      "Use AND operator when filtering by multiple tags/concepts (default: OR)",
      false,
    )
    .option("--skip-ui", "Skip copying frontend files", false)
    .option("--force", "Overwrite existing files in target directory", false)
    .action(async (starterNames: string[], opts: StarterCreateOptions) => {
      const g = program.opts<GlobalOptions>();
      applyCwd(g.cwd);
      await runStarterCreate({ starterNames, ...opts, ...program.opts() });
    });

  program
    .command("starter:add [contractDir] [contractName]")
    .description("Create a new draft starter for development")
    .option("--label <label>", "Label for the contract")
    .option("--category <category>", "Category of the draft starter")
    .option("--chapter <chapter>", "Chapter of the draft starter")
    .option("--tags <tags...>", "Tags for the draft starter")
    .option("--force", "Overwrite existing files", false)
    .action(async (contractDir: string, contractName: string, opts: StarterAddOptions) => {
      const g = program.opts<GlobalOptions>();
      applyCwd(g.cwd);
      await runStarterAdd({ contractDir, contractName, ...opts, ...g });
    });

  program
    .command("starter:reset [starterNames...]")
    .alias("starter:clean")
    .description("Delete starter project(s) in the workspace (DANGEROUS)")
    .option("--force", "Skip confirmation prompt", false)
    .action(async (starterNames: string[], opts: { force?: boolean }) => {
      const g = program.opts<GlobalOptions>();
      applyCwd(g.cwd);
      await runStarterClean(starterNames, { force: !!opts.force, ...g });
    });

  program
    .command("build:metadata <contractPath>")
    .description("Build metadata.json from contract NatSpec comments")
    .option("-o, --output <path>", "Output path for metadata.json")
    .option("-n, --starter-name <name>", "Starter name (default: auto-detect)")
    .option(
      "-c, --category <category>",
      "Category (fundamental, patterns, applied, advanced)",
      "fundamental",
    )
    .option(
      "--chapter <chapter>",
      "Chapter (basics, encryption, decryption, etc.)",
      "basics",
    )
    .action(async (contractPath: string, opts: Omit<BuildMetadataOptions, "contractPath">) => {
      const g = program.opts<GlobalOptions>();
      applyCwd(g.cwd);
      await runBuildMetadata({ ...opts, ...g, contractPath });
    });

  program
    .command("generate:docs <metadataPath>")
    .description("Generate documentation from metadata.json using Handlebars template")
    .option(
      "-o, --output <path>",
      "Output path for generated documentation (default: DOCUMENTATION.md)",
    )
    .option(
      "-t, --template <path>",
      "Custom template path (default: base/markdown-template/CONTRACT_DOCUMENTATION.md.hbs)",
    )
    .action(async (metadataPath: string, opts: Omit<GenerateDocsOptions, "metadataPath">) => {
      const g = program.opts<GlobalOptions>();
      applyCwd(g.cwd);
      await runGenerateDocs({ ...opts, ...g, metadataPath });
    });

  program
    .command("starter:build")
    .description(
      "Build a starter from workspace/draft (generates metadata, docs, and dist/)",
    )
    .option(
      "-d, --draft-dir <path>",
      "Path to draft directory (default: workspace/draft)",
    )
    .action(async (opts: Omit<StarterBuildOptions, never>) => {
      const g = program.opts<GlobalOptions>();
      applyCwd(g.cwd);
      await runStarterBuild({ ...opts, ...g });
    });

  program
    .command("starter:publish")
    .description(
      "Publish a built starter from workspace/draft/dist to starters/",
    )
    .option(
      "-d, --draft-dir <path>",
      "Path to draft directory (default: workspace/draft)",
    )
    .option(
      "-n, --starter-name <name>",
      "Starter name (default: from metadata.json)",
    )
    .option("-f, --force", "Overwrite existing starter", false)
    .action(async (opts: Omit<StarterPublishOptions, never>) => {
      const g = program.opts<GlobalOptions>();
      applyCwd(g.cwd);
      await runStarterPublish({ ...opts, ...g });
    });

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  const { message, stack } = normalizeError(err);

  console.error(`❌ Error: ${message}`);
  if (process.env.DEBUG && stack) console.error(stack);

  process.exit(1);
});

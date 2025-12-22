import { GlobalOptions } from "../cli";

export async function runStarterInit(
  starterName: string,
  input: {
    dir?: string;
    skipUi: boolean;
    dryRun: boolean;
  } & GlobalOptions
) {
  if (input.verbose)
    console.log("[debug] starter:init", { starterName, ...input });

  const targetDir = input.dir ?? starterName;

  console.log("▶ starter:init");
  console.log("starter:", starterName);
  console.log("dir:", targetDir);
  console.log("skip-ui:", input.skipUi ? "yes" : "no");
  console.log("dry-run:", input.dryRun ? "yes" : "no");

  // TODO:
  // - validate ./base templates exist (if not, suggest template:init)
  // - validate starter exists in ./starters/<starterName>
  // - if !skipUi => ensure frontend dist exists (build if missing/outdated)
  // - copy + mutate into ./projects/<targetDir>
  // - inject metadata/readme if needed
}

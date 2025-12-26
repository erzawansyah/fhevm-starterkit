/**
 * @path scripts/commands/starterCreate.ts
 * @script
 *   - npm run starter:create <starterName...> [dir]
 *   - npm run starter:create -- --category ... --chapter ... --tags ... --concepts ... [--dir ...]
 * @description Membuat proyek baru dengan menyalin folder template dari `/starters`.
 *
 * What this script does:
 * - Mendukung 3 mode pemilihan starter:
 *   1) Positional: pilih 1 atau banyak starter via argumen posisi `<starterName...>`
 *   2) Filter: pilih starter via taksonomi metadata (category, chapter, tags, concepts)
 *   3) Interaktif: jika tidak ada input yang cukup, user dipandu memilih starter
 * - Memvalidasi agar mode positional dan filter tidak dipakai bersamaan
 * - Menyalin folder starter ke direktori tujuan (membuat folder baru)
 *
 * What this script does NOT do:
 * - Tidak mengunduh atau meng-clone template dari internet
 * - Tidak mengubah isi starter di folder `/starters`
 */

import { logger } from "../../lib/helper/logger";
import { GlobalOptions } from "../cli";
import { prompt } from "enquirer";
import { checkStarterExists, copyTemplateToWorkspace, getFilteredStarter, getAllStarterMetadata, copyStarterToWorkspace, generateWorkspaceReadmeFromStarters } from "../../lib/helper/starters";
import config from "../../starterkit.config";
import path from "path";
import fs from "fs";
import { resolveWorkspaceStarterDir } from "../../lib/helper/path-utils";
import { quotePath } from "../../lib/helper/utils";

// Options for creating starter(s)
export type StarterCreateOptions = GlobalOptions & {
  starterNames?: string[]; // positional list
  dir?: string; // destination directory

  // filter
  category?: string
  chapter?: string;
  tags?: string[]; // comma-separated
  concepts?: string[]; // comma-separated
  and?: boolean; // operator for tags/concepts
  skipUI?: boolean; // skip copying frontend files
  force?: boolean; // overwrite existing files in target directory
};

/**
 * Type of fetching mode for selecting starter(s)
 * - positional: via positional argument `<starterName...>`
 * - filter: via filter options (category, chapter, tags, concepts)
 * - interactive: via interactive prompt
 */
type StarterCreateFetchMode = "positional" | "filter" | "interactive";


/**
 * Type of action for creating starter(s)
 * - single: creating one starter
 * - multiple: creating multiple starters
 */
type StarterCreateAction = "single" | "multiple"

/**
 * Type of plan for creating starter(s)
 */
type StarterCreatePlan = {
  mode: StarterCreateFetchMode;
  starterNames: string[];
  destinationDir: string; // workspace directory name
  destinationPath: string; // work
  action: StarterCreateAction;
};


/**
 * Resolve destination directory based on action type
 * @param starterNames
 * @returns Promise<{ destinationPath: string; actionType: StarterCreateAction }>
 * - destinationDir: destinationdirectory name inside workspace
 * - destinationPath: resolved destination absolute path
 * - actionType: "single" | "multiple"
 */
async function resolveActionType(starterNames: string[], dir?: string, forcePrompt: boolean = false): Promise<{

  destinationDir: string;
  destinationPath: string;
  actionType: StarterCreateAction;
}> {
  let destinationDir = "";
  let destinationPath = "";
  let actionType: StarterCreateAction = "single";
  //  Error kalau tidak ada starter name yang diberikan
  if (starterNames.length === 0) {
    logger.error("No starter names provided.");
    process.exit(1);
  }

  // Kalau cuma satu starter, tanyain pake default nama folder itu
  if (starterNames.length === 1) {
    actionType = "single";
    if (dir) {
      destinationDir = dir;
      destinationPath = resolveWorkspaceStarterDir(dir);
    } else {
      if (forcePrompt) {
        const answer = await prompt<{ name: string }>({
          type: "input",
          name: "name",
          message: `Enter the destination directory for starter "${starterNames[0]}":`,
          initial: starterNames[0],
        });
        destinationDir = answer.name;
        destinationPath = resolveWorkspaceStarterDir(answer.name);
      } else {
        destinationDir = starterNames[0];
        destinationPath = resolveWorkspaceStarterDir(starterNames[0]);
      }
    }
  } else {
    actionType = "multiple";

    // Kalau banyak starter, --dir harus disediain
    if (dir) {
      destinationDir = dir;
      destinationPath = resolveWorkspaceStarterDir(dir);
    } else {
      const answer = await prompt<{ name: string }>({
        type: "input",
        name: "name",
        message: "You are creating multiple starters. Enter the workspace directory:",
        initial: "my-first-starters",
      });
      destinationDir = answer.name;
      destinationPath = resolveWorkspaceStarterDir(answer.name);
    }
  };

  return { destinationDir, destinationPath, actionType };
}

/**
 * Resolve mode based on provided options. Fetch mode is the method used to select starter(s).
 * @param opts 
 * @returns StarterCreateFetchMode
 */
function resolveFetchMode(opts: StarterCreateOptions): StarterCreateFetchMode {
  const { starterNames, category, chapter, tags, concepts } = opts;
  if (starterNames && starterNames.length > 0) {
    // Jika ada argumen posisi, berarti mode positional.
    // Maka, jika tetapi ada filter, itu membingungkan. Jadi, tandai sebagai error dan hentikan eksekusi.
    if (category || chapter || (tags && tags.length > 0) || (concepts && concepts.length > 0)) {
      logger.error("Cannot use positional starter names with filter options (category, chapter, tags, concepts). Please choose one mode of selection.");
      process.exit(1);
    }
    return "positional";
  }
  if (category || chapter || (tags && tags.length > 0) || (concepts && concepts.length > 0)) {
    // Jika ada setidaknya satu opsi filter, berarti mode filter
    return "filter";
  }
  return "interactive";
}

/**
 * Handle fetch starter(s) in positional mode. 
 * This active when user provides starter names as positional arguments.
 * If multiple starter names are provided, user will be prompted to confirm workspace directory.
 * 
 * @param opts 
 * @returns  Promise<StarterCreatePlan>
 */
async function handlePositionalMode(opts: StarterCreateOptions): Promise<StarterCreatePlan> {
  const { starterNames } = opts;
  const unAvailableStarters = (starterNames || []).filter((name) => {
    return !checkStarterExists(name);
  });

  if (unAvailableStarters.length > 0) {
    logger.error(`The following starter(s) do not exist: ${unAvailableStarters.join(", ")}`);
    process.exit(1);
  }

  if (!starterNames || starterNames.length === 0) {
    logger.error("No starter names provided for positional mode.");
    process.exit(1);
  }
  const { destinationDir, destinationPath, actionType } = await resolveActionType(starterNames, opts.dir);
  return {
    mode: "positional",
    starterNames,
    destinationDir,
    destinationPath,
    action: actionType,
  };
};

/**
 * Handle fetch starter(s) in filter mode.
 * This active when user provides filter options (category, chapter, tags, concepts).
 * 
 * @param opts 
 * @returns Promise<StarterCreatePlan>
 */
async function handleFilterMode(opts: StarterCreateOptions): Promise<StarterCreatePlan> {
  const { category, chapter, tags, concepts, and = false } = opts;
  const filtered = {
    category: [] as string[],
    chapter: [] as string[],
    tags: [] as string[],
    concepts: [] as string[],
  };
  // Test filter berdasarkan 1 kategori
  if (category) {
    const filteredStarters = await getFilteredStarter("category", category);
    logger.info(`Found ${filteredStarters.length} starter(s) matching category "${category}".`);

    filtered["category"] = filteredStarters;
  }
  if (chapter) {
    const filteredStarters = await getFilteredStarter("chapter", chapter);
    logger.info(`Found ${filteredStarters.length} starter(s) matching chapter "${chapter}".`);
    filtered["chapter"] = filteredStarters;
  }
  if (tags && tags.length > 0) {
    const filteredStarters = await getFilteredStarter("tags", tags.join(","));
    logger.info(`Found ${filteredStarters.length} starter(s) matching tags "${tags.join(", ")}" with operator "${and ? "and" : "or"}".`);
    filtered["tags"] = filteredStarters;
  }
  if (concepts && concepts.length > 0) {
    const filteredStarters = await getFilteredStarter("concepts", concepts.join(","));
    logger.info(`Found ${filteredStarters.length} starter(s) matching concepts "${concepts.join(", ")}" with operator "${and ? "and" : "or"}".`);
    filtered["concepts"] = filteredStarters;
  }

  const combinedStartersSet = new Set<string>();
  if (!and) {
    // Gabungkan semua hasil filter
    for (const key in filtered) {
      const starters = filtered[key as keyof typeof filtered];
      starters.forEach((s) => combinedStartersSet.add(s));
    }
  } else {
    // Ambil irisan dari semua hasil filter
    const filteredArrays = Object.values(filtered).filter(arr => arr.length > 0);
    if (filteredArrays.length > 0) {
      let intersection = filteredArrays[0];
      for (let i = 1; i < filteredArrays.length; i++) {
        intersection = intersection.filter(x => filteredArrays[i].includes(x));
      }
      intersection.forEach((s) => combinedStartersSet.add(s));
    }
  }

  const combinedStarters = Array.from(combinedStartersSet);
  if (combinedStarters.length === 0) {
    logger.error("No starters found matching the provided filters.");
    process.exit(1);
  }
  logger.info(`Total starters selected after applying filters: ${combinedStarters.length}`);
  logger.info(`Starters: ${combinedStarters.join(", ")}`);

  const { actionType, destinationDir, destinationPath } = await resolveActionType(combinedStarters, opts.dir, true);

  return {
    mode: "filter",
    starterNames: combinedStarters,
    destinationDir: destinationDir,
    destinationPath: destinationPath,
    action: actionType,
  };
}


/**
 * Handle fetch starter(s) in interactive mode.
 * This active when user does not provide sufficient input to select starter(s).
 *
 * Constraints:
 * - Tidak bikin fungsi di dalam fungsi
 * - Memanfaatkan helper yang sudah ada: getAllStarterMetadata, getFilteredStarter, resolveActionType, resolvedestinationPath
 *
 * Behavior:
 * 1) User pilih metode: pick by name atau filter by taxonomy
 * 2) Jika pick: multiselect starter by name
 * 3) Jika filter: user pilih field yang ingin dipakai, pilih nilainya, pilih operator (AND/OR) untuk combine hasil antar field
 * 4) Hasil akhir => StarterCreatePlan (mode: interactive)
 */
async function handleInteractiveMode(): Promise<StarterCreatePlan> {
  // Load metadata sekali untuk membangun pilihan UI
  const allMetadata = await getAllStarterMetadata();

  if (!allMetadata || allMetadata.length === 0) {
    logger.error("No starters found in starters directory.");
    process.exit(1);
  }

  // Build option pools (tanpa nested function)
  const categorySet = new Set<string>();
  const chapterSet = new Set<string>();
  const tagSet = new Set<string>();
  const conceptSet = new Set<string>();

  for (const meta of allMetadata) {
    if (meta.category) categorySet.add(String(meta.category));
    if (meta.chapter) chapterSet.add(String(meta.chapter));
    if (Array.isArray(meta.tags)) meta.tags.forEach((t) => tagSet.add(String(t)));
    if (Array.isArray(meta.concepts)) meta.concepts.forEach((c) => conceptSet.add(String(c)));
  }

  const categories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));
  const chapters = Array.from(chapterSet).sort((a, b) => a.localeCompare(b));
  const tags = Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  const concepts = Array.from(conceptSet).sort((a, b) => a.localeCompare(b));

  // Step 1: choose selection method
  const entry = await prompt<{
    mode: "pick" | "filter";
  }>({
    type: "select",
    name: "mode",
    message: "How do you want to select starter(s)?",
    choices: [
      { name: "pick", message: "Pick by starter name" },
      { name: "filter", message: "Filter by taxonomy (category/chapter/tags/concepts)" },
    ],
  });

  // Mode: pick by starter name
  if (entry.mode === "pick") {
    const choices = allMetadata.map((m) => {
      const label = m.label ? `${m.label} (${m.name})` : m.name;
      return { name: m.name, message: `${label}` };
    });

    const selection = await prompt<{ starters: string[] }>({
      type: "multiselect",
      name: "starters",
      message: "Select starter(s) to create (Press <space> to select, <a> to toggle all, <i> to invert selection):",
      choices,
    });

    const picked = (selection.starters || []).filter(Boolean);
    if (picked.length === 0) {
      logger.error("No starters selected.");
      process.exit(1);
    }

    const { destinationDir, destinationPath, actionType } = await resolveActionType(picked, undefined, true);

    return {
      mode: "interactive",
      starterNames: picked,
      destinationDir,
      destinationPath,
      action: actionType,
    };
  }

  // Mode: filter by taxonomy
  const fieldPick = await prompt<{ fields: ("category" | "chapter" | "tags" | "concepts")[] }>({
    type: "multiselect",
    name: "fields",
    message: "Which filters do you want to apply? (Select at least one. Use <space> to select, <a> to toggle all, <i> to invert selection):",
    choices: [
      { name: "category", message: "Category" },
      { name: "chapter", message: "Chapter" },
      { name: "tags", message: "Tags" },
      { name: "concepts", message: "Concepts" },
    ],
  });

  const fields = (fieldPick.fields || []).filter(Boolean);
  if (fields.length === 0) {
    logger.error("No filter selected.");
    process.exit(1);
  }

  // Operator untuk gabung hasil antar field (bukan operator di dalam tags/concepts)
  const combine = await prompt<{ combine: "or" | "and" }>({
    type: "select",
    name: "combine",
    message: "Combine selected filter fields using:",
    choices: [
      { name: "or", message: "OR (union)" },
      { name: "and", message: "AND (intersection)" },
    ],
  });
  const combineAnd = combine.combine === "and";

  // Ambil filter values per field
  let selectedCategory: string | undefined = undefined;
  let selectedChapter: string | undefined = undefined;
  let selectedTags: string[] = [];
  let selectedConcepts: string[] = [];

  if (fields.includes("category")) {
    if (categories.length === 0) {
      logger.warning("No categories found in metadata. Skipping category.");
    } else {
      const ans = await prompt<{ category: string }>({
        type: "select",
        name: "category",
        message: "Select category",
        choices: categories,
      });
      selectedCategory = ans.category;
    }
  }

  if (fields.includes("chapter")) {
    if (chapters.length === 0) {
      logger.warning("No chapters found in metadata. Skipping chapter.");
    } else {
      const ans = await prompt<{ chapter: string }>({
        type: "select",
        name: "chapter",
        message: "Select chapter",
        choices: chapters,
      });
      selectedChapter = ans.chapter;
    }
  }

  if (fields.includes("tags")) {
    if (tags.length === 0) {
      logger.warning("No tags found in metadata. Skipping tags.");
    } else {
      const ans = await prompt<{ tags: string[] }>({
        type: "multiselect",
        name: "tags",
        message: "Select tag(s) (Press <space> to select, <a> to toggle all, <i> to invert selection):",
        choices: tags,
      });
      selectedTags = (ans.tags || []).filter(Boolean);
    }
  }

  if (fields.includes("concepts")) {
    if (concepts.length === 0) {
      logger.warning("No concepts found in metadata. Skipping concepts.");
    } else {
      const ans = await prompt<{ concepts: string[] }>({
        type: "multiselect",
        name: "concepts",
        message: "Select concept(s) (Press <space> to select, <a> to toggle all, <i> to invert selection):",
        choices: concepts,
      });
      selectedConcepts = (ans.concepts || []).filter(Boolean);
    }
  }

  // Hitung hasil per field pakai helper getFilteredStarter (tanpa nested function)
  const perFieldResults: string[][] = [];

  if (selectedCategory) {
    const r = await getFilteredStarter("category", selectedCategory);
    logger.info(`Found ${r.length} starter(s) matching category "${selectedCategory}".`);
    perFieldResults.push(r);
  }

  if (selectedChapter) {
    const r = await getFilteredStarter("chapter", selectedChapter);
    logger.info(`Found ${r.length} starter(s) matching chapter "${selectedChapter}".`);
    perFieldResults.push(r);
  }

  if (selectedTags.length > 0) {
    // getFilteredStarter() untuk tags sekarang = "AND" internal (harus include semua tag)
    // combine antar-field tetap di-handle di bawah.
    const r = await getFilteredStarter("tags", selectedTags.join(","));
    logger.info(`Found ${r.length} starter(s) matching tags "${selectedTags.join(", ")}".`);
    perFieldResults.push(r);
  }

  if (selectedConcepts.length > 0) {
    const r = await getFilteredStarter("concepts", selectedConcepts.join(","));
    logger.info(`Found ${r.length} starter(s) matching concepts "${selectedConcepts.join(", ")}".`);
    perFieldResults.push(r);
  }

  if (perFieldResults.length === 0) {
    logger.error("No effective filters were applied (empty selections).");
    process.exit(1);
  }

  // Combine results (union vs intersection)
  let combined: string[] = [];

  if (!combineAnd) {
    const set = new Set<string>();
    for (const arr of perFieldResults) {
      for (const s of arr) set.add(s);
    }
    combined = Array.from(set);
  } else {
    combined = perFieldResults[0].slice();
    for (let i = 1; i < perFieldResults.length; i++) {
      const next = perFieldResults[i];
      combined = combined.filter((x) => next.includes(x));
    }
  }

  combined = Array.from(new Set(combined)).sort((a, b) => a.localeCompare(b));

  if (combined.length === 0) {
    logger.error("No starters found after combining filters.");
    process.exit(1);
  }

  logger.info(`Total starters selected after combining filters: ${combined.length}`);
  logger.info(`Starters: ${combined.join(", ")}`);


  let dir: string | undefined = undefined;
  const { destinationDir, destinationPath, actionType } = await resolveActionType(combined, dir, true);

  return {
    mode: "interactive",
    starterNames: combined,
    destinationDir,
    destinationPath,
    action: actionType,
  };
}

/**
 * Main function to create starter(s) based on provided options.
 * @param plan StarterCreatePlan 
 * - mode: StarterCreateFetchMode
 * - starterNames: string[]
 * - destinationPath: string
 * - action: StarterCreateAction
 * @returns Promise<void>
 */
async function createStarters(plan: StarterCreatePlan, skipUI: boolean = false): Promise<void> {
  const { starterNames, destinationPath, destinationDir } = plan;
  const starterFrontendDir = path.join(destinationPath, config.starterFrontendDir || "ui");
  // Step 1: Copy base template (hardhat + frontend + overrides)
  logger.section("Step 1: Copying base templates...");
  await copyTemplateToWorkspace(destinationDir, skipUI);
  logger.success("Base templates copied.");

  // Step 2: Copy necessary starter(s) files to workspace directory
  logger.section(`Step 2: Copying ${starterNames.length} starter(s)...`);
  await copyStarterToWorkspace(starterNames, destinationDir, skipUI);
  logger.success("Starters copied.");

  // Step 3: Generate index.json for frontend
  logger.section("Step 3: Generating contracts index...");
  const indexPath = path.join(starterFrontendDir, "contracts", "index.json");
  fs.writeFileSync(indexPath, JSON.stringify(starterNames, null, 2));
  logger.success(`Contracts index generated at ${indexPath}`);

  // Step 4: Modify README.md
  logger.section("Step 4: Modifying README.md...");
  generateWorkspaceReadmeFromStarters("README.md.hbs", destinationDir);
  logger.success("README.md generated.");

  // Kasih tau user untuk next steps
  const shortDestPath = path.relative(process.cwd(), destinationPath);
  logger.section("All done!");
  logger.banner({
    emoji: "📦",
    tag: "Next Steps",
    tagColor: "bgBlue",
    rows: [
      { label: "Navigate", value: `cd ${quotePath(shortDestPath)}`, valueColor: "green" },
      { label: "Install", value: "npm install", valueColor: "green" },
      { label: "Start", value: "Start developing your FHE smart contracts!", valueColor: "cyan" },
    ],
  });
  logger.newLine();
  logger.newLine();
}


export async function runStarterCreate(opts: StarterCreateOptions) {
  const fetchMode = resolveFetchMode(opts);
  let plan: StarterCreatePlan;

  if (fetchMode === "positional") {
    plan = await handlePositionalMode(opts);
    logger.info(`Creating starter(s) in ${plan.destinationPath} using mode: ${plan.mode}`);
    logger.info(`Starters to create: ${plan.starterNames.join(", ")} `);
  } else if (fetchMode === "filter") {
    plan = await handleFilterMode(opts);
    logger.info(`Creating starter(s) in ${plan.destinationPath} using mode: ${plan.mode}`);
    logger.info(`Starters to create: ${plan.starterNames.join(", ")} `);
  } else {
    plan = await handleInteractiveMode();
    logger.info(`Creating starter(s) in ${plan.destinationPath} using mode: ${plan.mode}`);
    logger.info(`Starters to create: ${plan.starterNames.join(", ")} `);
  }

  // Check wheter workspace directory already exists
  if (fs.existsSync(plan.destinationPath)) {
    if (opts.force) {
      logger.warning(`Destination directory ${plan.destinationPath} already exists.Overwriting due to--force option.`);
      // delete existing directory
      fs.rmSync(plan.destinationPath, { recursive: true, force: true });
      logger.warning(`Deleted existing directory ${plan.destinationPath}.`);
    } else {
      logger.error(`Destination directory ${plan.destinationPath} already exists.Use--force to overwrite.`);
      process.exit(1);
    }
  }

  await createStarters(plan, opts.skipUI);
  process.exit(0);
}

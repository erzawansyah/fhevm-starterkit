import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import Ajv from "ajv";
import type { StarterMeta } from "../lib/types/starter-meta";

const ajv = new Ajv();

// Load schema
const schemaPath = join(__dirname, "../lib/schemas/starter-meta.schema.json");
const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
const validate = ajv.compile(schema);

// Validate all starter.meta.json files
const startersDir = join(__dirname, "../starters");
const starters = readdirSync(startersDir, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

let hasErrors = false;

for (const starter of starters) {
  const metaPath = join(startersDir, starter, "starter.meta.json");

  try {
    const metaContent = readFileSync(metaPath, "utf-8");
    const meta: StarterMeta = JSON.parse(metaContent);

    const valid = validate(meta);

    if (!valid) {
      console.error(`❌ Validation failed for ${starter}/starter.meta.json:`);
      console.error(validate.errors);
      hasErrors = true;
    } else {
      console.log(`✅ ${starter}/starter.meta.json is valid`);
    }
  } catch (error) {
    console.error(`❌ Error reading ${starter}/starter.meta.json:`, error);
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exit(1);
} else {
  console.log("\n✅ All starter metadata files are valid!");
}

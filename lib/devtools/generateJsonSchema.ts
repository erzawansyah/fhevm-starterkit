// tools/generateJsonSchema.ts
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import * as z from "zod";

async function main() {
  const schemasDir = path.join(__dirname, "..", "..", "lib", "schemas");
  if (!fs.existsSync(schemasDir)) {
    fs.mkdirSync(schemasDir, { recursive: true });
  }

  const typesDir = path.join(__dirname, "..", "..", "lib", "types");
  if (!fs.existsSync(typesDir)) {
    console.error(`Types directory not found: ${typesDir}`);
    process.exit(1);
  }

  const typeFiles = fs
    .readdirSync(typesDir)
    .filter(
      (file) => file.endsWith(".schema.ts") || file.endsWith(".schema.js")
    );

  for (const file of typeFiles) {
    try {
      const modulePath = path.join(typesDir, file);
      const moduleUrl = pathToFileURL(modulePath).href;
      const schemaModule = await import(moduleUrl);

      // prefer default export if present, otherwise find a named export that ends with "Schema"
      let schema = schemaModule.default;
      let schemaName: string | undefined;
      if (schema) {
        schemaName = schema.name || file.replace(/\.schema\.(ts|js)$/, "");
      } else {
        const namedKey = Object.keys(schemaModule).find((k) =>
          k.endsWith("Schema")
        );
        if (namedKey) {
          schema = schemaModule[namedKey];
          schemaName = namedKey;
        }
      }

      if (!schema) {
        console.warn(`No schema export found in ${file}`);
        continue;
      }

      const jsonSchema = z.toJSONSchema(schema);
      const outputFileName = file.replace(/\.schema\.(ts|js)$/, ".schema.json");
      fs.writeFileSync(
        path.join(schemasDir, outputFileName),
        JSON.stringify(jsonSchema, null, 2)
      );
      console.log(`✔ ${outputFileName} generated`);
    } catch (err) {
      console.error(`Failed to process ${file}:`, err);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

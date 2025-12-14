import * as fs from "fs";
import { StarterMeta } from "../../lib/types/starter-meta";
import { logger } from "../helper/logger";
import { normalizeDocblock } from "../helper/normalizeDocblock";
import { parseContractSpecs } from "./parser/contractSpecs";
import { parseStateVarSpecs } from "./parser/stateVarSpecs";
import { parseFunctionSpecs } from "./parser/functionSpecs";
import {
  parseStructSpecs,
  parseEnumSpecs,
  parseConstantSpecs,
  parseConstructorSpecs,
} from "./parser/specialSpecs";

function formatDocsAsMarkdown(output: any, metadata: StarterMeta): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${output.title || metadata.label || metadata.name}`);
  lines.push("");

  // Notice
  if (output.notice) {
    lines.push(output.notice);
    lines.push("");
  } else if (metadata.description) {
    lines.push(`## Overview`);
    lines.push("");
    lines.push(metadata.description);
    lines.push("");
  } else {
    lines.push(`## Overview`);
    lines.push("");
    lines.push("No description provided.");
    lines.push("");
  }

  // Dev sections
  if (output.dev) {
    if (output.dev.usage && output.dev.usage.length > 0) {
      lines.push(`## Usage`);
      lines.push("");
      // output.dev.usage.shift();
      for (const item of output.dev.usage) {
        lines.push(`- ${item}`);
      }
      lines.push("");
    }

    if (output.dev.prerequisites && output.dev.prerequisites.length > 0) {
      lines.push(`## Prerequisites`);
      lines.push("");
      // output.dev.prerequisites.shift();
      for (const item of output.dev.prerequisites) {
        lines.push(`- ${item}`);
      }
      lines.push("");
    }

    if (output.dev.notes && output.dev.notes.length > 0) {
      lines.push(`## Notes`);
      lines.push("");
      for (const item of output.dev.notes) {
        lines.push(item);
        lines.push("");
      }
    }
  }

  // Custom fields
  if (output.custom && Object.keys(output.custom).length > 0) {
    lines.push(`## Additional Information`);
    lines.push("");
    for (const [key, value] of Object.entries(output.custom)) {
      lines.push(`**${key}:** ${value}`);
      lines.push("");
    }
  }

  // Enums
  if (output.enums && output.enums.length > 0) {
    lines.push(`## Enums`);
    lines.push("");
    for (const enumItem of output.enums) {
      lines.push(`### \`${enumItem.name}\``);
      lines.push("");
      if (enumItem.docs?.notice) {
        lines.push(enumItem.docs.notice);
        lines.push("");
      }
      if (enumItem.docs?.values && enumItem.docs.values.length > 0) {
        lines.push(`**Values:**`);
        lines.push("");
        for (const val of enumItem.docs.values) {
          lines.push(`- \`${val.name}\`: ${val.notice || "-"}`);
        }
        lines.push("");
      }
    }
  }

  // Constants
  if (output.constants && output.constants.length > 0) {
    lines.push(`## Constants`);
    lines.push("");
    for (const constant of output.constants) {
      lines.push(`### \`${constant.name}\``);
      lines.push("");
      lines.push(`- **Type:** \`${constant.type}\``);
      if (constant.docs?.notice) {
        lines.push(`- **Description:** ${constant.docs.notice}`);
      }
      lines.push("");
    }
  }

  // Structs
  if (output.structs && output.structs.length > 0) {
    lines.push(`## Structs`);
    lines.push("");
    for (const struct of output.structs) {
      lines.push(`### \`${struct.name}\``);
      lines.push("");
      if (struct.docs?.notice) {
        lines.push(struct.docs.notice);
        lines.push("");
      }
      if (struct.docs?.fields && struct.docs.fields.length > 0) {
        lines.push(`**Fields:**`);
        lines.push("");
        for (const field of struct.docs.fields) {
          lines.push(
            `- \`${field.name}\`${field.type ? ` (${field.type})` : ""}: ${
              field.notice || "-"
            }`
          );
        }
        lines.push("");
      }
    }
  }

  // State Variables
  if (output.stateVariables && output.stateVariables.length > 0) {
    lines.push(`## State Variables`);
    lines.push("");
    for (const stateVar of output.stateVariables) {
      lines.push(`### \`${stateVar.name}\``);
      lines.push("");
      lines.push(`- **Type:** \`${stateVar.type}\``);
      lines.push(`- **Visibility:** \`${stateVar.visibility}\``);
      if (stateVar.docs?.notice) {
        lines.push(`- **Description:** ${stateVar.docs.notice}`);
      }
      if (stateVar.docs?.dev && stateVar.docs.dev.length > 0) {
        lines.push(`- **Details:**`);
        for (const devNote of stateVar.docs.dev) {
          lines.push(`  - ${devNote}`);
        }
      }
      lines.push("");
    }
  }

  // Constructor
  if (output.constructor) {
    lines.push(`## Constructor`);
    lines.push("");
    if (output.constructor.notice) {
      lines.push(output.constructor.notice);
      lines.push("");
    }
    if (output.constructor.params && output.constructor.params.length > 0) {
      lines.push(`**Parameters:**`);
      lines.push("");
      lines.push(`| Name | Description |`);
      lines.push(`|------|-------------|`);
      for (const param of output.constructor.params) {
        const desc = param.description || "-";
        lines.push(`| \`${param.name}\` | ${desc} |`);
      }
      lines.push("");
    }
    if (output.constructor.dev && output.constructor.dev.length > 0) {
      lines.push(`**Details:**`);
      lines.push("");
      for (const devNote of output.constructor.dev) {
        lines.push(`- ${devNote}`);
      }
      lines.push("");
    }
  }

  // Functions
  if (output.functions && output.functions.length > 0) {
    lines.push(`## Functions`);
    lines.push("");
    for (const func of output.functions) {
      lines.push(`### \`${func.name}\``);
      lines.push("");

      if (func.docs?.notice) {
        lines.push(func.docs.notice);
        lines.push("");
      }

      // Parameters
      if (func.params && func.params.length > 0) {
        lines.push(`**Parameters:**`);
        lines.push("");
        lines.push(`| Name | Type | Description |`);
        lines.push(`|------|------|-------------|`);
        for (const param of func.params) {
          const desc = param.description || "-";
          lines.push(`| \`${param.name}\` | \`${param.type}\` | ${desc} |`);
        }
        lines.push("");
      }

      // Return value
      if (func.docs?.returns) {
        lines.push(`**Returns:** ${func.docs.returns}`);
        lines.push("");
      }

      // Dev notes
      if (func.docs?.dev && func.docs.dev.length > 0) {
        lines.push(`**Details:**`);
        lines.push("");
        for (const devNote of func.docs.dev) {
          lines.push(`- ${devNote}`);
        }
        lines.push("");
      }

      // Custom fields
      if (func.docs?.custom && Object.keys(func.docs.custom).length > 0) {
        for (const [key, value] of Object.entries(func.docs.custom)) {
          lines.push(`**${key}:** ${value}`);
          lines.push("");
        }
      }
    }
  }

  return lines.join("\n");
}

export function generateDocs(
  starterName: string,
  filename: string,
  contractPath: string,
  metadata: StarterMeta
): void {
  // Implementation for generating documentation

  // Extract category from metadata, default to empty string if not present
  const category = metadata.category || "";
  // Create dir for starter if it doesn't exist
  const categoryDir = `docs/${category}`;
  // Generate output filename
  const outputName = `${starterName}-${filename}.md`;
  // Generate filename based on starter name and given
  const outputPath = `${categoryDir}/${outputName}`;
  // Read contract content (not used in this stub)
  const contractContent = fs.readFileSync(contractPath, "utf-8");

  if (!fs.existsSync(categoryDir)) {
    logger.info(`Creating directory: ${categoryDir}`);
    fs.mkdirSync(categoryDir, { recursive: true });
  }

  const specs = parseContractSpecs(contractContent);

  // extract all documented elements
  const stateVars = extractStateVariables(contractContent);
  const functions = extractFunctions(contractContent);
  const structs = extractStructs(contractContent);
  const enums = extractEnums(contractContent);
  const constants = extractConstants(contractContent);
  const constructor = extractConstructor(contractContent);

  const output = {
    ...specs,
    stateVariables: stateVars,
    functions,
    structs,
    enums,
    constants,
    constructor,
  };

  const markdownContent = formatDocsAsMarkdown(output, metadata);
  fs.writeFileSync(outputPath, markdownContent);
  logger.info(`Documentation generated: ${outputPath}`);
}

// Ambil daftar fungsi dari konten kontrak.
export function parseContractNatspec(doc: string) {
  const lines = normalizeDocblock(doc);

  const result: any = {
    custom: {},
  };

  let currentTag: string | null = null;

  for (const line of lines) {
    // @custom:key
    const customMatch = line.match(/^@custom:([\w-]+)\s+(.*)/);
    if (customMatch) {
      const [, key, value] = customMatch;
      result.custom[key] = value.trim();
      currentTag = null;
      continue;
    }

    // @tag
    const tagMatch = line.match(/^@(\w+)\s+(.*)/);
    if (tagMatch) {
      const [, tag, value] = tagMatch;

      currentTag = tag;

      if (tag === "dev") {
        result.dev = [];
        if (value) result.dev.push(value);
      } else {
        result[tag] = value.trim();
      }
      continue;
    }

    // lanjutan @dev (bullet list atau paragraf)
    if (currentTag === "dev") {
      result.dev.push(line.replace(/^- /, "").trim());
    }
  }

  return result;
}

export function extractStateVariables(source: string) {
  const results: any[] = [];

  /**
   * Regex ini mencari pola:
   * - optional doc comment (/// atau /** * /)
   * - diikuti deklarasi variable level kontrak
   *
   * Catatan:
   * - Disengaja TIDAK support mapping / array kompleks dulu
   * - Fokus ke starter examples
   */
  const stateVarRegex =
    /((?:[ \t]*\/\/\/[^\r\n]*\r?\n)+)?[ \t]*(\w+)\s+(public|private|internal)\s+(\w+)\s*;/g;

  let match;
  while ((match = stateVarRegex.exec(source)) !== null) {
    const [, rawDoc, type, visibility, name] = match;

    let docs = {};
    if (rawDoc && rawDoc.trim()) {
      // Use the dedicated state-var parser which accepts the raw docblock
      docs = parseStateVarSpecs(rawDoc);
    }

    results.push({
      name,
      type,
      visibility,
      docs,
    });
  }

  return results;
}

export function extractFunctions(source: string) {
  const results: any[] = [];
  const functionRegex =
    /((?:\/\/\/.*(?:\r?\n|$))+|\/\*\*[\s\S]*?\*\/)?\s*function\s+(\w+)\s*\(([^)]*)\)/g;

  let match;
  while ((match = functionRegex.exec(source)) !== null) {
    const [, rawDoc, name, paramsStr] = match;

    let docs = {};
    if (rawDoc && rawDoc.trim()) {
      docs = parseFunctionSpecs(rawDoc);
    }

    // Parse parameter types from function signature
    const params: any[] = [];
    if (paramsStr && paramsStr.trim()) {
      const paramList = paramsStr
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      for (const param of paramList) {
        // Match: type [memory|calldata|storage]? name
        const paramMatch = param.match(
          /(\w+(?:\[\])?(?:\s+(?:memory|calldata|storage))?)\s+(\w+)/
        );
        if (paramMatch) {
          const [, type, paramName] = paramMatch;
          // Find corresponding doc from parsed specs
          const docParam = (docs as any).params?.find(
            (p: any) => p.name === paramName
          );
          params.push({
            name: paramName,
            type: type.trim(),
            description: docParam?.description || undefined,
          });
        }
      }
    }

    results.push({
      name,
      params,
      docs,
    });
  }

  return results;
}

export function extractStructs(source: string) {
  const results: any[] = [];
  const structRegex =
    /((?:\/\/\/.*\n)+|\/\*\*[\s\S]*?\*\/\s*)?\s*struct\s+(\w+)\s*\{/g;

  let match;
  while ((match = structRegex.exec(source)) !== null) {
    const [, rawDoc, name] = match;

    let docs = {};
    if (rawDoc) {
      docs = parseStructSpecs(rawDoc);
    }

    results.push({
      name,
      docs,
    });
  }

  return results;
}

export function extractEnums(source: string) {
  const results: any[] = [];
  const enumRegex =
    /((?:\/\/\/.*\n)+|\/\*\*[\s\S]*?\*\/\s*)?\s*enum\s+(\w+)\s*\{/g;

  let match;
  while ((match = enumRegex.exec(source)) !== null) {
    const [, rawDoc, name] = match;

    let docs = {};
    if (rawDoc) {
      docs = parseEnumSpecs(rawDoc);
    }

    results.push({
      name,
      docs,
    });
  }

  return results;
}

export function extractConstants(source: string) {
  const results: any[] = [];
  const constantRegex =
    /((?:\/\/\/.*\n)+|\/\*\*[\s\S]*?\*\/\s*)?\s*(\w+)\s+(?:public|private|internal)?\s*constant\s+(\w+)\s*=/g;

  let match;
  while ((match = constantRegex.exec(source)) !== null) {
    const [, rawDoc, type, name] = match;

    let docs = {};
    if (rawDoc) {
      docs = parseConstantSpecs(rawDoc);
    }

    results.push({
      name,
      type,
      docs,
    });
  }

  return results;
}

export function extractConstructor(source: string) {
  const constructorRegex =
    /((?:\/\/\/.*\n)+|\/\*\*[\s\S]*?\*\/\s*)?\s*constructor\s*\(/;
  const match = constructorRegex.exec(source);

  if (!match) return null;

  const [, rawDoc] = match;
  if (!rawDoc) return null;

  return parseConstructorSpecs(rawDoc);
}

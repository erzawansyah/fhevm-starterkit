#!/usr/bin/env ts-node

import * as fs from "fs";
import * as path from "path";

/**
 * Simple tag map, example:
 * @notice Something
 * @dev Detail
 */
type TagMap = Record<string, string[]>;

interface ExampleMeta {
  id: string;
  title?: string;
  level?: string;
  concepts?: string[];
  summary?: string;
}

interface ParamDoc {
  name: string;
  description: string;
}

interface ReturnDoc {
  name?: string;
  description: string;
}

interface FunctionDoc {
  name: string;
  notice?: string;
  dev?: string[];
  fheOperations?: string[];
  fheVisibility?: string;
  params: ParamDoc[];
  returns: ReturnDoc[];
  security?: string[];
}

interface ContractDoc {
  name: string;
  role?: string;
  description?: string;
  fheConcepts?: string[];
  pitfalls?: string[];
  functions: FunctionDoc[];
}

interface TestCaseDoc {
  id: string;
  description: string;
}

interface TestScenarioDoc {
  id: string;
  title: string;
  cases: TestCaseDoc[];
}

interface TestDoc {
  exampleId: string;
  suite: string;
  goals: string[];
  scenarios: TestScenarioDoc[];
}

interface ExampleDoc {
  meta: ExampleMeta;
  contract: ContractDoc;
  tests: TestDoc;
}

// -------------------- Utils --------------------

function readFileSafe(p: string | undefined): string | null {
  if (!p) return null;
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}

function parseTagBlock(block: string): TagMap {
  const tags: TagMap = {};

  const lines = block.split("\n").map((l) => l.replace(/^\s*\*? ?/, "").trim()); // remove leading " * "

  for (const line of lines) {
    if (!line.startsWith("@")) continue;
    const match = line.match(/^@([a-zA-Z0-9\-]+)\s*(.*)$/);
    if (!match) continue;
    const [, key, valueRaw] = match;
    const value = valueRaw.trim();
    if (!tags[key]) tags[key] = [];
    if (value.length > 0) tags[key].push(value);
  }

  return tags;
}

function getSingleTag(tags: TagMap, key: string): string | undefined {
  const vals = tags[key];
  if (!vals || vals.length === 0) return undefined;
  return vals.join(" ");
}

function getTagLines(tags: TagMap, key: string): string[] {
  const vals = tags[key];
  if (!vals) return [];
  return vals;
}

function getCsvTag(tags: TagMap, key: string): string[] | undefined {
  const v = getSingleTag(tags, key);
  if (!v) return undefined;
  return v
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

// -------------------- Solidity parser --------------------

interface ParsedSolidity {
  exampleHeader?: TagMap;
  contractHeader?: TagMap;
  functions: {
    name: string;
    tags: TagMap;
  }[];
}

function parseSolidityDocblocks(source: string): ParsedSolidity {
  const result: ParsedSolidity = {
    exampleHeader: undefined,
    contractHeader: undefined,
    functions: [],
  };

  const docblockRegex = /\/\*\*([\s\S]*?)\*\/\s*([^\n]*)/g;
  let match: RegExpExecArray | null;

  const blocks: {
    raw: string;
    codeLine: string;
  }[] = [];

  while ((match = docblockRegex.exec(source)) !== null) {
    const [, blockContent, codeLine] = match;
    blocks.push({
      raw: blockContent,
      codeLine: codeLine.trim(),
    });
  }

  for (const b of blocks) {
    const tags = parseTagBlock(b.raw);
    const code = b.codeLine;

    // Header file / example
    if (!code || code.startsWith("//") || code.startsWith("/*")) {
      if (!result.exampleHeader) {
        result.exampleHeader = tags;
      }
      continue;
    }

    // Contract header
    const contractMatch = code.match(
      /^(abstract\s+)?(contract|interface|library)\s+([A-Za-z0-9_]+)/
    );
    if (contractMatch) {
      if (!result.contractHeader) {
        result.contractHeader = tags;
      }
      continue;
    }

    // Function header
    const funcMatch = code.match(/^function\s+([A-Za-z0-9_]+)\s*\(/);
    if (funcMatch) {
      const fnName = funcMatch[1];
      result.functions.push({
        name: fnName,
        tags,
      });
      continue;
    }
  }

  return result;
}

function buildContractDoc(parsed: ParsedSolidity): ContractDoc {
  const contractHeader = parsed.contractHeader || {};

  const contractName =
    getSingleTag(contractHeader, "contract") || "UnknownContract";

  const contract: ContractDoc = {
    name: contractName,
    role: getSingleTag(contractHeader, "role"),
    description: getSingleTag(contractHeader, "description"),
    fheConcepts: getCsvTag(contractHeader, "fhe-concepts"),
    pitfalls: getTagLines(contractHeader, "pitfalls"),
    functions: [],
  };

  for (const fn of parsed.functions) {
    const tags = fn.tags;
    const fnDoc: FunctionDoc = {
      name: fn.name,
      notice: getSingleTag(tags, "notice"),
      dev: getTagLines(tags, "dev"),
      fheOperations: getCsvTag(tags, "fhe-operations"),
      fheVisibility: getSingleTag(tags, "fhe-visibility"),
      params: [],
      returns: [],
      security: getTagLines(tags, "security"),
    };

    const paramLines = getTagLines(tags, "param");
    for (const line of paramLines) {
      const m = line.match(/^([A-Za-z0-9_]+)\s*(.*)$/);
      if (m) {
        fnDoc.params.push({
          name: m[1],
          description: m[2].trim(),
        });
      } else {
        fnDoc.params.push({
          name: "",
          description: line,
        });
      }
    }

    const returnLines = getTagLines(tags, "return");
    for (const line of returnLines) {
      const m = line.match(/^([A-Za-z0-9_]+)\s*(.*)$/);
      if (m) {
        fnDoc.returns.push({
          name: m[1],
          description: m[2].trim(),
        });
      } else {
        fnDoc.returns.push({
          description: line,
        });
      }
    }

    contract.functions.push(fnDoc);
  }

  return contract;
}

function buildExampleMeta(
  exampleHeader: TagMap | undefined,
  metaJson: any | null
): ExampleMeta {
  const tags = exampleHeader || {};
  const fromTags: ExampleMeta = {
    id: getSingleTag(tags, "example-id") || "",
    title: getSingleTag(tags, "example-title"),
    level: getSingleTag(tags, "example-level"),
    concepts: getCsvTag(tags, "example-concepts"),
    summary: getSingleTag(tags, "example-summary"),
  };

  if (metaJson) {
    const id = metaJson.name || fromTags.id;
    return {
      id,
      title: metaJson.title || fromTags.title,
      level: metaJson.category || fromTags.level,
      concepts: metaJson.concepts || fromTags.concepts,
      summary: metaJson.summary || fromTags.summary,
    };
  }

  return fromTags;
}

// -------------------- Test parser --------------------

function parseTestHeaderBlock(source: string): TagMap | undefined {
  const match = source.match(/\/\*\*([\s\S]*?)\*\/\s*/);
  if (!match) return undefined;
  const [, block] = match;
  return parseTagBlock(block);
}

function parseTestScenarios(source: string): TestScenarioDoc[] {
  const lines = source.split("\n");

  const scenarios: TestScenarioDoc[] = [];

  let pendingScenarioId: string | null = null;
  let pendingCaseId: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const scenarioMatch = line.match(/\/\/\s*@scenario\s+([^\s]+)/);
    if (scenarioMatch) {
      pendingScenarioId = scenarioMatch[1].trim();

      for (let j = i + 1; j < lines.length; j++) {
        const descLine = lines[j];
        const dMatch =
          descLine.match(/describe\("([^"]+)"/) ||
          descLine.match(/describe\('([^']+)'/);
        if (dMatch) {
          const title = dMatch[1];
          scenarios.push({
            id: pendingScenarioId,
            title,
            cases: [],
          });
          pendingScenarioId = null;
          break;
        }
      }

      continue;
    }

    const caseMatch = line.match(/\/\/\s*@case\s+([^\s]+)/);
    if (caseMatch) {
      pendingCaseId = caseMatch[1].trim();

      for (let j = i + 1; j < lines.length; j++) {
        const itLine = lines[j];
        const itMatch =
          itLine.match(/it\("([^"]+)"/) || itLine.match(/it\('([^']+)'/);
        if (itMatch) {
          const desc = itMatch[1];
          if (scenarios.length === 0) {
            scenarios.push({
              id: "default",
              title: "Default scenario",
              cases: [],
            });
          }
          const lastScenario = scenarios[scenarios.length - 1];
          lastScenario.cases.push({
            id: pendingCaseId,
            description: desc,
          });
          pendingCaseId = null;
          break;
        }
      }

      continue;
    }
  }

  return scenarios;
}

function buildTestDoc(source: string, exampleId: string): TestDoc {
  const header = parseTestHeaderBlock(source) || {};

  const suite = getSingleTag(header, "test-suite") || "UnknownSuite";

  const goals = getTagLines(header, "test-goal");

  const scenarios = parseTestScenarios(source);

  return {
    exampleId,
    suite,
    goals,
    scenarios,
  };
}

// -------------------- Markdown rendering --------------------

function renderMarkdown(doc: ExampleDoc): string {
  const lines: string[] = [];

  const title = doc.meta.title || `${doc.contract.name} example`;

  lines.push(`# ${doc.contract.name}: ${title}`);
  lines.push("");

  lines.push("## Overview");
  lines.push("");
  lines.push(`**Example ID**: \`${doc.meta.id}\``);
  if (doc.meta.level) {
    lines.push(`**Level**: \`${doc.meta.level}\``);
  }
  if (doc.meta.concepts && doc.meta.concepts.length > 0) {
    lines.push(`**Concepts**: \`${doc.meta.concepts.join("`, `")}\``);
  }
  lines.push("");

  if (doc.meta.summary) {
    lines.push("**Summary**");
    lines.push("");
    lines.push(doc.meta.summary);
    lines.push("");
  }

  lines.push("### What you will learn");
  lines.push("");
  lines.push("- How this example uses encrypted types in FHEVM.");
  lines.push("- How to interact with the contract from the test setup.");
  lines.push("- How to think about visibility and decrypt permissions.");
  lines.push("");

  lines.push("## Contract");
  lines.push("");
  lines.push(`**Name**: \`${doc.contract.name}\``);
  if (doc.contract.role) {
    lines.push(`**Role**: \`${doc.contract.role}\``);
  }
  lines.push("");

  if (doc.contract.description) {
    lines.push("### Description");
    lines.push("");
    lines.push(doc.contract.description);
    lines.push("");
  }

  if (doc.contract.fheConcepts && doc.contract.fheConcepts.length > 0) {
    lines.push("### FHE concepts");
    lines.push("");
    for (const c of doc.contract.fheConcepts) {
      lines.push(`- ${c}`);
    }
    lines.push("");
  }

  if (doc.contract.pitfalls && doc.contract.pitfalls.length > 0) {
    lines.push("### Pitfalls");
    lines.push("");
    for (const p of doc.contract.pitfalls) {
      lines.push(`- ${p}`);
    }
    lines.push("");
  }

  lines.push("## Public API");
  lines.push("");

  for (const fn of doc.contract.functions) {
    lines.push(`### \`${fn.name}\``);
    lines.push("");

    if (fn.notice) {
      lines.push("**What it does**");
      lines.push("");
      lines.push(fn.notice);
      lines.push("");
    }

    if (fn.dev && fn.dev.length > 0) {
      lines.push("**How it works**");
      lines.push("");
      for (const d of fn.dev) {
        lines.push(`- ${d}`);
      }
      lines.push("");
    }

    if ((fn.fheOperations && fn.fheOperations.length > 0) || fn.fheVisibility) {
      lines.push("**FHE details**");
      lines.push("");
      if (fn.fheOperations && fn.fheOperations.length > 0) {
        lines.push(`- Operations: \`${fn.fheOperations.join("`, `")}\``);
      }
      if (fn.fheVisibility) {
        lines.push(`- Visibility: \`${fn.fheVisibility}\``);
      }
      lines.push("");
    }

    if (fn.params.length > 0) {
      lines.push("**Parameters**");
      lines.push("");
      for (const p of fn.params) {
        const label = p.name ? `\`${p.name}\`` : "parameter";
        lines.push(`- ${label} ${p.description}`);
      }
      lines.push("");
    }

    if (fn.returns.length > 0) {
      lines.push("**Returns**");
      lines.push("");
      for (const r of fn.returns) {
        const label = r.name ? `\`${r.name}\`` : "value";
        lines.push(`- ${label} ${r.description}`);
      }
      lines.push("");
    }

    if (fn.security && fn.security.length > 0) {
      lines.push("**Security notes**");
      lines.push("");
      for (const s of fn.security) {
        lines.push(`- ${s}`);
      }
      lines.push("");
    }
  }

  lines.push("## Tests");
  lines.push("");
  lines.push(`**Suite**: \`${doc.tests.suite}\``);
  lines.push("");

  if (doc.tests.goals.length > 0) {
    lines.push("### Test goals");
    lines.push("");
    for (const g of doc.tests.goals) {
      lines.push(`- ${g}`);
    }
    lines.push("");
  }

  if (doc.tests.scenarios.length > 0) {
    lines.push("### Scenarios");
    lines.push("");
    for (const s of doc.tests.scenarios) {
      lines.push(`#### Scenario \`${s.id}\``);
      lines.push("");
      lines.push(s.title);
      lines.push("");
      if (s.cases.length > 0) {
        lines.push("Cases:");
        lines.push("");
        for (const c of s.cases) {
          lines.push(`- \`${c.id}\`: ${c.description}`);
        }
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}

// -------------------- File discovery --------------------

function findFirstFileWithExt(dir: string, exts: string[]): string {
  if (!fs.existsSync(dir)) {
    throw new Error(`Directory not found: ${dir}`);
  }
  const files = fs.readdirSync(dir);
  const found = files.find((f) =>
    exts.some((ext) => f.toLowerCase().endsWith(ext.toLowerCase()))
  );
  if (!found) {
    throw new Error(
      `No matching files in ${dir} for extensions: ${exts.join(", ")}`
    );
  }
  return path.join(dir, found);
}

// -------------------- Main --------------------

function main() {
  const exampleId = process.argv[2];

  if (!exampleId) {
    console.error("Usage: npm run docs:generate <example-id>");
    process.exit(1);
  }

  const projectRoot = path.resolve(__dirname, "..");
  const startersRoot = path.join(projectRoot, "starters");
  const exampleRoot = path.join(startersRoot, exampleId);

  if (!fs.existsSync(exampleRoot)) {
    console.error(`Example folder not found: ${exampleRoot}`);
    process.exit(1);
  }

  const contractsDir = path.join(exampleRoot, "contracts");
  const testDir = path.join(exampleRoot, "test");
  const metaPath = path.join(exampleRoot, "starter.meta.json");
  const readmePath = path.join(exampleRoot, "README.md");

  const contractPath = findFirstFileWithExt(contractsDir, [".sol"]);
  const testPath = findFirstFileWithExt(testDir, [".ts", ".tsx"]);

  const contractSource = readFileSafe(contractPath);
  const testSource = readFileSafe(testPath);
  const metaSource = readFileSafe(metaPath);

  if (!contractSource || !testSource) {
    console.error("Missing contract or test source");
    process.exit(1);
  }

  let metaJson: any | null = null;
  if (metaSource) {
    try {
      metaJson = JSON.parse(metaSource);
    } catch (e) {
      console.warn("Failed to parse starter.meta.json, ignoring.");
    }
  }

  const parsedSol = parseSolidityDocblocks(contractSource);
  const exampleMeta = buildExampleMeta(parsedSol.exampleHeader, metaJson);

  if (!exampleMeta.id) {
    console.warn("Warning: example-id not found, docs may be incomplete.");
  }

  const contractDoc = buildContractDoc(parsedSol);
  const testDoc = buildTestDoc(testSource, exampleMeta.id);

  const exampleDoc: ExampleDoc = {
    meta: exampleMeta,
    contract: contractDoc,
    tests: testDoc,
  };

  const markdown = renderMarkdown(exampleDoc);

  fs.writeFileSync(readmePath, markdown, "utf8");

  console.log(`Docs generated for example "${exampleId}" at ${readmePath}`);
}

main();

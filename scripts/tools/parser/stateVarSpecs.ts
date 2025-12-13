import { normalizeDocblock } from "../../helper/normalizeDocblock";

export interface StateVarSpecs {
  name?: string;
  type?: string;
  notice?: string;
  dev?: string[];
  custom?: Record<string, string>;
}

/**
 * Parse a Natspec docblock that documents a state variable.
 * Expected tags:
 * - @notice (one-line)
 * - @dev (multi-line) optional
 * - @custom:<key> optional
 * - @name, @type optional helpers
 */
export function parseStateVarSpecs(doc: string): StateVarSpecs {
  const lines = normalizeDocblock(doc);
  const result: StateVarSpecs = { custom: {} };

  let currentTag: string | null = null;

  for (const line of lines) {
    const customMatch = line.match(/^@custom:([\w-]+)\s*(.*)/);
    if (customMatch) {
      const [, key, value] = customMatch;
      result.custom = result.custom || {};
      result.custom[key] = (value || "").trim();
      currentTag = null;
      continue;
    }

    const tagMatch = line.match(/^@(\w+)\s*(.*)/);
    if (tagMatch) {
      const [, tag, value] = tagMatch;
      currentTag = tag;

      if (tag === "notice") {
        result.notice = (value || "").trim();
      } else if (tag === "dev") {
        result.dev = result.dev || [];
        const v = (value || "").trim();
        if (v) result.dev.push(v);
      } else if (tag === "name") {
        result.name = (value || "").trim();
      } else if (tag === "type") {
        result.type = (value || "").trim();
      }
      continue;
    }

    // continuation lines for @dev
    if (currentTag === "dev") {
      result.dev = result.dev || [];
      const text = line.replace(/^-\s*/, "").trim();
      if (text) result.dev.push(text);
    }
  }

  return result;
}

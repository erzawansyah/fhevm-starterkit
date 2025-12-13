import { normalizeDocblock } from "../../helper/normalizeDocblock";

export interface FunctionParam {
  name: string;
  description?: string;
}

export interface FunctionSpecs {
  name?: string;
  notice?: string;
  dev?: string[];
  params?: FunctionParam[];
  returns?: string;
  custom?: Record<string, string>;
}

/**
 * Parse a Natspec docblock for a function.
 * Supports: @notice, @dev, @param, @return(s), @custom:<key>, @name
 */
export function parseFunctionSpecs(doc: string): FunctionSpecs {
  const lines = normalizeDocblock(doc);
  const result: FunctionSpecs = { custom: {} };

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
      } else if (tag === "param") {
        result.params = result.params || [];
        const m = (value || "").trim().match(/^(\w+)\s*(.*)/);
        if (m) {
          const [, name, desc] = m;
          result.params.push({ name, description: (desc || "").trim() });
        }
      } else if (tag === "return" || tag === "returns") {
        result.returns = (value || "").trim();
      } else if (tag === "name") {
        result.name = (value || "").trim();
      }
      continue;
    }

    // continuation lines
    if (currentTag === "dev") {
      result.dev = result.dev || [];
      const text = line.replace(/^-\s*/, "").trim();
      if (text) result.dev.push(text);
      continue;
    }

    if (currentTag === "param") {
      const text = line.trim();
      if (text && result.params && result.params.length > 0) {
        const last = result.params[result.params.length - 1];
        last.description = ((last.description || "") + " " + text).trim();
      }
      continue;
    }

    if (currentTag === "return" || currentTag === "returns") {
      const text = line.trim();
      if (text)
        result.returns = result.returns ? result.returns + " " + text : text;
      continue;
    }
  }

  return result;
}

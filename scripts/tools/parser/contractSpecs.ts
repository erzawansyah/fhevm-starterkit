/**
 * Module ini berfungsi untuk mengambil spesifikasi kontrak dari docblock Natspec.
 * Spesifikasi ini meliputi tag-tag seperti @title, @author, @notice, @dev, dan tag kustom seperti @custom:key yang
 * berada di luar blok contract dan tepat di atas deklarasi kontrak.
 */

import { normalizeDocblock } from "../../helper/normalizeDocblock";

export interface ContractSpecs {
  title?: string;
  author?: string;
  notice?: string;
  dev?: {
    usage?: string[];
    prerequisites?: string[];
    notes?: string[];
  };
  custom: Record<string, string>;
}

export function parseContractSpecs(doc: string): ContractSpecs {
  const lines = normalizeDocblock(doc);

  const result: ContractSpecs = {
    custom: {},
  };

  let currentTag: string | null = null;
  let currentDevSection: "usage" | "prerequisites" | "notes" | null = null;

  for (const line of lines) {
    // @custom:key
    const customMatch = line.match(/^@custom:([\w-]+)\s*(.*)/);
    if (customMatch) {
      const [, key, value] = customMatch;
      result.custom[key] = (value || "").trim();
      currentTag = null;
      currentDevSection = null;
      continue;
    }

    // @tag (general)
    const tagMatch = line.match(/^@(\w+)\s*(.*)/);
    if (tagMatch) {
      const [, tag, value] = tagMatch;

      currentTag = tag;
      currentDevSection = null;

      if (tag === "dev") {
        if (!result.dev)
          result.dev = { usage: [], prerequisites: [], notes: [] };
        const v = (value || "").trim();
        if (!v) continue;

        const usageMatch = v.match(/^Usage summary:\s*(.*)/i);
        const prereqMatch = v.match(/^Prerequisites?:\s*(.*)/i);
        if (usageMatch) {
          currentDevSection = "usage";
          if (usageMatch[1].trim())
            result.dev!.usage!.push(usageMatch[1].trim());
        } else if (prereqMatch) {
          currentDevSection = "prerequisites";
          if (prereqMatch[1].trim())
            result.dev!.prerequisites!.push(prereqMatch[1].trim());
        } else {
          currentDevSection = "notes";
          result.dev!.notes!.push(v);
        }
      } else if (tag === "title" || tag === "author" || tag === "notice") {
        result[tag] = (value || "").trim();
      }
      continue;
    }

    // continuation lines for @dev: bullets or paragraphs
    if (currentTag === "dev") {
      if (!result.dev) result.dev = { usage: [], prerequisites: [], notes: [] };
      const text = line.replace(/^-\s*/, "").trim();
      if (!text) continue;

      // explicit subsection markers inside @dev block
      const usageMarker = text.match(/^Usage summary:\s*(.*)/i);
      const prereqMarker = text.match(/^Prerequisites?:\s*(.*)/i);
      if (usageMarker) {
        currentDevSection = "usage";
        if (usageMarker[1].trim())
          result.dev.usage!.push(usageMarker[1].trim());
        continue;
      }
      if (prereqMarker) {
        currentDevSection = "prerequisites";
        if (prereqMarker[1].trim())
          result.dev.prerequisites!.push(prereqMarker[1].trim());
        continue;
      }

      // default append to current dev subsection, or notes if none
      const target = currentDevSection || "notes";
      if (!result.dev[target]) result.dev[target] = [];
      result.dev[target]!.push(text);
    }
  }

  return result;
}

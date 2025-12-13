import { normalizeDocblock } from "../../helper/normalizeDocblock";

export interface StructField {
  name: string;
  type?: string;
  notice?: string;
}

export interface StructSpecs {
  name?: string;
  notice?: string;
  dev?: string[];
  fields?: StructField[];
  custom?: Record<string, string>;
}

export interface EnumValue {
  name: string;
  notice?: string;
}

export interface EnumSpecs {
  name?: string;
  notice?: string;
  dev?: string[];
  values?: EnumValue[];
  custom?: Record<string, string>;
}

export interface ConstantSpecs {
  name?: string;
  type?: string;
  notice?: string;
  dev?: string[];
  custom?: Record<string, string>;
}

export interface ConstructorParam {
  name: string;
  description?: string;
}

export interface ConstructorSpecs {
  notice?: string;
  dev?: string[];
  params?: ConstructorParam[];
  custom?: Record<string, string>;
}

function pushCustom(
  dst: Record<string, string> | undefined,
  k: string,
  v: string
) {
  if (!dst) return { [k]: v };
  dst[k] = v;
  return dst;
}

export function parseStructSpecs(doc: string): StructSpecs {
  const lines = normalizeDocblock(doc);
  const res: StructSpecs = { custom: {}, fields: [] };
  let currentTag: string | null = null;

  for (const line of lines) {
    const custom = line.match(/^@custom:([\w-]+)\s*(.*)/);
    if (custom) {
      const [, k, v] = custom;
      res.custom = pushCustom(res.custom, k, (v || "").trim());
      currentTag = null;
      continue;
    }

    const tag = line.match(/^@(\w+)\s*(.*)/);
    if (tag) {
      const [, t, val] = tag;
      currentTag = t;
      if (t === "notice") res.notice = (val || "").trim();
      else if (t === "dev") {
        res.dev = res.dev || [];
        if (val && val.trim()) res.dev.push(val.trim());
      } else if (t === "name") {
        res.name = (val || "").trim();
      }
      continue;
    }

    // field lines: support "@field name type description" or "- name (type): desc"
    const f1 = line.match(/^@field\s+(\w+)\s+(\S+)\s*(.*)/);
    if (f1) {
      const [, name, type, desc] = f1;
      res.fields!.push({ name, type, notice: (desc || "").trim() });
      continue;
    }

    const bullet = line.match(/^-\s*(\w+)\s*(?:\(([^)]+)\))?\s*:?\s*(.*)/);
    if (bullet) {
      const [, name, type, desc] = bullet;
      res.fields!.push({
        name,
        type: type || undefined,
        notice: (desc || "").trim(),
      });
      continue;
    }
  }

  return res;
}

export function parseEnumSpecs(doc: string): EnumSpecs {
  const lines = normalizeDocblock(doc);
  const res: EnumSpecs = { custom: {}, values: [] };
  let currentTag: string | null = null;

  for (const line of lines) {
    const custom = line.match(/^@custom:([\w-]+)\s*(.*)/);
    if (custom) {
      const [, k, v] = custom;
      res.custom = pushCustom(res.custom, k, (v || "").trim());
      currentTag = null;
      continue;
    }

    const tag = line.match(/^@(\w+)\s*(.*)/);
    if (tag) {
      const [, t, val] = tag;
      currentTag = t;
      if (t === "notice") res.notice = (val || "").trim();
      else if (t === "dev") {
        res.dev = res.dev || [];
        if (val && val.trim()) res.dev.push(val.trim());
      } else if (t === "name") res.name = (val || "").trim();
      else if (t === "value") {
        const m = (val || "").trim().match(/^(\w+)\s*(.*)/);
        if (m) res.values!.push({ name: m[1], notice: (m[2] || "").trim() });
      }
      continue;
    }

    // bullet value: "- NAME: description"
    const bullet = line.match(/^-\s*(\w+)\s*:?\s*(.*)/);
    if (bullet) {
      const [, name, desc] = bullet;
      res.values!.push({ name, notice: (desc || "").trim() });
      continue;
    }
  }

  return res;
}

export function parseConstantSpecs(doc: string): ConstantSpecs {
  const lines = normalizeDocblock(doc);
  const res: ConstantSpecs = { custom: {}, dev: [] };
  let currentTag: string | null = null;

  for (const line of lines) {
    const custom = line.match(/^@custom:([\w-]+)\s*(.*)/);
    if (custom) {
      const [, k, v] = custom;
      res.custom = pushCustom(res.custom, k, (v || "").trim());
      currentTag = null;
      continue;
    }

    const tag = line.match(/^@(\w+)\s*(.*)/);
    if (tag) {
      const [, t, val] = tag;
      currentTag = t;
      if (t === "notice") res.notice = (val || "").trim();
      else if (t === "dev") {
        res.dev = res.dev || [];
        if (val && val.trim()) res.dev.push(val.trim());
      } else if (t === "name") res.name = (val || "").trim();
      else if (t === "type") res.type = (val || "").trim();
      continue;
    }
  }

  return res;
}

export function parseConstructorSpecs(doc: string): ConstructorSpecs {
  const lines = normalizeDocblock(doc);
  const res: ConstructorSpecs = { custom: {}, dev: [], params: [] };
  let currentTag: string | null = null;

  for (const line of lines) {
    const custom = line.match(/^@custom:([\w-]+)\s*(.*)/);
    if (custom) {
      const [, k, v] = custom;
      res.custom = pushCustom(res.custom, k, (v || "").trim());
      currentTag = null;
      continue;
    }

    const tag = line.match(/^@(\w+)\s*(.*)/);
    if (tag) {
      const [, t, val] = tag;
      currentTag = t;
      if (t === "notice") res.notice = (val || "").trim();
      else if (t === "dev") {
        if (val && val.trim()) res.dev!.push(val.trim());
      } else if (t === "param") {
        const m = (val || "").trim().match(/^(\w+)\s*(.*)/);
        if (m)
          res.params!.push({ name: m[1], description: (m[2] || "").trim() });
      }
      continue;
    }

    // continuation for @dev or param
    if (currentTag === "dev") {
      const text = line.replace(/^-\s*/, "").trim();
      if (text) res.dev!.push(text);
      continue;
    }
    if (currentTag === "param") {
      const text = line.trim();
      if (text && res.params && res.params.length > 0) {
        const last = res.params[res.params.length - 1];
        last.description = ((last.description || "") + " " + text).trim();
      }
      continue;
    }
  }

  return res;
}

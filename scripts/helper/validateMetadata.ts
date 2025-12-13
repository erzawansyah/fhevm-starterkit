export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

export function validateMetadata(meta: any): ValidationResult {
  const errors: string[] = [];

  /* ===============================
     Helper kecil
  =============================== */

  const isNonEmptyString = (v: any) =>
    typeof v === "string" && v.trim().length > 0;

  const isStringArray = (v: any) =>
    Array.isArray(v) && v.every((x) => typeof x === "string");

  const isSemver = (v: string) => /^\d+\.\d+\.\d+$/.test(v);

  const isDashCase = (v: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v);

  /* ===============================
     Root object
  =============================== */

  if (typeof meta !== "object" || meta === null) {
    return {
      ok: false,
      errors: ["starter.meta.json must be an object"],
    };
  }

  /* ===============================
     name
  =============================== */

  if (!isNonEmptyString(meta.name)) {
    errors.push("`name` is required and must be a non-empty string");
  } else if (!isDashCase(meta.name)) {
    errors.push("`name` must be lowercase and dash-case (e.g. fhe-add)");
  }

  /* ===============================
     label
  =============================== */

  if (!isNonEmptyString(meta.label)) {
    errors.push("`label` is required and must be a non-empty string");
  }

  /* ===============================
     description
  =============================== */

  if (!isNonEmptyString(meta.description)) {
    errors.push("`description` is required and must be a non-empty string");
  } else if (meta.description.length > 300) {
    errors.push("`description` must not exceed 300 characters");
  }

  /* ===============================
     version
  =============================== */

  if (!isNonEmptyString(meta.version)) {
    errors.push("`version` is required and must be a string");
  } else if (!isSemver(meta.version)) {
    errors.push("`version` must follow semantic versioning (x.y.z)");
  }

  /* ===============================
     fhevm_version
  =============================== */

  if (!isNonEmptyString(meta.fhevm_version)) {
    errors.push("`fhevm_version` is required and must be a string");
  }

  /* ===============================
     category
  =============================== */

  const allowedCategories = ["fundamental", "patterns", "applied", "advanced"];

  if (!isNonEmptyString(meta.category)) {
    errors.push("`category` is required");
  } else if (!allowedCategories.includes(meta.category)) {
    errors.push(
      "`category` must be one of: fundamental | patterns | applied | advanced"
    );
  }

  /* ===============================
     tags
  =============================== */

  if (!Array.isArray(meta.tags)) {
    errors.push("`tags` must be an array of strings");
  } else if (!isStringArray(meta.tags)) {
    errors.push("`tags` must contain only strings");
  }

  /* ===============================
     concepts
  =============================== */

  if (!Array.isArray(meta.concepts)) {
    errors.push("`concepts` must be an array of strings");
  } else if (!isStringArray(meta.concepts)) {
    errors.push("`concepts` must contain only strings");
  }

  /* ===============================
     has_ui
  =============================== */

  if (typeof meta.has_ui !== "boolean") {
    errors.push("`has_ui` must be a boolean");
  }

  /* ===============================
     authors
  =============================== */

  if (!Array.isArray(meta.authors) || meta.authors.length === 0) {
    errors.push("`authors` must be a non-empty array");
  } else {
    meta.authors.forEach((a: any, idx: number) => {
      validateAuthor(a, idx, errors);
    });
  }

  /* ===============================
     Final
  =============================== */

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
}

/* =================================
   Author validation
================================= */

function validateAuthor(author: any, index: number, errors: string[]) {
  const prefix = `authors[${index}]`;

  if (typeof author !== "object" || author === null) {
    errors.push(`${prefix} must be an object`);
    return;
  }

  if (typeof author.name !== "string" || author.name.trim() === "") {
    errors.push(`${prefix}.name is required and must be a non-empty string`);
  }

  if (author.email !== undefined && typeof author.email !== "string") {
    errors.push(`${prefix}.email must be a string if provided`);
  }

  if (author.url !== undefined && typeof author.url !== "string") {
    errors.push(`${prefix}.url must be a string if provided`);
  }
}

import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";

export type RunOptions = { cwd?: string; silent?: boolean };

export function run(cmd: string, opts?: RunOptions | boolean): Promise<void> {
  const options: RunOptions =
    typeof opts === "object" ? opts : { silent: !!opts };
  const cwd = options.cwd ?? process.cwd();
  const silent = !!options.silent;

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, {
      cwd,
      shell: true,
      stdio: silent ? "ignore" : "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`)),
    );
  });
}

export function quotePath(p: string) {
  return `"${p.replace(/\\/g, "/")}"`;
}

export function isEmptyDir(dir: string) {
  if (!fs.existsSync(dir)) return true; // Direktori tidak ada
  const files = fs.readdirSync(dir); // Baca semua file dalam direktori
  return files.length === 0; // Return true jika tidak ada file
}

export function emptyDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return;
  }

  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    const entryPath = path.join(dir, entry);
    try {
      const stat = fs.lstatSync(entryPath);
      if (stat.isDirectory()) {
        fs.rmSync(entryPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(entryPath);
      }
    } catch {
      // ignore per-file errors
    }
  }
}

export function safeReadJson<T = unknown>(
  filePath: string,
): { ok: true; data: T } | { ok: false; error: string } {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return { ok: true, data: JSON.parse(raw) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)) + "…";
}

export function padRight(text: string, width: number): string {
  if (text.length >= width) return text;
  return text + " ".repeat(width - text.length);
}

export function formatTags(tags?: string[], maxTags = 5): string {
  if (!tags || tags.length === 0) return "";
  const shown = tags.slice(0, maxTags);
  const more = tags.length > maxTags ? ` +${tags.length - maxTags}` : "";
  return `[${shown.join(", ")}${more}]`;
}

export function parseCount(count: unknown): number | undefined {
  if (count === undefined || count === null) return undefined;
  const n = typeof count === "number" ? count : Number(String(count).trim());
  if (Number.isNaN(n)) return undefined;
  const fixed = Math.floor(n);
  if (fixed < 0) return undefined;
  return fixed;
}

export function getRemoteHeadCommitHash(repo: string, branch = "main"): string {
  const out = execSync(`git ls-remote ${quotePath(repo)} refs/heads/${branch}`)
    .toString()
    .trim();
  const sha = out.split(/\s+/)[0];
  if (!sha || sha.length < 7) {
    throw new Error(
      `Gagal mengambil remote HEAD commit untuk ${repo} (branch: ${branch}).`,
    );
  }
  return sha;
}

export async function checkoutRepoCommit(
  targetDir: string,
  commitHash: string,
  verbose = true,
) {
  await run(
    `cd ${quotePath(
      targetDir,
    )} && git fetch --all --prune && git checkout ${commitHash}`,
    verbose,
  );
}

export type RemoveLinesOptions = {
  exact?: boolean; // trim and compare equality
  regex?: boolean; // treat `match` as a RegExp (accepts `/pat/flags` or plain pattern)
};

export function removeLinesFromFile(
  filePath: string,
  match: string,
  opts: RemoveLinesOptions = {},
): { changed: boolean; before: string; after: string } {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  const raw = fs.readFileSync(abs, "utf8");
  const lines = raw.split(/\r?\n/);

  let matcher: RegExp | undefined;
  if (opts.regex) {
    if (match.startsWith("/") && match.lastIndexOf("/") > 0) {
      const last = match.lastIndexOf("/");
      const pattern = match.slice(1, last);
      const flags = match.slice(last + 1);
      matcher = new RegExp(pattern, flags);
    } else {
      matcher = new RegExp(match);
    }
  }

  let outLines: string[];
  if (opts.exact) {
    const target = match.trim();
    outLines = lines.filter((l) => l.trim() !== target);
  } else if (opts.regex && matcher) {
    outLines = lines.filter((l) => !matcher!.test(l));
  } else {
    outLines = lines.filter((l) => l.indexOf(match) === -1);
  }

  const before = lines.join("\n");
  const after = outLines.join("\n");
  const changed = before !== after;
  if (changed) fs.writeFileSync(abs, after, "utf8");
  return { changed, before, after };
}

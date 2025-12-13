export function parseLineDoc(lines: string[]) {
  const docs: Record<string, string> = {};

  for (const line of lines) {
    const m = line.match(/^@(\w+)\s+(.*)/);
    if (m) {
      docs[m[1]] = m[2].trim();
    }
  }

  return docs;
}

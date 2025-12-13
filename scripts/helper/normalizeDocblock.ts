export function normalizeDocblock(doc: string): string[] {
  // Handle /** */ style comments
  const blockMatch = doc.match(/\/\*\*([\s\S]*?)\*\//);
  if (blockMatch) {
    return blockMatch[1]
      .split("\n")
      .map((l) => l.replace(/^\s*\*\s?/, "").trim())
      .filter(Boolean);
  }

  // Handle /// style comments
  const lines = doc.split("\n");
  const result: string[] = [];
  for (const line of lines) {
    const cleaned = line.replace(/^\s*\/\/\/\s?/, "").trim();
    if (cleaned) result.push(cleaned);
  }

  return result;
}

import fs from "fs";
import { logger } from "./logger";

/**
 * Mendapatkan daftar nama starter yang tersedia dari direktori starters
 * @param startersDir Path ke direktori starters
 * @returns Daftar nama starter yang tersedia
 */
function listStarters(startersDir: string): string[] {
  try {
    const entries = fs.readdirSync(startersDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((d) => d.name)
      .sort();
  } catch (e) {
    return [];
  }
}

function listStartersWithMetadata(
  startersDir: string
): { name: string; metadata: Record<string, any> }[] {
  const starters = listStarters(startersDir);
  const inValidStarters: string[] = [];
  const validStarters = starters.map((name) => {
    const metadataPath = `${startersDir}/${name}/metadata.json`;
    let metadata = {};
    if (fs.existsSync(metadataPath)) {
      try {
        const data = fs.readFileSync(metadataPath, "utf-8");
        metadata = JSON.parse(data);
        if (typeof metadata !== "object" || Array.isArray(metadata)) {
          inValidStarters.push(name);
          metadata = {};
        }
      } catch (e) {}
    }
    return { name, metadata: metadata as Record<string, any> };
  });

  if (inValidStarters.length > 0) {
    logger.warning(
      `Starter berikut diabaikan karena metadata tidak valid: ${inValidStarters.join(
        ", "
      )}`
    );
  }

  return validStarters;
}

export { listStarters, listStartersWithMetadata };

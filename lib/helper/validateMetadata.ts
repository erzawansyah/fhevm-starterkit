import { StarterMetadataSchema } from "../types/starterMetadata.schema.js";
export async function validateMetadata(
  metadata: unknown,
): Promise<{ valid: boolean; errors: string[] }> {
  const result = StarterMetadataSchema.safeParse(metadata);
  if (result.success) {
    return { valid: true, errors: [] };
  } else {
    const errors = result.error.issues.map(
      (e) => `- ${e.path.join(".")}: ${e.message}`,
    );
    return { valid: false, errors };
  }
}

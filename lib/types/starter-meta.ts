/**
 * Type definition for starter.meta.json files
 */
export interface StarterMeta {
  /** Unique identifier for the starter */
  id: string;

  /** Display name of the starter */
  name: string;

  /** Brief description of what this starter demonstrates */
  description: string;

  /** Difficulty level */
  difficulty: "beginner" | "intermediate" | "advanced";

  /** Tags for categorization */
  tags: string[];

  /** FHE operations demonstrated */
  fheOperations?: string[];

  /** Author information (optional) */
  author?: {
    name: string;
    url?: string;
  };

  /** Version of the starter */
  version?: string;
}

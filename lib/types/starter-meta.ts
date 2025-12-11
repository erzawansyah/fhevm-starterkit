export interface StarterMeta {
  /**
   * Internal identifier for the starter.
   * Must be lowercase and dash-case (validated via schema).
   */
  name: string;

  /**
   * Human-readable name displayed in UI or documentation.
   */
  label: string;

  /**
   * Short explanation of what this starter does.
   * Max length: 300 characters.
   */
  description: string;

  /**
   * Starter version in semantic versioning (e.g., 1.0.0).
   */
  version: string;

  /**
   * Compatible FHEVM version used by this starter.
   */
  fhevm_version: string;

  /**
   * Educational level or type of the starter.
   * Must be one of: fundamental | patterns | applied | advanced
   */
  category: "fundamental" | "patterns" | "applied" | "advanced";

  /**
   * Flexible tags for filtering or grouping.
   */
  tags: string[];

  /**
   * Technical or educational concepts demonstrated by this starter.
   */
  concepts: string[];

  /**
   * Indicates whether this starter includes a user interface.
   */
  has_ui: boolean;

  /**
   * List of authors or contributors.
   */
  authors: AuthorEntry[];
}

/**
 * Single author object definition.
 */
export interface AuthorEntry {
  /**
   * Name of the contributor.
   */
  name: string;

  /**
   * Email address of the contributor.
   * Optional.
   */
  email?: string;

  /**
   * Link to the contributor's profile or website.
   * Optional.
   */
  url?: string;
}

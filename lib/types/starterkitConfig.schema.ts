import { z } from "zod";

export const PathConfigSchema = z.object({
  frontendDir: z.string().optional(),
});
export type PathConfigType = z.infer<typeof PathConfigSchema>;

export const TemplateConfigSchema = z.object({
  repo: z.string(),
  dir: z.string(),
  branch: z.string().optional(),
  commit: z.string().optional(),
});
export type TemplateConfigType = z.infer<typeof TemplateConfigSchema>;

export const CopyFileSchema = z.object({
  from: z.string(),
  to: z.string(),
});
export const CreateFileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

/**
 * Template Actions Configuration Schema
 * Defines actions to be performed when copying templates
 */
export const TemplateActionsConfigSchema = z.object({
  /** Directories to exclude during copy (e.g., .git, node_modules) to avoid locked files */
  excludeDirs: z.array(z.string()).optional(),
  /** Files to exclude during copy (e.g., example contracts, tests) */
  excludeFiles: z.array(z.string()).optional(),
  /** Files to create during copy (e.g., new configuration files) */
  createFiles: z.array(CreateFileSchema).optional(),
});
export type TemplateActionsConfigType = z.infer<
  typeof TemplateActionsConfigSchema
>;

export const TaxonomyConfigSchema = z.object({
  categories: z.array(z.string()),
  chapters: z.array(z.string()),
  commonTags: z.array(z.string()),
  concepts: z.record(z.string(), z.array(z.string())), // key: concept slug, value: description
});
export type TaxonomyConfigType = z.infer<typeof TaxonomyConfigSchema>;

export const StarterKitConfigSchema = z.object({
  startersDir: z.string(), // place where all starters are stored
  workingDir: z.string(), // place where starters will be created
  metadataFile: z.string(), // metadata file name inside each starter
  starterFrontendDir: z.string().optional(), // frontend directory inside each starter (built from frontend template)
  template: z.object({
    hardhat: TemplateConfigSchema, // hardhat template config
    frontend: TemplateConfigSchema, // frontend template config
    actions: TemplateActionsConfigSchema, // actions to perform when copying templates
    overrides: z.string() // overrides template directory
  }),
  taxonomy: TaxonomyConfigSchema,
  validation: z.object({
    requiredFiles: z.array(z.string()),
    requiredFolders: z.array(z.string()),
    fileTypeRestrictions: z.record(z.string(), z.array(z.string())),
  }),
});
export type StarterKitConfigType = z.infer<typeof StarterKitConfigSchema>;

export default StarterKitConfigSchema;

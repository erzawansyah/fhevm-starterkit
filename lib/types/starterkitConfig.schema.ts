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

export const TemplateActionsConfigSchema = z.object({
  removeDirs: z.array(z.string()).optional(),
  removeFiles: z.array(z.string()).optional(),
  copyFiles: z.array(CopyFileSchema).optional(),
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
  startersDir: z.string(),
  workingDir: z.string(),
  metadataFile: z.string(),
  path: PathConfigSchema,
  template: z.object({
    hardhat: TemplateConfigSchema,
    frontend: TemplateConfigSchema,
    actions: TemplateActionsConfigSchema,
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

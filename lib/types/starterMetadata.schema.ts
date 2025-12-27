// schemas/starterMetadata.schema.ts
import { string, z } from "zod";
import config from "../../starterkit.config";

const CategoryEnum = z.enum([...config.taxonomy.categories]);
const ChapterEnum = z.enum([...config.taxonomy.chapters]);
const ConceptEnum = z.enum([...Object.values(config.taxonomy.concepts).flat()]);
const CommonTagsEnum = z.enum([...config.taxonomy.commonTags]);
const TagsEnum = z.union([CommonTagsEnum, z.string()]);

export const StarterMetadataSchema = z.object({
  // unique identifier, no spaces, lowercase, hyphens
  // Example: fhe-counter
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9\-]+$/, {
      message: "Name must be lowercase alphanumeric with hyphens",
    }),
  // Name in contract files
  // Example: FHECounter
  contract_name: z.string().min(1).max(100, {
    message: "Contract name max length is 100",
  }),
  // Filename of the main contract
  // Example: FHECounter.sol
  contract_filename: z.string().min(1).max(100, {
    message: "Contract filename max length is 100",
  }),
  // human-readable title
  label: z.string().min(1).max(100, { message: "Label max length is 100" }),
  description: z
    .string()
    .max(300, { message: "Description max length is 300" }),
  details: z
    .string()
    .max(1000, { message: "Details max length is 1000" })
    .optional(),
  version: z.string().optional(),
  fhevm_version: z.string().optional(),
  category: CategoryEnum,
  chapter: ChapterEnum,
  concepts: z.array(ConceptEnum).optional(),
  tags: z.array(TagsEnum).optional(),
  authors: z.array(
    z.object({
      name: string().min(1).max(100),
      email: z.email().optional(),
      url: string().url().optional(),
    }),
  ),

  // Does the starter include a frontend project
  has_ui: z.boolean(),

  // Additional solidity files to include in the starter
  // Paths are relative to the contracts/ directory
  // Example: ["libraries/Helper.sol"]
  // Used for multi-file contracts
  additional_files: z.array(string().min(1)).optional(),

  // Used for deployment scripts
  constructor_args: z.array(z.any()).optional(),

  // Used to specify any additional npm packages required by the starter
  additional_packages: z
    .array(
      z.object({
        name: string().min(1),
        version: string().min(1),
      }),
    )
    .optional(),
});

export type StarterMetadataType = z.infer<typeof StarterMetadataSchema>;

export default StarterMetadataSchema;

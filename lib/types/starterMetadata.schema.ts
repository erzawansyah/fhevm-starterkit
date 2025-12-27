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

  // Documentation for state variables
  state_variables: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.string().min(1),
        visibility: z.enum(["public", "private", "internal"]).optional(),
        notice: z.string().optional(),
        dev: z.string().optional(),
      }),
    )
    .optional(),

  // Documentation for functions
  functions: z
    .array(
      z.object({
        name: z.string().min(1),
        signature: z.string().min(1),
        visibility: z.enum(["public", "external", "internal", "private"]),
        state_mutability: z
          .enum(["pure", "view", "payable", "nonpayable"])
          .optional(),
        notice: z.string().optional(),
        dev: z.string().optional(),
        params: z
          .array(
            z.object({
              name: z.string().min(1),
              type: z.string().min(1),
              description: z.string().optional(),
            }),
          )
          .optional(),
        returns: z
          .array(
            z.object({
              name: z.string().optional(),
              type: z.string().min(1),
              description: z.string().optional(),
            }),
          )
          .optional(),
        custom_tags: z
          .array(
            z.object({
              tag: z.string().min(1),
              value: z.string().min(1),
            }),
          )
          .optional(),
      }),
    )
    .optional(),

  // Documentation for structs
  structs: z
    .array(
      z.object({
        name: z.string().min(1),
        notice: z.string().optional(),
        dev: z.string().optional(),
        fields: z
          .array(
            z.object({
              name: z.string().min(1),
              type: z.string().min(1),
              notice: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),

  // Documentation for enums
  enums: z
    .array(
      z.object({
        name: z.string().min(1),
        notice: z.string().optional(),
        dev: z.string().optional(),
        values: z.array(z.string().min(1)).optional(),
      }),
    )
    .optional(),

  // Documentation for events
  events: z
    .array(
      z.object({
        name: z.string().min(1),
        signature: z.string().min(1),
        notice: z.string().optional(),
        dev: z.string().optional(),
        params: z
          .array(
            z.object({
              name: z.string().min(1),
              type: z.string().min(1),
              indexed: z.boolean().optional(),
              description: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),

  // Documentation for constructor
  constructor_doc: z
    .object({
      notice: z.string().optional(),
      dev: z.string().optional(),
      params: z
        .array(
          z.object({
            name: z.string().min(1),
            type: z.string().min(1),
            description: z.string().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export type StarterMetadataType = z.infer<typeof StarterMetadataSchema>;
export type CategoryEnumType = z.infer<typeof CategoryEnum>;
export type ChapterEnumType = z.infer<typeof ChapterEnum>;
export type ConceptEnumType = z.infer<typeof ConceptEnum>;
export type TagsEnumType = z.infer<typeof TagsEnum>;

export default StarterMetadataSchema;

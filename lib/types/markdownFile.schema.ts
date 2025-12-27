import { CategoryEnumType, ChapterEnumType, TagsEnumType } from "./starterMetadata.schema";

export type ReadmeContractEntry = {
  name: string;
  file: string;
  description: string;
  category?: string;
  chapter?: string;
  tags?: string[];
  concepts?: string[];
  details?: string;
  docs?: string;
};

export type ReadmeTemplateData = {
  workspaceName: string;
  title: string;
  description: string;
  hasFrontend?: boolean;
  contracts: ReadmeContractEntry[];
  additionalContractsNote?: string;
  sourceRepo?: string;
};

export type DraftContractMetadata = {
  contractName: string; // e.g., DraftContract
  contractDir: string; // e.g., draft-contract
  contractLabel: string; // e.g., "Draft Contract"
  authorName: string; // e.g., "John Doe"
  category: CategoryEnumType;
  chapter: ChapterEnumType
  tags: TagsEnumType[];
};


export type DraftTestMetadata = {
  starterId: string;
  contractName: string;
  testGoal: string;
  scenarioName: string;
  scenarioDescription: string;
  testCaseName: string;
  testCaseDescription: string;
};

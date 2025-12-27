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

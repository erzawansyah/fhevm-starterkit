export interface PathConfigType {
  frontendDir?: string; // path to frontend directory within starter kit
}

export interface TemplateConfigType {
  repo: string;
  dir: string;
  branch?: string;
  commit?: string;
}

export interface TemplateActionsConfigType {
  removeDirs?: string[];
  removeFiles?: string[];
  copyFiles?: { from: string; to: string }[];
  createFiles?: { path: string; content: string }[];
}

export interface TaxonomyConfigType {
  categories: string[];
  chapters: string[];
  commonTags: string[];
  concepts: string[];
}

export interface StarterKitConfigType {
  startersDir: string;
  workingDir: string;
  path: PathConfigType;
  template: {
    hardhat: TemplateConfigType;
    frontend: TemplateConfigType;
    actions: TemplateActionsConfigType;
  };
  taxonomy: TaxonomyConfigType;
  validation: {
    requiredFiles: string[];
    requiredFolders: string[];
    fileTypeRestrictions: { [key: string]: string[] };
  };
}

// starterkit.config.js

import { StarterKitConfigType } from "./lib/types/starterkitConfig.schema";

/** @type {import("./types").StarterKitConfigType | any} */
const config: StarterKitConfigType = {
  startersDir: "starters",
  workingDir: "workspace",
  metadataFile: "metadata.json",
  starterFrontendDir: "ui",

  // Template repositories configuration
  template: {
    // FHEVM Hardhat Template (official Zama repo)
    hardhat: {
      repo: "https://github.com/zama-ai/fhevm-hardhat-template.git",
      dir: "base/hardhat-template",
      branch: "main",
      commit: "27606858ef15f7960c1e7589827945356ebcb8b2",
    },

    // Relayer UI Template
    frontend: {
      repo: "https://github.com/erzawansyah/relayer-ui-template.git",
      dir: "base/frontend-template",
      branch: "main",
      commit: "daaff464231f32be03564e2f7cfe2d162490ebca",
    },
    actions: {
      // Directories to exclude when copying templates (to avoid locked files and unnecessary data)
      excludeDirs: [".git", "node_modules", ".vscode", ".github"],
      excludeFiles: [
        "contracts/FHECounter.sol",
        "test/FHECounter.ts",
        "test/FHECounterSepolia.ts",
        "tasks/FHECounter.ts",
      ],
      // Directories to remove after copying
      // You can use `override` directory in base templates to provide your own files als
      createDirs: ["docs"],
      createFiles: [],
      additionalPackages: {
        dependencies: [],
        devDependencies: ["serve@14.2.3"],
      },
      additionalScripts: {
        // deploys to localhost and sepolia, then starts hardhat node
        "starter:runtime":
          "npx hardhat deploy && npx hardhat deploy --network sepolia && npx hardhat node",
        // serves the frontend on port 3000
        "starter:start-ui": "serve -s ui -l 3000",
        // builds the frontend template
        "starter:build":
          "echo 'Run template:build-ui command to build the frontend template'",
        // placeholder for publishing starter
        "starter:publish":
          "echo 'Publish your starter project to your own repository'",
      },
    },
    overrides: "base/overrides",
    markdown: "base/markdown-template",
  },

  // Taxonomy configuration
  taxonomy: {
    // Available categories
    // - fundamental: Basic starters demonstrating core FHEVM concepts
    // - patterns: Starters showcasing common design patterns
    // - applied: Real-world use case implementations
    // - advanced: Complex starters with advanced FHEVM techniques
    categories: ["fundamental", "patterns", "applied", "advanced"],

    // Chapters
    // - basics: Introductory concepts
    // - encryption: FHE encryption techniques
    // - decryption: FHE decryption techniques
    // - access-control: Access control patterns
    // - inputproof: Input-proofing strategies
    // - anti-patterns: Common pitfalls to avoid
    // - handles: Using FHE handles
    // - openzeppelin: Integrations with OpenZeppelin libraries
    // - advanced: Advanced FHEVM topics
    chapters: [
      "basics",
      "encryption",
      "decryption",
      "access-control",
      "inputproof",
      "anti-patterns",
      "handles",
      "openzeppelin",
      "advanced",
      "fhe-operations"
    ],

    // Common tags untuk filtering
    commonTags: [
      "DeFi",
      "InfoFi",
      "DeSci",
      "Infra",
      "Gaming",
      "Social",
      "Governance",
      "NFT",
      "Identity",
      "Storage",
      "Science",
    ],

    // Concepts will auto-populate based on FHE used in contracts
    concepts: {
      "arithmetic-operations": [
        "FHE.add",
        "FHE.sub",
        "FHE.mul",
        "FHE.div",
        "FHE.rem",
        "FHE.neg",
        "FHE.min",
        "FHE.max",
      ],
      "bitwise-operations": [
        "FHE.and",
        "FHE.or",
        "FHE.xor",
        "FHE.not",
        "FHE.shr",
        "FHE.shl",
        "FHE.rotr",
        "FHE.rotl",
      ],
      "comparison-operations": [
        "FHE.eq",
        "FHE.ne",
        "FHE.ge",
        "FHE.gt",
        "FHE.le",
        "FHE.lt",
      ],
      "ternary-operations": ["FHE.select"],
      "random-operations": [
        "FHE.randEuint256",
        "FHE.randEuint64",
        "FHE.randEuint32",
        "FHE.randEuint16",
        "FHE.randEuint8",
        "FHE.randEbool",
      ],
      "trivial-encryption": [
        "FHE.asEbool",
        "FHE.asEuint8",
        "FHE.asEuint16",
        "FHE.asEuint32",
        "FHE.asEuint64",
        "FHE.asEuint128",
        "FHE.asEuint256",
        "FHE.asEaddress",
      ],
      "access-control": [
        "FHE.allow",
        "FHE.allowThis",
        "FHE.allowTransient",
        "FHE.makePubliclyDecryptable",
        "FHE.isSenderAllowed",
      ],
    },
  },

  // Validation rules
  validation: {
    // Required files in starter
    requiredFiles: ["README.md", "metadata.json"],

    // Required folders in starter
    requiredFolders: ["contracts", "test"],

    // File type restrictions
    fileTypeRestrictions: {
      contracts: [".sol"],
      test: [".ts", ".js"],
    },
  },
};

export default config;

// starterkit.config.js

import { StarterKitConfigType } from "./lib/types/starterkit-config";

/** @type {import("./types").StarterKitConfigType | any} */
const config: StarterKitConfigType = {
  // Path configuration
  path: {
    frontendDir: "ui", // this mean the frontend directory is located at /ui within the starter kit
  },

  // Template repositories configuration
  template: {
    // FHEVM Hardhat Template (official Zama repo)
    hardhat: {
      repo: "https://github.com/zama-ai/fhevm-hardhat-template.git",
      dir: "base/hardhat-template",
      branch: "main",
      commit: "27606858ef15f7960c1e7589827945356ebcb8b2",
    },

    // Relayer UI Template (TODO: Create this repo)
    frontend: {
      repo: "https://github.com/erzawansyah/relayer-ui-template.git",
      dir: "base/frontend-template",
      branch: "main",
      commit: "daaff464231f32be03564e2f7cfe2d162490ebca",
    },

    actions: {
      removeDirs: [".github", ".vscode"],
      removeFiles: [
        "contracts/FHECounter.sol",
        "test/FHECounter.ts",
        "test/FHECounterSepolia.ts",
        "tasks/FHECounterTask.ts",
        "deploy/deploy.ts",
      ],
      copyFiles: [
        {
          from: "base/extensions/deploy.ts",
          to: "base/hardhat-template/deploy/deploy.ts",
        },
        {
          from: ".env.example",
          to: "base/frontend-template/.env.example",
        },
      ],
      createFiles: [
        {
          path: "contract-list.json",
          content: JSON.stringify(
            [
              {
                name: "",
                file: "",
                slug: "",
              },
            ],
            null,
            2
          ),
        },
      ],
    },
  },

  // Taxonomy configuration
  taxonomy: {
    // Available categories
    categories: ["fundamental", "patterns", "applied", "advanced"],

    // Chapters
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

    concepts: ["FHE", "FHEVM"],
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

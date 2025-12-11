// starterkit.config.js

/** @type {import("./types").StarterKitConfig | any} */
const config = {
    // Paths configuration
    paths: {
        // Base directories
        base: "base",
        starters: "starters",
        scripts: "scripts",
        docs: "docs",
        web: "apps/web",
        lib: "lib",

        // Templates
        templates: {
            fhevmHardhat: "base/fhevm-hardhat-template",
            relayerUI: "base/relayer-ui-template",
        },

        // Schema files
        schemas: {
            starterMeta: "lib/schemas/starter-meta.schema.json",
        },
    },

    // Template repositories configuration
    template: {
        // FHEVM Hardhat Template (official Zama repo)
        fhevmHardhat: {
            repo: "https://github.com/zama-ai/fhevm-hardhat-template.git",
            dir: "base/fhevm-hardhat-template",
            branch: "main",
        },

        // Relayer UI Template (TODO: Create this repo)
        relayerUI: {
            repo: "https://github.com/YOUR-USERNAME/relayer-ui-template.git",
            dir: "base/relayer-ui-template",
            branch: "main",
        },

        // File di folder scripts yang tidak boleh dicopy ke template
        excludedScriptFiles: ["template-init.ts", "template-update.ts"],

        // Nama npm script untuk update template
        updateScript: "template:update",
    },

    // Taxonomy configuration
    taxonomy: {
        // Available categories
        categories: ["fundamental", "patterns", "applied", "advanced"],

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
    },

    // Validation rules
    validation: {
        // Metadata validation
        maxDescriptionLength: 300,
        minDescriptionLength: 20,

        // Required files in starter
        requiredFiles: ["README.md", "starter.meta.json"],

        // Required folders in starter
        requiredFolders: ["contracts", "test"],

        // Optional folders in starter
        optionalFolders: ["ui"],

        // File type restrictions
        fileTypeRestrictions: {
            contracts: [".sol"],
            test: [".ts", ".js"],
        },
    },
};

module.exports = config;

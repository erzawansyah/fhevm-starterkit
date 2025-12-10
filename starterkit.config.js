// starterkit.config.js

/** @type {import("./types").StarterKitConfig | any} */
const config = {
    template: {
        // Repo resmi Zama untuk Hardhat FHEVM
        repo: "https://github.com/zama-ai/fhevm-hardhat-template.git",

        // Path relatif dari root project ke folder template
        // Nanti script akan pakai path.join(__dirname, "..", template.dir)
        dir: "base/fhevm-hardhat-template",

        // File di folder scripts yang tidak boleh dicopy ke template
        excludedScriptFiles: ["template-init.ts", "template-update.ts"],

        // Nama npm script untuk update template
        updateScript: "template:update",
    },
};

module.exports = config;

import * as fs from "fs";
import * as path from "path";
import { logger } from "./helper/logger";

// cari dist directory untuk frontend.

const args = process.argv.slice(2);

if (args.length < 1) {
  logger.error(
    "Please provide a starter name. Example: npm run starter:use fhe-counter"
  );
  process.exit(1);
}

const starterName = args[0];
const starterPath = path.join(__dirname, "..", "starters", starterName);
const basePath = path.join(__dirname, "..", "base", "fhevm-hardhat-template");
const devPath = path.join(__dirname, "..", "dev", starterName);

if (!fs.existsSync(starterPath)) {
  logger.error(
    `Starter "${starterName}" does not exist in the starter folder.`
  );
  process.exit(1);
}

if (fs.existsSync(devPath)) {
  logger.warning(`The dev folder for "${starterName}" already exists.`);
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  readline.question(
    "Do you want to overwrite it? (yes/no): ",
    (answer: string) => {
      if (answer.toLowerCase() === "yes") {
        fs.rmSync(devPath, { recursive: true, force: true });
        copyStarterToDev();
      } else {
        logger.info("Operation cancelled by the user.");
        process.exit(0);
      }
      readline.close();
    }
  );
} else {
  copyStarterToDev();
}

function copyStarterToDev() {
  // Step 1: Copy base template
  logger.info("Copying base template from fhevm-hardhat-template...");
  fs.mkdirSync(devPath, { recursive: true });
  copyFolderRecursiveSync(basePath, devPath);

  // Step 2: Clear contracts and test folders
  logger.info("Preparing contracts and test folders...");
  clearFolder(path.join(devPath, "contracts"));
  clearFolder(path.join(devPath, "test"));

  // Step 3: Copy contracts from starter
  const starterContractsPath = path.join(starterPath, "contracts");
  const devContractsPath = path.join(devPath, "contracts");
  if (fs.existsSync(starterContractsPath)) {
    logger.info("Copying contracts from starter...");
    copyFolderRecursiveSync(starterContractsPath, devContractsPath);
  }

  // Step 4: Copy tests from starter
  const starterTestPath = path.join(starterPath, "test");
  const devTestPath = path.join(devPath, "test");
  if (fs.existsSync(starterTestPath)) {
    logger.info("Copying tests from starter...");
    copyFolderRecursiveSync(starterTestPath, devTestPath);
  }

  // Step 5: Copy README and metadata from starter
  const starterReadme = path.join(starterPath, "README.md");
  const devReadme = path.join(devPath, "README.md");
  if (fs.existsSync(starterReadme)) {
    fs.copyFileSync(starterReadme, devReadme);
  }

  logger.success(`Starter "${starterName}" has been set up in the dev folder.`);
  logger.info(`Next steps:
1. cd dev/${starterName}
2. npm install
3. npm run test`);
}

function copyFolderRecursiveSync(source: string, target: string) {
  const files = fs.readdirSync(source);
  files.forEach((file) => {
    const curSource = path.join(source, file);
    const curTarget = path.join(target, file);
    if (fs.lstatSync(curSource).isDirectory()) {
      fs.mkdirSync(curTarget, { recursive: true });
      copyFolderRecursiveSync(curSource, curTarget);
    } else {
      fs.copyFileSync(curSource, curTarget);
    }
  });
}

function clearFolder(folderPath: string) {
  if (fs.existsSync(folderPath)) {
    const files = fs.readdirSync(folderPath);
    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    });
  }
}

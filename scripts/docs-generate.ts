#!/usr/bin/env ts-node

import * as fs from "fs";
import * as path from "path";
import { logger } from "./helper/logger";
import { generateDocs } from "./tools/generateDocs";
import { validateMetadata } from "./helper/validateMetadata";
import { StarterMeta } from "../lib/types/starter-meta";

// This script will generate documentation for each starter kit by name
const startersDir = path.join(__dirname, "..", "starters");

function main() {
  logger.section("Generating Starter Kits Documentation");
  logger.info(`Scanning directory: ${startersDir}`);

  // get starter name
  const starterName = process.argv[2];
  if (!starterName) {
    logger.error("Please provide a starter name as an argument.");
    process.exit(1);
  }

  // check if starter exists
  const starterPath = path.join(startersDir, starterName);
  if (!fs.existsSync(starterPath)) {
    logger.error(`Starter kit "${starterName}" does not exist.`);
    process.exit(1);
  }

  // Check file solidity in contracts
  const contractDir = path.join(starterPath, "contracts");
  // Assume that contracts dir always exists for a valid starter kit
  const contractFiles = fs
    .readdirSync(contractDir)
    .filter((file) => file.endsWith(".sol"));

  // error if no contract files found
  if (contractFiles.length === 0) {
    logger.error(`No Solidity contract files found in "${contractDir}".`);
    process.exit(1);
  }

  // Check metadata files in starter
  const metadataFile = "starter.meta.json";
  const metadataPath = path.join(starterPath, metadataFile);
  if (!fs.existsSync(metadataPath)) {
    logger.error(`Metadata file "${metadataFile}" not found in starter kit.`);
    process.exit(1);
  }

  // Read and parse metadata
  const metadataContent = fs.readFileSync(metadataPath, "utf-8");
  const metadata: StarterMeta = JSON.parse(metadataContent);
  // Validate metadata structure
  const validationResult = validateMetadata(metadata);
  if (!validationResult.ok) {
    logger.error(`Metadata validation errors in "${metadataFile}":`);
    validationResult.errors.forEach((error) => logger.error(`- ${error}`));
    process.exit(1);
  }

  // Log found contract files
  for (const file of contractFiles) {
    logger.info(`Found contract file: ${file}`);
    const contractPath = path.join(contractDir, file);

    // Generate documentation for each contract file
    const filenameWithoutExt = path.parse(contractPath).name;
    generateDocs(starterName, filenameWithoutExt, contractPath, metadata);
  }
}

if (require.main === module) {
  main();
}

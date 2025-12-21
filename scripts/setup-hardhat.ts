import { execSync } from "child_process";
import { logger } from "../scripts/helper/logger";
import { run } from "../scripts/helper/utils";

// get force flags
const FORCE_FLAG =
  process.argv.includes("--force") || process.argv.includes("-f");

// Cek apakah vars MNEMONIC Hardhat sudah diatur
function isHardhatMnemonicSet(): boolean {
  try {
    const result = execSync("npx hardhat vars get MNEMONIC").toString().trim();
    return result.length > 0;
  } catch (error) {
    return false;
  }
}

// Cek apakah vars INFURA_API_KEY
function isHardhatInfuraKeySet(): boolean {
  try {
    const result = execSync("npx hardhat vars get INFURA_API_KEY")
      .toString()
      .trim();
    return result.length > 0;
  } catch (error) {
    return false;
  }
}
async function main() {
  const isForce = FORCE_FLAG;

  if (isForce) {
    logger.info("Force flag detected. Overwriting existing Hardhat vars...");

    // Konfirmasi apakah user ingin melanjutkan
    try {
      execSync("npx hardhat vars unset MNEMONIC");
      execSync("npx hardhat vars unset INFURA_API_KEY");
    } catch (error) {
      logger.info("No existing vars to unset.");
    }
  }

  logger.info("Setting up Hardhat configuration variables...");
  if (!isHardhatMnemonicSet()) {
    const defaultMnemonic =
      "test test test test test test test test test test test junk";
    logger.info(
      `MNEMONIC not set. Setting to default mnemonic: "${defaultMnemonic}"`
    );
    await run(`npx hardhat vars set MNEMONIC "${defaultMnemonic}"`);
  } else {
    logger.info("MNEMONIC is already set. Skipping...");
  }
  if (!isHardhatInfuraKeySet()) {
    const defaultInfuraKey = "YOUR_INFURA_PROJECT_ID";
    logger.info(
      `INFURA_API_KEY not set. Setting to default key: "${defaultInfuraKey}"`
    );
    await run(`npx hardhat vars set INFURA_API_KEY "${defaultInfuraKey}"`);
  } else {
    logger.info("INFURA_API_KEY is already set. Skipping...");
  }
  logger.success("Hardhat configuration variables setup complete.");
}

import { execSync } from "child_process";
import { logger } from "../helper/logger";
import { run } from "../helper/utils";
import { GlobalOptions } from "../cli";

// Skrip CLI untuk mengatur variabel Hardhat (MNEMONIC, INFURA_API_KEY) dengan nilai default atau paksa overwrite.
// Cek apakah vars MNEMONIC Hardhat sudah diatur
function isHardhatMnemonicSet(): boolean {
  try {
    const result = execSync("npx hardhat vars get MNEMONIC").toString().trim();
    return result.length > 0;
  } catch {
    return false;
  }
}

// Cek apakah vars INFURA_API_KEY sudah diatur
function isHardhatInfuraKeySet(): boolean {
  try {
    const result = execSync("npx hardhat vars get INFURA_API_KEY")
      .toString()
      .trim();
    return result.length > 0;
  } catch {
    return false;
  }
}

export async function runSetupHardhat(
  input: { force: boolean } & GlobalOptions
) {
  if (input.verbose)
    logger.info(`[debug] setup:hardhat ${JSON.stringify(input)}`);

  const isForce = !!input.force;

  logger.info("Setting up Hardhat configuration variables...");

  if (isForce) {
    logger.info("Force flag detected. Overwriting existing Hardhat vars...");
    try {
      execSync("npx hardhat vars unset MNEMONIC");
      execSync("npx hardhat vars unset INFURA_API_KEY");
    } catch {
      logger.info("No existing vars to unset.");
    }
  }

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
  process.exit(0);
}

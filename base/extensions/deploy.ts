import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";
import contractList from "../contract-list.json";

const files = contractList.map((contract) => ({
  file: contract.file,
  name: contract.name,
  slug: contract.slug,
}));

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, getArtifact } = hre.deployments;

  // generate index.json in ../frontend/public/contracts/
  // always (re)create/update it; create contracts dir if missing
  const CONTRACT_DIRECTORY = path.join(
    __dirname,
    "..",
    "ui",
    "public",
    "contracts"
  );
  const INDEX_FILE_PATH = path.join(CONTRACT_DIRECTORY, "index.json");
  if (!fs.existsSync(CONTRACT_DIRECTORY)) {
    fs.mkdirSync(CONTRACT_DIRECTORY, { recursive: true });
    console.log(`Created contracts directory: ${CONTRACT_DIRECTORY}`);
  }
  fs.writeFileSync(
    INDEX_FILE_PATH,
    JSON.stringify(
      files.map((file) => file.slug),
      null,
      2
    ),
    "utf8"
  );
  console.log(`Wrote index.json at ${INDEX_FILE_PATH}`);

  for (const file of files) {
    console.log("Deploying contract:", file.name);
    const deployedContract = await deploy(file.name, {
      from: deployer,
      log: true,
      args: [], // Add constructor arguments here as an array
    });

    // get used chain id to deploy address mapping
    const chainId = await hre.getChainId();
    console.log(`Deployed on chain ID: ${chainId}`);

    // Check dir ../frontend/public/contracts/[slug]
    const starterDir = path.join(CONTRACT_DIRECTORY, file.slug);
    if (!fs.existsSync(starterDir)) {
      fs.mkdirSync(starterDir, { recursive: true });
      console.log(`Created directory: ${starterDir}`);
    }

    // insert into ../frontend/public/contracts/metadata.json
    // specifically, it will update the contract_address field
    // chainId should be the key, and deployedContract.address should be the value
    console.log("Preparing metadata update for contract:", file.name);
    const metadataPath = path.join(
      CONTRACT_DIRECTORY,
      file.slug,
      "metadata.json"
    );
    // jika gak ada, buat file metadata.json dulu
    if (!fs.existsSync(metadataPath)) {
      fs.writeFileSync(
        metadataPath,
        JSON.stringify(
          {
            contract_file: file.file,
            contract_name: file.name,
            contract_address: {},
            name: file.name,
            label: file.name,
            description: "",
            version: "1.0.0",
            fhevm_version: "1.0.0",
            category: "application",
            tags: [],
            concepts: [],
            has_ui: false,
            authors: [],
          },
          null,
          2
        ),
        "utf8"
      );
      console.log(`Created new metadata file at ${metadataPath}`);
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    metadata.contract_address = {
      ...(metadata.contract_address || {}),
      [Number(chainId)]: deployedContract.address,
    };
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), "utf8");
    console.log(
      `Updated metadata for ${file.name} at ${metadataPath} with address ${deployedContract.address}`
    );
  }

  // Copy abi key from artifact to ../frontend/public/contracts/[slug]/abi.json
  for (const file of files) {
    console.log("Updating ABI for contract:", file.name);
    const artifact = await getArtifact(file.name);
    const abiPath = path.join(CONTRACT_DIRECTORY, file.slug, "abi.json");
    fs.writeFileSync(
      abiPath,
      JSON.stringify({ abi: artifact.abi }, null, 2),
      "utf8"
    );
    console.log(`Updated ABI for ${file.name} at ${abiPath}`);
  }
};
export default func;
func.id = "deploy_fhe_contracts";
func.tags = ["all", "deploy"];

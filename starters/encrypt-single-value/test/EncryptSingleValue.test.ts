import { EncryptSingleValue, EncryptSingleValue__factory } from "../../../types";
import type { Signers } from "../../types";
import { FhevmType, HardhatFhevmRuntimeEnvironment } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as hre from "hardhat";

async function deployFixture() {
  // Contracts are deployed using the first signer/account by default
  const factory = (await ethers.getContractFactory("EncryptSingleValue")) as EncryptSingleValue__factory;
  const encryptSingleValue = (await factory.deploy()) as EncryptSingleValue;
  const encryptSingleValue_address = await encryptSingleValue.getAddress();

  return { encryptSingleValue, encryptSingleValue_address };
}

/**
 * This trivial example demonstrates the FHE encryption mechanism
 * and highlights a common pitfall developers may encounter.
 */
describe("EncryptSingleValue", function () {
  let contract: EncryptSingleValue;
  let contractAddress: string;
  let signers: Signers;
  let alice: HardhatEthersSigner;
  let owner: HardhatEthersSigner;

  before(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!hre.fhevm.isMock) {
      throw new Error(`This hardhat test suite cannot run on Sepolia Testnet`);
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { owner: ethSigners[0], alice: ethSigners[1] };
    owner = ethSigners[0];
    alice = ethSigners[1];
  });

  beforeEach(async function () {
    // Deploy a new contract each time we run a new test
    const deployment = await deployFixture();
    contractAddress = deployment.encryptSingleValue_address;
    contract = deployment.encryptSingleValue;
  });

  // ✅ Test should succeed
  it("encryption should succeed", async function () {
    // Use the FHEVM Hardhat plugin runtime environment
    // to perform FHEVM input encryptions.
    const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;

    // 🔐 Encryption Process:
    // Values are encrypted locally and bound to a specific contract/user pair.
    // This grants the bound contract FHE permissions to receive and process the encrypted value,
    // but only when it is sent by the bound user.
    const input = fhevm.createEncryptedInput(contractAddress, alice.address);

    // Add a uint32 value to the list of values to encrypt locally.
    input.add32(123456);

    // Perform the local encryption. This operation produces two components:
    // 1. `handles`: an array of FHEVM handles. In this case, a single handle associated with the
    //    locally encrypted uint32 value `123456`.
    // 2. `inputProof`: a zero-knowledge proof that attests the `handles` are cryptographically
    //    bound to the pair `[contractAddress, signers.alice.address]`.
    const enc = await input.encrypt();

    // a 32-bytes FHEVM handle that represents a future Solidity `euint32` value.
    const inputEuint32 = enc.handles[0];
    const inputProof = enc.inputProof;

    // Now `signers.alice.address` can send the encrypted value and its associated zero-knowledge proof
    // to the smart contract deployed at `contractAddress`.
    const tx = await contract.connect(alice).initialize(inputEuint32, inputProof);
    await tx.wait();

    // Let's try to decrypt it to check that everything is ok!
    const encryptedUint32 = await contract.encryptedUint32();

    const clearUint32 = await fhevm.userDecryptEuint(
      FhevmType.euint32, // Specify the encrypted type
      encryptedUint32,
      contractAddress, // The contract address
      alice, // The user wallet
    );

    expect(clearUint32).to.equal(123456);
  });

  // ❌ This test illustrates a very common pitfall
  it("encryption should fail for wrong sender", async function () {
    const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;
    const enc = await fhevm.createEncryptedInput(contractAddress, alice.address).add32(123456).encrypt();
    const inputEuint32 = enc.handles[0];
    const inputProof = enc.inputProof;

    await expect(contract.connect(owner).initialize(inputEuint32, inputProof)).to.be.reverted;
  });

  it("encryption should fail for malformed proof", async function () {
    const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;
    const enc = await fhevm.createEncryptedInput(contractAddress, alice.address).add32(111).encrypt();
    const inputEuint32 = enc.handles[0];
    const originalProof = enc.inputProof as unknown as Uint8Array;
    const mutated = Uint8Array.from(originalProof);
    mutated[mutated.length - 1] = (mutated[mutated.length - 1] ^ 0xff) & 0xff;

    await expect(contract.connect(alice).initialize(inputEuint32, mutated)).to.be.reverted;
  });

  it("edge values: 0 and max", async function () {
    const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;
    // 0
    {
      const enc = await fhevm.createEncryptedInput(contractAddress, alice.address).add32(0).encrypt();
      await (await contract.connect(alice).initialize(enc.handles[0], enc.inputProof)).wait();
      const handle = await contract.encryptedUint32();
      const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, alice);
      expect(clear).to.equal(0);
    }
    // max (uint32)
    {
      const MAX32 = 0xffffffff;
      const enc = await fhevm.createEncryptedInput(contractAddress, alice.address).add32(MAX32).encrypt();
      await (await contract.connect(alice).initialize(enc.handles[0], enc.inputProof)).wait();
      const handle = await contract.encryptedUint32();
      const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, alice);
      expect(clear).to.equal(MAX32);
    }
  });
});

/**
 * @title HandleExample test suite
 * @notice Validates the handle lifecycle helper utilities exported by HandleExample.sol.
 * @example-id handle-example
 * @test-suite HandleExample
 * @test-goal
 * - Ensure the initialized handle is zero and decrypts to a zero cleartext value.
 * - Verify that compareHandles() returns distinct handles and yields an incremented cleartext.
 * - Confirm invalid proofs are rejected by the same entrypoint.
 */

import {
  FhevmType,
  HardhatFhevmRuntimeEnvironment,
} from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as hre from "hardhat";

async function deployFixture() {
  const factory = await ethers.getContractFactory("HandleExample");
  const contract = await factory.deploy();
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("HandleExample", function () {
  let contract: any;
  let contractAddress: string;
  let alice: HardhatEthersSigner;

  before(async function () {
    if (!hre.fhevm.isMock) {
      throw new Error("This hardhat test suite cannot run on Sepolia Testnet");
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    alice = ethSigners[1];
  });

  beforeEach(async function () {
    const deployment = await deployFixture();
    contractAddress = deployment.contractAddress;
    contract = deployment.contract;
  });

  describe("Handle lifecycle", function () {
    it("initial handle is zero and decrypts to zero", async function () {
      const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;
      const storedHandle = await contract.getHandle();

      expect(storedHandle).to.eq(ethers.ZeroHash);

      const clearValue = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        storedHandle,
        contractAddress,
        alice,
      );

      expect(clearValue).to.eq(0);
    });

    it("compareHandles returns distinct handles and increments the ciphertext", async function () {
      const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;
      const value = 42;
      const input = await fhevm
        .createEncryptedInput(contractAddress, alice.address)
        .add32(value)
        .encrypt();

      const [originalHandle, newHandle] = await contract
        .connect(alice)
        .callStatic.compareHandles(input.handles[0], input.inputProof);

      expect(originalHandle.eq(input.handles[0])).to.be.true;
      expect(originalHandle.eq(newHandle)).to.be.false;

      await contract.connect(alice).compareHandles(input.handles[0], input.inputProof);

      const decrypted = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        newHandle,
        contractAddress,
        alice,
      );

      expect(decrypted).to.eq(value + 1);
    });

    it("rejects compareHandles when proof is tampered", async function () {
      const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;
      const input = await fhevm
        .createEncryptedInput(contractAddress, alice.address)
        .add32(7)
        .encrypt();

      const proofLength = ethers.utils.arrayify(input.inputProof).length;
      const tamperedProof = ethers.utils.hexZeroPad("0x02", proofLength);

      await expect(
        contract.connect(alice).compareHandles(input.handles[0], tamperedProof),
      ).to.be.reverted;
    });
  });
});

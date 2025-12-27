/**
 * @title FHEIfThenElse test suite
 * @notice Validates encrypted comparison flow and maximum value selection.
 * @example-id fhe-if-then-else
 * @test-suite FHEIfThenElse
 * @test-goal
 * - Ensure basic contract functions work as expected.
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
  const factory = await ethers.getContractFactory("FHEIfThenElse");
  const contract = await factory.deploy();
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("FHEIfThenElse", function () {
  let contract: any;
  let contractAddress: string;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  before(async function () {
    if (!hre.fhevm.isMock) {
      throw new Error(`This hardhat test suite cannot run on Sepolia Testnet`);
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    alice = ethSigners[1];
    bob = ethSigners[2];
  });

  beforeEach(async function () {
    const deployment = await deployFixture();
    contractAddress = deployment.contractAddress;
    contract = deployment.contract;
  });

  // @scenario Basic FHEVM
  describe("Testing basic functions on FHEVM contract.", function () {
    // @case Initialization and Value Storage
    it("Ensure contract can be initialized and store encrypted values correctly.", async function () {
      const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;

      const encryptedFive = await fhevm
        .createEncryptedInput(contractAddress, alice.address)
        .add8(5)
        .encrypt();

      const encryptedNine = await fhevm
        .createEncryptedInput(contractAddress, bob.address)
        .add8(9)
        .encrypt();

      await contract.connect(alice).setA(encryptedFive.handles[0], encryptedFive.inputProof);
      await contract.connect(bob).setB(encryptedNine.handles[0], encryptedNine.inputProof);

      await contract.connect(alice).computeMax();

      const encryptedResult = await contract.result();
      const clearResult = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        encryptedResult,
        contractAddress,
        alice,
      );

      expect(clearResult).to.equal(9);
    });

    // @case Maximum value selection when operand A is greater or equal
    it("Select operand A when its value is greater than or equal to operand B.", async function () {
      const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;

      const encryptedTwelve = await fhevm
        .createEncryptedInput(contractAddress, bob.address)
        .add8(12)
        .encrypt();

      const encryptedThree = await fhevm
        .createEncryptedInput(contractAddress, alice.address)
        .add8(3)
        .encrypt();

      await contract.connect(bob).setA(encryptedTwelve.handles[0], encryptedTwelve.inputProof);
      await contract.connect(alice).setB(encryptedThree.handles[0], encryptedThree.inputProof);

      await contract.connect(bob).computeMax();

      const encryptedResult = await contract.result();
      const clearResult = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        encryptedResult,
        contractAddress,
        bob,
      );

      expect(clearResult).to.equal(12);
    });
  });
});

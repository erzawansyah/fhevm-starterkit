/**
 * @example-id fhe-add
 * @test-suite FHEAdd
 * @test-goal
 * - Demonstrate encrypted addition (A + B).
 * - Show correct workflow: encrypt → setA / setB → compute → decrypt.
 * - Show that decrypt permission must be explicitly granted.
 */

import {
  FhevmType,
  HardhatFhevmRuntimeEnvironment,
} from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as hre from "hardhat";

import { FHEAdd, FHEAdd__factory } from "../../../types";
import type { Signers } from "../../types";

async function deployFixture() {
  const factory = (await ethers.getContractFactory(
    "FHEAdd"
  )) as FHEAdd__factory;
  const fheAdd = (await factory.deploy()) as FHEAdd;
  const fheAdd_address = await fheAdd.getAddress();

  return { fheAdd, fheAdd_address };
}

describe("FHEAdd", function () {
  let contract: FHEAdd;
  let contractAddress: string;
  let signers: Signers;
  let bob: HardhatEthersSigner;

  before(async function () {
    if (!hre.fhevm.isMock) {
      throw new Error(`This hardhat test suite cannot run on Sepolia Testnet`);
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { owner: ethSigners[0], alice: ethSigners[1] };
    bob = ethSigners[2];
  });

  beforeEach(async function () {
    const deployment = await deployFixture();
    contractAddress = deployment.fheAdd_address;
    contract = deployment.fheAdd;
  });

  // @scenario happy-path
  describe("encrypted addition workflow", function () {
    // @case compute-a-plus-b
    it("a + b should succeed", async function () {
      const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;

      let tx;

      const a = 80;
      const b = 123;

      // Encrypt input A
      const inputA = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add8(a)
        .encrypt();

      tx = await contract
        .connect(signers.alice)
        .setA(inputA.handles[0], inputA.inputProof);
      await tx.wait();

      // Encrypt input B
      const inputB = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add8(b)
        .encrypt();

      tx = await contract
        .connect(signers.alice)
        .setB(inputB.handles[0], inputB.inputProof);
      await tx.wait();

      // Compute encrypted result
      tx = await contract.connect(bob).computeAPlusB();
      await tx.wait();

      // Fetch encrypted output
      const encryptedAplusB = await contract.result();

      // Decrypt by authorized user (bob)
      const clearAplusB = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        encryptedAplusB,
        contractAddress,
        bob
      );

      expect(clearAplusB).to.equal(a + b);
    });
  });
});

/**
 * @title FHEVMAntiPatterns test suite
 * @notice Validates common anti-patterns and their correct counterparts.
 * @example-id anti-patterns
 * @test-suite FHEVMAntiPatterns
 * @test-goal
 * - Confirm correct flows succeed and decrypt with proper permissions.
 * - Demonstrate failures for missing allowThis and wrong user permissions.
 * - Contrast missing result permissions vs correct result permissions.
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
  const factory = await ethers.getContractFactory("FHEVMAntiPatterns");
  const contract = await factory.deploy();
  const address = await contract.getAddress();
  return { contract, address };
}

describe("FHEVMAntiPatterns", function () {
  let contract: any;
  let address: string;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  before(async function () {
    if (!hre.fhevm.isMock) {
      throw new Error("This test suite only runs on FHEVM mock environment");
    }
    const s: HardhatEthersSigner[] = await ethers.getSigners();
    alice = s[1];
    bob = s[2];
  });

  beforeEach(async function () {
    const d = await deployFixture();
    contract = d.contract;
    address = d.address;
    await contract.connect(alice).initialize();
  });

  describe("Correct vs incorrect handle storage", function () {
    it("correct path: setCorrectly + useCorrectValue increments and decrypts", async function () {
      const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;
      const val = 5;
      const input = await fhevm.createEncryptedInput(address, alice.address).add32(val).encrypt();

      await (await contract.connect(alice).setCorrectly(input.handles[0], input.inputProof)).wait();
      await (await contract.connect(alice).useCorrectValue()).wait();

      const handle = await contract.getValueHandle();
      const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, address, alice);
      expect(clear).to.eq(val + 1);
    });

    it("incorrect path: setIncorrectly then useIncorrectValue should revert", async function () {
      const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;
      const val = 7;
      const input = await fhevm.createEncryptedInput(address, alice.address).add32(val).encrypt();

      await (await contract.connect(alice).setIncorrectly(input.handles[0], input.inputProof)).wait();
      await expect(contract.connect(alice).useIncorrectValue()).to.be.reverted;
    });
  });

  describe("Permissions for caller vs wrong user", function () {
    it("setValueCorrect: caller (alice) can decrypt", async function () {
      const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;
      const val = 123;
      const input = await fhevm.createEncryptedInput(address, alice.address).add32(val).encrypt();

      await (await contract.connect(alice).setValueCorrect(input.handles[0], input.inputProof)).wait();
      const handle = await contract.getValueHandle();
      const clear = await fhevm.userDecryptEuint(FhevmType.euint32, handle, address, alice);
      expect(clear).to.eq(val);
    });

    it("setValueWrongUser: alice cannot decrypt; wrong user (bob) can", async function () {
      const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;
      const val = 42;
      const input = await fhevm.createEncryptedInput(address, alice.address).add32(val).encrypt();

      await (await contract.connect(alice).setValueWrongUser(input.handles[0], input.inputProof, bob.address)).wait();
      const handle = await contract.getValueHandle();

      await expect(
        fhevm.userDecryptEuint(FhevmType.euint32, handle, address, alice),
      ).to.be.rejected;

      const clearBob = await fhevm.userDecryptEuint(FhevmType.euint32, handle, address, bob);
      expect(clearBob).to.eq(val);
    });
  });

  describe("Result permissions", function () {
    it("computeValueWrong: missing permissions makes result undecryptable for caller", async function () {
      const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;
      const delta = 10;
      const input = await fhevm.createEncryptedInput(address, alice.address).add32(delta).encrypt();

      await (await contract.connect(alice).computeValueWrong(input.handles[0], input.inputProof)).wait();
      const resultHandle = await contract.getResultHandle();
      await expect(
        fhevm.userDecryptEuint(FhevmType.euint32, resultHandle, address, alice),
      ).to.be.rejected;
    });

    it("computeValueCorrect: caller can decrypt result and equals previous value + delta", async function () {
      const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;
      const base = 3;
      const delta = 4;

      // Set base value
      const inputBase = await fhevm.createEncryptedInput(address, alice.address).add32(base).encrypt();
      await (await contract.connect(alice).setValueCorrect(inputBase.handles[0], inputBase.inputProof)).wait();

      // Compute with delta
      const inputDelta = await fhevm.createEncryptedInput(address, alice.address).add32(delta).encrypt();
      await (await contract.connect(alice).computeValueCorrect(inputDelta.handles[0], inputDelta.inputProof)).wait();

      const resultHandle = await contract.getResultHandle();
      const clear = await fhevm.userDecryptEuint(FhevmType.euint32, resultHandle, address, alice);
      expect(clear).to.eq(base + delta);
    });
  });
});

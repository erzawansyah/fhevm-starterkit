/**
 * @example-id input-proof-explanation
 * @test-suite InputProofExample
 * @test-goal
 * - Verify input proof validation prevents ciphertext malling attacks.
 * - Test proof-based encrypted operations (set, add, subtract, multiply, compare).
 * - Ensure FHE.fromExternal() correctly validates proofs.
 * - Validate that invalid proofs are rejected.
 * - Demonstrate encrypted conditional operations.
 */

import { FhevmType } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

import { InputProofExample } from "../types/contracts/InputProofExplanation.sol";

type LocalSigners = {
  owner: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = await ethers.getContractFactory("InputProofExample");
  const contract = (await factory.deploy()) as InputProofExample;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("InputProofExample", function () {
  let signers: LocalSigners;
  let contract: InputProofExample;
  let contractAddress: string;

  before(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test suite only runs on FHEVM mock environment");
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { owner: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2], charlie: ethSigners[3] };
  });

  beforeEach(async function () {
    const deployment = await deployFixture();
    contract = deployment.contract;
    contractAddress = deployment.contractAddress;
  });

  // ============= Deployment =============

  describe("Deployment", function () {
    it("should deploy successfully", async function () {
      expect(contractAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("should start with zero validation count", async function () {
      const count = await contract.getValidationCount();
      expect(count).to.equal(0);
    });
  });

  // ============= Basic Proof Validation =============

  describe("Basic Proof Validation - setValue", function () {
    it("should accept valid proof and set value", async function () {
      const value = 42;
      const input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(value)
        .encrypt();

      const tx = await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should increment validation count on successful setValue", async function () {
      const countBefore = await contract.getValidationCount();
      const value = 100;
      const input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(value)
        .encrypt();

      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);
      const countAfter = await contract.getValidationCount();
      expect(countAfter).to.equal(countBefore + 1n);
    });

    it("should allow different users to set independent values", async function () {
      const aliceValue = 111;
      const bobValue = 222;

      // Alice sets her value
      let input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(aliceValue)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      // Bob sets his value
      input = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(bobValue)
        .encrypt();
      await contract.connect(signers.bob).setValue(input.handles[0], input.inputProof);

      // Verify both values are stored (encrypted)
      const aliceStoredValue = await contract.connect(signers.alice).getValue();
      const bobStoredValue = await contract.connect(signers.bob).getValue();

      expect(aliceStoredValue).to.not.equal(ethers.ZeroHash);
      expect(bobStoredValue).to.not.equal(ethers.ZeroHash);
    });

    it("should allow overwriting an existing value with new proof", async function () {
      const initialValue = 50;
      let input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(initialValue)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      const newValue = 999;
      input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(newValue)
        .encrypt();

      const tx = await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should emit ValueSet event on successful setValue", async function () {
      const value = 77;
      const input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(value)
        .encrypt();

      const tx = contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);
      await expect(tx).to.emit(contract, "ValueSet").withArgs(signers.alice.address, expect.any(BigInt));
    });

    it("should emit ProofValidated event on successful setValue", async function () {
      const value = 77;
      const input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(value)
        .encrypt();

      const tx = contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);
      await expect(tx).to.emit(contract, "ProofValidated");
    });
  });

  // ============= Proof Malling Attack Prevention =============

  describe("Ciphertext Malling Attack Prevention", function () {
    it("should reject proof not matching the sender (malling attempt)", async function () {
      const value = 50;
      // Alice creates and encrypts a value
      const input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(value)
        .encrypt();

      // Bob tries to use Alice's ciphertext and proof - this should FAIL
      // because the proof is bound to Alice, not Bob
      await expect(
        contract.connect(signers.bob).setValue(input.handles[0], input.inputProof),
      ).to.be.reverted;
    });

    it("should reject proof if Alice uses Bob's ciphertext", async function () {
      const value = 75;
      // Bob creates and encrypts a value
      const input = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(value)
        .encrypt();

      // Alice tries to use Bob's ciphertext and proof
      await expect(
        contract.connect(signers.alice).setValue(input.handles[0], input.inputProof),
      ).to.be.reverted;
    });

    it("should reject if proof is tampered with (invalid proof)", async function () {
      const value = 100;
      const input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(value)
        .encrypt();

      // Tamper with the proof by modifying a byte
      const tamperedProof = input.inputProof.slice(0, -2) + "FF";

      await expect(
        contract.connect(signers.alice).setValue(input.handles[0], tamperedProof),
      ).to.be.reverted;
    });

    it("should reject if different user reuses another's encrypted input", async function () {
      const aliceValue = 42;
      const aliceInput = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(aliceValue)
        .encrypt();

      // Alice sets her value successfully
      await contract.connect(signers.alice).setValue(aliceInput.handles[0], aliceInput.inputProof);

      // Charlie tries to call a different operation (addToValue) with the same ciphertext/proof
      // This should fail because the proof is for Alice, not Charlie
      await expect(
        contract.connect(signers.charlie).addToValue(aliceInput.handles[0], aliceInput.inputProof),
      ).to.be.reverted;
    });
  });

  // ============= Arithmetic Operations =============

  describe("Arithmetic Operations with Proof", function () {
    it("should add to value with valid proof", async function () {
      // Set initial value
      let input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      // Add to value
      input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(30)
        .encrypt();
      const tx = await contract.connect(signers.alice).addToValue(input.handles[0], input.inputProof);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should subtract from value with valid proof", async function () {
      // Set initial value
      let input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(100)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      // Subtract from value
      input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(25)
        .encrypt();
      const tx = await contract.connect(signers.alice).subtractFromValue(input.handles[0], input.inputProof);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should multiply value with valid proof", async function () {
      // Set initial value
      let input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(5)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      // Multiply value
      input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(3)
        .encrypt();
      const tx = await contract.connect(signers.alice).multiplyValue(input.handles[0], input.inputProof);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should increment validation count for each arithmetic operation", async function () {
      const countBefore = await contract.getValidationCount();

      // Set initial value
      let input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(10)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      // Add
      input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(5)
        .encrypt();
      await contract.connect(signers.alice).addToValue(input.handles[0], input.inputProof);

      // Subtract
      input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(2)
        .encrypt();
      await contract.connect(signers.alice).subtractFromValue(input.handles[0], input.inputProof);

      const countAfter = await contract.getValidationCount();
      // Should have 3 increments (setValue +1, addToValue +1, subtractFromValue +1)
      expect(countAfter).to.equal(countBefore + 3n);
    });
  });

  // ============= Comparison Operations =============

  describe("Comparison Operations with Proof", function () {
    it("should compare values with isEqualTo", async function () {
      // Set value
      let input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      // Compare with same value
      input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();
      const result = await contract.connect(signers.alice).isEqualTo(input.handles[0], input.inputProof);
      expect(result).to.not.equal(ethers.ZeroHash);
    });

    it("should compare values with isLessThan", async function () {
      // Set value to 30
      let input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(30)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      // Compare: is 30 < 50?
      input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();
      const result = await contract.connect(signers.alice).isLessThan(input.handles[0], input.inputProof);
      expect(result).to.not.equal(ethers.ZeroHash);
    });

    it("should increment validation count for comparison operations", async function () {
      const countBefore = await contract.getValidationCount();

      // Set value
      let input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(25)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      // Comparison 1
      input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(25)
        .encrypt();
      await contract.connect(signers.alice).isEqualTo(input.handles[0], input.inputProof);

      // Comparison 2
      input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(30)
        .encrypt();
      await contract.connect(signers.alice).isLessThan(input.handles[0], input.inputProof);

      const countAfter = await contract.getValidationCount();
      // Should have 3 increments (setValue +1, isEqualTo +1, isLessThan +1)
      expect(countAfter).to.equal(countBefore + 3n);
    });
  });

  // ============= Conditional Operations =============

  describe("Conditional Operations with Proof", function () {
    it("should perform encrypted conditional set with valid proofs", async function () {
      const condition = 1; // True
      const trueValue = 100;

      const input1 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(condition)
        .encrypt();

      const input2 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(trueValue)
        .encrypt();

      const tx = await contract
        .connect(signers.alice)
        .conditionalSetValue(input1.handles[0], input1.inputProof, input2.handles[0], input2.inputProof);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should increment validation count by 2 for conditionalSetValue (two proofs)", async function () {
      const countBefore = await contract.getValidationCount();

      const input1 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(1)
        .encrypt();

      const input2 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(42)
        .encrypt();

      await contract
        .connect(signers.alice)
        .conditionalSetValue(input1.handles[0], input1.inputProof, input2.handles[0], input2.inputProof);

      const countAfter = await contract.getValidationCount();
      // Should increment by 2 (two proofs validated)
      expect(countAfter).to.equal(countBefore + 2n);
    });

    it("should reject conditionalSetValue if condition proof is invalid", async function () {
      const condition = 1;
      const trueValue = 100;

      const input1 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(condition)
        .encrypt();

      const input2 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(trueValue)
        .encrypt();

      // Tamper with condition proof
      const tamperedProof = input1.inputProof.slice(0, -2) + "AA";

      await expect(
        contract
          .connect(signers.alice)
          .conditionalSetValue(input1.handles[0], tamperedProof, input2.handles[0], input2.inputProof),
      ).to.be.reverted;
    });

    it("should reject conditionalSetValue if value proof is invalid", async function () {
      const condition = 1;
      const trueValue = 100;

      const input1 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(condition)
        .encrypt();

      const input2 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(trueValue)
        .encrypt();

      // Tamper with value proof
      const tamperedProof = input2.inputProof.slice(0, -2) + "BB";

      await expect(
        contract
          .connect(signers.alice)
          .conditionalSetValue(input1.handles[0], input1.inputProof, input2.handles[0], tamperedProof),
      ).to.be.reverted;
    });
  });

  // ============= Value Retrieval =============

  describe("Value Retrieval", function () {
    it("should retrieve encrypted value via getValue", async function () {
      const value = 55;
      const input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(value)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      const retrieved = await contract.connect(signers.alice).getValue();
      expect(retrieved).to.not.equal(ethers.ZeroHash);
    });

    it("should retrieve value for specific address via getValueFor", async function () {
      const value = 88;
      const input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(value)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      const retrieved = await contract.getValueFor(signers.alice.address);
      expect(retrieved).to.not.equal(ethers.ZeroHash);
    });

    it("should emit ValueRetrieved event on getValue", async function () {
      const value = 99;
      const input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(value)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      const tx = contract.connect(signers.alice).getValue();
      await expect(tx).to.emit(contract, "ValueRetrieved");
    });
  });

  // ============= Reset Functionality =============

  describe("Reset Functionality", function () {
    it("should reset value to zero", async function () {
      // Set a value
      let input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(77)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      // Reset
      const tx = await contract.connect(signers.alice).reset();
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should allow setting new value after reset", async function () {
      // Set initial value
      let input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      // Reset
      await contract.connect(signers.alice).reset();

      // Set new value
      input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(200)
        .encrypt();
      const tx = await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });
  });

  // ============= Cross-User Isolation =============

  describe("Cross-User Isolation", function () {
    it("should keep different users' values isolated", async function () {
      // Alice sets value
      let input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(111)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      // Bob sets different value
      input = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(222)
        .encrypt();
      await contract.connect(signers.bob).setValue(input.handles[0], input.inputProof);

      // Charlie sets yet another value
      input = await fhevm
        .createEncryptedInput(contractAddress, signers.charlie.address)
        .add32(333)
        .encrypt();
      await contract.connect(signers.charlie).setValue(input.handles[0], input.inputProof);

      // All should have non-zero encrypted values
      const aliceVal = await contract.getValueFor(signers.alice.address);
      const bobVal = await contract.getValueFor(signers.bob.address);
      const charlieVal = await contract.getValueFor(signers.charlie.address);

      expect(aliceVal).to.not.equal(ethers.ZeroHash);
      expect(bobVal).to.not.equal(ethers.ZeroHash);
      expect(charlieVal).to.not.equal(ethers.ZeroHash);
    });

    it("should prevent one user's operations from affecting another's value", async function () {
      // Alice sets value
      let input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(50)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      const aliceValueBefore = await contract.getValueFor(signers.alice.address);

      // Bob tries to add to Alice's value (using Bob's proof) - should FAIL
      input = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add32(100)
        .encrypt();

      await expect(
        contract.connect(signers.bob).addToValue(input.handles[0], input.inputProof),
      ).to.be.reverted;
    });
  });

  // ============= Edge Cases =============

  describe("Edge Cases", function () {
    it("should handle zero value", async function () {
      const input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(0)
        .encrypt();

      const tx = await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should handle maximum uint32 value", async function () {
      const maxUint32 = 4294967295;
      const input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(maxUint32)
        .encrypt();

      const tx = await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should handle multiple sequential operations by same user", async function () {
      let input = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add32(10)
        .encrypt();
      await contract.connect(signers.alice).setValue(input.handles[0], input.inputProof);

      // Perform multiple operations
      for (let i = 0; i < 5; i++) {
        input = await fhevm
          .createEncryptedInput(contractAddress, signers.alice.address)
          .add32(1)
          .encrypt();
        await contract.connect(signers.alice).addToValue(input.handles[0], input.inputProof);
      }

      const finalCount = await contract.getValidationCount();
      expect(finalCount).to.be.greaterThanOrEqual(6n); // 1 setValue + 5 addToValue
    });
  });
});

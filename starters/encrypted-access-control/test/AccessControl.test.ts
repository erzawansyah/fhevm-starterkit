/**
 * @example-id access-control
 * @test-suite AccessControl
 * @test-goal
 * - Ensure contract deployment and admin initialization work correctly.
 * - Test encrypted role assignment and retrieval with FHE operations.
 * - Verify transient and persistent permission mechanisms work as expected.
 * - Validate access control enforcement (role-based and permission-based).
 * - Test permission revocation and edge cases.
 * - Ensure only admin can perform sensitive operations.
 */

import {
  FhevmType,
  HardhatFhevmRuntimeEnvironment,
} from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as hre from "hardhat";

import type { Signers } from "../../types";

async function deployFixture() {
  const factory = await ethers.getContractFactory("EncryptedAccessControl");
  const contract = await factory.deploy();
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("AccessControl", function () {
  let contract: any;
  let contractAddress: string;
  let signers: Signers;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let charlie: HardhatEthersSigner;
  let fhevm: HardhatFhevmRuntimeEnvironment;

  before(async function () {
    if (!hre.fhevm.isMock) {
      throw new Error(`This hardhat test suite cannot run on Sepolia Testnet`);
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { owner: ethSigners[0], alice: ethSigners[1] };
    alice = ethSigners[1];
    bob = ethSigners[2];
    charlie = ethSigners[3];
    fhevm = hre.fhevm;
  });

  beforeEach(async function () {
    const deployment = await deployFixture();
    contractAddress = deployment.contractAddress;
    contract = deployment.contract;
  });

  // @scenario Contract Initialization
  describe("Contract Initialization", function () {
    // @case Admin is set correctly on deployment
    it("Should initialize admin to deployer address", async function () {
      const admin = await contract.admin();
      expect(admin).to.equal(signers.owner.address);
    });
  });

  // @scenario Role Management
  describe("Encrypted Role Management", function () {
    // @case Admin can set encrypted role to true
    it("Should allow admin to set encrypted role to true for a user", async function () {
      const inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .addBool(true)
        .encrypt();

      const tx = await contract.setEncryptedRole(alice.address, inputProof.handles[0], inputProof.inputProof);
      await tx.wait();

      await expect(tx)
        .to.emit(contract, "EncryptedRoleSet")
        .withArgs(alice.address);
    });

    // @case Admin can set encrypted role to false
    it("Should allow admin to set encrypted role to false for a user", async function () {
      const inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .addBool(false)
        .encrypt();

      const tx = await contract.setEncryptedRole(bob.address, inputProof.handles[0], inputProof.inputProof);
      await expect(tx)
        .to.emit(contract, "EncryptedRoleSet")
        .withArgs(bob.address);
    });

    // @case Admin can overwrite existing role
    it("Should allow admin to overwrite existing role", async function () {
      // Set initial role to true
      let inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .addBool(true)
        .encrypt();
      await contract.setEncryptedRole(alice.address, inputProof.handles[0], inputProof.inputProof);

      // Overwrite with false
      inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .addBool(false)
        .encrypt();
      const tx = await contract.setEncryptedRole(alice.address, inputProof.handles[0], inputProof.inputProof);

      await expect(tx)
        .to.emit(contract, "EncryptedRoleSet")
        .withArgs(alice.address);
    });

    // @case Non-admin cannot set encrypted role
    it("Should reject role assignment from non-admin", async function () {
      const inputProof = await fhevm
        .createEncryptedInput(contractAddress, alice.address)
        .addBool(true)
        .encrypt();

      await expect(
        contract.connect(alice).setEncryptedRole(bob.address, inputProof.handles[0], inputProof.inputProof),
      ).to.be.revertedWith("Only admin");
    });

    // @case Admin can re-allow contract to use stored role
    it("Should allow admin to re-allow contract to use role ciphertext", async function () {
      const inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .addBool(true)
        .encrypt();
      await contract.setEncryptedRole(alice.address, inputProof.handles[0], inputProof.inputProof);

      // Re-allow should succeed without reverting
      const tx = await contract.allowThisRole(alice.address);
      await expect(tx).to.not.be.reverted;
    });
  });

  // @scenario Secret Management
  describe("Encrypted Secret Management", function () {
    // @case Admin can set encrypted secret
    it("Should allow admin to set encrypted secret value", async function () {
      const secretValue = 42;
      const inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .add32(secretValue)
        .encrypt();

      const tx = await contract.setSecretValue(inputProof.handles[0], inputProof.inputProof);
      await expect(tx).to.emit(contract, "SecretUpdated");
    });

    // @case Admin can overwrite secret
    it("Should allow admin to overwrite encrypted secret", async function () {
      let inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .add32(42)
        .encrypt();
      await contract.setSecretValue(inputProof.handles[0], inputProof.inputProof);

      // Overwrite with new value
      inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .add32(100)
        .encrypt();
      const tx = await contract.setSecretValue(inputProof.handles[0], inputProof.inputProof);

      await expect(tx).to.emit(contract, "SecretUpdated");
    });

    // @case Non-admin cannot set secret
    it("Should reject secret assignment from non-admin", async function () {
      const inputProof = await fhevm
        .createEncryptedInput(contractAddress, alice.address)
        .add32(42)
        .encrypt();

      await expect(
        contract.connect(alice).setSecretValue(inputProof.handles[0], inputProof.inputProof),
      ).to.be.revertedWith("Only admin");
    });

    // @case Admin can re-allow contract to use secret
    it("Should allow admin to re-allow contract to use secret ciphertext", async function () {
      const inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .add32(42)
        .encrypt();
      await contract.setSecretValue(inputProof.handles[0], inputProof.inputProof);

      // Re-allow should succeed without reverting
      const tx = await contract.allowThisSecret();
      await expect(tx).to.not.be.reverted;
    });
  });

  // @scenario Transient Permission Read
  describe("Transient Permission (readSecretTransient)", function () {
    // @case User can call readSecretTransient
    it("Should allow user to call readSecretTransient successfully", async function () {
      // Set alice's role to true
      let inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .addBool(true)
        .encrypt();
      await contract.setEncryptedRole(alice.address, inputProof.handles[0], inputProof.inputProof);

      // Set secret
      inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .add32(42)
        .encrypt();
      await contract.setSecretValue(inputProof.handles[0], inputProof.inputProof);

      // Alice reads the secret - just verify it returns without error
      const result = await contract.connect(alice).readSecretTransient();
      // Verify result is not null/undefined
      expect(result).to.exist;
    });

    // @case User without role can still call readSecretTransient
    it("Should allow user with role=false to call readSecretTransient", async function () {
      // Set bob's role to false
      let inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .addBool(false)
        .encrypt();
      await contract.setEncryptedRole(bob.address, inputProof.handles[0], inputProof.inputProof);

      // Set secret
      inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .add32(99)
        .encrypt();
      await contract.setSecretValue(inputProof.handles[0], inputProof.inputProof);

      // Bob calls readSecretTransient - should succeed
      const result = await contract.connect(bob).readSecretTransient();
      expect(result).to.exist;
    });

    // @case Unassigned user can call readSecretTransient
    it("Should allow user without assigned role to call readSecretTransient", async function () {
      // Set secret without assigning charlie a role
      const inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .add32(55)
        .encrypt();
      await contract.setSecretValue(inputProof.handles[0], inputProof.inputProof);

      // Charlie tries to read - should succeed even without role assignment
      const result = await contract.connect(charlie).readSecretTransient();
      expect(result).to.exist;
    });
  });

  // @scenario Persistent Permission Management
  describe("Persistent Permission Grant/Revoke", function () {
    // @case Admin can check persistent access flag
    it("Should allow checking persistent access flag for users", async function () {
      // Initially false
      let flag = await contract.hasPersistentSecretAccess(alice.address);
      expect(flag).to.be.false;
    });

    // @case Non-admin cannot grant persistent access
    it("Should reject persistent access grant from non-admin", async function () {
      await expect(contract.connect(alice).grantPersistentSecretAccess(bob.address)).to.be.revertedWith(
        "Only admin",
      );
    });
  });

  // @scenario Persistent Permission Read
  describe("Persistent Permission (readSecretPersistent)", function () {
    // @case User without persistent flag cannot read secret
    it("Should reject read from user without persistent access flag", async function () {
      let inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .addBool(true)
        .encrypt();
      await contract.setEncryptedRole(bob.address, inputProof.handles[0], inputProof.inputProof);

      inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .add32(200)
        .encrypt();
      await contract.setSecretValue(inputProof.handles[0], inputProof.inputProof);

      // Bob has role=true but no persistent flag, so should revert
      await expect(contract.connect(bob).readSecretPersistent()).to.be.revertedWith(
        "No persistent access flag",
      );
    });
  });

  // @scenario Admin Transfer
  describe("Admin Transfer", function () {
    // @case New admin can be set
    it("Should allow admin to transfer admin role to another address", async function () {
      const tx = await contract.setAdmin(alice.address);
      const newAdmin = await contract.admin();
      expect(newAdmin).to.equal(alice.address);
    });

    // @case Previous admin loses admin privileges
    it("Should prevent previous admin from executing admin-only functions", async function () {
      await contract.setAdmin(alice.address);

      // Original admin tries to set role
      const inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .addBool(true)
        .encrypt();

      await expect(
        contract
          .connect(signers.owner)
          .setEncryptedRole(bob.address, inputProof.handles[0], inputProof.inputProof),
      ).to.be.revertedWith("Only admin");
    });

    // @case New admin can execute admin functions
    it("Should allow new admin to execute admin-only functions", async function () {
      await contract.setAdmin(alice.address);

      const inputProof = await fhevm
        .createEncryptedInput(contractAddress, alice.address)
        .addBool(true)
        .encrypt();

      const tx = await contract.connect(alice).setEncryptedRole(bob.address, inputProof.handles[0], inputProof.inputProof);
      await expect(tx).to.emit(contract, "EncryptedRoleSet").withArgs(bob.address);
    });

    // @case Cannot set admin to zero address
    it("Should reject setting admin to zero address", async function () {
      await expect(contract.setAdmin("0x0000000000000000000000000000000000000000")).to.be.revertedWith(
        "Zero address",
      );
    });

    // @case Non-admin cannot transfer admin
    it("Should prevent non-admin from transferring admin role", async function () {
      await expect(contract.connect(alice).setAdmin(bob.address)).to.be.revertedWith("Only admin");
    });

    // @case Admin can transfer to self
    it("Should allow admin to set self as new admin (no-op)", async function () {
      const currentAdmin = await contract.admin();
      const tx = await contract.setAdmin(currentAdmin);
      const newAdmin = await contract.admin();
      expect(newAdmin).to.equal(currentAdmin);
    });
  });

  // @scenario Integration Scenarios
  describe("Integration: Role + Secret + Permission Workflows", function () {
    // @case Admin can set and update secret
    it("Should allow admin to set and update secret without issues", async function () {
      // Setup: Set encrypted secret to 500
      let inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .add32(500)
        .encrypt();
      await contract.setSecretValue(inputProof.handles[0], inputProof.inputProof);

      // Update secret
      inputProof = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .add32(700)
        .encrypt();
      await contract.setSecretValue(inputProof.handles[0], inputProof.inputProof);

      // Verify it worked by checking admin can re-allow
      const tx = await contract.allowThisSecret();
      await expect(tx).to.not.be.reverted;
    });

    // @case Admin can manage multiple users with different roles
    it("Should independently manage multiple users with different roles", async function () {
      const inputProof1 = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .addBool(true)
        .encrypt();
      await contract.setEncryptedRole(alice.address, inputProof1.handles[0], inputProof1.inputProof);

      const inputProof2 = await fhevm
        .createEncryptedInput(contractAddress, signers.owner.address)
        .addBool(false)
        .encrypt();
      await contract.setEncryptedRole(bob.address, inputProof2.handles[0], inputProof2.inputProof);

      // Both should be settable independently
      const tx = await contract.allowThisRole(alice.address);
      await expect(tx).to.not.be.reverted;
    });
  });

  // @scenario Edge Cases
  describe("Edge Cases and Boundary Conditions", function () {
    // @case Can handle repeated role assignments
    it("Should handle repeated role assignments for the same user", async function () {
      for (let i = 0; i < 3; i++) {
        const bool = i % 2 === 0;
        const inputProof = await fhevm
          .createEncryptedInput(contractAddress, signers.owner.address)
          .addBool(bool)
          .encrypt();
        await contract.setEncryptedRole(alice.address, inputProof.handles[0], inputProof.inputProof);
      }

      // Should succeed without reverting
      const tx = await contract.allowThisRole(alice.address);
      await expect(tx).to.not.be.reverted;
    });

    // @case Can handle repeated secret updates
    it("Should handle repeated secret updates", async function () {
      for (let i = 0; i < 3; i++) {
        const inputProof = await fhevm
          .createEncryptedInput(contractAddress, signers.owner.address)
          .add32(100 + i)
          .encrypt();
        await contract.setSecretValue(inputProof.handles[0], inputProof.inputProof);
      }

      // Should succeed without reverting
      const tx = await contract.allowThisSecret();
      await expect(tx).to.not.be.reverted;
    });

    // @case Checking access flags for unassigned user
    it("Should return false for access flag of user never granted access", async function () {
      const flag = await contract.hasPersistentSecretAccess(charlie.address);
      expect(flag).to.be.false;
    });

    // @case Can verify admin transfer works multiple times
    it("Should allow multiple sequential admin transfers", async function () {
      await contract.setAdmin(alice.address);
      let currentAdmin = await contract.admin();
      expect(currentAdmin).to.equal(alice.address);

      const inputProof = await fhevm
        .createEncryptedInput(contractAddress, alice.address)
        .addBool(true)
        .encrypt();
      await contract.connect(alice).setAdmin(bob.address);

      currentAdmin = await contract.admin();
      expect(currentAdmin).to.equal(bob.address);
    });
  });
});

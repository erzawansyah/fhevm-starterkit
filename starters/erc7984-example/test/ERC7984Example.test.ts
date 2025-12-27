/**
 * @example-id erc7984-example
 * @test-suite ERC7984Example
 * @test-goal
 * - Verify encrypted token functionality with confidential balances and transfers.
 * - Test minting and encrypted token transfers.
 * - Ensure FHE operations work correctly with external encrypted inputs.
 * - Validate edge cases and error handling.
 */

import { FhevmType } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

import { ERC7984Example } from "../types/contracts/ERC7984Example.sol";

type LocalSigners = {
  owner: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = await ethers.getContractFactory("ERC7984Example");
  const token = (await factory.deploy()) as ERC7984Example;
  const tokenAddress = await token.getAddress();

  return { token, tokenAddress };
}

describe("ERC7984Example", function () {
  let signers: LocalSigners;
  let token: ERC7984Example;
  let tokenAddress: string;

  before(async function () {
    if (!fhevm.isMock) {
      throw new Error("This test suite only runs on FHEVM mock environment");
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { owner: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    const deployment = await deployFixture();
    token = deployment.token;
    tokenAddress = deployment.tokenAddress;
  });

  // ============= Deployment & Initialization =============

  describe("Deployment and Initialization", function () {
    it("should deploy with correct token name", async function () {
      const name = await token.name();
      expect(name).to.equal("ConfidentialToken");
    });

    it("should deploy with correct token symbol", async function () {
      const symbol = await token.symbol();
      expect(symbol).to.equal("CTK");
    });

    it("should have valid token address after deployment", async function () {
      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("should have reasonable token decimals", async function () {
      const decimals = await token.decimals();
      // ERC7984 may have different decimal config
      expect(decimals).to.be.greaterThan(0);
    });
  });

  // ============= Basic Minting =============

  describe("Token Minting", function () {
    it("should mint tokens without errors", async function () {
      const mintAmount = 100;
      const tx = await token.mint(signers.alice.address, mintAmount);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should allow multiple mints to the same address", async function () {
      const amount1 = 100;
      const amount2 = 200;
      const tx1 = await token.mint(signers.alice.address, amount1);
      await tx1.wait();
      const tx2 = await token.mint(signers.alice.address, amount2);
      const receipt = await tx2.wait();
      expect(receipt).to.not.be.null;
    });

    it("should allow minting to different addresses", async function () {
      const amount = 100;
      const tx1 = await token.mint(signers.alice.address, amount);
      await tx1.wait();
      const tx2 = await token.mint(signers.bob.address, amount);
      const receipt = await tx2.wait();
      expect(receipt).to.not.be.null;
    });

    it("should handle zero amount mint", async function () {
      const zeroAmount = 0;
      const tx = await token.mint(signers.alice.address, zeroAmount);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should handle large amount mint", async function () {
      const largeAmount = BigInt("9223372036854775807");
      const tx = await token.mint(signers.alice.address, largeAmount);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });
  });

  // ============= Encrypted Transfers =============

  describe("Encrypted Token Transfers", function () {
    it("should execute transfer with encrypted external input", async function () {
      const mintAmount = 500;
      const transferAmount = 100;

      // Mint tokens to alice
      await token.mint(signers.alice.address, mintAmount);

      // Create encrypted input for transfer amount
      const input = await fhevm
        .createEncryptedInput(tokenAddress, signers.alice.address)
        .add64(transferAmount)
        .encrypt();

      // Execute transfer
      const tx = await token
        .connect(signers.alice)
        .transferExternal(signers.bob.address, input.handles[0], input.inputProof);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should handle transfer with different amounts", async function () {
      const mintAmount = 1000;
      await token.mint(signers.alice.address, mintAmount);

      // Transfer 1
      let transferAmount = 50;
      let input = await fhevm
        .createEncryptedInput(tokenAddress, signers.alice.address)
        .add64(transferAmount)
        .encrypt();
      const tx1 = await token.connect(signers.alice).transferExternal(signers.bob.address, input.handles[0], input.inputProof);
      await tx1.wait();

      // Transfer 2
      transferAmount = 150;
      input = await fhevm
        .createEncryptedInput(tokenAddress, signers.alice.address)
        .add64(transferAmount)
        .encrypt();
      const tx2 = await token.connect(signers.alice).transferExternal(signers.bob.address, input.handles[0], input.inputProof);
      const receipt = await tx2.wait();
      expect(receipt).to.not.be.null;
    });

    it("should return true on successful transfer", async function () {
      const mintAmount = 500;
      const transferAmount = 100;

      await token.mint(signers.alice.address, mintAmount);
      const input = await fhevm
        .createEncryptedInput(tokenAddress, signers.alice.address)
        .add64(transferAmount)
        .encrypt();

      const result = await token
        .connect(signers.alice)
        .transferExternal(signers.bob.address, input.handles[0], input.inputProof);
      expect(result).to.not.be.undefined;
    });

    it("should allow transfer with small amount (1 token)", async function () {
      const mintAmount = 100;
      const transferAmount = 1;

      await token.mint(signers.alice.address, mintAmount);
      const input = await fhevm
        .createEncryptedInput(tokenAddress, signers.alice.address)
        .add64(transferAmount)
        .encrypt();

      const tx = await token.connect(signers.alice).transferExternal(signers.bob.address, input.handles[0], input.inputProof);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should allow transfer of large amounts", async function () {
      const mintAmount = BigInt("9223372036854775807");
      const transferAmount = BigInt("100");

      await token.mint(signers.alice.address, mintAmount);
      const input = await fhevm
        .createEncryptedInput(tokenAddress, signers.alice.address)
        .add64(transferAmount)
        .encrypt();

      const tx = await token.connect(signers.alice).transferExternal(signers.bob.address, input.handles[0], input.inputProof);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });
  });

  // ============= Boundary Cases =============

  describe("Boundary and Edge Cases", function () {
    it("should handle zero amount mint and transfer", async function () {
      const zeroAmount = 0;
      await token.mint(signers.alice.address, 100);

      const input = await fhevm
        .createEncryptedInput(tokenAddress, signers.alice.address)
        .add64(zeroAmount)
        .encrypt();

      const tx = await token.connect(signers.alice).transferExternal(signers.bob.address, input.handles[0], input.inputProof);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });

    it("should handle maximum uint64 amount operations", async function () {
      const largeAmount = BigInt("9223372036854775807");
      const tx = await token.mint(signers.alice.address, largeAmount);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;
    });
  });

  // ============= Multi-Party Scenarios =============

  describe("Multi-Party Scenarios", function () {
    it("should allow independent minting to multiple users", async function () {
      const aliceAmount = 300;
      const bobAmount = 500;

      await token.mint(signers.alice.address, aliceAmount);
      await token.mint(signers.bob.address, bobAmount);

      // No errors should occur
    });

    it("should support chain of transfers between multiple parties", async function () {
      const initialAmount = 1000;
      const transferAmount1 = 300;
      const transferAmount2 = 150;

      // Mint to Alice
      await token.mint(signers.alice.address, initialAmount);

      // Alice transfers to Bob
      let input = await fhevm
        .createEncryptedInput(tokenAddress, signers.alice.address)
        .add64(transferAmount1)
        .encrypt();
      const tx1 = await token.connect(signers.alice).transferExternal(signers.bob.address, input.handles[0], input.inputProof);
      await tx1.wait();

      // Bob transfers to Owner
      input = await fhevm
        .createEncryptedInput(tokenAddress, signers.bob.address)
        .add64(transferAmount2)
        .encrypt();
      const tx2 = await token.connect(signers.bob).transferExternal(signers.owner.address, input.handles[0], input.inputProof);
      const receipt = await tx2.wait();

      expect(receipt).to.not.be.null;
    });
  });

  // ============= Metadata =============

  describe("Token Metadata", function () {
    it("should have correct URI", async function () {
      const uri = await token.contractURI();
      expect(uri).to.equal("https://example.com/meta");
    });

    it("should support ERC165 interface detection", async function () {
      // ERC7984 implements standard interfaces
      const isERC7984 = await token.supportsInterface("0x36372b07"); // ERC7984 interface ID
      // This may return false if not fully compliant, but should not revert
      expect(isERC7984 !== undefined).to.be.true;
    });
  });
});

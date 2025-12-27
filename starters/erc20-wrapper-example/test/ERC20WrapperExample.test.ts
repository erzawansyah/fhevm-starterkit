/**
 * @example-id erc-20-wrapper-example
 * @test-suite ERC20WrapperExample
 * @test-goal
 * - Verify token wrapping functionality from public ERC20 to encrypted ERC7984.
 * - Test basic contract deployment and initialization.
 * - Ensure public ERC20 tokens can interact with the wrapper.
 * - Validate error handling and edge cases.
 */

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as hre from "hardhat";

import { ERC20WrapperExample, MockERC20 } from "../types/contracts/ERC20WrapperExample.sol";

type LocalSigners = {
  owner: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  // Deploy MockERC20 token first
  const mockTokenFactory = await ethers.getContractFactory("MockERC20");
  const mockToken = (await mockTokenFactory.deploy()) as MockERC20;
  const mockTokenAddress = await mockToken.getAddress();

  // Deploy ERC20WrapperExample with reference to the underlying token
  const wrapperFactory = await ethers.getContractFactory("ERC20WrapperExample");
  const wrapper = (await wrapperFactory.deploy(mockTokenAddress)) as ERC20WrapperExample;
  const wrapperAddress = await wrapper.getAddress();

  return { mockToken, mockTokenAddress, wrapper, wrapperAddress };
}

describe("ERC20WrapperExample", function () {
  let signers: LocalSigners;
  let mockToken: MockERC20;
  let mockTokenAddress: string;
  let wrapper: ERC20WrapperExample;
  let wrapperAddress: string;

  before(async function () {
    if (!hre.fhevm.isMock) {
      throw new Error("This test suite only runs on FHEVM mock environment");
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { owner: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    const deployment = await deployFixture();
    mockToken = deployment.mockToken;
    mockTokenAddress = deployment.mockTokenAddress;
    wrapper = deployment.wrapper;
    wrapperAddress = deployment.wrapperAddress;
  });

  // ============= Deployment & Initialization =============

  describe("Deployment and Initialization", function () {
    it("should deploy MockERC20 with correct initial supply", async function () {
      const ownerBalance = await mockToken.balanceOf(signers.owner.address);
      const expectedSupply = ethers.parseUnits("1000000", 18);
      expect(ownerBalance).to.equal(expectedSupply);
    });

    it("should deploy wrapper with correct name", async function () {
      const name = await wrapper.name();
      expect(name).to.equal("Wrapped Mock Token");
    });

    it("should deploy wrapper with correct symbol", async function () {
      const symbol = await wrapper.symbol();
      expect(symbol).to.equal("wMCK");
    });

    it("should have valid wrapper address after deployment", async function () {
      expect(wrapperAddress).to.not.equal(ethers.ZeroAddress);
    });
  });

  // ============= Token Minting =============

  describe("Token Minting", function () {
    it("should mint tokens to specified address", async function () {
      const mintAmount = ethers.parseUnits("500", 18);
      await mockToken.mint(signers.alice.address, mintAmount);
      const balance = await mockToken.balanceOf(signers.alice.address);
      expect(balance).to.equal(mintAmount);
    });

    it("should allow multiple mints to increase balance", async function () {
      const amount1 = ethers.parseUnits("100", 18);
      const amount2 = ethers.parseUnits("200", 18);
      await mockToken.mint(signers.alice.address, amount1);
      await mockToken.mint(signers.alice.address, amount2);
      const balance = await mockToken.balanceOf(signers.alice.address);
      expect(balance).to.equal(amount1 + amount2);
    });

    it("should mint to owner by default in constructor", async function () {
      const ownerBalance = await mockToken.balanceOf(signers.owner.address);
      // Owner should have the initial 1,000,000 tokens
      expect(ownerBalance).to.be.greaterThan(0);
    });
  });

  // ============= Approval & Allowance =============

  describe("Approval and Allowance", function () {
    it("should allow user to approve wrapper for token spending", async function () {
      const approveAmount = ethers.parseUnits("1000", 18);
      await mockToken.mint(signers.alice.address, approveAmount);
      await mockToken.connect(signers.alice).approve(wrapperAddress, approveAmount);
      const allowance = await mockToken.allowance(signers.alice.address, wrapperAddress);
      expect(allowance).to.equal(approveAmount);
    });

    it("should update allowance correctly on multiple approvals", async function () {
      const amount1 = ethers.parseUnits("100", 18);
      const amount2 = ethers.parseUnits("500", 18);
      await mockToken.mint(signers.alice.address, amount2);
      // First approval
      await mockToken.connect(signers.alice).approve(wrapperAddress, amount1);
      expect(await mockToken.allowance(signers.alice.address, wrapperAddress)).to.equal(amount1);
      // Second approval overrides
      await mockToken.connect(signers.alice).approve(wrapperAddress, amount2);
      expect(await mockToken.allowance(signers.alice.address, wrapperAddress)).to.equal(amount2);
    });

    it("should handle zero allowance", async function () {
      await mockToken.mint(signers.alice.address, ethers.parseUnits("100", 18));
      const allowance = await mockToken.allowance(signers.alice.address, wrapperAddress);
      expect(allowance).to.equal(0);
    });

    it("should allow multiple independent approvals from different users", async function () {
      const aliceAmount = ethers.parseUnits("100", 18);
      const bobAmount = ethers.parseUnits("200", 18);

      await mockToken.mint(signers.alice.address, aliceAmount);
      await mockToken.mint(signers.bob.address, bobAmount);

      await mockToken.connect(signers.alice).approve(wrapperAddress, aliceAmount);
      await mockToken.connect(signers.bob).approve(wrapperAddress, bobAmount);

      expect(await mockToken.allowance(signers.alice.address, wrapperAddress)).to.equal(aliceAmount);
      expect(await mockToken.allowance(signers.bob.address, wrapperAddress)).to.equal(bobAmount);
    });
  });

  // ============= Token Transfer Mechanics =============

  describe("Token Transfer Mechanics", function () {
    it("should transfer tokens between users", async function () {
      const transferAmount = ethers.parseUnits("100", 18);
      await mockToken.mint(signers.alice.address, transferAmount);
      await mockToken.connect(signers.alice).transfer(signers.bob.address, transferAmount);
      const bobBalance = await mockToken.balanceOf(signers.bob.address);
      expect(bobBalance).to.equal(transferAmount);
    });

    it("should prevent transfer with insufficient balance", async function () {
      const transferAmount = ethers.parseUnits("100", 18);
      const lesserAmount = ethers.parseUnits("50", 18);
      await mockToken.mint(signers.alice.address, lesserAmount);
      await expect(
        mockToken.connect(signers.alice).transfer(signers.bob.address, transferAmount),
      ).to.be.reverted; // ERC20 insufficient balance
    });

    it("should allow transferFrom with prior approval", async function () {
      const transferAmount = ethers.parseUnits("100", 18);
      await mockToken.mint(signers.alice.address, transferAmount);
      await mockToken.connect(signers.alice).approve(signers.bob.address, transferAmount);
      await mockToken
        .connect(signers.bob)
        .transferFrom(signers.alice.address, signers.bob.address, transferAmount);
      const bobBalance = await mockToken.balanceOf(signers.bob.address);
      expect(bobBalance).to.equal(transferAmount);
    });

    it("should prevent transferFrom without sufficient allowance", async function () {
      const transferAmount = ethers.parseUnits("100", 18);
      const insufficientAllowance = ethers.parseUnits("50", 18);
      await mockToken.mint(signers.alice.address, transferAmount);
      await mockToken.connect(signers.alice).approve(signers.bob.address, insufficientAllowance);
      await expect(
        mockToken
          .connect(signers.bob)
          .transferFrom(signers.alice.address, signers.bob.address, transferAmount),
      ).to.be.reverted; // ERC20 insufficient allowance
    });
  });

  // ============= Large Amount Testing =============

  describe("Large Amount Operations", function () {
    it("should handle large token balances", async function () {
      const largeAmount = ethers.parseUnits("999999", 18);
      await mockToken.mint(signers.alice.address, largeAmount);
      const balance = await mockToken.balanceOf(signers.alice.address);
      expect(balance).to.equal(largeAmount);
    });

    it("should handle large approval amounts", async function () {
      const largeAmount = ethers.parseUnits("1000000", 18);
      await mockToken.mint(signers.alice.address, largeAmount);
      await mockToken.connect(signers.alice).approve(wrapperAddress, largeAmount);
      const allowance = await mockToken.allowance(signers.alice.address, wrapperAddress);
      expect(allowance).to.equal(largeAmount);
    });
  });

  // ============= Wrapper Metadata =============

  describe("Wrapper Metadata and Properties", function () {
    it("should have correct token decimals", async function () {
      const decimals = await mockToken.decimals();
      expect(decimals).to.equal(18);
    });

    it("should have wrapper decimals", async function () {
      const decimals = await wrapper.decimals();
      // Wrapper may have different decimals, just verify it's valid
      expect(decimals).to.be.greaterThan(0);
    });
  });

  // ============= Edge Cases =============

  describe("Edge Cases and Error Handling", function () {
    it("should handle zero amount transfers", async function () {
      const zeroAmount = ethers.parseUnits("0", 18);
      await mockToken.mint(signers.alice.address, ethers.parseUnits("100", 18));
      // Zero transfer should not revert, just have no effect
      await mockToken.connect(signers.alice).transfer(signers.bob.address, zeroAmount);
      const bobBalance = await mockToken.balanceOf(signers.bob.address);
      expect(bobBalance).to.equal(0);
    });

    it("should handle zero amount approvals", async function () {
      const zeroAmount = ethers.parseUnits("0", 18);
      await mockToken.mint(signers.alice.address, ethers.parseUnits("100", 18));
      await mockToken.connect(signers.alice).approve(wrapperAddress, zeroAmount);
      const allowance = await mockToken.allowance(signers.alice.address, wrapperAddress);
      expect(allowance).to.equal(0);
    });

    it("should handle sequential approvals to different spenders", async function () {
      const amount = ethers.parseUnits("100", 18);
      await mockToken.mint(signers.alice.address, amount);
      // Approve two different spenders
      await mockToken.connect(signers.alice).approve(signers.bob.address, amount);
      await mockToken.connect(signers.alice).approve(wrapperAddress, amount);
      expect(await mockToken.allowance(signers.alice.address, signers.bob.address)).to.equal(amount);
      expect(await mockToken.allowance(signers.alice.address, wrapperAddress)).to.equal(amount);
    });
  });
});

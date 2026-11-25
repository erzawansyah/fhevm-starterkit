/**
 * @title HandleExample test suite
 * @notice Validates the handle lifecycle helper utilities exported by HandleExample.sol.
 * @example-id handle-example
 * @test-suite HandleExample
 * @test-goal
 * - Show that an encrypted zero (trivial encryption) still has a non-zero handle.
 * - Verify that compareHandles() returns distinct handles and yields an incremented cleartext.
 * - Confirm invalid proofs are rejected by the same entrypoint.
 */

import { FhevmType } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

import { HandleExample } from "../types";

async function deployFixture() {
  const factory = await ethers.getContractFactory("HandleExample");
  const contract = (await factory.deploy()) as HandleExample;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("HandleExample", function () {
  let contract: HandleExample;
  let contractAddress: string;
  let alice: HardhatEthersSigner;

  before(async function () {
    if (!fhevm.isMock) {
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
    it("encrypted zero has a non-zero, stable handle", async function () {
      const storedHandle = await contract.getHandle();

      // FHE.asEuint32(0) produces a real ciphertext handle, not bytes32(0)
      expect(storedHandle).to.not.equal(0n);

      // Reading again returns the same handle: nothing changed on-chain
      expect(await contract.getHandle()).to.equal(storedHandle);
    });

    it("compareHandles returns distinct handles and increments the ciphertext", async function () {
      const value = 42;
      const input = await fhevm
        .createEncryptedInput(contractAddress, alice.address)
        .add32(value)
        .encrypt();

      const [originalHandle, newHandle] = await contract
        .connect(alice)
        .compareHandles.staticCall(input.handles[0], input.inputProof);

      // The imported handle is the same as the one produced client-side
      expect(originalHandle).to.equal(BigInt(ethers.hexlify(input.handles[0])));
      // Every FHE operation produces a new handle
      expect(newHandle).to.not.equal(originalHandle);

      const tx = await contract.connect(alice).compareHandles(input.handles[0], input.inputProof);
      await tx.wait();

      const decrypted = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        ethers.toBeHex(newHandle, 32),
        contractAddress,
        alice,
      );

      expect(decrypted).to.equal(BigInt(value + 1));
    });

    it("rejects compareHandles when proof is tampered", async function () {
      const input = await fhevm
        .createEncryptedInput(contractAddress, alice.address)
        .add32(7)
        .encrypt();

      const proofLength = ethers.getBytes(input.inputProof).length;
      const tamperedProof = ethers.zeroPadValue("0x02", proofLength);

      await expect(
        contract.connect(alice).compareHandles(input.handles[0], tamperedProof),
      ).to.be.reverted;
    });
  });
});

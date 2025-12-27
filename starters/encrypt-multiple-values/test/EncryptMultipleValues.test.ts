/**
 * @example-id encrypt-multiple-values
 * @test-suite EncryptMultipleValues
 * @test-goal
 * - Memastikan fungsi dasar contract berjalan sesuai harapan.
 */

import {
  FhevmType,
  HardhatFhevmRuntimeEnvironment,
} from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as hre from "hardhat";

type Signers = {
  owner: HardhatEthersSigner;
  alice: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = await ethers.getContractFactory("EncryptMultipleValues");
  const contract = await factory.deploy();
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("EncryptMultipleValues", function () {
  let contract: any;
  let contractAddress: string;
  let signers: Signers;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  before(async function () {
    if (!hre.fhevm.isMock) {
      throw new Error(`This hardhat test suite cannot run on Sepolia Testnet`);
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { owner: ethSigners[0], alice: ethSigners[1] };
    alice = ethSigners[1];
    bob = ethSigners[2];
  });

  beforeEach(async function () {
    const deployment = await deployFixture();
    contractAddress = deployment.contractAddress;
    contract = deployment.contract;
  });

  // @scenario Dasar FHEVM
  describe("Pengujian fungsi dasar pada contract FHEVM.", function () {
    // @case Inisialisasi dan Penyimpanan Nilai
    it("Memastikan contract dapat diinisialisasi dan menyimpan nilai terenkripsi dengan benar.", async function () {
      const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;
      const plaintext = 42;

      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, alice.address)
        .add8(plaintext)
        .encrypt();

      const tx = await contract
        .connect(alice)
        .setValue(encryptedInput.handles[0], encryptedInput.inputProof);
      await tx.wait();

      const storedCipher = await contract.getResult();
      const decrypted = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        storedCipher,
        contractAddress,
        alice,
      );

      expect(decrypted).to.equal(plaintext);
    });

    // @case Pembaruan nilai terenkripsi
    it("Mengizinkan penyimpanan ulang oleh pemanggil berbeda dengan ciphertext baru.", async function () {
      const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;

      const firstValue = 7;
      const secondValue = 201;

      const firstInput = await fhevm
        .createEncryptedInput(contractAddress, alice.address)
        .add8(firstValue)
        .encrypt();
      await (await contract.connect(alice).setValue(firstInput.handles[0], firstInput.inputProof)).wait();

      const secondInput = await fhevm
        .createEncryptedInput(contractAddress, bob.address)
        .add8(secondValue)
        .encrypt();
      await (await contract.connect(bob).setValue(secondInput.handles[0], secondInput.inputProof)).wait();

      const storedCipher = await contract.getResult();
      const decrypted = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        storedCipher,
        contractAddress,
        bob,
      );

      expect(decrypted).to.equal(secondValue);
    });

    // @case Proof tidak valid
    it("Menolak proof yang tidak valid ketika menyimpan ciphertext.", async function () {
      const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;

      const encryptedInput = await fhevm
        .createEncryptedInput(contractAddress, alice.address)
        .add8(99)
        .encrypt();

      const invalidProof = ethers.randomBytes(64);

      await expect(
        contract.connect(alice).setValue(encryptedInput.handles[0], invalidProof),
      ).to.be.reverted;
    });
  });
});

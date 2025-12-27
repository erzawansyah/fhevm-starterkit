/**
 * @title FHEIfThenElse test suite
 * @notice Memvalidasi alur perbandingan terenkripsi dan pemilihan nilai maksimum.
 * @example-id fhe-if-then-else
 * @test-suite FHEIfThenElse
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

  // @scenario Dasar FHEVM
  describe("Pengujian fungsi dasar pada contract FHEVM.", function () {
    // @case Inisialisasi dan Penyimpanan Nilai
    it("Memastikan contract dapat diinisialisasi dan menyimpan nilai terenkripsi dengan benar.", async function () {
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

    // @case Pemilihan nilai maksimum ketika operand A lebih besar atau sama
    it("Memilih operand A ketika nilainya lebih besar atau sama dengan operand B.", async function () {
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

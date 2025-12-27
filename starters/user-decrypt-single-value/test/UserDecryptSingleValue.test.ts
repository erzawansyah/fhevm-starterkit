import { UserDecryptSingleValue, UserDecryptSingleValue__factory } from "../../../types";
import type { Signers } from "../../../types";
import { FhevmType, HardhatFhevmRuntimeEnvironment } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as hre from "hardhat";

async function deployFixture() {
  // Contracts are deployed using the first signer/account by default
  const factory = (await ethers.getContractFactory("UserDecryptSingleValue")) as UserDecryptSingleValue__factory;
  const userUserDecryptSingleValue = (await factory.deploy()) as UserDecryptSingleValue;
  const userUserDecryptSingleValue_address = await userUserDecryptSingleValue.getAddress();

  return { userUserDecryptSingleValue, userUserDecryptSingleValue_address };
}

/**
 * This trivial example demonstrates the FHE user decryption mechanism
 * and highlights a common pitfall developers may encounter.
 */
describe("UserDecryptSingleValue", function () {
  let contract: UserDecryptSingleValue;
  let contractAddress: string;
  let signers: Signers;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  before(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!hre.fhevm.isMock) {
      throw new Error(`This hardhat test suite cannot run on Sepolia Testnet`);
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { owner: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] } as unknown as Signers;
    alice = ethSigners[1];
    bob = ethSigners[2];
  });

  beforeEach(async function () {
    // Deploy a new contract each time we run a new test
    const deployment = await deployFixture();
    contractAddress = deployment.userUserDecryptSingleValue_address;
    contract = deployment.userUserDecryptSingleValue;
  });

  // ✅ Test should succeed
  it("user decryption should succeed", async function () {
    const tx = await contract.connect(alice).initializeUint32(123456);
    await tx.wait();

    const encryptedUint32 = await contract.encryptedUint32();

    // The FHEVM Hardhat plugin provides a set of convenient helper functions
    // that make it easy to perform FHEVM operations within your Hardhat environment.
    const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;

    const clearUint32 = await fhevm.userDecryptEuint(
      FhevmType.euint32, // Specify the encrypted type
      encryptedUint32,
      contractAddress, // The contract address
      alice, // The user wallet
    );

    expect(clearUint32).to.equal(123456 + 1);
  });

  // ❌ Test should fail
  it("user decryption should fail", async function () {
    const tx = await contract.connect(alice).initializeUint32Wrong(123456);
    await tx.wait();

    const encryptedUint32 = await contract.encryptedUint32();

    await expect(
      hre.fhevm.userDecryptEuint(FhevmType.euint32, encryptedUint32, contractAddress, alice),
    ).to.be.rejectedWith(new RegExp("^dapp contract (.+) is not authorized to user decrypt handle (.+)."));
  });

  // ✅ Only the initializing caller has permission to decrypt
  it("only the initializing caller can decrypt", async function () {
    await (await contract.connect(alice).initializeUint32(42)).wait();
    const handle = await contract.encryptedUint32();

    // Bob should be unauthorized
    await expect(
      hre.fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, bob),
    ).to.be.rejectedWith(new RegExp("^User 0x[a-fA-F0-9]+ is not authorized to user decrypt handle .+"));

    // Alice succeeds
    const clear = await hre.fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, alice);
    expect(clear).to.equal(43);
  });

  // ❌ Decrypt without initialization (no permissions granted) must fail
  it("decrypt before initialization should fail", async function () {
    const handle = await contract.encryptedUint32();
    await expect(
      hre.fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, alice),
    ).to.be.rejectedWith("Handle is not initialized");
  });

  // ✅ Edge values wrap modulo 2^32
  it("edge values: 0 -> 1 and max -> 0", async function () {
    // 0 -> 1
    await (await contract.connect(alice).initializeUint32(0)).wait();
    const h0 = await contract.encryptedUint32();
    const c0 = await hre.fhevm.userDecryptEuint(FhevmType.euint32, h0, contractAddress, alice);
    expect(c0).to.equal(1);

    // max -> 0 (wrap)
    const MAX32 = 0xffffffff;
    await (await contract.connect(alice).initializeUint32(MAX32)).wait();
    const hMax = await contract.encryptedUint32();
    const cMax = await hre.fhevm.userDecryptEuint(FhevmType.euint32, hMax, contractAddress, alice);
    expect(cMax).to.equal(0);
  });
});

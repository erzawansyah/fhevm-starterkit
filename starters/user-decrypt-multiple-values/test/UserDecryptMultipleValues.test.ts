import { UserDecryptMultipleValues, UserDecryptMultipleValues__factory } from "../../../types";
import type { Signers } from "../../types";
import { HardhatFhevmRuntimeEnvironment } from "@fhevm/hardhat-plugin";
import { utils as fhevm_utils } from "@fhevm/mock-utils";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { DecryptedResults } from "@zama-fhe/relayer-sdk";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as hre from "hardhat";

async function deployFixture() {
  // Contracts are deployed using the first signer/account by default
  const factory = (await ethers.getContractFactory("UserDecryptMultipleValues")) as UserDecryptMultipleValues__factory;
  const userDecryptMultipleValues = (await factory.deploy()) as UserDecryptMultipleValues;
  const userDecryptMultipleValues_address = await userDecryptMultipleValues.getAddress();

  return { userDecryptMultipleValues, userDecryptMultipleValues_address };
}

/**
 * This trivial example demonstrates the FHE user decryption mechanism
 * and highlights a common pitfall developers may encounter.
 */
describe("UserDecryptMultipleValues", function () {
  let contract: UserDecryptMultipleValues;
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
    contractAddress = deployment.userDecryptMultipleValues_address;
    contract = deployment.userDecryptMultipleValues;
  });

  // ✅ Test should succeed
  it("user decryption should succeed", async function () {
    const tx = await contract.connect(alice).initialize(true, 123456, 78901234567n);
    await tx.wait();

    const encryptedBool = await contract.encryptedBool();
    const encryptedUint32 = await contract.encryptedUint32();
    const encryptedUint64 = await contract.encryptedUint64();

    // The FHEVM Hardhat plugin provides a set of convenient helper functions
    // that make it easy to perform FHEVM operations within your Hardhat environment.
    const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm;

    const aliceKeypair = fhevm.generateKeypair();

    const startTimestamp = fhevm_utils.timestampNow();
    const durationDays = 365;

    const aliceEip712 = fhevm.createEIP712(aliceKeypair.publicKey, [contractAddress], startTimestamp, durationDays);
    const aliceSignature = await alice.signTypedData(
      aliceEip712.domain,
      { UserDecryptRequestVerification: aliceEip712.types.UserDecryptRequestVerification },
      aliceEip712.message,
    );

    const decrytepResults: DecryptedResults = await fhevm.userDecrypt(
      [
        { handle: encryptedBool, contractAddress: contractAddress },
        { handle: encryptedUint32, contractAddress: contractAddress },
        { handle: encryptedUint64, contractAddress: contractAddress },
      ],
      aliceKeypair.privateKey,
      aliceKeypair.publicKey,
      aliceSignature,
      [contractAddress],
      alice.address,
      startTimestamp,
      durationDays,
    );

    expect(decrytepResults[encryptedBool]).to.equal(true);
    expect(decrytepResults[encryptedUint32]).to.equal(123456 + 1);
    expect(decrytepResults[encryptedUint64]).to.equal(78901234567n + 1n);
  });

  // ❌ Decrypt before initialization should fail
  it("decrypt before initialization should fail", async function () {
    const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm as unknown as HardhatFhevmRuntimeEnvironment;
    const handleBool = await contract.encryptedBool();
    const handleU32 = await contract.encryptedUint32();
    const handleU64 = await contract.encryptedUint64();

    const kp = fhevm.generateKeypair();
    const start = fhevm_utils.timestampNow();
    const duration = 365;
    const eip712 = fhevm.createEIP712(kp.publicKey, [contractAddress], start, duration);
    const sig = await alice.signTypedData(
      eip712.domain,
      { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
      eip712.message,
    );

    await expect(
      fhevm.userDecrypt(
        [
          { handle: handleBool, contractAddress },
          { handle: handleU32, contractAddress },
          { handle: handleU64, contractAddress },
        ],
        kp.privateKey,
        kp.publicKey,
        sig,
        [contractAddress],
        alice.address,
        start,
        duration,
      ),
    ).to.be.rejectedWith(
      new RegExp("(Handle is not initialized|^User 0x[a-fA-F0-9]+ is not authorized to user decrypt handle .+)"),
    );
  });

  // ❌ Only the initializing caller can decrypt
  it("only the initializing caller can decrypt", async function () {
    await (await contract.connect(alice).initialize(false, 1, 2n)).wait();
    const hb = await contract.encryptedBool();
    const h32 = await contract.encryptedUint32();
    const h64 = await contract.encryptedUint64();

    const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm as unknown as HardhatFhevmRuntimeEnvironment;
    const kpBob = fhevm.generateKeypair();
    const start = fhevm_utils.timestampNow();
    const duration = 365;
    const eip712Bob = fhevm.createEIP712(kpBob.publicKey, [contractAddress], start, duration);
    const sigBob = await bob.signTypedData(
      eip712Bob.domain,
      { UserDecryptRequestVerification: eip712Bob.types.UserDecryptRequestVerification },
      eip712Bob.message,
    );

    await expect(
      fhevm.userDecrypt(
        [
          { handle: hb, contractAddress },
          { handle: h32, contractAddress },
          { handle: h64, contractAddress },
        ],
        kpBob.privateKey,
        kpBob.publicKey,
        sigBob,
        [contractAddress],
        bob.address,
        start,
        duration,
      ),
    ).to.be.rejectedWith(new RegExp("^User 0x[a-fA-F0-9]+ is not authorized to user decrypt handle .+"));
  });

  // ✅ Edge values: uint32 and uint64 wrap, boolean stays same
  it("edge values: bool stays same, u32/u64 wrap", async function () {
    await (await contract.connect(alice).initialize(false, 0, 0n)).wait();
    const hb1 = await contract.encryptedBool();
    const h321 = await contract.encryptedUint32();
    const h641 = await contract.encryptedUint64();

    const fhevm: HardhatFhevmRuntimeEnvironment = hre.fhevm as unknown as HardhatFhevmRuntimeEnvironment;
    const kp = fhevm.generateKeypair();
    const start = fhevm_utils.timestampNow();
    const duration = 365;
    const eip712 = fhevm.createEIP712(kp.publicKey, [contractAddress], start, duration);
    const sig = await alice.signTypedData(
      eip712.domain,
      { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
      eip712.message,
    );

    const res1 = await fhevm.userDecrypt(
      [
        { handle: hb1, contractAddress },
        { handle: h321, contractAddress },
        { handle: h641, contractAddress },
      ],
      kp.privateKey,
      kp.publicKey,
      sig,
      [contractAddress],
      alice.address,
      start,
      duration,
    );

    expect(res1[hb1]).to.equal(false);
    expect(res1[h321]).to.equal(1);
    expect(res1[h641]).to.equal(1n);

    // Max wraps
    const MAX32 = 0xffffffff;
    const MAX64 = 18446744073709551615n;
    await (await contract.connect(alice).initialize(true, MAX32, MAX64)).wait();
    const hb2 = await contract.encryptedBool();
    const h322 = await contract.encryptedUint32();
    const h642 = await contract.encryptedUint64();

    const res2 = await fhevm.userDecrypt(
      [
        { handle: hb2, contractAddress },
        { handle: h322, contractAddress },
        { handle: h642, contractAddress },
      ],
      kp.privateKey,
      kp.publicKey,
      sig,
      [contractAddress],
      alice.address,
      start,
      duration,
    );

    expect(res2[hb2]).to.equal(true);
    expect(res2[h322]).to.equal(0);
    expect(res2[h642]).to.equal(0n);
  });
});

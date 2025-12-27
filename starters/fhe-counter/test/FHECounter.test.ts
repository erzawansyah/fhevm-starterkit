import { FhevmType } from "@fhevm/hardhat-plugin";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";

import { FHECounter, FHECounter__factory } from "../types";

type LocalSigners = {
  owner: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("FHECounter")) as FHECounter__factory;
  const counter = (await factory.deploy()) as FHECounter;
  const counterAddress = await counter.getAddress();
  return { counter, counterAddress };
}

describe("FHECounter", function () {
  let signers: LocalSigners;
  let counter: FHECounter;
  let counterAddress: string;

  before(async function () {
    const s: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { owner: s[0], alice: s[1], bob: s[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This test suite runs only on FHEVM mock environment");
      this.skip();
    }
    ({ counter, counterAddress } = await deployFixture());
  });

  it("initial encrypted count should be empty handle (ZeroHash)", async function () {
    const encrypted = await counter.getCount();
    expect(encrypted).to.eq(ethers.ZeroHash);
  });

  it("increment by 1 and decrypt as caller (alice)", async function () {
    const one = 1;
    const input = await fhevm.createEncryptedInput(counterAddress, signers.alice.address).add32(one).encrypt();

    const tx = await counter.connect(signers.alice).increment(input.handles[0], input.inputProof);
    await tx.wait();

    const encryptedAfter = await counter.getCount();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, encryptedAfter, counterAddress, signers.alice);
    expect(clear).to.eq(one);
  });

  it("increment then decrement back to 0", async function () {
    const one = 1;
    const input = await fhevm.createEncryptedInput(counterAddress, signers.alice.address).add32(one).encrypt();

    let tx = await counter.connect(signers.alice).increment(input.handles[0], input.inputProof);
    await tx.wait();

    tx = await counter.connect(signers.alice).decrement(input.handles[0], input.inputProof);
    await tx.wait();

    const encrypted = await counter.getCount();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, encrypted, counterAddress, signers.alice);
    expect(clear).to.eq(0);
  });

  it("multiple increments (5 + 7) and decrypt result", async function () {
    const a = 5;
    const b = 7;

    const inputA = await fhevm.createEncryptedInput(counterAddress, signers.alice.address).add32(a).encrypt();
    await (await counter.connect(signers.alice).increment(inputA.handles[0], inputA.inputProof)).wait();

    const inputB = await fhevm.createEncryptedInput(counterAddress, signers.alice.address).add32(b).encrypt();
    await (await counter.connect(signers.alice).increment(inputB.handles[0], inputB.inputProof)).wait();

    const encrypted = await counter.getCount();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, encrypted, counterAddress, signers.alice);
    expect(clear).to.eq(a + b);
  });

  it("unauthorized decrypt should fail for non-caller (bob)", async function () {
    const val = 3;
    const input = await fhevm.createEncryptedInput(counterAddress, signers.alice.address).add32(val).encrypt();
    await (await counter.connect(signers.alice).increment(input.handles[0], input.inputProof)).wait();

    const encrypted = await counter.getCount();
    // Permission was granted to the contract and to alice (caller), not to bob
    await expect(
      fhevm.userDecryptEuint(FhevmType.euint32, encrypted, counterAddress, signers.bob),
    ).to.be.rejected; // rejection indicates missing permission
  });

  it("invalid proof: input built for a different contract should revert", async function () {
    const other = await (await (await ethers.getContractFactory("FHECounter")) as FHECounter__factory).deploy();
    const otherAddress = await other.getAddress();

    const bad = await fhevm.createEncryptedInput(otherAddress, signers.alice.address).add32(10).encrypt();

    await expect(counter.connect(signers.alice).increment(bad.handles[0], bad.inputProof)).to.be.reverted;
  });

  it("edge: decrement from zero wraps to max uint32", async function () {
    const one = 1;
    const input = await fhevm.createEncryptedInput(counterAddress, signers.alice.address).add32(one).encrypt();
    await (await counter.connect(signers.alice).decrement(input.handles[0], input.inputProof)).wait();

    const encrypted = await counter.getCount();
    const clear = await fhevm.userDecryptEuint(FhevmType.euint32, encrypted, counterAddress, signers.alice);
    // uint32 underflow wraps around
    expect(clear).to.eq(2 ** 32 - 1);
  });

  it("edge: adding zero keeps value stable", async function () {
    const zero = 0;
    // first set to 7
    const seven = await fhevm.createEncryptedInput(counterAddress, signers.alice.address).add32(7).encrypt();
    await (await counter.connect(signers.alice).increment(seven.handles[0], seven.inputProof)).wait();

    const beforeEnc = await counter.getCount();
    const before = await fhevm.userDecryptEuint(FhevmType.euint32, beforeEnc, counterAddress, signers.alice);

    // add zero
    const zeroIn = await fhevm.createEncryptedInput(counterAddress, signers.alice.address).add32(zero).encrypt();
    await (await counter.connect(signers.alice).increment(zeroIn.handles[0], zeroIn.inputProof)).wait();

    const afterEnc = await counter.getCount();
    const after = await fhevm.userDecryptEuint(FhevmType.euint32, afterEnc, counterAddress, signers.alice);
    expect(after).to.eq(before);
  });
});

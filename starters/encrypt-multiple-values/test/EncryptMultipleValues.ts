import { expect } from "chai";
import { ethers } from "hardhat";

describe("EncryptMultipleValues", function () {
  it("should store and retrieve an arbitrary bytes payload", async function () {
    const Factory = await ethers.getContractFactory("EncryptMultipleValues");
    const inst = await Factory.deploy();
    await inst.deployed();

    const payload = ethers.utils.toUtf8Bytes("hello-encrypted");
    await inst.store(1, payload);
    const got = await inst.get(1);
    expect(ethers.utils.toUtf8String(got)).to.equal("hello-encrypted");
  });
});

import { expect } from "chai";
import { ethers } from "hardhat";

describe("SimpleStorage", function () {
    it("should store and retrieve a value", async function () {
        const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
        const ss = await SimpleStorage.deploy();
        await ss.deployed();

        await ss.set(42);
        const v = await ss.get();
        expect(v).to.equal(42);
    });
});

import { expect } from "chai";
import { ethers } from "hardhat";

describe("SimpleVoting", function () {
    it("should accept votes and count them", async function () {
        const SimpleVoting = await ethers.getContractFactory("SimpleVoting");
        const sv = await SimpleVoting.deploy();
        await sv.deployed();

        await sv.vote("Alice");
        await sv.vote("Alice");
        const count = await sv.getVotes("Alice");
        expect(count).to.equal(2);
    });
});

import { expect } from "chai";
import { ethers } from "hardhat";

describe("SimpleERC20", function () {
    it("mints and transfers", async function () {
        const [owner, other] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory("SimpleERC20");
        const erc = await Factory.deploy();
        await erc.deployed();

        await erc.mint(owner.address, ethers.utils.parseUnits("100", 18));
        const bal = await erc.balanceOf(owner.address);
        expect(bal).to.equal(ethers.utils.parseUnits("100", 18));

        await erc.transfer(other.address, ethers.utils.parseUnits("10", 18));
        const bal2 = await erc.balanceOf(other.address);
        expect(bal2).to.equal(ethers.utils.parseUnits("10", 18));
    });
});

import { expect } from "chai";
import { ethers } from "hardhat";

describe("SimpleERC721", function () {
    it("mints and transfers NFTs", async function () {
        const [owner, other] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory("SimpleERC721");
        const nft = await Factory.deploy();
        await nft.deployed();

        await nft.mint(owner.address, 1);
        const o = await nft.ownerOf(1);
        expect(o).to.equal(owner.address);

        await nft.transfer(other.address, 1);
        const o2 = await nft.ownerOf(1);
        expect(o2).to.equal(other.address);
    });
});

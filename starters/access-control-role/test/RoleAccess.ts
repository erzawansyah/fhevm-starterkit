import { expect } from "chai";
import { ethers } from "hardhat";

describe("RoleAccess", function () {
    it("allows admin to grant and revoke roles", async function () {
        const [admin, alice] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory("RoleAccess");
        const r = await Factory.deploy();
        await r.deployed();

        const ROLE = ethers.utils.keccak256(Buffer.from("TEST"));
        await r.grantRole(ROLE, alice.address);
        const has = await r.hasRole(ROLE, alice.address);
        expect(has).to.equal(true);

        await r.revokeRole(ROLE, alice.address);
        const has2 = await r.hasRole(ROLE, alice.address);
        expect(has2).to.equal(false);
    });
});

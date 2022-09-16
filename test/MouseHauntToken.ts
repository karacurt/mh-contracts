import { expect } from "chai";
import { ethers } from "hardhat";

describe("Mouse Haunt Token", function () {
  it("Should be an ERC20 token", async function () {
    const [owner, to] = await ethers.getSigners();
    const MouseHauntToken = await ethers.getContractFactory("MouseHauntToken");
    const mht = await MouseHauntToken.deploy(owner.address);
    await mht.deployed();
    await expect(mht.transferFrom(owner.address, to.address, 1)).to.be.revertedWith(
      "ERC20: transfer amount exceeds allowance"
    );
  });
  it("Should have initial supply", async function () {
    const [owner] = await ethers.getSigners();
    const MouseHauntToken = await ethers.getContractFactory("MouseHauntToken");
    const mht = await MouseHauntToken.deploy(owner.address);
    await mht.deployed();

    expect(await mht.totalSupply()).to.equal("100000000000000000000000000");
  });
  it("Should be pausable", async function () {
    const [owner, to] = await ethers.getSigners();
    const MouseHauntToken = await ethers.getContractFactory("MouseHauntToken");
    const mht = await MouseHauntToken.deploy(owner.address);
    await mht.deployed();

    await mht.pause();

    await expect(mht.transferFrom(owner.address, to.address, 1)).to.be.revertedWith(
      "Pausable: paused"
    );

    await mht.unpause();

    await mht.approve(owner.address, to.address);

    const tx = mht.transferFrom(owner.address, to.address, 1);
    await expect(tx).to.emit(mht, "Transfer").withArgs(owner.address, to.address, 1);
  });
  it("Should be ownable", async function () {
    const [owner] = await ethers.getSigners();
    const MouseHauntToken = await ethers.getContractFactory("MouseHauntToken");
    const mht = await MouseHauntToken.deploy(owner.address);
    await mht.deployed();

    const [, notOwner] = await ethers.getSigners();

    await expect(mht.connect(notOwner).pause()).to.be.revertedWith(
      `AccessControl: account ${notOwner.address.toLowerCase()} is missing role 0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a`
    );
  });
  it("Should be burnable", async function () {
    const [owner] = await ethers.getSigners();
    const MouseHauntToken = await ethers.getContractFactory("MouseHauntToken");
    const mht = await MouseHauntToken.deploy(owner.address);
    await mht.deployed();

    expect(await mht.totalSupply()).to.equal("100000000000000000000000000");

    await mht.burn("1");

    expect(await mht.totalSupply()).to.equal("99999999999999999999999999");
  });
});

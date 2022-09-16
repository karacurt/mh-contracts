import { expect } from "chai";
import { ethers } from "hardhat";

describe("Mouse Haunt Booster EPIC", function () {
  it("Should be an ERC20 token", async function () {
    const [owner] = await ethers.getSigners();
    const BMHTE = await ethers.getContractFactory("BMHTE");
    const token = await BMHTE.deploy(owner.address);
    await token.deployed();
    expect(await token.name()).to.equal("Mouse Haunt Booster EPIC");
    expect(await token.symbol()).to.equal("BMHTE");
    expect(await token.totalSupply()).to.equal(ethers.utils.parseEther("66000"));
  });
  it("Should be pausable", async function () {
    const [owner, to] = await ethers.getSigners();
    const BMHTE = await ethers.getContractFactory("BMHTE");
    const token = await BMHTE.deploy(owner.address);
    await token.deployed();
    await token.pause();

    await expect(token.transferFrom(owner.address, to.address, 1)).to.revertedWith(
      "Pausable: paused"
    );

    await token.unpause();

    await token.approve(owner.address, 1);

    const tx = token.transferFrom(owner.address, to.address, 1);
    await expect(tx).to.emit(token, "Transfer").withArgs(owner.address, to.address, 1);
  });
  it("Should setup allowance to marketing account", async function () {
    const [owner, to, marketing] = await ethers.getSigners();
    const BMHTE = await ethers.getContractFactory("BMHTE");
    const token = await BMHTE.deploy(owner.address);
    await token.deployed();

    await token.approve(marketing.address, 42);

    const tx = token.connect(marketing).transferFrom(owner.address, to.address, 42);

    await expect(tx).to.emit(token, "Transfer").withArgs(owner.address, to.address, 42);
  });
});

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";
const toWei = ethers.utils.parseEther;

// FOR DEBUG ONLY WILL BE REMOVED FOR MERGE

describe("Marketplace Upgradable", function () {
  /* eslint-disable no-unused-vars */
  let boosterOwner: SignerWithAddress;
  let nftOwner: SignerWithAddress;
  let owner: SignerWithAddress;
  let notOwner: SignerWithAddress;
  let buyer: SignerWithAddress;
  let seller: SignerWithAddress;
  let deployer: SignerWithAddress;
  /* eslint-disable no-unused-vars */

  let mht: Contract;

  const itemPrice = toWei("200");
  const publicationFeeInWei = toWei("10");
  const ownerCutPerMillion = 10000;

  before(async function () {
    [deployer, owner, nftOwner, notOwner, boosterOwner, buyer, seller] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // CONTRACT FACTORIES
    const MHT = await ethers.getContractFactory("MouseHauntToken");
    mht = await MHT.deploy(owner.address);
    await mht.deployed();
    await mht.connect(owner).transfer(buyer.address, itemPrice);
  });
  it("is upgradable", async () => {
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const MarketplaceV2 = await ethers.getContractFactory("MarketplaceUpgradeTest");

    const instance = await upgrades.deployProxy(Marketplace, [
      mht.address,
      ownerCutPerMillion,
      publicationFeeInWei,
      owner.address,
    ]);

    const value = await instance.publicationFeeInWei();
    expect(value).to.equal(publicationFeeInWei);

    const upgraded = await upgrades.upgradeProxy(instance.address, MarketplaceV2);

    await upgraded.newPublicationFeeInWei(0);

    const value2 = await upgraded.publicationFeeInWei();
    expect(value2.toString()).to.equal("0");
  });
});

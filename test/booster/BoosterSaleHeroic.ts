import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, BigNumber } from "ethers";
import { ethers } from "hardhat";

const toWei = ethers.utils.parseEther;

describe("Booster Sale Heroic", function () {
  let deployer: SignerWithAddress;
  let boosterOwner: SignerWithAddress;
  let boosterOperations: SignerWithAddress;
  let mhtOwner: SignerWithAddress;
  let buyer2: SignerWithAddress;
  let buyer3: SignerWithAddress; // not whitelisted

  let mht: Contract;
  let boosterSaleHeroic: Contract;
  let bmhth: Contract;
  let mouseHero: Contract;

  // dummy values
  const boosterPrice: BigNumber = toWei("30");
  const buyer1Amount = "1";
  const buyer2Amount = "2";
  const maxAmount = "2";

  const boosterName = "Mouse Haunt Booster HEROIC";
  const boosterSymbol = "BMHTH";
  const baseURI = "https://nft.mousehaunt.com/hero/0";

  before(async function () {
    [deployer, boosterOwner, boosterOperations, mhtOwner, buyer2, buyer3] =
      await ethers.getSigners();
  });

  beforeEach(async function () {
    const MHT = await ethers.getContractFactory("MouseHauntToken");
    mht = await MHT.deploy(mhtOwner.address);
    await mht.deployed();

    const MouseHeroFactory = await ethers.getContractFactory("MouseHero");
    mouseHero = await MouseHeroFactory.deploy(boosterName, boosterSymbol, baseURI);
    await mouseHero.deployed();

    const BMHTH = await ethers.getContractFactory("BMHTH");
    bmhth = await BMHTH.deploy(boosterOwner.address, mouseHero.address);
    await bmhth.deployed();

    const BoosterSaleHeroicFactory = await ethers.getContractFactory("BoosterSaleHeroic");
    boosterSaleHeroic = await BoosterSaleHeroicFactory.deploy(
      boosterOwner.address,
      mht.address,
      bmhth.address,
      boosterPrice
    );
    await boosterSaleHeroic.deployed();
  });

  describe("Initial values", async function () {
    it("Should have owner different than deployer", async function () {
      const adminRole = await boosterSaleHeroic.DEFAULT_ADMIN_ROLE();
      expect(await boosterSaleHeroic.hasRole(adminRole, deployer.address)).to.equal(false);
      expect(
        await boosterSaleHeroic.hasRole(ethers.utils.id("OPERATOR_ROLE"), deployer.address)
      ).to.equal(true);
      expect(await boosterSaleHeroic.hasRole(adminRole, boosterOwner.address)).to.equal(true);
    });

    it("Should have initial values correctly set", async function () {
      expect(await boosterSaleHeroic.boosterOwner()).to.equal(boosterOwner.address);
      expect(await boosterSaleHeroic.mht()).to.equal(mht.address);
      expect(await boosterSaleHeroic.booster()).to.equal(bmhth.address);
      expect(await boosterSaleHeroic.price()).to.equal(boosterPrice);
    });

    it("Should be pausable", async function () {
      await boosterSaleHeroic.connect(boosterOwner).pause();

      await expect(boosterSaleHeroic.buy(1)).to.be.revertedWith("Pausable: paused");

      await boosterSaleHeroic.connect(boosterOwner).unpause();

      await expect(boosterSaleHeroic.buy(1)).to.not.be.revertedWith("Pausable: paused");
    });

    it("Should have roles", async function () {
      await boosterSaleHeroic
        .connect(boosterOwner)
        .grantRole(ethers.utils.id("OPERATOR_ROLE"), boosterOperations.address);

      await boosterSaleHeroic.connect(boosterOperations).pause();

      await expect(boosterSaleHeroic.buy(1)).to.be.revertedWith("Pausable: paused");

      await boosterSaleHeroic.connect(boosterOwner).unpause();

      await expect(boosterSaleHeroic.buy(1)).to.not.be.revertedWith("Pausable: paused");
    });
  });

  describe("Whitelist", async function () {
    it("should set the whitelist correctly", async function () {
      await boosterSaleHeroic
        .connect(boosterOwner)
        .setWhitelist([mhtOwner.address, buyer2.address], maxAmount);

      expect(await boosterSaleHeroic.whitelist(mhtOwner.address)).to.equal(maxAmount);
      expect(await boosterSaleHeroic.whitelist(buyer2.address)).to.equal(maxAmount);
      expect(await boosterSaleHeroic.whitelist(buyer3.address)).to.equal(0);
    });
  });

  describe("Sale", async function () {
    beforeEach(async function () {
      // add users 1 and 2 to the whitelist:
      await boosterSaleHeroic
        .connect(boosterOwner)
        .setWhitelist([mhtOwner.address, buyer2.address], maxAmount);

      // users 1 and 2 approve boosterSaleHeroic:
      const buyer1DesiredAllowance = boosterPrice.mul(buyer1Amount);
      const buyer2DesiredAllowance = boosterPrice.mul(buyer2Amount);
      await mht.connect(mhtOwner).approve(boosterSaleHeroic.address, buyer1DesiredAllowance);
      await mht.connect(buyer2).approve(boosterSaleHeroic.address, buyer2DesiredAllowance);

      // BoosterOwner approve the max allowance
      await bmhth
        .connect(boosterOwner)
        .approve(boosterSaleHeroic.address, Number(buyer1Amount) + Number(buyer2Amount));
    });

    it("should allow a whitelisted user to buy tokens", async function () {
      // get balances before
      const heroicBalanceBefore = await bmhth.balanceOf(boosterOwner.address);

      await boosterSaleHeroic.connect(mhtOwner).buy("1");

      await mht.connect(mhtOwner).transfer(buyer2.address, boosterPrice.mul(buyer2Amount));
      await boosterSaleHeroic.connect(buyer2).buy(buyer2Amount);

      // get balances after
      const heroicBalanceAfter = await bmhth.balanceOf(boosterOwner.address);

      // make sure tokens have been moved from the owner to the user
      expect(heroicBalanceAfter.toString()).to.equal(
        heroicBalanceBefore.sub(Number(buyer1Amount) + Number(buyer2Amount))
      );

      // make sure the allowance has been consumed
      expect(await boosterSaleHeroic.whitelist(mhtOwner.address)).to.equal(1);
      expect(await boosterSaleHeroic.whitelist(buyer2.address)).to.equal(0);
    });

    it("should allow a partially whitelisted user to buy only the tokens they are whitelisted for", async function () {
      // transfer some money to buyer2
      await mht.connect(mhtOwner).transfer(buyer2.address, boosterPrice.mul(buyer2Amount));
      await mht.connect(mhtOwner).transfer(buyer3.address, boosterPrice);

      // get balances before
      const heroicBalanceBefore = await bmhth.balanceOf(boosterOwner.address);

      await mht.connect(buyer2).approve(boosterSaleHeroic.address, boosterPrice.mul(buyer2Amount));
      await boosterSaleHeroic.connect(buyer2).buy(buyer2Amount);

      await expect(boosterSaleHeroic.connect(buyer3).buy("1")).to.be.revertedWith(
        "BoosterSale: above cap"
      );

      // get balances after
      const heroicBalanceAfter = await bmhth.balanceOf(boosterOwner.address);

      // make sure tokens have been moved from the owner to the user
      expect(heroicBalanceAfter.toString()).to.equal(heroicBalanceBefore.sub(buyer2Amount));
      // make sure the whitelist allowance has been consumed
      expect(await boosterSaleHeroic.whitelist(buyer2.address)).to.equal(0);
    });

    it("should revert when a non-whitelisted user tries to buy tokens", async function () {
      // make sure the whitelist allowance is zero
      expect(await boosterSaleHeroic.whitelist(buyer3.address)).to.equal(0);

      // transfer some money to buyer3
      await mht.connect(mhtOwner).transfer(buyer3.address, toWei("10000"));

      // get balances before
      const heroicBalanceBefore = await bmhth.balanceOf(boosterOwner.address);

      await expect(boosterSaleHeroic.connect(buyer3).buy("1")).to.be.revertedWith(
        "BoosterSale: above cap"
      );

      // get balances after
      const heroicBalanceAfter = await bmhth.balanceOf(boosterOwner.address);

      // make sure tokens have been moved from the owner to the user
      expect(heroicBalanceAfter.toString()).to.equal(heroicBalanceBefore);

      // make sure the whitelist allowance has not changed
      expect(await boosterSaleHeroic.whitelist(buyer3.address)).to.equal(0);
    });

    it("should not allow buying 0 boosters", async function () {
      await expect(boosterSaleHeroic.connect(mhtOwner).buy("0")).to.revertedWith(
        "BoosterSale: invalid amount"
      );
    });
  });
});

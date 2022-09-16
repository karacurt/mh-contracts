import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, BigNumber } from "ethers";
import { ethers } from "hardhat";

const toWei = ethers.utils.parseEther;

describe("BoosterSale2", function () {
  let deployer: SignerWithAddress;
  let boosterOwner: SignerWithAddress;
  let boosterOperations: SignerWithAddress;
  let buyer: SignerWithAddress; // whitelisted to buy both tokens
  let buyer2: SignerWithAddress; // whitelisted to buy legendary tokens, but not epic
  let buyer3: SignerWithAddress; // not whitelisted

  let busd: Contract;
  let boosterSale2: Contract;
  let bmhtl: Contract;
  let bmhte: Contract;

  const legendaryPrice: BigNumber = toWei("250");
  const epicPrice: BigNumber = toWei("75");

  before(async function () {
    [deployer, boosterOwner, boosterOperations, buyer, buyer2, buyer3] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const BUSD = await ethers.getContractFactory("MouseHauntToken");
    busd = await BUSD.deploy(buyer.address);
    await busd.deployed();

    const BMHTL = await ethers.getContractFactory("BMHTL");
    bmhtl = await BMHTL.deploy(boosterOwner.address);
    await bmhtl.deployed();

    const BMHTE = await ethers.getContractFactory("BMHTE");
    bmhte = await BMHTE.deploy(boosterOwner.address);
    await bmhte.deployed();

    const BoosterSale2 = await ethers.getContractFactory("BoosterSale2");

    boosterSale2 = await BoosterSale2.deploy(
      boosterOwner.address,
      busd.address,
      bmhtl.address,
      bmhte.address,
      legendaryPrice,
      epicPrice
    );
    await boosterSale2.deployed();
  });

  describe("Initial values", async function () {
    it("Should have owner different than deployer", async function () {
      const adminRole = await boosterSale2.DEFAULT_ADMIN_ROLE();
      expect(await boosterSale2.hasRole(adminRole, deployer.address)).to.equal(false);
      expect(await boosterSale2.hasRole(adminRole, boosterOwner.address)).to.equal(true);
    });

    it("Should have initial values correctly set", async function () {
      expect(await boosterSale2.boosterOwner()).to.equal(boosterOwner.address);
      expect(await boosterSale2.busd()).to.equal(busd.address);
      expect(await boosterSale2.legendaryBooster()).to.equal(bmhtl.address);
      expect(await boosterSale2.epicBooster()).to.equal(bmhte.address);
      expect(await boosterSale2.prices(bmhtl.address)).to.equal(legendaryPrice);
      expect(await boosterSale2.prices(bmhte.address)).to.equal(epicPrice);
    });

    it("Should be pausable", async function () {
      await boosterSale2.connect(boosterOwner).pause();

      await expect(boosterSale2.buy(bmhtl.address, 1)).to.be.revertedWith("Pausable: paused");

      await boosterSale2.connect(boosterOwner).unpause();

      await expect(boosterSale2.buy(bmhtl.address, 1)).to.not.be.revertedWith("Pausable: paused");
    });

    it("Should have roles", async function () {
      await boosterSale2
        .connect(boosterOwner)
        .grantRole(ethers.utils.id("OPERATOR_ROLE"), boosterOperations.address);

      await boosterSale2.connect(boosterOperations).pause();

      await expect(boosterSale2.buy(bmhtl.address, 1)).to.be.revertedWith("Pausable: paused");

      await boosterSale2.connect(boosterOwner).unpause();

      await expect(boosterSale2.buy(bmhtl.address, 1)).to.not.be.revertedWith("Pausable: paused");
    });
  });

  describe("Whitelist", async function () {
    it("should set the whitelist correctly", async function () {
      await boosterSale2
        .connect(boosterOwner)
        .setWhitelist([buyer.address, buyer2.address], [2, 3], [5, 0]);

      expect(await boosterSale2.whitelist(buyer.address, bmhtl.address)).to.equal(2);
      expect(await boosterSale2.whitelist(buyer.address, bmhte.address)).to.equal(5);

      expect(await boosterSale2.whitelist(buyer2.address, bmhtl.address)).to.equal(3);
      expect(await boosterSale2.whitelist(buyer2.address, bmhte.address)).to.equal(0);
    });

    it("should allow the owner to reset the whitelist", async function () {
      await boosterSale2
        .connect(boosterOwner)
        .setWhitelist([buyer.address, buyer2.address], [2, 3], [5, 0]);

      expect(await boosterSale2.whitelist(buyer.address, bmhtl.address)).to.equal(2);
      expect(await boosterSale2.whitelist(buyer.address, bmhte.address)).to.equal(5);

      expect(await boosterSale2.whitelist(buyer2.address, bmhtl.address)).to.equal(3);
      expect(await boosterSale2.whitelist(buyer2.address, bmhte.address)).to.equal(0);

      await boosterSale2
        .connect(boosterOwner)
        .setWhitelist([buyer.address, buyer2.address], [0, 10], [0, 10]);

      expect(await boosterSale2.whitelist(buyer.address, bmhtl.address)).to.equal(0);
      expect(await boosterSale2.whitelist(buyer.address, bmhte.address)).to.equal(0);

      expect(await boosterSale2.whitelist(buyer2.address, bmhtl.address)).to.equal(10);
      expect(await boosterSale2.whitelist(buyer2.address, bmhte.address)).to.equal(10);
    });
  });

  describe("Sale", async function () {
    beforeEach(async function () {
      const buyer1LegendaryAllowance = 2;
      const buyer1EpicAllowance = 5;
      const buyer2LegendaryAllowance = 3;
      const buyer2EpicAllowance = 0;

      // add users 1 and 2 to the whitelist:
      await boosterSale2
        .connect(boosterOwner)
        .setWhitelist(
          [buyer.address, buyer2.address],
          [buyer1LegendaryAllowance, buyer2LegendaryAllowance],
          [buyer1EpicAllowance, buyer2EpicAllowance]
        );

      // users 1 and 2 approve boosterSale2:
      const buyer1DesiredAllowance = legendaryPrice
        .mul(buyer1LegendaryAllowance)
        .add(epicPrice.mul(buyer1EpicAllowance));
      const buyer2DesiredAllowance = legendaryPrice
        .mul(buyer2LegendaryAllowance)
        .add(epicPrice.mul(buyer2EpicAllowance));
      await busd.connect(buyer).approve(boosterSale2.address, buyer1DesiredAllowance);
      await busd.connect(buyer2).approve(boosterSale2.address, buyer2DesiredAllowance);

      // BoosterOwner approve the max allowance
      await bmhtl
        .connect(boosterOwner)
        .approve(boosterSale2.address, await bmhtl.balanceOf(boosterOwner.address));

      await bmhte
        .connect(boosterOwner)
        .approve(boosterSale2.address, await bmhte.balanceOf(boosterOwner.address));
    });

    it("should allow a whitelisted user to buy tokens", async function () {
      // get balances before
      const legendaryBalanceBefore = await bmhtl.balanceOf(boosterOwner.address);
      const epicBalanceBefore = await bmhte.balanceOf(boosterOwner.address);

      // get whitelist allowance and buy as much Legendaries as I can
      const maxLegendaries = await boosterSale2.whitelist(buyer.address, bmhtl.address);
      await boosterSale2.connect(buyer).buy(bmhtl.address, toWei(maxLegendaries.toString()));

      // get whitelist allowance and buy as much Epics as I can
      const maxEpics = await boosterSale2.whitelist(buyer.address, bmhte.address);
      await boosterSale2.connect(buyer).buy(bmhte.address, toWei(maxEpics.toString()));

      // get balances after
      const legendaryBalanceAfter = await bmhtl.balanceOf(boosterOwner.address);
      const epicBalanceAfter = await bmhte.balanceOf(boosterOwner.address);

      // make sure tokens have been moved from the owner to the user
      expect(legendaryBalanceAfter.toString()).to.equal(
        legendaryBalanceBefore.sub(toWei(maxLegendaries.toString()))
      );
      expect(epicBalanceAfter.toString()).to.equal(
        epicBalanceBefore.sub(toWei(maxEpics.toString()))
      );

      // make sure the allowance has been consumed
      expect(await boosterSale2.whitelist(buyer.address, bmhtl.address)).to.equal(0);
      expect(await boosterSale2.whitelist(buyer.address, bmhte.address)).to.equal(0);
    });

    it("should allow a partially whitelisted user to buy only the tokens they are whitelisted for", async function () {
      // transfer some money to buyer2
      await busd.connect(buyer).transfer(buyer2.address, toWei("10000"));

      // get balances before
      const legendaryBalanceBefore = await bmhtl.balanceOf(boosterOwner.address);
      const epicBalanceBefore = await bmhte.balanceOf(boosterOwner.address);

      // get whitelist allowance and buy as much Legendaries as I can
      const maxLegendaries = await boosterSale2.whitelist(buyer2.address, bmhtl.address);
      await boosterSale2.connect(buyer2).buy(bmhtl.address, toWei(maxLegendaries.toString()));

      // try to buy Epics and fail because there is no whitelist allowance
      await expect(boosterSale2.connect(buyer2).buy(bmhte.address, toWei("1"))).to.be.revertedWith(
        "BoosterSale: above cap"
      );

      // get balances after
      const legendaryBalanceAfter = await bmhtl.balanceOf(boosterOwner.address);
      const epicBalanceAfter = await bmhte.balanceOf(boosterOwner.address);

      // make sure tokens have been moved from the owner to the user
      expect(legendaryBalanceAfter.toString()).to.equal(
        legendaryBalanceBefore.sub(toWei(maxLegendaries.toString()))
      );
      expect(epicBalanceAfter.toString()).to.equal(epicBalanceBefore);

      // make sure the whitelist allowance has been consumed
      expect(await boosterSale2.whitelist(buyer2.address, bmhtl.address)).to.equal(0);
      expect(await boosterSale2.whitelist(buyer2.address, bmhte.address)).to.equal(0);
    });

    it("should revert when a non-whitelisted user tries to buy tokens", async function () {
      // make sure the whitelist allowance is zero
      expect(await boosterSale2.whitelist(buyer3.address, bmhtl.address)).to.equal(0);
      expect(await boosterSale2.whitelist(buyer3.address, bmhte.address)).to.equal(0);

      // transfer some money to buyer3
      await busd.connect(buyer).transfer(buyer3.address, toWei("10000"));

      // get balances before
      const legendaryBalanceBefore = await bmhtl.balanceOf(boosterOwner.address);
      const epicBalanceBefore = await bmhte.balanceOf(boosterOwner.address);

      // try to buy Legendaries and fail because there is no whitelist allowance
      await expect(boosterSale2.connect(buyer3).buy(bmhtl.address, toWei("1"))).to.be.revertedWith(
        "BoosterSale: above cap"
      );

      // try to buy Epics and fail because there is no whitelist allowance
      await expect(boosterSale2.connect(buyer3).buy(bmhte.address, toWei("1"))).to.be.revertedWith(
        "BoosterSale: above cap"
      );

      // get balances after
      const legendaryBalanceAfter = await bmhtl.balanceOf(boosterOwner.address);
      const epicBalanceAfter = await bmhte.balanceOf(boosterOwner.address);

      // make sure tokens have been moved from the owner to the user
      expect(legendaryBalanceAfter.toString()).to.equal(legendaryBalanceBefore);
      expect(epicBalanceAfter.toString()).to.equal(epicBalanceBefore);

      // make sure the whitelist allowance has not changed
      expect(await boosterSale2.whitelist(buyer3.address, bmhtl.address)).to.equal(0);
      expect(await boosterSale2.whitelist(buyer3.address, bmhte.address)).to.equal(0);
    });
  });
});

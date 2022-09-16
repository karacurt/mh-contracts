import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, BigNumber } from "ethers";
import { ethers } from "hardhat";

const toWei = ethers.utils.parseEther;

describe("BoosterSale3", function () {
  let deployer: SignerWithAddress;
  let boosterOwner: SignerWithAddress;
  let boosterOperations: SignerWithAddress;
  let buyer: SignerWithAddress; // whitelisted to buy both tokens
  let buyer2: SignerWithAddress; // whitelisted to buy rare tokens, but not epic
  let buyer3: SignerWithAddress; // not whitelisted

  let busd: Contract;
  let boosterSale3: Contract;
  let bmhte: Contract;
  let bmhtr: Contract;

  // dummy values
  const epicPrice: BigNumber = toWei("75");
  const rarePrice: BigNumber = toWei("50");

  before(async function () {
    [deployer, boosterOwner, boosterOperations, buyer, buyer2, buyer3] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const BUSD = await ethers.getContractFactory("MouseHauntToken");
    busd = await BUSD.deploy(buyer.address);
    await busd.deployed();

    const BMHTE = await ethers.getContractFactory("BMHTE");
    bmhte = await BMHTE.deploy(boosterOwner.address);
    await bmhte.deployed();

    const BMHTR = await ethers.getContractFactory("BMHTR");
    bmhtr = await BMHTR.deploy(boosterOwner.address);
    await bmhtr.deployed();

    const BoosterSale3 = await ethers.getContractFactory("BoosterSale3");

    boosterSale3 = await BoosterSale3.deploy(
      boosterOwner.address,
      busd.address,
      bmhte.address,
      bmhtr.address,
      epicPrice,
      rarePrice
    );
    await boosterSale3.deployed();
  });

  describe("Initial values", async function () {
    it("Should have owner different than deployer", async function () {
      const adminRole = await boosterSale3.DEFAULT_ADMIN_ROLE();
      expect(await boosterSale3.hasRole(adminRole, deployer.address)).to.equal(false);
      expect(await boosterSale3.hasRole(adminRole, boosterOwner.address)).to.equal(true);
    });

    it("Should have initial values correctly set", async function () {
      expect(await boosterSale3.boosterOwner()).to.equal(boosterOwner.address);
      expect(await boosterSale3.busd()).to.equal(busd.address);
      expect(await boosterSale3.rareBooster()).to.equal(bmhtr.address);
      expect(await boosterSale3.epicBooster()).to.equal(bmhte.address);
      expect(await boosterSale3.prices(bmhtr.address)).to.equal(rarePrice);
      expect(await boosterSale3.prices(bmhte.address)).to.equal(epicPrice);
    });

    it("Should be pausable", async function () {
      await boosterSale3.connect(boosterOwner).pause();

      await expect(boosterSale3.buy(bmhtr.address, 1)).to.be.revertedWith("Pausable: paused");

      await boosterSale3.connect(boosterOwner).unpause();

      await expect(boosterSale3.buy(bmhtr.address, 1)).to.not.be.revertedWith("Pausable: paused");
    });

    it("Should have roles", async function () {
      await boosterSale3
        .connect(boosterOwner)
        .grantRole(ethers.utils.id("OPERATOR_ROLE"), boosterOperations.address);

      await boosterSale3.connect(boosterOperations).pause();

      await expect(boosterSale3.buy(bmhtr.address, 1)).to.be.revertedWith("Pausable: paused");

      await boosterSale3.connect(boosterOwner).unpause();

      await expect(boosterSale3.buy(bmhtr.address, 1)).to.not.be.revertedWith("Pausable: paused");
    });
  });

  describe("Whitelist", async function () {
    it("should set the whitelist correctly", async function () {
      await boosterSale3
        .connect(boosterOwner)
        .setWhitelist([buyer.address, buyer2.address], [2, 3], [5, 0]);

      expect(await boosterSale3.whitelist(buyer.address, bmhte.address)).to.equal(2);
      expect(await boosterSale3.whitelist(buyer.address, bmhtr.address)).to.equal(5);

      expect(await boosterSale3.whitelist(buyer2.address, bmhte.address)).to.equal(3);
      expect(await boosterSale3.whitelist(buyer2.address, bmhtr.address)).to.equal(0);
    });

    it("should allow the owner to reset the whitelist", async function () {
      await boosterSale3
        .connect(boosterOwner)
        .setWhitelist([buyer.address, buyer2.address], [2, 3], [5, 0]);

      expect(await boosterSale3.whitelist(buyer.address, bmhte.address)).to.equal(2);
      expect(await boosterSale3.whitelist(buyer.address, bmhtr.address)).to.equal(5);

      expect(await boosterSale3.whitelist(buyer2.address, bmhte.address)).to.equal(3);
      expect(await boosterSale3.whitelist(buyer2.address, bmhtr.address)).to.equal(0);

      await boosterSale3
        .connect(boosterOwner)
        .setWhitelist([buyer.address, buyer2.address], [0, 10], [0, 10]);

      expect(await boosterSale3.whitelist(buyer.address, bmhte.address)).to.equal(0);
      expect(await boosterSale3.whitelist(buyer.address, bmhtr.address)).to.equal(0);

      expect(await boosterSale3.whitelist(buyer2.address, bmhte.address)).to.equal(10);
      expect(await boosterSale3.whitelist(buyer2.address, bmhtr.address)).to.equal(10);
    });
  });

  describe("Sale", async function () {
    beforeEach(async function () {
      const buyer1EpicAllowance = 5;
      const buyer1RareAllowance = 2;
      const buyer2EpicAllowance = 0;
      const buyer2RareAllowance = 3;

      // add users 1 and 2 to the whitelist:
      await boosterSale3
        .connect(boosterOwner)
        .setWhitelist(
          [buyer.address, buyer2.address],
          [buyer1EpicAllowance, buyer2EpicAllowance],
          [buyer1RareAllowance, buyer2RareAllowance]
        );

      // users 1 and 2 approve boosterSale3:
      const buyer1DesiredAllowance = rarePrice
        .mul(buyer1RareAllowance)
        .add(epicPrice.mul(buyer1EpicAllowance));
      const buyer2DesiredAllowance = rarePrice
        .mul(buyer2RareAllowance)
        .add(epicPrice.mul(buyer2EpicAllowance));
      await busd.connect(buyer).approve(boosterSale3.address, buyer1DesiredAllowance);
      await busd.connect(buyer2).approve(boosterSale3.address, buyer2DesiredAllowance);

      // BoosterOwner approve the max allowance
      await bmhtr
        .connect(boosterOwner)
        .approve(boosterSale3.address, await bmhtr.balanceOf(boosterOwner.address));

      await bmhte
        .connect(boosterOwner)
        .approve(boosterSale3.address, await bmhte.balanceOf(boosterOwner.address));
    });

    it("should allow a whitelisted user to buy tokens", async function () {
      // get balances before
      const rareBalanceBefore = await bmhtr.balanceOf(boosterOwner.address);
      const epicBalanceBefore = await bmhte.balanceOf(boosterOwner.address);

      // get whitelist allowance and buy as much Rares as I can
      const maxRares = await boosterSale3.whitelist(buyer.address, bmhtr.address);
      await boosterSale3.connect(buyer).buy(bmhtr.address, maxRares.toString());

      // get whitelist allowance and buy as much Epics as I can
      const maxEpics = await boosterSale3.whitelist(buyer.address, bmhte.address);
      await boosterSale3.connect(buyer).buy(bmhte.address, maxEpics.toString());

      // get balances after
      const rareBalanceAfter = await bmhtr.balanceOf(boosterOwner.address);
      const epicBalanceAfter = await bmhte.balanceOf(boosterOwner.address);

      // make sure tokens have been moved from the owner to the user
      expect(rareBalanceAfter.toString()).to.equal(rareBalanceBefore.sub(maxRares.toString()));
      expect(epicBalanceAfter.toString()).to.equal(
        epicBalanceBefore.sub(toWei(maxEpics.toString()))
      );

      // make sure the allowance has been consumed
      expect(await boosterSale3.whitelist(buyer.address, bmhtr.address)).to.equal(0);
      expect(await boosterSale3.whitelist(buyer.address, bmhte.address)).to.equal(0);
    });

    it("should allow a partially whitelisted user to buy only the tokens they are whitelisted for", async function () {
      // transfer some money to buyer2
      await busd.connect(buyer).transfer(buyer2.address, toWei("10000"));

      // get balances before
      const rareBalanceBefore = await bmhtr.balanceOf(boosterOwner.address);
      const epicBalanceBefore = await bmhte.balanceOf(boosterOwner.address);

      // get whitelist allowance and buy as much Rares as I can
      const maxRares = await boosterSale3.whitelist(buyer2.address, bmhtr.address);
      await boosterSale3.connect(buyer2).buy(bmhtr.address, maxRares.toString());

      // try to buy Epics and fail because there is no whitelist allowance
      await expect(boosterSale3.connect(buyer2).buy(bmhte.address, "1")).to.be.revertedWith(
        "BoosterSale: above cap"
      );

      // get balances after
      const rareBalanceAfter = await bmhtr.balanceOf(boosterOwner.address);
      const epicBalanceAfter = await bmhte.balanceOf(boosterOwner.address);

      // make sure tokens have been moved from the owner to the user
      expect(rareBalanceAfter.toString()).to.equal(rareBalanceBefore.sub(maxRares.toString()));
      expect(epicBalanceAfter.toString()).to.equal(epicBalanceBefore);

      // make sure the whitelist allowance has been consumed
      expect(await boosterSale3.whitelist(buyer2.address, bmhtr.address)).to.equal(0);
      expect(await boosterSale3.whitelist(buyer2.address, bmhte.address)).to.equal(0);
    });

    it("should revert when a non-whitelisted user tries to buy tokens", async function () {
      // make sure the whitelist allowance is zero
      expect(await boosterSale3.whitelist(buyer3.address, bmhtr.address)).to.equal(0);
      expect(await boosterSale3.whitelist(buyer3.address, bmhte.address)).to.equal(0);

      // transfer some money to buyer3
      await busd.connect(buyer).transfer(buyer3.address, toWei("10000"));

      // get balances before
      const rareBalanceBefore = await bmhtr.balanceOf(boosterOwner.address);
      const epicBalanceBefore = await bmhte.balanceOf(boosterOwner.address);

      // try to buy Rares and fail because there is no whitelist allowance
      await expect(boosterSale3.connect(buyer3).buy(bmhtr.address, "1")).to.be.revertedWith(
        "BoosterSale: above cap"
      );

      // try to buy Epics and fail because there is no whitelist allowance
      await expect(boosterSale3.connect(buyer3).buy(bmhte.address, "1")).to.be.revertedWith(
        "BoosterSale: above cap"
      );

      // get balances after
      const rareBalanceAfter = await bmhtr.balanceOf(boosterOwner.address);
      const epicBalanceAfter = await bmhte.balanceOf(boosterOwner.address);

      // make sure tokens have been moved from the owner to the user
      expect(rareBalanceAfter.toString()).to.equal(rareBalanceBefore);
      expect(epicBalanceAfter.toString()).to.equal(epicBalanceBefore);

      // make sure the whitelist allowance has not changed
      expect(await boosterSale3.whitelist(buyer3.address, bmhtr.address)).to.equal(0);
      expect(await boosterSale3.whitelist(buyer3.address, bmhte.address)).to.equal(0);
    });

    it("should not allow buying 0 boosters", async function () {
      await expect(boosterSale3.connect(buyer).buy(bmhtr.address, "0")).to.revertedWith(
        "BoosterSale: invalid amount"
      );
    });

    it("should not allow buying an invalid booster", async function () {
      await expect(boosterSale3.connect(buyer).buy(buyer.address, "0")).to.revertedWith(
        "BoosterSale: invalid amount"
      );
    });
  });
});

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract, BigNumber } from "ethers";
import { ethers } from "hardhat";

const toWei = ethers.utils.parseEther;

describe("BoosterSaleGenesis", function () {
  let deployer: SignerWithAddress;
  let boosterOwner: SignerWithAddress;
  let boosterOperations: SignerWithAddress;
  let mhtOwner: SignerWithAddress;
  let buyer2: SignerWithAddress;
  let buyer3: SignerWithAddress; // not whitelisted

  let mht: Contract;
  let boosterSaleGenesis: Contract;
  let bmhtg: Contract;

  // dummy values
  const genesisPrice: BigNumber = toWei("30");
  const buyer1Amount = "1";
  const buyer2Amount = "2";
  const maxAmount = "2";

  before(async function () {
    [deployer, boosterOwner, boosterOperations, mhtOwner, buyer2, buyer3] =
      await ethers.getSigners();
  });

  beforeEach(async function () {
    const MHT = await ethers.getContractFactory("MouseHauntToken");
    mht = await MHT.deploy(mhtOwner.address);
    await mht.deployed();

    const BMHTG = await ethers.getContractFactory("BMHTG");
    bmhtg = await BMHTG.deploy(boosterOwner.address);
    await bmhtg.deployed();

    const BoosterSaleGenesis = await ethers.getContractFactory("BoosterSaleGenesis");

    boosterSaleGenesis = await BoosterSaleGenesis.deploy(
      boosterOwner.address,
      mht.address,
      bmhtg.address,
      genesisPrice
    );
    await boosterSaleGenesis.deployed();
  });

  describe("Initial values", async function () {
    it("Should have owner different than deployer", async function () {
      const adminRole = await boosterSaleGenesis.DEFAULT_ADMIN_ROLE();
      expect(await boosterSaleGenesis.hasRole(adminRole, deployer.address)).to.equal(false);
      expect(
        await boosterSaleGenesis.hasRole(ethers.utils.id("OPERATOR_ROLE"), deployer.address)
      ).to.equal(true);
      expect(await boosterSaleGenesis.hasRole(adminRole, boosterOwner.address)).to.equal(true);
    });

    it("Should have initial values correctly set", async function () {
      expect(await boosterSaleGenesis.boosterOwner()).to.equal(boosterOwner.address);
      expect(await boosterSaleGenesis.mht()).to.equal(mht.address);
      expect(await boosterSaleGenesis.genesisBooster()).to.equal(bmhtg.address);
      expect(await boosterSaleGenesis.price()).to.equal(genesisPrice);
    });

    it("Should be pausable", async function () {
      await boosterSaleGenesis.connect(boosterOwner).pause();

      await expect(boosterSaleGenesis.buy(1)).to.be.revertedWith("Pausable: paused");

      await boosterSaleGenesis.connect(boosterOwner).unpause();

      await expect(boosterSaleGenesis.buy(1)).to.not.be.revertedWith("Pausable: paused");
    });

    it("Should have roles", async function () {
      await boosterSaleGenesis
        .connect(boosterOwner)
        .grantRole(ethers.utils.id("OPERATOR_ROLE"), boosterOperations.address);

      await boosterSaleGenesis.connect(boosterOperations).pause();

      await expect(boosterSaleGenesis.buy(1)).to.be.revertedWith("Pausable: paused");

      await boosterSaleGenesis.connect(boosterOwner).unpause();

      await expect(boosterSaleGenesis.buy(1)).to.not.be.revertedWith("Pausable: paused");
    });
  });

  describe("Whitelist", async function () {
    it("should set the whitelist correctly", async function () {
      await boosterSaleGenesis
        .connect(boosterOwner)
        .setWhitelist([mhtOwner.address, buyer2.address], maxAmount);

      expect(await boosterSaleGenesis.whitelist(mhtOwner.address)).to.equal(maxAmount);
      expect(await boosterSaleGenesis.whitelist(buyer2.address)).to.equal(maxAmount);
      expect(await boosterSaleGenesis.whitelist(buyer3.address)).to.equal(0);
    });
  });

  describe("Sale", async function () {
    beforeEach(async function () {
      // add users 1 and 2 to the whitelist:
      await boosterSaleGenesis
        .connect(boosterOwner)
        .setWhitelist([mhtOwner.address, buyer2.address], maxAmount);

      // users 1 and 2 approve boosterSaleGenesis:
      const buyer1DesiredAllowance = genesisPrice.mul(buyer1Amount);
      const buyer2DesiredAllowance = genesisPrice.mul(buyer2Amount);
      await mht.connect(mhtOwner).approve(boosterSaleGenesis.address, buyer1DesiredAllowance);
      await mht.connect(buyer2).approve(boosterSaleGenesis.address, buyer2DesiredAllowance);

      // BoosterOwner approve the max allowance
      await bmhtg
        .connect(boosterOwner)
        .approve(boosterSaleGenesis.address, Number(buyer1Amount) + Number(buyer2Amount));
    });

    it("should allow a whitelisted user to buy tokens", async function () {
      // get balances before
      const genesisBalanceBefore = await bmhtg.balanceOf(boosterOwner.address);

      await boosterSaleGenesis.connect(mhtOwner).buy("1");

      await mht.connect(mhtOwner).transfer(buyer2.address, genesisPrice.mul(buyer2Amount));
      await boosterSaleGenesis.connect(buyer2).buy(buyer2Amount);

      // get balances after
      const genesisBalanceAfter = await bmhtg.balanceOf(boosterOwner.address);

      // make sure tokens have been moved from the owner to the user
      expect(genesisBalanceAfter.toString()).to.equal(
        genesisBalanceBefore.sub(Number(buyer1Amount) + Number(buyer2Amount))
      );

      // make sure the allowance has been consumed
      expect(await boosterSaleGenesis.whitelist(mhtOwner.address)).to.equal(1);
      expect(await boosterSaleGenesis.whitelist(buyer2.address)).to.equal(0);
    });

    it("should allow a partially whitelisted user to buy only the tokens they are whitelisted for", async function () {
      // transfer some money to buyer2
      await mht.connect(mhtOwner).transfer(buyer2.address, genesisPrice.mul(buyer2Amount));
      await mht.connect(mhtOwner).transfer(buyer3.address, genesisPrice);

      // get balances before
      const genesisBalanceBefore = await bmhtg.balanceOf(boosterOwner.address);

      await mht.connect(buyer2).approve(boosterSaleGenesis.address, genesisPrice.mul(buyer2Amount));
      await boosterSaleGenesis.connect(buyer2).buy(buyer2Amount);

      await expect(boosterSaleGenesis.connect(buyer3).buy("1")).to.be.revertedWith(
        "BoosterSale: above cap"
      );

      // get balances after
      const genesisBalanceAfter = await bmhtg.balanceOf(boosterOwner.address);

      // make sure tokens have been moved from the owner to the user
      expect(genesisBalanceAfter.toString()).to.equal(genesisBalanceBefore.sub(buyer2Amount));
      // make sure the whitelist allowance has been consumed
      expect(await boosterSaleGenesis.whitelist(buyer2.address)).to.equal(0);
    });

    it("should revert when a non-whitelisted user tries to buy tokens", async function () {
      // make sure the whitelist allowance is zero
      expect(await boosterSaleGenesis.whitelist(buyer3.address)).to.equal(0);

      // transfer some money to buyer3
      await mht.connect(mhtOwner).transfer(buyer3.address, toWei("10000"));

      // get balances before
      const genesisBalanceBefore = await bmhtg.balanceOf(boosterOwner.address);

      await expect(boosterSaleGenesis.connect(buyer3).buy("1")).to.be.revertedWith(
        "BoosterSale: above cap"
      );

      // get balances after
      const genesisBalanceAfter = await bmhtg.balanceOf(boosterOwner.address);

      // make sure tokens have been moved from the owner to the user
      expect(genesisBalanceAfter.toString()).to.equal(genesisBalanceBefore);

      // make sure the whitelist allowance has not changed
      expect(await boosterSaleGenesis.whitelist(buyer3.address)).to.equal(0);
    });

    it("should not allow buying 0 boosters", async function () {
      await expect(boosterSaleGenesis.connect(mhtOwner).buy("0")).to.revertedWith(
        "BoosterSale: invalid amount"
      );
    });
  });
});

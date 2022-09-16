import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, BigNumber, ContractFactory } from "ethers";
import { getAllowedPeriodsToStash, getRanges, getTiers } from "./fixture/MouseHauntStashingFixture";
import { getFeesForTiers } from "./fixture/SwapFixture";

const zeroAddress = ethers.constants.AddressZero;
const toWei = ethers.utils.parseEther;

describe("Swap", async function () {
  let owner: SignerWithAddress;
  let trader: SignerWithAddress;
  let friend: SignerWithAddress;
  let operator: SignerWithAddress;
  let intruder: SignerWithAddress;
  let treasury: SignerWithAddress;
  /* eslint-disable no-unused-vars */
  let deployer: SignerWithAddress;
  /* eslint-disable no-unused-vars */

  let Swap: ContractFactory;
  let MHT: ContractFactory;
  let MouseHero: ContractFactory;
  let Stasher: ContractFactory;

  let swap: Contract;
  let mht: Contract;
  let nft: Contract;
  let stasher: Contract;

  let traderAssetId: BigNumber;
  let friendAssetId: BigNumber;

  const burnFeePercentageInWei = toWei("10");

  const initialBalance = toWei("10000");

  async function mintNFT(address: string) {
    const transaction = await nft
      .connect(owner)
      .mintSpecialMouseHero(address, "Special Mouse Hero");
    const tx = await transaction.wait();

    const event = tx.events![0];
    const value = event.args![2];
    return value.toNumber();
  }
  /* eslint-disable no-unused-vars */
  before(async function () {
    [deployer, owner, operator, trader, friend, intruder, treasury] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // CONTRACT FACTORIES

    MHT = await ethers.getContractFactory("MouseHauntToken");
    mht = await MHT.deploy(owner.address);
    await mht.deployed();

    MouseHero = await ethers.getContractFactory("MouseHero");
    nft = await MouseHero.connect(owner).deploy(
      "MouseHero",
      "MHN",
      "https://nft.mousehaunt.com/hero/"
    );
    await nft.deployed();

    Stasher = await ethers.getContractFactory("MouseHauntStashing");
    stasher = await upgrades.deployProxy(Stasher, [operator.address, mht.address]);
    await stasher.deployed();
    const allowedPeriodsToStash = getAllowedPeriodsToStash();
    await stasher.connect(operator).setPeriods(allowedPeriodsToStash);

    const ranges = getRanges();
    await stasher.connect(operator).setRanges(ranges);

    const tiers = getTiers();
    await stasher.connect(operator).setTiers(tiers);

    Swap = await ethers.getContractFactory("Swap");
    swap = await upgrades.deployProxy(Swap, [
      operator.address,
      treasury.address,
      mht.address,
      nft.address,
      burnFeePercentageInWei,
      stasher.address,
    ]);
    await swap.deployed();

    const fees = getFeesForTiers();
    await swap.connect(operator).setFeePerTier(fees);

    friendAssetId = await mintNFT(friend.address);
    traderAssetId = await mintNFT(trader.address);

    await mht.connect(owner).transfer(trader.address, initialBalance);
    await mht.connect(owner).transfer(friend.address, initialBalance);

    await nft.connect(friend).approve(swap.address, friendAssetId);
    await nft.connect(trader).approve(swap.address, traderAssetId);

    await mht.connect(friend).approve(swap.address, initialBalance);
    await mht.connect(trader).approve(swap.address, initialBalance);
  });
  describe("Iniatialize SwapNFT", function () {
    it("Should revert when trustedToken is invalid", async function () {
      await expect(
        upgrades.deployProxy(Swap, [
          owner.address,
          treasury.address,
          mht.address,
          zeroAddress,
          burnFeePercentageInWei,
          stasher.address,
        ])
      ).to.be.revertedWith("INV_TRUSTED_TOKEN");
    });
    it("Should revert when owner is invalid", async function () {
      await expect(
        upgrades.deployProxy(Swap, [
          zeroAddress,
          treasury.address,
          mht.address,
          nft.address,
          burnFeePercentageInWei,
          stasher.address,
        ])
      ).to.be.revertedWith("INV_OWNER");
    });
    it("Should revert when treasury is invalid", async function () {
      await expect(
        upgrades.deployProxy(Swap, [
          owner.address,
          zeroAddress,
          mht.address,
          nft.address,
          burnFeePercentageInWei,
          stasher.address,
        ])
      ).to.be.revertedWith("INV_TREASURY");
    });
    it("Should revert when acceptedToken is invalid", async function () {
      await expect(
        upgrades.deployProxy(Swap, [
          owner.address,
          treasury.address,
          zeroAddress,
          nft.address,
          burnFeePercentageInWei,
          stasher.address,
        ])
      ).to.be.revertedWith("INV_ACCEPTED_TOKEN");
    });
  });
  describe("Create Trade Offer Flow", function () {
    it("Create a trade Offer", async function () {
      await expect(
        swap.connect(trader).createTradeOffer(traderAssetId, friendAssetId, friend.address)
      )
        .to.emit(swap, "TradeOfferCreated")
        .withArgs(1, friendAssetId, traderAssetId, trader.address, friend.address);
    });
  });
  describe("Trade Offer Actions", function () {
    let offerId = 1;
    beforeEach(async function () {
      await swap.connect(trader).createTradeOffer(traderAssetId, friendAssetId, friend.address);
    });

    it("Should NOT execute a Trade Offer by the trader", async function () {
      expect(await nft.ownerOf(traderAssetId)).to.be.equal(trader.address);
      expect(await nft.ownerOf(friendAssetId)).to.be.equal(friend.address);

      await expect(swap.connect(trader).executeTradeOffer(offerId)).to.revertedWith(
        "ACCESS_DENIED"
      );
    });
    it("Should execute a Trade Offer by the friend", async function () {
      expect(await nft.ownerOf(traderAssetId)).to.be.equal(trader.address);
      expect(await nft.ownerOf(friendAssetId)).to.be.equal(friend.address);

      await expect(swap.connect(friend).executeTradeOffer(offerId))
        .to.emit(swap, "TradeOfferExecuted")
        .withArgs(offerId, friendAssetId, traderAssetId, trader.address, friend.address);

      expect(await nft.ownerOf(traderAssetId)).to.be.equal(friend.address);
      expect(await nft.ownerOf(friendAssetId)).to.be.equal(trader.address);
    });
    it("Should not execute a Trade Offer when a intruder tries it", async function () {
      await expect(swap.connect(intruder).executeTradeOffer(offerId)).to.be.revertedWith(
        "ACCESS_DENIED"
      );
    });
    it("Should cancel a Trade Offer by the trader", async function () {
      await expect(swap.connect(trader).cancelTradeOffer(offerId))
        .to.emit(swap, "TradeOfferCancelled")
        .withArgs(offerId, friendAssetId, traderAssetId, trader.address, friend.address);
    });
    it("Should cancel a Trade Offer by the friend", async function () {
      await expect(swap.connect(friend).cancelTradeOffer(offerId))
        .to.emit(swap, "TradeOfferCancelled")
        .withArgs(offerId, friendAssetId, traderAssetId, trader.address, friend.address);
    });
    it("Should not be cancel a Trade Offer by a intruder", async function () {
      await expect(swap.connect(intruder).cancelTradeOffer(offerId)).to.be.revertedWith(
        "ACCESS_DENIED"
      );
    });
    it("Should burn fee when friend executes a Trade Offer", async function () {
      await expect(swap.connect(friend).executeTradeOffer(offerId)).to.emit(swap, "FeeBurned");
    });
  });
  describe("Setters", function () {
    it("Should set a new burnFeePercentage", async function () {
      const newBurnFeeInWei = toWei("30");
      await swap.connect(operator).setBurnFeePercentage(newBurnFeeInWei);
      expect(await swap.burnFeePercentage()).to.be.equal(newBurnFeeInWei);
    });
    it("Should NOT set a new burnFeePercentage by a intruder", async function () {
      const newBurnFeeInWei = toWei("99");
      await expect(swap.connect(intruder).setBurnFeePercentage(newBurnFeeInWei)).to.be.reverted;
    });
    it("Should NOT set a new burnFeePercentage greater than 100", async function () {
      const newBurnFeeInWei = toWei("101");
      await expect(swap.connect(operator).setBurnFeePercentage(newBurnFeeInWei)).to.be.reverted;
    });
    it("Should set a new paymentToken", async function () {
      const newPaymentToken = await MHT.deploy(operator.address);
      await newPaymentToken.deployed();
      await swap.connect(operator).setPaymentToken(newPaymentToken.address);
      expect(await swap.paymentToken()).to.be.equal(newPaymentToken.address);
    });
    it("Should set a new trustedToken", async function () {
      const newTrustedToken = await MouseHero.connect(operator).deploy(
        "MouseHero",
        "MHN",
        "https://nft.mousehaunt.com/hero/"
      );
      await newTrustedToken.deployed();

      await swap.connect(operator).setTrustedToken(newTrustedToken.address);
      expect(await swap.trustedToken()).to.be.equal(newTrustedToken.address);
    });
  });
});

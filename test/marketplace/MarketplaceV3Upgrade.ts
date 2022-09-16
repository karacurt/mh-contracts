import { expect } from "chai";
import { ethers, upgrades, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";

const toWei = ethers.utils.parseEther;

describe("Marketplace V3 Upgrade", async function () {
  let owner: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;
  let player3: SignerWithAddress;

  let Marketplace: ContractFactory;
  let BMHTH: ContractFactory;
  let MHT: ContractFactory;
  let MouseHero: ContractFactory;

  let marketplace: Contract;
  let bmhth: Contract;
  let mht: Contract;
  let nft: Contract;

  const publicationFeeInWei = toWei("10");
  const ownerCutPerMillion = 10000;
  const amountOfAssets = 10;
  const startingMHT = toWei("100");
  const usualItemPrice = toWei("2");

  const longGracePeriod = 100;

  enum AssetType {
    NIL,
    ERC20,
    ERC721,
  }
  interface Order {
    orderId: Number;
    buyer: string;
    seller: string;
    assetId: Number;
    price: Number;
    amount: Number;
    assetType: AssetType;
    tokenAddress: string;
    blockNumber: Number;
  }

  let orders: Order[] = [];

  before(async function () {
    [owner, player1, player2, player3] = await ethers.getSigners();
  });

  beforeEach(async function () {
    MouseHero = await ethers.getContractFactory("MouseHero");
    nft = await MouseHero.connect(owner).deploy(
      "MouseHero",
      "MHH",
      "https://nft.mousehaunt.com/hero/"
    );
    await nft.deployed();

    BMHTH = await ethers.getContractFactory("BMHTH");
    bmhth = await BMHTH.deploy(owner.address, nft.address);
    await bmhth.deployed();

    MHT = await ethers.getContractFactory("MouseHauntToken");
    mht = await MHT.deploy(owner.address);
    await mht.deployed();

    Marketplace = await ethers.getContractFactory("MarketplaceV3Auction");
    marketplace = await upgrades.deployProxy(Marketplace, [
      mht.address,
      ownerCutPerMillion,
      publicationFeeInWei,
      owner.address,
      mht.address,
      nft.address,
      publicationFeeInWei,
      owner.address,
    ]);
    await marketplace.deployed();

    const MouseHauntTokens = [
      { addr: nft.address, assetType: AssetType.ERC721 },
      { addr: bmhth.address, assetType: AssetType.ERC20 },
    ];
    await marketplace.connect(owner).setNFTs(MouseHauntTokens);

    // Send assets to players:
    await bmhth.connect(owner).transfer(player1.address, amountOfAssets);
    await bmhth.connect(owner).transfer(player2.address, amountOfAssets);
    await mht.connect(owner).transfer(player1.address, startingMHT);
    await mht.connect(owner).transfer(player2.address, startingMHT);
    await mht.connect(owner).transfer(player3.address, startingMHT);

    // Players approve spending:
    await bmhth.connect(player1).approve(marketplace.address, amountOfAssets);
    await bmhth.connect(player2).approve(marketplace.address, amountOfAssets);
    await mht.connect(player1).approve(marketplace.address, startingMHT);
    await mht.connect(player2).approve(marketplace.address, startingMHT);
    await mht.connect(player3).approve(marketplace.address, startingMHT);
  });

  it("Should upgrade successfully", async () => {
    const upgradedFactory = await ethers.getContractFactory("MarketplaceV3AntiMEV");
    await upgrades.upgradeProxy(marketplace.address, upgradedFactory);
  });

  it("Should allow us to set a grace period", async () => {
    const upgradedFactory = await ethers.getContractFactory("MarketplaceV3AntiMEV");
    const upgraded = await upgrades.upgradeProxy(marketplace.address, upgradedFactory);

    await upgraded.setGracePeriod(10);
  });

  describe("After Upgrade", async () => {
    const tokenID = 0;

    beforeEach(async () => {
      // create two V3 orders
      const baseTx1 = await marketplace
        .connect(player1)
        .createOrder(bmhth.address, tokenID, 1, usualItemPrice);
      baseTx1.wait();

      const baseTx2 = await marketplace
        .connect(player1)
        .createOrder(bmhth.address, tokenID, 1, usualItemPrice);
      baseTx2.wait();

      // Upgrade to V3AM
      const upgradedFactory = await ethers.getContractFactory("MarketplaceV3AntiMEV");
      marketplace = await upgrades.upgradeProxy(marketplace.address, upgradedFactory);
    });

    it("Allows users to buy V3 orders", async () => {
      const tx = await marketplace.connect(player2).executeOrder(1);
      tx.wait();
    });

    it("Allows users to create V3AM orders", async () => {
      const baseTx1 = await marketplace
        .connect(player1)
        .createOrder(bmhth.address, tokenID, 1, usualItemPrice);
      baseTx1.wait();
    });

    it("Allows users to buy both V3 and V3AM orders that don't have a grace period set", async () => {
      const amOrder1 = await marketplace
        .connect(player1)
        .createOrder(bmhth.address, tokenID, 1, usualItemPrice);
      amOrder1.wait();

      const buyTx1 = await marketplace.connect(player2).executeOrder(2);
      buyTx1.wait();

      const buyTx2 = await marketplace.connect(player2).executeOrder(3);
      buyTx2.wait();
    });

    it("Creates V3AM orders with the grace period set", async () => {
      const gracePeriodSetupTx = await marketplace.connect(owner).setGracePeriod(longGracePeriod);
      gracePeriodSetupTx.wait();

      // Create a V3AM order
      const amOrder1 = await marketplace
        .connect(player1)
        .createOrder(bmhth.address, tokenID, 1, usualItemPrice);
      amOrder1.wait();

      const gracePeriod = await marketplace.orderIdToAllowedBlock(3);
      expect(gracePeriod).to.equals(amOrder1.blockNumber + longGracePeriod);
    });

    it("Forbids users from buying V3AM orders that have a grace period set", async () => {
      const gracePeriodSetupTx = await marketplace.connect(owner).setGracePeriod(longGracePeriod);
      gracePeriodSetupTx.wait();

      // User should be able to buy a V3 order
      const buyTx1 = await marketplace.connect(player2).executeOrder(2);
      buyTx1.wait();

      // Create a V3AM order
      const amOrder1 = await marketplace
        .connect(player1)
        .createOrder(bmhth.address, tokenID, 1, usualItemPrice);
      amOrder1.wait();

      // Must fail to buy the V3AM order now
      await expect(marketplace.connect(player2).executeOrder(3)).to.be.revertedWith(
        "Transaction failed, please try again"
      );
    });

    it("Allows users to buy V3AM orders that have a grace period completed", async () => {
      const gracePeriodSetupTx = await marketplace.connect(owner).setGracePeriod(longGracePeriod);
      gracePeriodSetupTx.wait();

      // User should be able to buy a V3 order
      const buyTx1 = await marketplace.connect(player2).executeOrder(2);
      buyTx1.wait();

      // Create a V3AM order
      const amOrder1 = await marketplace
        .connect(player1)
        .createOrder(bmhth.address, tokenID, 1, usualItemPrice);
      amOrder1.wait();

      // We move 101 blocks to the future
      await network.provider.send("hardhat_mine", ["0x65"]);

      // Must NOT fail to buy the V3AM order now
      await marketplace.connect(player2).executeOrder(3);
    });

    describe("Private Orders", async () => {
      beforeEach(async () => {
        const gracePeriodSetupTx = await marketplace.connect(owner).setGracePeriod(longGracePeriod);
        gracePeriodSetupTx.wait();
      });

      it("Allows users to create private V3AM orders", async () => {
        // Create private V3AM orders
        const privateAmOrder1 = await marketplace
          .connect(player1)
          .createPrivateOrder(bmhth.address, tokenID, 1, usualItemPrice, player2.address);
        privateAmOrder1.wait();

        const privateAmOrder2 = await marketplace
          .connect(player1)
          .createPrivateOrder(bmhth.address, tokenID, 1, usualItemPrice, player2.address);
        privateAmOrder2.wait();

        const privateForOrder1 = await marketplace.orderIdToPrivateFor(3);
        const privateForOrder2 = await marketplace.orderIdToPrivateFor(4);

        expect(privateForOrder1).to.equals(player2.address);
        expect(privateForOrder2).to.equals(player2.address);
      });

      it("Allows the correct users to buy private V3AM orders", async () => {
        // Create private V3AM orders
        const privateAmOrder1 = await marketplace
          .connect(player1)
          .createPrivateOrder(bmhth.address, tokenID, 1, usualItemPrice, player2.address);
        privateAmOrder1.wait();

        const privateAmOrder2 = await marketplace
          .connect(player1)
          .createPrivateOrder(bmhth.address, tokenID, 1, usualItemPrice, player2.address);
        privateAmOrder2.wait();

        // We move 101 blocks to the future
        await network.provider.send("hardhat_mine", ["0x65"]);

        // Must NOT fail to buy private V3AM orders with the correct buyer
        await marketplace.connect(player2).executeOrder(3);
        await marketplace.connect(player2).executeOrder(4);
      });

      it("Forbids the wrong users to buy private V3AM orders", async () => {
        // Create private V3AM orders
        const privateAmOrder1 = await marketplace
          .connect(player1)
          .createPrivateOrder(bmhth.address, tokenID, 1, usualItemPrice, player2.address);
        privateAmOrder1.wait();

        const privateAmOrder2 = await marketplace
          .connect(player1)
          .createPrivateOrder(bmhth.address, tokenID, 1, usualItemPrice, player2.address);
        privateAmOrder2.wait();

        // We move 101 blocks to the future
        await network.provider.send("hardhat_mine", ["0x65"]);

        // Must fail to buy private V3AM orders with the wrong buyer
        await expect(marketplace.connect(player3).executeOrder(3)).to.be.revertedWith(
          "This order is private"
        );
        await expect(marketplace.connect(player3).executeOrder(3)).to.be.revertedWith(
          "This order is private"
        );
      });
    });
  });
});

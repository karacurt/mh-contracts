import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, BigNumber, ContractFactory } from "ethers";

const zeroAddress = ethers.constants.AddressZero;
const toWei = ethers.utils.parseEther;
describe("Marketplace", async function () {
  let nftOwner: SignerWithAddress;
  let owner: SignerWithAddress;
  let notOwner: SignerWithAddress;
  let buyer: SignerWithAddress;
  let seller: SignerWithAddress;
  /* eslint-disable no-unused-vars */
  let deployer: SignerWithAddress;
  /* eslint-disable no-unused-vars */

  let Marketplace: ContractFactory;
  let BMHTL: ContractFactory;
  let BMHTE: ContractFactory;
  let BMHTG: ContractFactory;
  let MHT: ContractFactory;
  let MouseHero: ContractFactory;

  let marketplace: Contract;
  let bmhtl: Contract;
  let bmhte: Contract;
  let bmhtg: Contract;
  let mht: Contract;
  let nft: Contract;

  let assetId: BigNumber;

  const itemPrice = toWei("200");
  const amount = 1;
  const amountE18 = "1000000000000000000";
  const publicationFeeInWei = toWei("10");
  const ownerCutPerMillion = 10000;
  /* eslint-disable no-unused-vars */
  enum Rarity {
    LEGENDARY,
    EPIC,
    RARE,
    COMMON,
  }

  enum AssetType {
    NIL,
    ERC20,
    ERC721,
  }
  /* eslint-disable no-unused-vars */
  before(async function () {
    [deployer, owner, nftOwner, notOwner, buyer, seller] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // CONTRACT FACTORIES

    BMHTL = await ethers.getContractFactory("BMHTL");
    bmhtl = await BMHTL.deploy(owner.address);
    await bmhtl.deployed();

    BMHTE = await ethers.getContractFactory("BMHTE");
    bmhte = await BMHTE.deploy(owner.address);
    await bmhte.deployed();

    BMHTG = await ethers.getContractFactory("BMHTG");
    bmhtg = await BMHTG.deploy(owner.address);
    await bmhtg.deployed();
    await bmhtg.connect(owner).transfer(seller.address, amount);

    MHT = await ethers.getContractFactory("MouseHauntToken");
    mht = await MHT.deploy(owner.address);
    await mht.deployed();
    await mht.connect(owner).transfer(buyer.address, itemPrice);

    MouseHero = await ethers.getContractFactory("MouseHero");
    nft = await MouseHero.connect(nftOwner).deploy(
      "MouseHero",
      "MHN",
      "https://nft.mousehaunt.com/hero/"
    );
    await nft.deployed();

    Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await upgrades.deployProxy(Marketplace, [
      mht.address,
      ownerCutPerMillion,
      publicationFeeInWei,
      owner.address,
    ]);
    await marketplace.deployed();

    const MouseHauntTokens = [
      { addr: nft.address, assetType: AssetType.ERC721 },
      { addr: bmhtl.address, assetType: AssetType.ERC20 },
      { addr: bmhte.address, assetType: AssetType.ERC20 },
      { addr: bmhtg.address, assetType: AssetType.ERC20 },
    ];
    // ASSET OPERATIONS
    await marketplace.connect(owner).setNFTs(MouseHauntTokens);

    const transaction = await nft
      .connect(nftOwner)
      .mintSpecialMouseHero(seller.address, "Special Mouse Hero");
    const tx = await transaction.wait();

    const event = tx.events![0];
    const value = event.args![2];
    assetId = value.toNumber();

    await nft.connect(seller).approve(marketplace.address, assetId);
    await mht.connect(owner).transfer(seller.address, publicationFeeInWei);
    await mht.connect(seller).approve(marketplace.address, publicationFeeInWei);

    await bmhtg.connect(seller).approve(marketplace.address, amount);
  });
  describe("Iniatialize Mouse Haunt Marketplace", function () {
    it("Should initialize with MHT", async function () {
      const marketplace = await upgrades.deployProxy(Marketplace, [
        mht.address,
        0,
        0,
        owner.address,
      ]);
      const acceptedToken = await marketplace.connect(owner).acceptedToken();
      expect(acceptedToken).to.equal(mht.address);
    });
    it("Should revert when token is invalid", async function () {
      await expect(
        upgrades.deployProxy(Marketplace, [zeroAddress, 0, 0, owner.address])
      ).to.be.revertedWith("Invalid accepted token");
    });
    it("Should revert when fee is invalid", async function () {
      await mht.deployed();
      await expect(
        upgrades.deployProxy(Marketplace, [mht.address, 1000000, 0, owner.address])
      ).to.be.revertedWith("Invalid owner cut");
    });
    it("Should revert when owner is invalid", async function () {
      await expect(
        upgrades.deployProxy(Marketplace, [mht.address, 0, 0, zeroAddress])
      ).to.be.revertedWith("Invalid owner");
    });
  });

  describe("Mouse Haunt Marketplace Create Orders", function () {
    it("Should create a new MouseHero order", async function () {
      const createOrder = await marketplace
        .connect(seller)
        .createOrder(nft.address, assetId, amount, itemPrice);
      const orderId = "1";
      await expect(createOrder)
        .to.emit(marketplace, "OrderCreated")
        .withArgs(orderId, assetId, seller.address, amount, nft.address, itemPrice);
    });

    // FAILURES
    it("Should fail to create a new MouseHero order :: (contract not approved)", async function () {
      await nft.connect(seller).approve(zeroAddress, assetId);

      await expect(
        marketplace.connect(seller).createOrder(nft.address, assetId, amount, itemPrice)
      ).to.be.revertedWith("Marketplace unauthorized");
    });

    it("Should fail to create a new MouseHero order :: (address not the owner of asset)", async function () {
      await expect(
        marketplace.connect(notOwner).createOrder(nft.address, assetId, amount, itemPrice)
      ).to.be.revertedWith("Only the owner can create orders");
    });

    it("Should fail to create a new MouseHero order :: (price is 0)", async function () {
      const invalidPrice = 0;
      await expect(
        marketplace.connect(notOwner).createOrder(nft.address, assetId, amount, invalidPrice)
      ).to.be.revertedWith("Price should be greater than 0");
    });

    it("Should fail to create a new MouseHero order :: (Asset type is NIL)", async function () {
      await marketplace.connect(owner).setNFTs([{ addr: nft.address, assetType: AssetType.NIL }]);

      await expect(
        marketplace.connect(seller).createOrder(nft.address, assetId, amount, itemPrice)
      ).to.be.revertedWith("Invalid NFT address");
    });

    it("Should fail to create a ERC20 order :: (Asset id != 0)", async function () {
      await expect(
        marketplace.connect(seller).createOrder(bmhte.address, 20, amount, itemPrice)
      ).to.be.revertedWith("Invalid asset ID");
    });

    it("Should fail to create a ERC20 order :: (balance < amount)", async function () {
      await expect(
        marketplace.connect(seller).createOrder(bmhte.address, assetId, amountE18, itemPrice)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should fail to create an ERC20 order with float amount (and succeed if decimals == 0)", async function () {
      await expect(
        marketplace.connect(seller).createOrder(bmhte.address, assetId, amount, itemPrice)
      ).to.be.revertedWith("INV_AMOUNT");

      await expect(marketplace.connect(seller).createOrder(bmhtg.address, 0, amount, itemPrice))
        .to.emit(marketplace, "OrderCreated")
        .withArgs(1, 0, seller.address, amount, bmhtg.address, itemPrice);
    });
  });
  describe("Mouse Haunt Marketplace Execute/Cancel Orders", function () {
    let orderId: number;
    let orderIdBmhtl: number;
    beforeEach(async function () {
      await nft.connect(seller).approve(marketplace.address, assetId);
      await mht.connect(owner).transfer(buyer.address, itemPrice);
      await mht.connect(buyer).approve(marketplace.address, itemPrice);

      let tx = await (
        await marketplace.connect(seller).createOrder(nft.address, assetId, amount, itemPrice)
      ).wait();
      let event = tx.events![2];
      let value = event.args![0];
      orderId = value.toNumber();

      await mht.connect(owner).transfer(seller.address, publicationFeeInWei);
      await mht.connect(seller).approve(marketplace.address, publicationFeeInWei);

      await bmhtl.connect(owner).transfer(seller.address, amountE18);
      await bmhtl.connect(seller).approve(marketplace.address, amountE18);

      tx = await (
        await marketplace.connect(seller).createOrder(bmhtl.address, assetId, amountE18, itemPrice)
      ).wait();
      event = tx.events![2];
      value = event.args![0];
      orderIdBmhtl = value.toNumber();
    });

    describe("Cancel Mouse Haunt Marketplace Orders", function () {
      it("Should let the owner cancel a created order", async function () {
        const cancelOrder = await marketplace.connect(owner).cancelOrder(orderId);
        await expect(cancelOrder)
          .to.emit(marketplace, "OrderCancelled")
          .withArgs(orderId, assetId, seller.address, amount, nft.address);
      });

      it("Should let the seller cancel a created order", async function () {
        const cancelOrder = await marketplace.connect(seller).cancelOrder(orderId);
        await expect(cancelOrder)
          .to.emit(marketplace, "OrderCancelled")
          .withArgs(orderId, assetId, seller.address, amount, nft.address);
      });

      it("Should fail if order index and id doesn't match", async function () {
        const cancelOrder = await marketplace.connect(seller).cancelOrder(orderId);

        await expect(cancelOrder)
          .to.emit(marketplace, "OrderCancelled")
          .withArgs(orderId, assetId, seller.address, amount, nft.address);

        await expect(marketplace.connect(seller).cancelOrder(orderId)).to.be.revertedWith(
          "Invalid order index"
        );
      });
    });

    describe("Mouse Haunt Marketplace Execute Orders", function () {
      it("Should Execute Orders with ERC721", async function () {
        const executeOrder = await marketplace.connect(buyer).executeOrder(orderId);
        await expect(executeOrder)
          .to.emit(marketplace, "OrderExecuted")
          .withArgs(
            orderId,
            assetId,
            seller.address,
            amount,
            nft.address,
            itemPrice,
            buyer.address
          );
      });

      it("Should Execute Orders with ERC20", async function () {
        expect(await mht.balanceOf(seller.address)).to.equal(0);

        const executeOrder = await marketplace.connect(buyer).executeOrder(orderIdBmhtl);

        await expect(executeOrder)
          .to.emit(marketplace, "OrderExecuted")
          .withArgs(
            orderIdBmhtl,
            assetId,
            seller.address,
            amountE18,
            bmhtl.address,
            itemPrice,
            buyer.address
          );

        expect(await mht.balanceOf(seller.address)).to.equal(
          itemPrice.sub(itemPrice.mul(ownerCutPerMillion).div(1e6))
        );
      });

      it("Should fail if selling to yourself", async function () {
        await expect(marketplace.connect(seller).executeOrder(orderId)).to.be.revertedWith(
          "Cannot sell to yourself"
        );
      });

      it("Should fail if seller does not have balance", async function () {
        await bmhtl.connect(seller).transfer(owner.address, amount);

        await expect(marketplace.connect(buyer).executeOrder(orderIdBmhtl)).to.be.revertedWith(
          "Seller does not have balance"
        );
      });

      it("Should fail if seller is no longer the owner", async function () {
        await nft.connect(seller).transferFrom(seller.address, owner.address, assetId);

        await expect(marketplace.connect(buyer).executeOrder(orderId)).to.be.revertedWith(
          "Seller is no longer the owner"
        );
      });

      it("Should fail if invalid order index", async function () {
        const marketplace = await upgrades.deployProxy(Marketplace, [
          mht.address,
          ownerCutPerMillion,
          publicationFeeInWei,
          owner.address,
        ]);
        await marketplace.deployed();
        await expect(marketplace.connect(buyer).executeOrder(66)).to.be.revertedWith(
          "Invalid order index"
        );
      });

      it("Should fail if invalid amount", async function () {
        const invalidAmount = "0";
        await expect(
          marketplace.connect(seller).createOrder(nft.address, assetId, invalidAmount, itemPrice)
        ).to.be.revertedWith("Invalid amount");
      });

      it("Should fail for invalid order Index", async function () {
        await expect(marketplace.connect(buyer).executeOrder(66)).to.be.revertedWith(
          "Invalid order index"
        );
      });

      it("Should fail if marketplace unauthorized :: ERC20", async function () {
        await bmhtl.connect(owner).transfer(owner.address, amountE18);
        await bmhtl.connect(seller).approve(marketplace.address, assetId);
        await expect(
          marketplace.connect(seller).createOrder(bmhtl.address, assetId, amountE18, itemPrice)
        ).to.be.revertedWith("Marketplace unauthorized");
      });

      it("Should fail for unauthorized user", async function () {
        await expect(marketplace.connect(buyer).cancelOrder(orderId)).to.be.revertedWith(
          "Unauthorized user"
        );
      });
    });
  });

  describe("Publication Fee for Mouse Haunt Marketplace", function () {
    it("Should set a new fee", async function () {
      const newPublicationFee = toWei("0.01");
      await marketplace.connect(owner).setPublicationFee(newPublicationFee);
      const publicationFee = await marketplace.publicationFeeInWei();
      expect(publicationFee).to.equal(newPublicationFee);
    });
  });
  describe("Owner Cut Per Million for Mouse Haunt Marketplace", function () {
    it("Should be initialized to 0", async function () {
      const mht = await MHT.deploy(owner.address);
      await mht.deployed();
      const marketplace = await upgrades.deployProxy(Marketplace, [
        mht.address,
        0,
        0,
        owner.address,
      ]);
      await marketplace.deployed();
      const value = await marketplace.ownerCutPerMillion();
      expect(value).to.equal(0);
    });

    it("Should change owner sale cut", async function () {
      const newOwnerCut = 10;
      await marketplace.connect(owner).setOwnerCutPerMillion(newOwnerCut);
      const value = await marketplace.ownerCutPerMillion();
      expect(value).to.equal(newOwnerCut);
    });

    it("Should fail to change owner cut ::(% invalid above)", async function () {
      const invalidOwnerCut = 10000000;
      await expect(
        marketplace.connect(owner).setOwnerCutPerMillion(invalidOwnerCut)
      ).to.be.revertedWith("Invalid owner cut");
    });

    it("should fail to change owner cut ::(not operator)", async function () {
      const [notOperator] = await ethers.getSigners();
      const ownerCut = 100;

      await expect(
        marketplace.connect(notOperator).setOwnerCutPerMillion(ownerCut)
      ).to.be.revertedWith(
        `AccessControl: account ${notOperator.address.toLowerCase()} is missing role ${ethers.utils.id(
          "OPERATOR_ROLE"
        )}`
      );
    });
  });

  describe("Update Approved NFTs", function () {
    const legendaryAmount = ethers.utils.parseEther("2");
    const epicAmount = ethers.utils.parseEther("3");
    const nftAmount = "1";

    const legendaryPrice = ethers.utils.parseEther("4");
    const epicPrice = ethers.utils.parseEther("5");
    const nftPrice = ethers.utils.parseEther("6");

    const totalPrice = legendaryPrice.add(epicPrice).add(nftPrice);

    it("Should execute created order by updating approved NFTs", async function () {
      const nft = await MouseHero.connect(nftOwner).deploy(
        "MouseHero",
        "MHN",
        "https://nft.mousehaunt.com/hero/"
      );
      await nft.deployed();

      await mht.connect(owner).transfer(buyer.address, totalPrice);

      const marketplace = await upgrades.deployProxy(Marketplace, [
        mht.address,
        0,
        0,
        owner.address,
      ]);

      await marketplace.deployed();
      await marketplace.connect(owner).setNFTs([
        { addr: bmhtl.address, assetType: AssetType.ERC20 },
        { addr: bmhte.address, assetType: AssetType.ERC20 },
      ]);

      await bmhtl.connect(owner).transfer(seller.address, legendaryAmount);
      await bmhte.connect(owner).transfer(seller.address, epicAmount);
      const transaction = await nft
        .connect(nftOwner)
        .mintSpecialMouseHero(seller.address, "Special Mouse Hero");
      const tx = await transaction.wait();
      const event = tx.events![0];
      const value = event.args![2];
      const assetId = value.toString();

      await bmhte.connect(seller).approve(marketplace.address, epicAmount);
      await bmhtl.connect(seller).approve(marketplace.address, legendaryAmount);
      await nft.connect(seller).approve(marketplace.address, assetId);
      await mht.connect(buyer).approve(marketplace.address, totalPrice);

      const legendaryOrder = await (
        await marketplace
          .connect(seller)
          .createOrder(bmhtl.address, assetId, legendaryAmount, legendaryPrice)
      ).wait();
      const legendaryEvent = legendaryOrder.events![0];
      const legendaryOrderId = legendaryEvent.args![0].toString();

      await expect(marketplace.connect(buyer).executeOrder(legendaryOrderId))
        .to.emit(marketplace, "OrderExecuted")
        .withArgs(
          legendaryOrderId,
          assetId,
          seller.address,
          legendaryAmount,
          bmhtl.address,
          legendaryPrice,
          buyer.address
        );

      const epicOrder = await (
        await marketplace.connect(seller).createOrder(bmhte.address, assetId, epicAmount, epicPrice)
      ).wait();
      const epicEvent = epicOrder.events![0];
      const epicOrderId = epicEvent.args![0].toString();

      await expect(marketplace.connect(buyer).executeOrder(epicOrderId))
        .to.emit(marketplace, "OrderExecuted")
        .withArgs(
          epicOrderId,
          assetId,
          seller.address,
          epicAmount,
          bmhte.address,
          epicPrice,
          buyer.address
        );

      await marketplace.connect(owner).setNFTs([
        { addr: bmhtl.address, assetType: AssetType.ERC20 },
        { addr: bmhte.address, assetType: AssetType.ERC20 },
        { addr: nft.address, assetType: AssetType.ERC721 },
      ]);

      const nftOrder = await (
        await marketplace.connect(seller).createOrder(nft.address, assetId, nftAmount, nftPrice)
      ).wait();
      const nftEvent = nftOrder.events![0];
      const nftOrderId = nftEvent.args![0].toString();

      await expect(marketplace.connect(buyer).executeOrder(nftOrderId))
        .to.emit(marketplace, "OrderExecuted")
        .withArgs(
          nftOrderId,
          assetId,
          seller.address,
          nftAmount,
          nft.address,
          nftPrice,
          buyer.address
        );
    });
  });
  describe("Marketplace Proxy", function () {
    let MarketplaceV2: ContractFactory;
    beforeEach(async function () {
      MarketplaceV2 = await ethers.getContractFactory("MarketplaceUpgradeTest");
    });
    it("is upgradable", async () => {
      const value = await marketplace.publicationFeeInWei();
      expect(value).to.equal(publicationFeeInWei);

      const marketplaceV2 = await upgrades.upgradeProxy(marketplace.address, MarketplaceV2);

      await marketplaceV2.newPublicationFeeInWei(0);

      const value2 = await marketplaceV2.publicationFeeInWei();
      await expect(value2.toString()).to.equal("0");
    });
  });
});

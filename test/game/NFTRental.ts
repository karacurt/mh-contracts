import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import { MouseHeroFixture } from "../fixture/MouseHeroFixture";
import { TokenType } from "../types";
import { toWei } from "../../src/utils/misc";
import {
  getValidCancelRentOrder,
  getValidCreateRentOrder,
  getValidExecuteRentOrder,
  getValidSetRentOrderAvailability,
} from "../fixture/NFTRentalFixture";

const zeroAddress = ethers.constants.AddressZero;
const INITIAL_BALANCE = toWei("99999");
const networkDescriptor = 56;
const rentFee = toWei("10");
const rentingDays = 5;
describe("NFTRental", async function () {
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let validator: SignerWithAddress;
  let validator2: SignerWithAddress;
  let player: SignerWithAddress;
  let player2: SignerWithAddress;
  let player3: SignerWithAddress;
  let treasury: SignerWithAddress;

  /* eslint-disable no-unused-vars */
  let deployer: SignerWithAddress;
  /* eslint-disable no-unused-vars */

  let NFTRental: ContractFactory;
  let MHT: ContractFactory;
  let MouseHero: ContractFactory;

  let mouseHeroContract: Contract;
  let nftrental: Contract;
  let mht: Contract;

  let mousehero: MouseHeroFixture;

  before(async function () {
    [deployer, owner, operator, validator, validator2, treasury, player, player2, player3] =
      await ethers.getSigners();
  });

  beforeEach(async function () {
    // CONTRACT FACTORIES

    MHT = await ethers.getContractFactory("MouseHauntToken");
    mht = await MHT.deploy(owner.address);
    await mht.deployed();
    await mht.connect(owner).transfer(player.address, INITIAL_BALANCE);
    await mht.connect(owner).transfer(player2.address, INITIAL_BALANCE);
    await mht.connect(owner).transfer(player3.address, INITIAL_BALANCE);

    MouseHero = await ethers.getContractFactory("MouseHero");
    mouseHeroContract = await MouseHero.connect(owner).deploy(
      "MouseHero",
      "MHN",
      "https://nft.mousehaunt.com/hero/"
    );
    await mouseHeroContract.deployed();

    mousehero = new MouseHeroFixture(mouseHeroContract, owner);

    NFTRental = await ethers.getContractFactory("NFTRental");
    nftrental = await upgrades.deployProxy(NFTRental, [
      networkDescriptor,
      [validator.address, validator2.address],
      operator.address,
      treasury.address,
      mht.address,
      rentFee,
    ]);
    await nftrental.deployed();

    const trustedTokens = [{ addr: mouseHeroContract.address, tokenType: TokenType.ERC721 }];

    await nftrental.connect(operator).setTrustedTokens(trustedTokens);

    const paymentTokens = [{ addr: mht.address, tokenType: TokenType.ERC20 }];

    await nftrental.connect(operator).setPaymentTokens(paymentTokens);

    await mht.connect(player).approve(nftrental.address, INITIAL_BALANCE);
    await mht.connect(player2).approve(nftrental.address, INITIAL_BALANCE);
    await mht.connect(player3).approve(nftrental.address, INITIAL_BALANCE);
  });

  describe("Initializing", async function () {
    it("Should NOT initialize with invalid operator", async function () {
      await expect(
        upgrades.deployProxy(NFTRental, [
          networkDescriptor,
          [validator.address, validator2.address],
          zeroAddress,
          treasury.address,
          mht.address,
          rentFee,
        ])
      ).to.be.revertedWith("INV_ADDRESS");
    });
    it("Should NOT initialize with invalid treasury", async function () {
      await expect(
        upgrades.deployProxy(NFTRental, [
          networkDescriptor,
          [validator.address, validator2.address],
          operator.address,
          zeroAddress,
          mht.address,
          rentFee,
        ])
      ).to.be.revertedWith("INV_ADDRESS");
    });
    it("Should NOT initialize with invalid paymentToken", async function () {
      await expect(
        upgrades.deployProxy(NFTRental, [
          networkDescriptor,
          [validator.address, validator2.address],
          operator.address,
          treasury.address,
          zeroAddress,
          rentFee,
        ])
      ).to.be.revertedWith("INV_ADDRESS");
    });
  });

  describe("Pausable", async function () {
    it("Should pause the contract", async function () {
      await nftrental.connect(operator).pause();
      expect(await nftrental.paused()).to.be.true;
    });
    it("Should unpause the contract", async function () {
      await nftrental.connect(operator).pause();
      await nftrental.connect(operator).unpause();
      expect(await nftrental.paused()).to.be.false;
    });
  });

  describe("Renting", function () {
    let tokenId = 0;
    const valuePerDay = 10;
    const maxDays = 7;
    beforeEach(async function () {
      tokenId = await mousehero.mintMouseHeroTo(player.address);

      await mouseHeroContract.connect(player).approve(nftrental.address, tokenId);
    });
    describe("Create Rent Order", function () {
      describe("Should create rent order", function () {
        it("Should create rent a order", async function () {
          const { digest, data, signature } = await getValidCreateRentOrder(
            player.address,
            mouseHeroContract.address,
            tokenId,
            valuePerDay,
            maxDays,
            nftrental.address,
            networkDescriptor,
            1,
            validator
          );
          await expect(nftrental.createRentOrder(digest, data, signature))
            .to.emit(nftrental, "RentOrderCreated")
            .withArgs(1, player.address, mouseHeroContract.address, tokenId, valuePerDay, 1);
        });
      });
      describe("Should NOT create rent order", function () {
        it("Should NOT create a rent order twice the same token", async function () {
          const tokenId2 = await mousehero.mintMouseHeroTo(player.address);
          await mousehero.contract.connect(player).approve(nftrental.address, tokenId2);

          const { digest, data, signature } = await getValidCreateRentOrder(
            player.address,
            mouseHeroContract.address,
            tokenId2,
            valuePerDay,
            maxDays,
            nftrental.address,
            networkDescriptor,
            1,
            validator
          );

          await nftrental.createRentOrder(digest, data, signature);

          const {
            digest: digest2,
            data: data2,
            signature: signature2,
          } = await getValidCreateRentOrder(
            player.address,
            mouseHeroContract.address,
            tokenId2,
            valuePerDay,
            maxDays,
            nftrental.address,
            networkDescriptor,
            2,
            validator
          );

          await expect(nftrental.createRentOrder(digest2, data2, signature2)).to.be.revertedWith(
            "ALREADY_RENTED"
          );
        });
        it("Should NOT create a order for a untrusted token", async function () {
          const { digest, data, signature } = await getValidCreateRentOrder(
            player.address,
            zeroAddress,
            tokenId,
            valuePerDay,
            maxDays,
            nftrental.address,
            networkDescriptor,
            1,
            validator
          );

          await expect(nftrental.createRentOrder(digest, data, signature)).to.be.revertedWith(
            "UNTRUSTED_TOKEN"
          );
        });
        it("Should NOT create a order for a invalid playerAddress", async function () {
          const { digest, data, signature } = await getValidCreateRentOrder(
            zeroAddress,
            mouseHeroContract.address,
            tokenId,
            valuePerDay,
            maxDays,
            nftrental.address,
            networkDescriptor,
            1,
            validator
          );

          await expect(nftrental.createRentOrder(digest, data, signature)).to.be.revertedWith(
            "INV_ADDRESS"
          );
        });
        it("Should NOT create a order if the player it's not the owner of the token", async function () {
          const tokenId2 = await mousehero.mintMouseHeroTo(player.address);
          await mousehero.contract.connect(player).approve(nftrental.address, tokenId2);

          const { digest, data, signature } = await getValidCreateRentOrder(
            player2.address,
            mouseHeroContract.address,
            tokenId2,
            valuePerDay,
            maxDays,
            nftrental.address,
            networkDescriptor,
            1,
            validator
          );

          await expect(nftrental.createRentOrder(digest, data, signature)).to.be.revertedWith(
            "INV_OWNER"
          );
        });
      });
    });
    describe("Execute Rent", function () {
      let rentOrderId = 1;

      beforeEach(async function () {
        const { digest, data, signature } = await getValidCreateRentOrder(
          player.address,
          mouseHeroContract.address,
          tokenId,
          valuePerDay,
          maxDays,
          nftrental.address,
          networkDescriptor,
          1,
          validator
        );

        const tx = await nftrental.createRentOrder(digest, data, signature);
        const rentOrderCreatedEvent = (await tx.wait()).events[0].args;
        rentOrderId = rentOrderCreatedEvent.rentOrderId;

        await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
      });
      describe("Should execute rent order", function () {
        it("Should execute a rent order", async function () {
          const { digest, data, signature } = await getValidExecuteRentOrder(
            player2.address,
            Number(rentOrderId),
            rentingDays,
            mht.address,
            nftrental.address,
            networkDescriptor,
            1,
            validator
          );

          await expect(nftrental.executeRentOrder(digest, data, signature))
            .to.emit(nftrental, "RentOrderExecuted")
            .withArgs(
              rentOrderId,
              player.address,
              mouseHeroContract.address,
              tokenId,
              player2.address,
              rentingDays,
              1
            );
        });
      });
      describe("Should NOT execute rent order", function () {
        it("Should NOT execute a rent order after renter change availability", async function () {
          const {
            digest: digest1,
            data: data1,
            signature: signature1,
          } = await getValidExecuteRentOrder(
            player2.address,
            Number(rentOrderId),
            rentingDays,
            mht.address,
            nftrental.address,
            networkDescriptor,
            1,
            validator
          );

          await expect(nftrental.executeRentOrder(digest1, data1, signature1))
            .to.emit(nftrental, "RentOrderExecuted")
            .withArgs(
              rentOrderId,
              player.address,
              mouseHeroContract.address,
              tokenId,
              player2.address,
              rentingDays,
              1
            );

          const {
            digest: digest2,
            data: data2,
            signature: signature2,
          } = await getValidSetRentOrderAvailability(
            player.address,
            Number(rentOrderId),
            false,
            nftrental.address,
            networkDescriptor,
            2,
            validator
          );

          await expect(nftrental.setRentOrderAvailability(digest2, data2, signature2))
            .to.emit(nftrental, "RentOrderAvailability")
            .withArgs(player.address, rentOrderId, false, 2);

          await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
          const {
            digest: digest3,
            data: data3,
            signature: signature3,
          } = await getValidExecuteRentOrder(
            player2.address,
            Number(rentOrderId),
            rentingDays,
            mht.address,
            nftrental.address,
            networkDescriptor,
            2,
            validator
          );

          await expect(nftrental.executeRentOrder(digest3, data3, signature3)).to.be.revertedWith(
            "UNAVAILABLE"
          );
        });
        it("Should NOT rent a already rented token", async function () {
          const {
            digest: digest1,
            data: data1,
            signature: signature1,
          } = await getValidExecuteRentOrder(
            player2.address,
            Number(rentOrderId),
            rentingDays,
            mht.address,
            nftrental.address,
            networkDescriptor,
            1,
            validator
          );

          await expect(nftrental.executeRentOrder(digest1, data1, signature1))
            .to.emit(nftrental, "RentOrderExecuted")
            .withArgs(
              rentOrderId,
              player.address,
              mouseHeroContract.address,
              tokenId,
              player2.address,
              rentingDays,
              1
            );

          const {
            digest: digest2,
            data: data2,
            signature: signature2,
          } = await getValidExecuteRentOrder(
            player3.address,
            Number(rentOrderId),
            rentingDays,
            mht.address,
            nftrental.address,
            networkDescriptor,
            1,
            validator
          );

          await expect(nftrental.executeRentOrder(digest2, data2, signature2)).to.be.revertedWith(
            "TOKEN_IS_RENTED"
          );
        });
        it("Should NOT execute a rent a token for yourself", async function () {
          const { digest, data, signature } = await getValidExecuteRentOrder(
            player.address,
            Number(rentOrderId),
            rentingDays,
            mht.address,
            nftrental.address,
            networkDescriptor,
            2,
            validator
          );
          await expect(nftrental.executeRentOrder(digest, data, signature)).to.be.revertedWith(
            "CANNOT_RENT_OWN_TOKEN"
          );
        });
        it("Should NOT rent a token more than max days allowed", async function () {
          const { digest, data, signature } = await getValidExecuteRentOrder(
            player2.address,
            Number(rentOrderId),
            maxDays + 1,
            mht.address,
            nftrental.address,
            networkDescriptor,
            1,
            validator
          );
          await expect(nftrental.executeRentOrder(digest, data, signature)).to.be.revertedWith(
            "MAX_DAYS_EXCEEDED"
          );
        });
        it("Should NOT execute rent with a invalid playerAddress", async function () {
          const { digest, data, signature } = await getValidExecuteRentOrder(
            zeroAddress,
            Number(rentOrderId),
            rentingDays,
            mht.address,
            nftrental.address,
            networkDescriptor,
            1,
            validator
          );
          await expect(nftrental.executeRentOrder(digest, data, signature)).to.be.revertedWith(
            "INV_ADDRESS"
          );
        });
        it("Should NOT execute rent with a invalid payment Token", async function () {
          const { digest, data, signature } = await getValidExecuteRentOrder(
            player2.address,
            Number(rentOrderId),
            rentingDays,
            zeroAddress,
            nftrental.address,
            networkDescriptor,
            1,
            validator
          );
          await expect(nftrental.executeRentOrder(digest, data, signature)).to.be.revertedWith(
            "INV_PAYMENT_TOKEN"
          );
        });
      });
    });
    describe("Cancel Rent", function () {
      let rentOrderId = 1;

      beforeEach(async function () {
        const { digest, data, signature } = await getValidCreateRentOrder(
          player.address,
          mouseHeroContract.address,
          tokenId,
          valuePerDay,
          maxDays,
          nftrental.address,
          networkDescriptor,
          1,
          validator
        );

        const tx = await nftrental.createRentOrder(digest, data, signature);
        const rentOrderCreatedEvent = (await tx.wait()).events[0].args;
        rentOrderId = rentOrderCreatedEvent.rentOrderId;

        await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
      });

      it("Should cancel a rent order", async function () {
        const { digest, data, signature } = await getValidCancelRentOrder(
          player.address,
          rentOrderId,
          nftrental.address,
          networkDescriptor,
          2,
          validator
        );
        await expect(nftrental.cancelRentOrder(digest, data, signature))
          .to.emit(nftrental, "RentOrderCancelled")
          .withArgs(rentOrderId, player.address, mouseHeroContract.address, tokenId, 2);
      });
      it("Should NOT cancel a rent order while the token is rented", async function () {
        const tokenId2 = await mousehero.mintMouseHeroTo(player.address);
        await mousehero.contract.connect(player).approve(nftrental.address, tokenId2);

        const {
          digest: digest1,
          data: data1,
          signature: signature1,
        } = await getValidCreateRentOrder(
          player.address,
          mouseHeroContract.address,
          tokenId2,
          valuePerDay,
          maxDays,
          nftrental.address,
          networkDescriptor,
          2,
          validator
        );

        const tx = await nftrental.createRentOrder(digest1, data1, signature1);
        const rentOrderCreatedEvent = (await tx.wait()).events[0].args;
        const rentOrderId2 = rentOrderCreatedEvent.rentOrderId;

        await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]); //cooldown

        const {
          digest: digest2,
          data: data2,
          signature: signature2,
        } = await getValidExecuteRentOrder(
          player2.address,
          Number(rentOrderId2),
          rentingDays,
          mht.address,
          nftrental.address,
          networkDescriptor,
          1,
          validator
        );

        await nftrental.executeRentOrder(digest2, data2, signature2);

        const {
          digest: digest3,
          data: data3,
          signature: signature3,
        } = await getValidCancelRentOrder(
          player.address,
          rentOrderId2,
          nftrental.address,
          networkDescriptor,
          3,
          validator
        );

        await expect(nftrental.cancelRentOrder(digest3, data3, signature3)).to.be.revertedWith(
          "TOKEN_IS_RENTED"
        );
      });
      it("Should NOT cancel a rent order from someoneelse", async function () {
        const { digest, data, signature } = await getValidCancelRentOrder(
          player2.address,
          rentOrderId,
          nftrental.address,
          networkDescriptor,
          1,
          validator
        );
        await expect(nftrental.cancelRentOrder(digest, data, signature)).to.be.revertedWith(
          "INV_OWNER"
        );
      });
      it("Should NOT cancel with invalid playerAddress", async function () {
        const { digest, data, signature } = await getValidCancelRentOrder(
          zeroAddress,
          rentOrderId,
          nftrental.address,
          networkDescriptor,
          1,
          validator
        );
        await expect(nftrental.cancelRentOrder(digest, data, signature)).to.be.revertedWith(
          "INV_ADDRESS"
        );
      });
    });
    describe("Rent Getters ", function () {
      beforeEach(async function () {
        const { digest, data, signature } = await getValidCreateRentOrder(
          player.address,
          mouseHeroContract.address,
          tokenId,
          valuePerDay,
          maxDays,
          nftrental.address,
          networkDescriptor,
          1,
          validator
        );

        await nftrental.createRentOrder(digest, data, signature);

        const tokenId2 = await mousehero.mintMouseHeroTo(player.address);
        await mousehero.contract.connect(player).approve(nftrental.address, tokenId2);

        const {
          digest: digest2,
          data: data2,
          signature: signature2,
        } = await getValidCreateRentOrder(
          player.address,
          mouseHeroContract.address,
          tokenId2,
          valuePerDay,
          maxDays,
          nftrental.address,
          networkDescriptor,
          2,
          validator
        );
        await nftrental.createRentOrder(digest2, data2, signature2);

        const tokenId3 = await mousehero.mintMouseHeroTo(player.address);
        await mousehero.contract.connect(player).approve(nftrental.address, tokenId3);

        const {
          digest: digest3,
          data: data3,
          signature: signature3,
        } = await getValidCreateRentOrder(
          player.address,
          mouseHeroContract.address,
          tokenId3,
          valuePerDay,
          maxDays,
          nftrental.address,
          networkDescriptor,
          3,
          validator
        );

        await nftrental.createRentOrder(digest3, data3, signature3);

        await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
      });

      it("Should get rent orders from a player", async function () {
        const playerOrders = await nftrental.getPlayerRentOrders(player.address);
        //console.log("playerOrders", playerOrders);
      });

      it("Should get rent orders from a player after cancel", async function () {
        const playerOrdersBefore = await nftrental.getPlayerRentOrders(player.address);
        //console.log("playerOrdersBefore", playerOrdersBefore);

        const { digest, data, signature } = await getValidCancelRentOrder(
          player.address,
          2,
          nftrental.address,
          networkDescriptor,
          4,
          validator
        );
        await nftrental.cancelRentOrder(digest, data, signature);

        const playerOrdersAfter = await nftrental.getPlayerRentOrders(player.address);
        //console.log("playerOrdersAfter", playerOrdersAfter);
      });
      it("Should get all orders", async function () {
        const allOrders = await nftrental.getRentOrders();
        //console.log("allOrders", allOrders);
      });
      it("Should not get a invalid order id", async function () {
        await expect(nftrental.getRentOrder(0)).to.be.revertedWith("Invalid order index");
      });
      it("Should get orders count", async function () {
        const count = await nftrental.getRentOrdersCount();
        //console.log("count", count);
      });
      it("Should get a Order Id index", async function () {
        const index = await nftrental.getRentOrderIndex(1);
        //console.log("index", index);
      });
    });
    describe("Rent Setters", function () {
      let rentOrderId = 1;
      beforeEach(async function () {
        const { digest, data, signature } = await getValidCreateRentOrder(
          player.address,
          mouseHeroContract.address,
          tokenId,
          valuePerDay,
          maxDays,
          nftrental.address,
          networkDescriptor,
          1,
          validator
        );
        const tx = await nftrental.createRentOrder(digest, data, signature);
        const rentOrderCreatedEvent = (await tx.wait()).events[0].args;
        rentOrderId = rentOrderCreatedEvent.rentOrderId;
      });
      it("Should set treasury address", async function () {
        await nftrental.connect(operator).setTreasury(player.address);
        expect(await nftrental.treasury()).to.equal(player.address);
      });
      it("Should set rent fee", async function () {
        await nftrental.connect(operator).setRentFee(toWei("10"));
        expect(await nftrental.rentFee()).to.equal(toWei("10"));
      });
      it("Should set rent order availability", async function () {
        const orderBefore = await nftrental.getRentOrder(rentOrderId);
        expect(orderBefore.isAvailable).to.be.true;
        const { digest, data, signature } = await getValidSetRentOrderAvailability(
          player.address,
          Number(rentOrderId),
          false,
          nftrental.address,
          networkDescriptor,
          2,
          validator
        );
        await expect(nftrental.setRentOrderAvailability(digest, data, signature))
          .to.emit(nftrental, "RentOrderAvailability")
          .withArgs(player.address, rentOrderId, false, 2);

        const orderAfter = await nftrental.getRentOrder(rentOrderId);
        expect(orderAfter.isAvailable).to.be.false;
      });
      it("Should NOT set treasury address with invalid address", async function () {
        await expect(nftrental.connect(operator).setTreasury(zeroAddress)).to.be.revertedWith(
          "INV_ADDRESS"
        );
      });
      it("Should NOT set availability for non existent order", async function () {
        const { digest, data, signature } = await getValidSetRentOrderAvailability(
          player.address,
          Number(rentOrderId) + 1,
          false,
          nftrental.address,
          networkDescriptor,
          2,
          validator
        );
        await expect(
          nftrental.setRentOrderAvailability(digest, data, signature)
        ).to.be.revertedWith("INV_INDEX");
      });
      it("Should NOT set availability of another player's order", async function () {
        const { digest, data, signature } = await getValidSetRentOrderAvailability(
          player2.address,
          Number(rentOrderId),
          false,
          nftrental.address,
          networkDescriptor,
          1,
          validator
        );
        await expect(
          nftrental.setRentOrderAvailability(digest, data, signature)
        ).to.be.revertedWith("NOT_RENTER");
      });
    });
  });
});

import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import { MouseHeroFixture } from "../fixture/MouseHeroFixture";
import { GenericAssets, Identifiers, TokenType } from "../types";
import {
  getValidDepositCoin,
  getValidDepositGeneric,
  getValidDepositNFT,
  getValidWithdrawCoin,
  getValidWithdrawGeneric,
  getValidWithdrawNFT,
} from "../fixture/PlayerStashFixture";
import { toWei } from "../../src/utils/misc";

const zeroAddress = ethers.constants.AddressZero;
const INITIAL_BALANCE = 99999;
const networkDescriptor = 56;
describe("PlayerStash", async function () {
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let validator: SignerWithAddress;
  let validator2: SignerWithAddress;
  let player: SignerWithAddress;
  let player2: SignerWithAddress;
  let treasury: SignerWithAddress;

  /* eslint-disable no-unused-vars */
  let deployer: SignerWithAddress;
  /* eslint-disable no-unused-vars */

  let PlayerStash: ContractFactory;
  let MHT: ContractFactory;
  let MouseHero: ContractFactory;

  let mouseHeroContract: Contract;
  let playerstash: Contract;
  let mht: Contract;

  let mousehero: MouseHeroFixture;

  before(async function () {
    [deployer, owner, operator, validator, validator2, player, player2, treasury] =
      await ethers.getSigners();
  });

  beforeEach(async function () {
    // CONTRACT FACTORIES

    MHT = await ethers.getContractFactory("MouseHauntToken");
    mht = await MHT.deploy(owner.address);
    await mht.deployed();
    await mht.connect(owner).transfer(player.address, INITIAL_BALANCE);

    MouseHero = await ethers.getContractFactory("MouseHero");
    mouseHeroContract = await MouseHero.connect(owner).deploy(
      "MouseHero",
      "MHN",
      "https://nft.mousehaunt.com/hero/"
    );
    await mouseHeroContract.deployed();

    mousehero = new MouseHeroFixture(mouseHeroContract, owner);

    PlayerStash = await ethers.getContractFactory("PlayerStash");
    playerstash = await upgrades.deployProxy(PlayerStash, [
      networkDescriptor,
      [validator.address, validator2.address],
      operator.address,
    ]);
    await playerstash.deployed();

    const AcceptedTokens = [
      { addr: mousehero.contract.address, tokenType: TokenType.ERC721 },
      { addr: mht.address, tokenType: TokenType.ERC20 },
    ];

    await playerstash.connect(operator).setTrustedTokens(AcceptedTokens);
  });

  describe("Initialize", function () {
    it("Should not intilize with invalid operator", async function () {
      await expect(
        upgrades.deployProxy(PlayerStash, [
          networkDescriptor,
          [validator.address, validator2.address],
          zeroAddress,
        ])
      ).to.be.revertedWith("INV_ADDR");
    });
  });

  describe("DepositToken", function () {
    const DEPOSIT_AMOUNT = toWei("100").toString();
    let tokenId = 0;

    beforeEach(async function () {
      tokenId = await mousehero.mintMouseHeroTo(player.address);
      await mht.connect(owner).transfer(player.address, DEPOSIT_AMOUNT);
      await mht.connect(player).approve(playerstash.address, DEPOSIT_AMOUNT);
    });
    describe("Should deposit", function () {
      it("Should deposit ERC20 token", async function () {
        const { digest, data, signature } = await getValidDepositCoin(
          mht.address,
          player.address,
          DEPOSIT_AMOUNT,
          playerstash.address,
          networkDescriptor,
          validator,
          1
        );

        await expect(playerstash.depositCoin(digest, data, signature))
          .to.emit(playerstash, "DepositCoin")
          .withArgs(player.address, mht.address, DEPOSIT_AMOUNT, 1);
      });
      it("Should deposit ERC721 token", async function () {
        await mousehero.contract.connect(player).approve(playerstash.address, tokenId);

        const { digest, data, signature } = await getValidDepositNFT(
          Identifiers.General,
          mousehero.contract.address,
          tokenId,
          player.address,
          playerstash.address,
          networkDescriptor,
          validator,
          1
        );

        await expect(playerstash.depositNFT(digest, data, signature))
          .to.emit(playerstash, "DepositNFT")
          .withArgs(player.address, mousehero.contract.address, tokenId, Identifiers.General, 1);

        expect(await playerstash.tokenToIdToOwner(mousehero.contract.address, tokenId)).to.be.equal(
          player.address
        );
      });
    });
    describe("Should NOT deposit", function () {
      it("Should NOT deposit an invalid token", async function () {
        const { digest, data, signature } = await getValidDepositCoin(
          zeroAddress,
          player.address,
          DEPOSIT_AMOUNT,
          playerstash.address,
          networkDescriptor,
          validator,
          1
        );

        await expect(playerstash.depositCoin(digest, data, signature)).to.be.revertedWith(
          "INV_TOKEN"
        );
      });
      it("Should NOT deposit if it is an invalid amount", async function () {
        const { digest, data, signature } = await getValidDepositCoin(
          mht.address,
          player.address,
          "0",
          playerstash.address,
          networkDescriptor,
          validator,
          1
        );
        await expect(playerstash.depositCoin(digest, data, signature)).to.be.revertedWith(
          "INV_AMOUNT"
        );
      });
      it("Should NOT deposit if the player has no ERC20 balance", async function () {
        const { digest, data, signature } = await getValidDepositCoin(
          mht.address,
          player.address,
          (Number(DEPOSIT_AMOUNT) * 2).toString(),
          playerstash.address,
          networkDescriptor,
          validator,
          1
        );

        await expect(playerstash.depositCoin(digest, data, signature)).to.be.revertedWith(
          "NO_BALANCE"
        );
      });
      it("Should NOT deposit if PlayerStash has no allowance for ERC20 token", async function () {
        await mht.connect(player).approve(playerstash.address, 0);

        const { digest, data, signature } = await getValidDepositCoin(
          mht.address,
          player.address,
          DEPOSIT_AMOUNT,
          playerstash.address,
          networkDescriptor,
          validator,
          1
        );

        await expect(playerstash.depositCoin(digest, data, signature)).to.be.revertedWith(
          "NOT_ENOUGH_ALLOWANCE"
        );
      });
      it("Should NOT deposit if the player is not the owner", async function () {
        const { digest, data, signature } = await getValidDepositNFT(
          Identifiers.Captain,
          mousehero.contract.address,
          tokenId,
          player2.address,
          playerstash.address,
          networkDescriptor,
          validator,
          1
        );

        await expect(playerstash.depositNFT(digest, data, signature)).to.be.revertedWith(
          "INV_OWNER"
        );
      });
      it("Should NOT deposit if PlayerStash has no allowance for ERC721 token", async function () {
        const { digest, data, signature } = await getValidDepositNFT(
          Identifiers.Captain,
          mousehero.contract.address,
          tokenId,
          player.address,
          playerstash.address,
          networkDescriptor,
          validator,
          1
        );

        await expect(playerstash.depositNFT(digest, data, signature)).to.be.revertedWith(
          "NOT_ENOUGH_ALLOWANCE"
        );
      });
      it("Should NOT deposit if the token is already deposited", async function () {
        await mousehero.contract.connect(player).approve(playerstash.address, tokenId);

        const { digest, data, signature } = await getValidDepositNFT(
          Identifiers.Captain,
          mousehero.contract.address,
          tokenId,
          player.address,
          playerstash.address,
          networkDescriptor,
          validator,
          1
        );

        await playerstash.depositNFT(digest, data, signature);

        const {
          digest: digest2,
          data: data2,
          signature: signature2,
        } = await getValidDepositNFT(
          Identifiers.Captain,
          mousehero.contract.address,
          tokenId,
          player.address,
          playerstash.address,
          networkDescriptor,
          validator,
          2
        );

        await expect(playerstash.depositNFT(digest2, data2, signature2)).to.be.revertedWith(
          "ALREADY_DEPOSITED"
        );
      });
      it("Should NOT deposit a untrusted Token", async function () {
        const { digest, data, signature } = await getValidDepositNFT(
          Identifiers.Captain,
          zeroAddress,
          tokenId,
          player.address,
          playerstash.address,
          networkDescriptor,
          validator,
          1
        );

        await expect(playerstash.depositNFT(digest, data, signature)).to.be.revertedWith(
          "INV_TOKEN"
        );
      });
    });
  });
  describe("WithdrawToken", function () {
    let tokenId = 0;
    const grossAmount = toWei("100").toString();
    const netAmount = toWei("99").toString();

    beforeEach(async function () {
      await mht.connect(owner).transfer(player.address, grossAmount);
      await mht.connect(player).approve(playerstash.address, grossAmount);
      const {
        digest: digest1,
        data: data1,
        signature: signature1,
      } = await getValidDepositCoin(
        mht.address,
        player.address,
        grossAmount,
        playerstash.address,
        networkDescriptor,
        validator,
        1
      );
      await playerstash.depositCoin(digest1, data1, signature1);

      tokenId = await mousehero.mintMouseHeroTo(player.address);
      await mousehero.contract.connect(player).approve(playerstash.address, tokenId);

      const {
        digest: digest2,
        data: data2,
        signature: signature2,
      } = await getValidDepositNFT(
        Identifiers.General,
        mousehero.contract.address,
        tokenId,
        player.address,
        playerstash.address,
        networkDescriptor,
        validator,
        2
      );

      await playerstash.depositNFT(digest2, data2, signature2);
    });

    describe("Should withdraw", function () {
      it("Should withdraw MHT stashed", async function () {
        const playerBalanceBefore = await mht.balanceOf(player.address);

        const { digest, data, signature } = await getValidWithdrawCoin(
          mht.address,
          grossAmount,
          player.address,
          netAmount,
          playerstash.address,
          networkDescriptor,
          validator,
          3
        );

        await expect(playerstash.withdrawCoin(digest, data, signature))
          .to.emit(playerstash, "WithdrawCoin")
          .withArgs(player.address, mht.address, grossAmount, netAmount, 3);

        const playerBalanceAfter = await mht.balanceOf(player.address);
        const playerBalanceDifference = playerBalanceAfter.sub(playerBalanceBefore);

        expect(playerBalanceDifference).to.equal(netAmount);
      });
      it("Should withdraw MouseHero stashed", async function () {
        expect(await mousehero.contract.ownerOf(tokenId)).to.equal(playerstash.address);

        const { digest, data, signature } = await getValidWithdrawNFT(
          mousehero.contract.address,
          tokenId.toString(),
          player.address,
          playerstash.address,
          networkDescriptor,
          validator,
          3
        );

        await expect(playerstash.withdrawNFT(digest, data, signature))
          .to.emit(playerstash, "WithdrawNFT")
          .withArgs(player.address, mousehero.contract.address, tokenId, 3);

        expect(await mousehero.contract.ownerOf(tokenId)).to.equal(player.address);
      });
    });
    describe("Should  NOT withdraw", function () {
      it("Should  NOT withdraw another player's token", async function () {
        const { digest, data, signature } = await getValidWithdrawNFT(
          mousehero.contract.address,
          tokenId.toString(),
          player2.address,
          playerstash.address,
          networkDescriptor,
          validator,
          1
        );
        await expect(playerstash.withdrawNFT(digest, data, signature)).to.be.revertedWith(
          "INV_OWNER"
        );
      });
      it("Should  NOT withdraw invalid ERC721 token", async function () {
        const { digest, data, signature } = await getValidWithdrawNFT(
          zeroAddress,
          tokenId.toString(),
          player.address,
          playerstash.address,
          networkDescriptor,
          validator,
          3
        );
        await expect(playerstash.withdrawNFT(digest, data, signature)).to.be.revertedWith(
          "INV_TOKEN"
        );
      });
      it("Should  NOT withdraw an invalid ERC20 token", async function () {
        const { digest, data, signature } = await getValidWithdrawCoin(
          zeroAddress,
          grossAmount,
          player.address,
          netAmount,
          playerstash.address,
          networkDescriptor,
          validator,
          3
        );
        await expect(playerstash.withdrawCoin(digest, data, signature)).to.be.revertedWith(
          "INV_ADDRESS"
        );
      });
      it("Should  NOT withdraw an invalid amount", async function () {
        const { digest, data, signature } = await getValidWithdrawCoin(
          mht.address,
          "0",
          player.address,
          "0",
          playerstash.address,
          networkDescriptor,
          validator,
          3
        );

        await expect(playerstash.withdrawCoin(digest, data, signature)).to.be.revertedWith(
          "INV_AMOUNT"
        );
      });
      it("Should  NOT withdraw if has no balance", async function () {
        const { digest, data, signature } = await getValidWithdrawCoin(
          mht.address,
          (Number(grossAmount) * 2).toString(),
          player.address,
          netAmount,
          playerstash.address,
          networkDescriptor,
          validator,
          3
        );

        await expect(playerstash.withdrawCoin(digest, data, signature)).to.be.revertedWith(
          "NO_BALANCE"
        );
      });
      it("Should NOT withdraw with invalid NET", async function () {
        const { digest, data, signature } = await getValidWithdrawCoin(
          mht.address,
          netAmount,
          player.address,
          grossAmount,
          playerstash.address,
          networkDescriptor,
          validator,
          3
        );

        await expect(playerstash.withdrawCoin(digest, data, signature)).to.be.revertedWith(
          "INV_NET"
        );
      });
    });
  });

  describe("Deposit Generic", function () {
    const DEPOSIT_AMOUNT = 2;

    describe("Should deposit", function () {
      it("Should deposit any generic asset", async function () {
        const { digest, data, signature } = await getValidDepositGeneric(
          GenericAssets.Apple,
          DEPOSIT_AMOUNT,
          player.address,
          playerstash.address,
          networkDescriptor,
          validator,
          1
        );

        await expect(playerstash.depositGeneric(digest, data, signature))
          .to.emit(playerstash, "DepositGeneric")
          .withArgs(player.address, GenericAssets.Apple, DEPOSIT_AMOUNT, 1);
      });
    });

    describe("Should NOT deposit", function () {
      it("Should NOT deposit an invalid amount", async function () {
        const { digest, data, signature } = await getValidDepositGeneric(
          GenericAssets.Apple,
          0,
          player.address,
          playerstash.address,
          networkDescriptor,
          validator,
          1
        );

        await expect(playerstash.depositGeneric(digest, data, signature)).to.be.revertedWith(
          "INV_AMOUNT"
        );
      });
    });
  });

  describe("Withdraw Generic", function () {
    const DEPOSIT_AMOUNT = 2;

    beforeEach(async function () {
      const { digest, data, signature } = await getValidDepositGeneric(
        GenericAssets.Apple,
        DEPOSIT_AMOUNT,
        player.address,
        playerstash.address,
        networkDescriptor,
        validator,
        1
      );
      await playerstash.depositGeneric(digest, data, signature);
    });

    describe("Should withdraw", function () {
      it("Should withdraw any generic asset", async function () {
        const { digest, data, signature } = await getValidWithdrawGeneric(
          GenericAssets.Apple,
          DEPOSIT_AMOUNT,
          player.address,
          playerstash.address,
          networkDescriptor,
          validator,
          2
        );
        await expect(playerstash.withdrawGeneric(digest, data, signature))
          .to.emit(playerstash, "WithdrawGeneric")
          .withArgs(player.address, GenericAssets.Apple, DEPOSIT_AMOUNT, 2);
      });
    });

    describe("Should NOT withdraw", function () {
      it("Should NOT withdraw an invalid amount", async function () {
        const { digest, data, signature } = await getValidWithdrawGeneric(
          GenericAssets.Apple,
          0,
          player.address,
          playerstash.address,
          networkDescriptor,
          validator,
          2
        );
        await expect(playerstash.withdrawGeneric(digest, data, signature)).to.be.revertedWith(
          "INV_AMOUNT"
        );
      });
      it("Should NOT withdraw if has no balance", async function () {
        const { digest, data, signature } = await getValidWithdrawGeneric(
          GenericAssets.Apple,
          DEPOSIT_AMOUNT * 2,
          player.address,
          playerstash.address,
          networkDescriptor,
          validator,
          2
        );
        await expect(playerstash.withdrawGeneric(digest, data, signature)).to.be.revertedWith(
          "NO_BALANCE"
        );
      });
    });
  });
});

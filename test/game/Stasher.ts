import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import { toWei } from "../../src/utils/misc";
import {
  getAllowedPeriodsToStash,
  getRanges,
  getTiers,
  Tier,
} from "../fixture/MouseHauntStashingFixture";

const zeroAddress = ethers.constants.AddressZero;
const INITIAL_BALANCE = toWei("1000000");
const durationInDays = 30;
const SECONDS_IN_DAY = 24 * 60 * 60;

describe("Stasher", async function () {
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let player: SignerWithAddress;
  let player2: SignerWithAddress;

  /* eslint-disable no-unused-vars */
  let deployer: SignerWithAddress;
  /* eslint-disable no-unused-vars */

  let Stasher: ContractFactory;
  let MHT: ContractFactory;

  let stasher: Contract;
  let mht: Contract;

  before(async function () {
    [deployer, owner, operator, player, player2] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // CONTRACT FACTORIES

    MHT = await ethers.getContractFactory("MouseHauntToken");
    mht = await MHT.deploy(owner.address);
    await mht.deployed();
    await mht.connect(owner).transfer(player.address, INITIAL_BALANCE);
    await mht.connect(owner).transfer(player2.address, INITIAL_BALANCE);

    Stasher = await ethers.getContractFactory("MouseHauntStashing");
    stasher = await upgrades.deployProxy(Stasher, [operator.address, mht.address]);
    await stasher.deployed();

    await stasher.connect(operator).setPaymentToken(mht.address);

    await mht.connect(player).approve(stasher.address, INITIAL_BALANCE);
    await mht.connect(player2).approve(stasher.address, INITIAL_BALANCE);

    const allowedPeriodsToStash = getAllowedPeriodsToStash();
    await stasher.connect(operator).setPeriods(allowedPeriodsToStash);

    const ranges = getRanges();
    await stasher.connect(operator).setRanges(ranges);

    const tiers = getTiers();
    await stasher.connect(operator).setTiers(tiers);
  });

  describe("Initializing", async function () {
    it("Should NOT initialize with invalid operator", async function () {
      await expect(upgrades.deployProxy(Stasher, [zeroAddress, mht.address])).to.be.revertedWith(
        "INV_ADDRESS"
      );
    });
  });

  describe("Pausable", async function () {
    it("Should pause the contract", async function () {
      await stasher.connect(operator).pause();
      expect(await stasher.paused()).to.be.true;
    });
    it("Should unpause the contract", async function () {
      await stasher.connect(operator).pause();
      await stasher.connect(operator).unpause();
      expect(await stasher.paused()).to.be.false;
    });
  });

  describe("Stash Token", async function () {
    it("Should stash token", async function () {
      await expect(stasher.connect(player).stash(INITIAL_BALANCE, durationInDays))
        .to.emit(stasher, "Stashed")
        .withArgs(1, player.address, INITIAL_BALANCE, durationInDays);
    });
    it("Should NOT stash token with invalid amount", async function () {
      await expect(stasher.connect(player).stash(0, durationInDays)).to.be.revertedWith(
        "INV_AMOUNT"
      );
    });
    it("Should NOT stash token with invalid duration", async function () {
      await expect(stasher.connect(player).stash(INITIAL_BALANCE, 0)).to.be.revertedWith(
        "INV_DURATION"
      );
    });
    it("Should NOT stash token with not enough balance", async function () {
      await mht.connect(player).transfer(stasher.address, INITIAL_BALANCE);
      await expect(
        stasher.connect(player).stash(INITIAL_BALANCE, durationInDays)
      ).to.be.revertedWith("NO_BALANCE");
    });
    it("Should NOT stash token with no allowance", async function () {
      await mht.connect(player).approve(stasher.address, 0);
      await expect(
        stasher.connect(player).stash(INITIAL_BALANCE, durationInDays)
      ).to.be.revertedWith("NOT_ENOUGH_ALLOWANCE");
    });
    it("Should NOT stash token with paused contract", async function () {
      await stasher.connect(operator).pause();
      await expect(
        stasher.connect(player).stash(INITIAL_BALANCE, durationInDays)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Getters", async function () {
    beforeEach(async function () {
      await stasher.connect(player).stash(INITIAL_BALANCE, durationInDays);
    });

    it("Should get stashed tokens", async function () {
      const playerStashes = await stasher.stashesOf(player.address);
      // console.log("playerStashes", playerStashes);
    });

    it("Should get all stash Stashes", async function () {
      const stashes = await stasher.getStashes();
      // console.log("Stashes", stashes);
    });
    it("Should get total stashed", async function () {
      const totalStashed = await stasher.totalStashed();
      // console.log("totalStashed", totalStashed);
    });
    it("Should get player balance", async function () {
      const playerBalance = await stasher.balanceOf(player.address);
      // console.log("playerBalance", playerBalance);
    });
  });

  describe("Unstash Token", async function () {
    beforeEach(async function () {
      await stasher.connect(player).stash(INITIAL_BALANCE, durationInDays);
    });
    it("Should unstash token if duration is reached", async function () {
      await ethers.provider.send("evm_increaseTime", [
        durationInDays * SECONDS_IN_DAY + 0.5 * SECONDS_IN_DAY,
      ]);

      await expect(stasher.connect(player).unstash(1))
        .to.emit(stasher, "Unstashed")
        .withArgs(1, player.address, INITIAL_BALANCE, 1);
    });
    it("Should unstash after cycles is reached", async function () {
      const cycles = 5;
      await ethers.provider.send("evm_increaseTime", [
        durationInDays * cycles * SECONDS_IN_DAY + 0.5 * SECONDS_IN_DAY,
      ]);

      await expect(stasher.connect(player).unstash(1))
        .to.emit(stasher, "Unstashed")
        .withArgs(1, player.address, INITIAL_BALANCE, cycles);
    });
    it("Should NOT unstash token that is stashed", async function () {
      await expect(stasher.connect(player).unstash(1)).to.be.revertedWith("STASHED");
    });
    it("Should NOT unstash token with invalid owner", async function () {
      await ethers.provider.send("evm_increaseTime", [durationInDays * SECONDS_IN_DAY]);
      await expect(stasher.connect(player2).unstash(1)).to.be.revertedWith("INV_OWNER");
    });
    it("Should NOT unstash token with invalid id", async function () {
      await ethers.provider.send("evm_increaseTime", [durationInDays * SECONDS_IN_DAY]);
      await expect(stasher.connect(player).unstash(2)).to.be.revertedWith("INV_ID");
    });
    it("Should NOT unstash token with paused contract", async function () {
      await stasher.connect(operator).pause();
      await expect(stasher.connect(player).unstash(1)).to.be.revertedWith("Pausable: paused");
    });
    it("Should NOT unstash twice", async function () {
      await ethers.provider.send("evm_increaseTime", [durationInDays * SECONDS_IN_DAY]);
      await expect(stasher.connect(player).unstash(1))
        .to.emit(stasher, "Unstashed")
        .withArgs(1, player.address, INITIAL_BALANCE, 1);

      await expect(stasher.connect(player).unstash(1)).to.be.revertedWith("INV_ID");
    });
    it("Should NOT unstash if 1 day is passed from the stash date", async function () {
      await ethers.provider.send("evm_increaseTime", [(durationInDays + 1.1) * SECONDS_IN_DAY]);
      await expect(stasher.connect(player).unstash(1)).to.be.revertedWith("STASHED");
    });
  });

  describe("God mode", async function () {
    const messyDurationInDays = 120;
    const depositAmount = toWei("100");
    beforeEach(async function () {
      await stasher.connect(player).stash(depositAmount, messyDurationInDays);
    });
    it("Should unstash a token with a messy duration", async function () {
      await expect(stasher.connect(operator).__godMode__unstash(1, 0))
        .to.emit(stasher, "Unstashed")
        .withArgs(1, player.address, depositAmount, 0);
    });
    it("Should NOT godMode unstash with invalid operator", async function () {
      await expect(stasher.connect(player).__godMode__unstash(1, 0)).to.be.reverted;
    });
    it("Should get player stashes correctly after god mode", async function () {
      await stasher.connect(player).stash(depositAmount, messyDurationInDays); // 2
      await stasher.connect(player).stash(depositAmount, messyDurationInDays); // 3

      const stashesBefore = await stasher.stashesOf(player.address);
      //console.log("stashesBefore:", stashesBefore);

      await stasher.connect(operator).__godMode__unstash(1, 0);

      const stashesAfter1 = await stasher.stashesOf(player.address);
      // console.log("stashesAfter1", stashesAfter1);

      await stasher.connect(player).stash(depositAmount, messyDurationInDays); // 4

      const stashesAfter2 = await stasher.stashesOf(player.address);
      // console.log("stashesAfter2", stashesAfter2);

      await stasher.connect(operator).__godMode__unstash(2, 0);

      const stashesAfter3 = await stasher.stashesOf(player.address);
      // console.log("stashesAfter3", stashesAfter3);

      await stasher.connect(player).stash(depositAmount, messyDurationInDays); // 5

      const stashesAfter4 = await stasher.stashesOf(player.address);
      // console.log("stashesAfter4", stashesAfter4);

      await stasher.connect(operator).__godMode__unstash(4, 0);

      const stashesAfter5 = await stasher.stashesOf(player.address);
      //console.log("stashesAfter5", stashesAfter5);

      const id4Index = await stasher.stashIdToStashIndex(4);
      //console.log("id4Index", id4Index);

      const id5Index = await stasher.stashIdToStashIndex(5);
      //console.log("id5Index", id5Index);
    });
  });
  describe("Calculate player tier", async function () {
    it("Gives the right Tier according to deposit amount and period", async function () {
      const stashes = getTiers();
      for (let i = 0; i < stashes.length; i++) {
        MHT = await ethers.getContractFactory("MouseHauntToken");
        mht = await MHT.deploy(owner.address);
        await mht.deployed();
        await mht.connect(owner).transfer(player.address, INITIAL_BALANCE);
        await mht.connect(owner).transfer(player2.address, INITIAL_BALANCE);

        Stasher = await ethers.getContractFactory("MouseHauntStashing");
        stasher = await upgrades.deployProxy(Stasher, [operator.address, mht.address]);
        await stasher.deployed();

        await stasher.connect(operator).setPaymentToken(mht.address);

        await mht.connect(player).approve(stasher.address, INITIAL_BALANCE);
        await mht.connect(player2).approve(stasher.address, INITIAL_BALANCE);

        const allowedPeriodsToStash = getAllowedPeriodsToStash();
        await stasher.connect(operator).setPeriods(allowedPeriodsToStash);

        const ranges = getRanges();
        await stasher.connect(operator).setRanges(ranges);

        const tiers = getTiers();
        await stasher.connect(operator).setTiers(tiers);

        const stash = stashes[i];
        await stasher.connect(player).stash(stash.range, stash.period);
        const tier = await stasher.connect(operator).tierOf(player.address);

        console.log(
          `Deposited ${ethers.utils.formatEther(stash.range)} for ${
            stash.period
          } days expecting to get Tier ${stash.tier}: got ${tier}`
        );

        expect(tier).to.be.equal(stash.tier);
      }
    });

    it("Gives the right Tier according to deposit amount (in range) and period", async function () {
      const stashes = getTiers();
      for (let i = 0; i < stashes.length; i++) {
        MHT = await ethers.getContractFactory("MouseHauntToken");
        mht = await MHT.deploy(owner.address);
        await mht.deployed();
        await mht.connect(owner).transfer(player.address, INITIAL_BALANCE);
        await mht.connect(owner).transfer(player2.address, INITIAL_BALANCE);

        Stasher = await ethers.getContractFactory("MouseHauntStashing");
        stasher = await upgrades.deployProxy(Stasher, [operator.address, mht.address]);
        await stasher.deployed();

        await stasher.connect(operator).setPaymentToken(mht.address);

        await mht.connect(player).approve(stasher.address, INITIAL_BALANCE);
        await mht.connect(player2).approve(stasher.address, INITIAL_BALANCE);

        const allowedPeriodsToStash = getAllowedPeriodsToStash();
        await stasher.connect(operator).setPeriods(allowedPeriodsToStash);

        const ranges = getRanges();
        await stasher.connect(operator).setRanges(ranges);

        const tiers = getTiers();
        await stasher.connect(operator).setTiers(tiers);

        const stash = stashes[i];
        await stasher.connect(player).stash(stash.range.add("20000000000000000000"), stash.period);
        const tier = await stasher.connect(operator).tierOf(player.address);

        console.log(
          `Deposited ${ethers.utils.formatEther(stash.range.add("20000000000000000000"))} for ${
            stash.period
          } days expecting to get Tier ${stash.tier}: got ${tier}`
        );

        expect(tier).to.be.equal(stash.tier);
      }
    });

    it("Gives the right Tier when user composes his stash", async function () {
      await stasher.connect(player).stash(toWei("60"), 30);
      await stasher.connect(player).stash(toWei("60"), 30);
      await stasher.connect(player).stash(toWei("60"), 30);
      await stasher.connect(player).stash(toWei("60"), 30);
      await stasher.connect(player).stash(toWei("60"), 30);
      await stasher.connect(player).stash(toWei("60"), 30);
      await stasher.connect(player).stash(toWei("60"), 30);
      await stasher.connect(player).stash(toWei("60"), 30);
      // Total of 480 MHT for 30 days. Should get Tier NIL
      let tier = await stasher.connect(operator).tierOf(player.address);
      expect(tier).to.be.equal(Tier.NIL);

      await stasher.connect(player).stash(toWei("60"), 30);
      // Total of 540 MHT for 30 days. Should get Tier F
      tier = await stasher.connect(operator).tierOf(player.address);
      expect(tier).to.be.equal(Tier.F);

      await stasher.connect(player).stash(toWei("460"), 30);
      // Total of 1000 MHT for 30 days. Should get Tier E
      tier = await stasher.connect(operator).tierOf(player.address);
      expect(tier).to.be.equal(Tier.E);

      await stasher.connect(player).stash(toWei("1400"), 30);
      // Total of 2400 MHT for 30 days. Should get Tier E
      tier = await stasher.connect(operator).tierOf(player.address);
      expect(tier).to.be.equal(Tier.E);

      await stasher.connect(player).stash(toWei("100"), 30);
      // Total of 2500 MHT for 30 days. Should get Tier D
      tier = await stasher.connect(operator).tierOf(player.address);
      expect(tier).to.be.equal(Tier.D);

      await stasher.connect(player).stash(toWei("2500"), 30);
      // Total of 5000 MHT for 30 days. Should get Tier B
      tier = await stasher.connect(operator).tierOf(player.address);
      expect(tier).to.be.equal(Tier.B);

      await stasher.connect(player).stash(toWei("9999"), 30);
      // Total of 14999 MHT for 30 days. Should get Tier B
      tier = await stasher.connect(operator).tierOf(player.address);
      expect(tier).to.be.equal(Tier.B);

      await stasher.connect(player).stash(toWei("1"), 30);
      // Total of 15000 MHT for 30 days. Should get Tier A
      tier = await stasher.connect(operator).tierOf(player.address);
      expect(tier).to.be.equal(Tier.A);

      await stasher.connect(player).stash(toWei("10000"), 30);
      // Total of 25000 MHT for 30 days. Should get Tier A
      tier = await stasher.connect(operator).tierOf(player.address);
      expect(tier).to.be.equal(Tier.A);
    });

    it("Logs weird sums and Tiers: Case A", async function () {
      await stasher.connect(player).stash(toWei("1000"), 60);
      let tier = await stasher.connect(operator).tierOf(player.address);
      expect(tier).to.be.equal(Tier.D);

      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const timestampBefore = blockBefore.timestamp;

      // +30 days
      await ethers.provider.send("evm_setNextBlockTimestamp", [timestampBefore + 2592000]);
      //await ethers.provider.send("evm_mine", []);

      await stasher.connect(player).stash(toWei("1500"), 30);
      tier = await stasher.connect(operator).tierOf(player.address);
      expect(tier).to.be.equal(Tier.D);
    });
  });

  describe("Preview player tier", async function () {
    it("Gives the right Tier according to deposit amount and period", async function () {
      const stashes = getTiers();
      for (let i = 0; i < stashes.length; i++) {
        MHT = await ethers.getContractFactory("MouseHauntToken");
        mht = await MHT.deploy(owner.address);
        await mht.deployed();
        await mht.connect(owner).transfer(player.address, INITIAL_BALANCE);
        await mht.connect(owner).transfer(player2.address, INITIAL_BALANCE);

        Stasher = await ethers.getContractFactory("MouseHauntStashing");
        stasher = await upgrades.deployProxy(Stasher, [operator.address, mht.address]);
        await stasher.deployed();

        await stasher.connect(operator).setPaymentToken(mht.address);

        await mht.connect(player).approve(stasher.address, INITIAL_BALANCE);
        await mht.connect(player2).approve(stasher.address, INITIAL_BALANCE);

        const allowedPeriodsToStash = getAllowedPeriodsToStash();
        await stasher.connect(operator).setPeriods(allowedPeriodsToStash);

        const ranges = getRanges();
        await stasher.connect(operator).setRanges(ranges);

        const tiers = getTiers();
        await stasher.connect(operator).setTiers(tiers);

        const stash = stashes[i];
        const previewTier = await stasher
          .connect(player)
          .previewTierOf(player.address, stash.range, stash.period);
        await stasher.connect(player).stash(stash.range, stash.period);
        const tier = await stasher.connect(operator).tierOf(player.address);

        console.log(` expecting to get Tier ${previewTier}: got ${tier}`);

        expect(previewTier).to.be.equal(tier);
      }
    });
  });
});

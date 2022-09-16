import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import BN from "bignumber.js";

/* eslint-disable node/no-missing-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MouseHauntToken, Farm, Farm__factory } from "../../typechain";
import { getValidWithdrawClaim, WithdrawClaimData } from "../fixture/FarmFixture";

import { OPERATOR_ROLE } from "../../src/utils/roles";

/* eslint-disable node/no-missing-import */
describe("Farm", function () {
  // A very explicit way of fetching and naming accounts that will be used during the tests
  let operator: SignerWithAddress;
  let validator1: SignerWithAddress;
  let validator2: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  // Contracts
  let farm: Contract;
  let mht: MouseHauntToken;

  // Default values
  const networkDescriptor = 56;
  const mhtAmount = new BN("10000000000000000000000");

  const withdrawId = 1;

  const withdrawAmount1 = mhtAmount.div(10);
  const tax1 = withdrawAmount1.times(0.5); // 50%
  const burn1 = withdrawAmount1.times(0.045); // 4.5%

  const withdrawAmount2 = mhtAmount;
  const tax2 = 0; // 0%
  const burn2 = withdrawAmount2.times(0.035); // 3.5%

  const withdrawAmount3 = mhtAmount.times(2);
  const tax3 = 0; // 0%
  const burn3 = withdrawAmount3.times(0.025); // 2.5%

  before(async function () {
    [operator, validator1, validator2, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const mhtFactory = await ethers.getContractFactory("MouseHauntToken");
    mht = await mhtFactory.deploy(operator.address);
    await mht.deployed();

    const FarmFactory = await ethers.getContractFactory("Farm");
    farm = await upgrades.deployProxy(FarmFactory, [
      networkDescriptor,
      [validator1.address, validator2.address],
      operator.address,
      mht.address,
    ]);
    await farm.deployed();

    // send MHT to the Farm
    await mht.transfer(farm.address, mhtAmount.toFixed());
  });

  describe("Iniatialize Farm", function () {
    it("Should initialize with correct values", async function () {
      const isValidator1Correct = await farm.validators(validator1.address);
      expect(isValidator1Correct).to.be.true;

      const isValidator2Correct = await farm.validators(validator2.address);
      expect(isValidator2Correct).to.be.true;

      const hasOperatorRole = await farm.hasRole(OPERATOR_ROLE, operator.address);
      expect(hasOperatorRole).to.be.equal(true);
    });

    it("Should allow the operator to change the token", async function () {
      await farm.setToken(user2.address);
      const token = await farm.token();
      expect(token).to.be.equal(user2.address);
    });

    it("Should withdraw with a valid withdraw claim", async function () {
      const claimData: WithdrawClaimData = {
        guardianAddress: farm.address,
        playerAddress: user1.address,
        net: withdrawAmount1.toFixed(),
        tax: tax1.toFixed(),
        burn: burn1.toFixed(),
        networkDescriptor,
        playerNonce: 1,
        withdrawId,
      };

      const { digest, signature } = await getValidWithdrawClaim(validator1, claimData);

      expect(await (farm as Farm).connect(user1).withdraw(digest, claimData, signature))
        .to.emit(farm, "Withdraw")
        .withArgs(
          user1.address,
          withdrawAmount1.toFixed(),
          tax1.toFixed(),
          burn1.toFixed(),
          1,
          withdrawId
        );

      const farmBalance = await mht.balanceOf(farm.address);
      const user1Balance = await mht.balanceOf(user1.address);
      expect(farmBalance).to.be.equal(mhtAmount.minus(withdrawAmount1.plus(burn1)).toFixed());
      expect(user1Balance).to.be.equal(withdrawAmount1.toFixed());
    });

    it("Should revert with an invalid withdraw claim (wrong nonce)", async function () {
      const claimData: WithdrawClaimData = {
        guardianAddress: farm.address,
        playerAddress: user1.address,
        net: withdrawAmount1.toFixed(),
        tax: tax1.toFixed(),
        burn: burn1.toFixed(),
        networkDescriptor,
        playerNonce: 2,
        withdrawId,
      };

      const { digest, signature } = await getValidWithdrawClaim(validator1, claimData);

      await expect(farm.connect(user1).withdraw(digest, claimData, signature)).to.be.revertedWith(
        "INV_NONCE"
      );

      const farmBalance = await mht.balanceOf(farm.address);
      const user1Balance = await mht.balanceOf(user1.address);
      expect(farmBalance).to.be.equal(mhtAmount.toFixed());
      expect(user1Balance).to.be.equal(0);
    });

    it("Should revert with an invalid withdraw claim (wrong validator)", async function () {
      const claimData: WithdrawClaimData = {
        guardianAddress: farm.address,
        playerAddress: user1.address,
        net: withdrawAmount1.toFixed(),
        tax: tax1.toFixed(),
        burn: burn1.toFixed(),
        networkDescriptor,
        playerNonce: 1,
        withdrawId,
      };

      const { digest, signature } = await getValidWithdrawClaim(user1, claimData);

      await expect(farm.connect(user1).withdraw(digest, claimData, signature)).to.be.revertedWith(
        "INV_VALIDATOR"
      );

      const farmBalance = await mht.balanceOf(farm.address);
      const user1Balance = await mht.balanceOf(user1.address);
      expect(farmBalance).to.be.equal(mhtAmount.toFixed());
      expect(user1Balance).to.be.equal(0);
    });

    it("Should revert with an invalid withdraw claim (wrong network descriptor)", async function () {
      const claimData: WithdrawClaimData = {
        guardianAddress: farm.address,
        playerAddress: user1.address,
        net: withdrawAmount1.toFixed(),
        tax: tax1.toFixed(),
        burn: burn1.toFixed(),
        networkDescriptor: 2,
        playerNonce: 1,
        withdrawId,
      };

      const { digest, signature } = await getValidWithdrawClaim(validator1, claimData);

      await expect(farm.connect(user1).withdraw(digest, claimData, signature)).to.be.revertedWith(
        "INV_NETWORK"
      );

      const farmBalance = await mht.balanceOf(farm.address);
      const user1Balance = await mht.balanceOf(user1.address);
      expect(farmBalance).to.be.equal(mhtAmount.toFixed());
      expect(user1Balance).to.be.equal(0);
    });

    it("Should revert with an invalid withdraw claim (wrong farm contract)", async function () {
      const claimData: WithdrawClaimData = {
        guardianAddress: user2.address,
        playerAddress: user1.address,
        net: withdrawAmount1.toFixed(),
        tax: tax1.toFixed(),
        burn: burn1.toFixed(),
        networkDescriptor,
        playerNonce: 1,
        withdrawId,
      };

      const { digest, signature } = await getValidWithdrawClaim(validator1, claimData);

      await expect(farm.connect(user1).withdraw(digest, claimData, signature)).to.be.revertedWith(
        "INV_GUARDIAN"
      );

      const farmBalance = await mht.balanceOf(farm.address);
      const user1Balance = await mht.balanceOf(user1.address);
      expect(farmBalance).to.be.equal(mhtAmount.toFixed());
      expect(user1Balance).to.be.equal(0);
    });

    it("Should revert if the contract doesn't have funds to transfer", async function () {
      const claimData: WithdrawClaimData = {
        guardianAddress: farm.address,
        playerAddress: user1.address,
        net: withdrawAmount3.toFixed(),
        tax: tax3.toFixed(),
        burn: burn3.toFixed(),
        networkDescriptor,
        playerNonce: 1,
        withdrawId,
      };

      const { digest, signature } = await getValidWithdrawClaim(validator1, claimData);

      await expect(farm.connect(user1).withdraw(digest, claimData, signature)).to.be.revertedWith(
        "ERC20: transfer amount exceeds balance"
      );

      const farmBalance = await mht.balanceOf(farm.address);
      const user1Balance = await mht.balanceOf(user1.address);
      expect(farmBalance).to.be.equal(mhtAmount.toFixed());
      expect(user1Balance).to.be.equal(0);
    });

    it("Should revert if the contract doesn't have funds to burn", async function () {
      const claimData: WithdrawClaimData = {
        guardianAddress: farm.address,
        playerAddress: user1.address,
        net: withdrawAmount2.toFixed(),
        tax: tax2.toFixed(),
        burn: burn2.toFixed(),
        networkDescriptor,
        playerNonce: 1,
        withdrawId,
      };

      const { digest, signature } = await getValidWithdrawClaim(validator1, claimData);

      await expect(farm.connect(user1).withdraw(digest, claimData, signature)).to.be.revertedWith(
        "ERC20: transfer amount exceeds balance"
      );

      const farmBalance = await mht.balanceOf(farm.address);
      const user1Balance = await mht.balanceOf(user1.address);
      expect(farmBalance).to.be.equal(mhtAmount.toFixed());
      expect(user1Balance).to.be.equal(0);
    });

    it("Should revert if paused", async function () {
      await farm.connect(operator).pause();

      const claimData: WithdrawClaimData = {
        guardianAddress: farm.address,
        playerAddress: user1.address,
        net: withdrawAmount1.toFixed(),
        tax: tax1.toFixed(),
        burn: burn1.toFixed(),
        networkDescriptor,
        playerNonce: 1,
        withdrawId,
      };

      const { digest, signature } = await getValidWithdrawClaim(validator1, claimData);

      await expect(farm.connect(user1).withdraw(digest, claimData, signature)).to.be.revertedWith(
        "Pausable: paused"
      );

      const farmBalance = await mht.balanceOf(farm.address);
      const user1Balance = await mht.balanceOf(user1.address);
      expect(farmBalance).to.be.equal(mhtAmount.toFixed());
      expect(user1Balance).to.be.equal(0);
    });
  });
});

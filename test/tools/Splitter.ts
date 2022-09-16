import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
/* eslint-disable node/no-missing-import */
import { OPERATOR_ROLE } from "../../src/utils/roles";
import { print, colors, logGasDiff } from "../../src/utils/misc";
/* eslint-disable node/no-missing-import */

const gasProfiling = {
  use: false,
  previous: {
    transfer: 51736, // the cost of a normal ERC20 transfer to a 0-balance address
    batch3Transfers: 51736 * 3,
    batch6Transfers: 51736 * 6,
    batch9Transfers: 51736 * 9,
    batch12Transfers: 51736 * 12,
  },
};

describe("Splitter", function () {
  // A very explicit way of fetching and naming accounts that will be used during the tests
  let deployer: SignerWithAddress;
  let operator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;
  let user5: SignerWithAddress;
  let user6: SignerWithAddress;
  let user7: SignerWithAddress;
  let user8: SignerWithAddress;
  let user9: SignerWithAddress;
  let user10: SignerWithAddress;
  let user11: SignerWithAddress;
  let user12: SignerWithAddress;

  let mht: Contract;
  let splitter: Contract;

  const operatorFunds = 1000;

  before(async function () {
    [
      deployer,
      operator,
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      user8,
      user9,
      user10,
      user11,
      user12,
    ] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // Redeploy the MHT and mint to the deployer
    const mhtFactory = await ethers.getContractFactory("MouseHauntToken");
    mht = await mhtFactory.deploy(deployer.address);
    await mht.deployed();

    // Redeploy the Splitter
    const splitterFactory = await ethers.getContractFactory("Splitter");
    splitter = await splitterFactory.deploy();
    await splitter.deployed();

    // Set the operator as Splitter operator
    await expect(splitter.grantRole(OPERATOR_ROLE, operator.address))
      .to.emit(splitter, "RoleGranted")
      .withArgs(OPERATOR_ROLE, operator.address, deployer.address);

    // Send the operator some money
    await mht.transfer(operator.address, operatorFunds);

    // Operator grants the Splitter allowance
    await mht.connect(operator).approve(splitter.address, operatorFunds);
  });

  describe("Split", async function () {
    it("Should send money to one user", async function () {
      const user1BalanceBefore = await mht.balanceOf(user1.address);
      const operatorBalanceBefore = await mht.balanceOf(operator.address);
      const mhtToTransfer = operatorFunds / 2;

      // Operator sends half of what he has to user1
      await splitter.connect(operator).send(mht.address, [user1.address], [mhtToTransfer]);

      // Check if user1 received the money
      const user1BalanceAfter = await mht.balanceOf(user1.address);
      const user1BalanceDiff = user1BalanceAfter - user1BalanceBefore;
      expect(user1BalanceDiff).to.equal(mhtToTransfer);

      // Check if the money left the operator's account
      const operatorBalanceAfter = await mht.balanceOf(operator.address);
      const operatorBalanceDiff = operatorBalanceBefore - operatorBalanceAfter;
      expect(operatorBalanceDiff).to.equal(mhtToTransfer);
    });

    it("Should send money to three users", async function () {
      const user1BalanceBefore = await mht.balanceOf(user1.address);
      const user2BalanceBefore = await mht.balanceOf(user2.address);
      const user3BalanceBefore = await mht.balanceOf(user3.address);
      const operatorBalanceBefore = await mht.balanceOf(operator.address);
      const mhtToTransfer = operatorFunds / 4;

      // Operator sends money to users
      await splitter
        .connect(operator)
        .send(
          mht.address,
          [user1.address, user2.address, user3.address],
          [mhtToTransfer, mhtToTransfer, mhtToTransfer]
        );

      // Check if user1 received the money
      const user1BalanceAfter = await mht.balanceOf(user1.address);
      const user1BalanceDiff = user1BalanceAfter - user1BalanceBefore;
      expect(user1BalanceDiff).to.equal(mhtToTransfer);

      // Check if user2 received the money
      const user2BalanceAfter = await mht.balanceOf(user2.address);
      const user2BalanceDiff = user2BalanceAfter - user2BalanceBefore;
      expect(user2BalanceDiff).to.equal(mhtToTransfer);

      // Check if user3 received the money
      const user3BalanceAfter = await mht.balanceOf(user3.address);
      const user3BalanceDiff = user3BalanceAfter - user3BalanceBefore;
      expect(user3BalanceDiff).to.equal(mhtToTransfer);

      // Check if the money left the operator's account
      const operatorBalanceAfter = await mht.balanceOf(operator.address);
      const operatorBalanceDiff = operatorBalanceBefore - operatorBalanceAfter;
      expect(operatorBalanceDiff).to.equal(mhtToTransfer * 3);
    });

    it("Should NOT send money to users from a non-operator account", async function () {
      // Send user3 some money
      await mht.transfer(operator.address, operatorFunds);

      // user3 grants the Splitter allowance
      await mht.connect(user3).approve(splitter.address, operatorFunds);

      const user1BalanceBefore = await mht.balanceOf(user1.address);
      const user3BalanceBefore = await mht.balanceOf(user3.address);
      const mhtToTransfer = operatorFunds / 2;

      // Operator sends half of what he has to user1
      await expect(
        splitter.connect(user3).send(mht.address, [user1.address], [mhtToTransfer])
      ).to.be.revertedWith(
        `AccessControl: account ${user3.address.toLowerCase()} is missing role ${OPERATOR_ROLE}`
      );

      // Check if user1 received the money
      const user1BalanceAfter = await mht.balanceOf(user1.address);
      const user1BalanceDiff = user1BalanceAfter - user1BalanceBefore;
      expect(user1BalanceDiff).to.equal(0);

      // Check if the money left the operator's account
      const user3BalanceAfter = await mht.balanceOf(user3.address);
      const user3BalanceDiff = user3BalanceBefore - user3BalanceAfter;
      expect(user3BalanceDiff).to.equal(0);
    });
  });

  describe("GAS", async function () {
    it("Should allow us to estimate gas costs of splitting an ERC20 token to a single user", async function () {
      // Operator sends half of what he has to user1
      const tx = await splitter.connect(operator).send(mht.address, [user1.address], [100]);

      const receipt = await tx.wait();
      const total = Number(receipt.gasUsed);

      if (gasProfiling.use) {
        logGasDiff("Transfer", gasProfiling.previous.transfer, total);
      } else {
        print(colors.cyan, `~~~~~~~~~~~~\nGas: ${total}`);
      }
    });

    it("Should allow us to estimate gas costs of splitting an ERC20 token to 3 users", async function () {
      // Operator sends half of what he has to user1
      const tx = await splitter
        .connect(operator)
        .send(mht.address, [user1.address, user2.address, user3.address], [100, 100, 100]);

      const receipt = await tx.wait();
      const total = Number(receipt.gasUsed);

      if (gasProfiling.use) {
        logGasDiff("Batch 3", gasProfiling.previous.batch3Transfers, total);
      } else {
        print(colors.cyan, `~~~~~~~~~~~~\nGas: ${total}`);
      }
    });

    it("Should allow us to estimate gas costs of splitting an ERC20 token to 6 users", async function () {
      // Operator sends half of what he has to user1
      const tx = await splitter
        .connect(operator)
        .send(
          mht.address,
          [
            user1.address,
            user2.address,
            user3.address,
            user4.address,
            user5.address,
            user6.address,
          ],
          [100, 100, 100, 100, 100, 100]
        );

      const receipt = await tx.wait();
      const total = Number(receipt.gasUsed);

      if (gasProfiling.use) {
        logGasDiff("Batch 6", gasProfiling.previous.batch6Transfers, total);
      } else {
        print(colors.cyan, `~~~~~~~~~~~~\nGas: ${total}`);
      }
    });

    it("Should allow us to estimate gas costs of splitting an ERC20 token to 9 users", async function () {
      // Operator sends half of what he has to user1
      const tx = await splitter
        .connect(operator)
        .send(
          mht.address,
          [
            user1.address,
            user2.address,
            user3.address,
            user4.address,
            user5.address,
            user6.address,
            user7.address,
            user8.address,
            user9.address,
          ],
          [100, 100, 100, 100, 100, 100, 100, 100, 100]
        );

      const receipt = await tx.wait();
      const total = Number(receipt.gasUsed);

      if (gasProfiling.use) {
        logGasDiff("Batch 9", gasProfiling.previous.batch9Transfers, total);
      } else {
        print(colors.cyan, `~~~~~~~~~~~~\nGas: ${total}`);
      }
    });

    it("Should allow us to estimate gas costs of splitting an ERC20 token to 12 users", async function () {
      // Operator sends half of what he has to user1
      const tx = await splitter
        .connect(operator)
        .send(
          mht.address,
          [
            user1.address,
            user2.address,
            user3.address,
            user4.address,
            user5.address,
            user6.address,
            user7.address,
            user8.address,
            user9.address,
            user10.address,
            user11.address,
            user12.address,
          ],
          [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]
        );

      const receipt = await tx.wait();
      const total = Number(receipt.gasUsed);

      if (gasProfiling.use) {
        logGasDiff("Batch 12", gasProfiling.previous.batch12Transfers, total);
      } else {
        print(colors.cyan, `~~~~~~~~~~~~\nGas: ${total}`);
      }
    });
  });
});

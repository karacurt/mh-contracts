import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import BN from "bignumber.js";

/* eslint-disable node/no-missing-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { getAllowedAmounts } from "../fixture/MhtOnRampFixture";
import { toWei } from "../../src/utils/misc";

/* eslint-disable node/no-missing-import */
describe("MHTOnRamp", function () {
  // A very explicit way of fetching and naming accounts that will be used during the tests
  let operator: SignerWithAddress;
  let validator1: SignerWithAddress;
  let validator2: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  // Contracts
  let farm: Contract;
  let mht: Contract;
  let mhtOnRamp: Contract;

  // Default values
  const networkDescriptor = 56;
  const mhtAmount = new BN("10000000000000000000000");

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
    const swapFeePercentage = toWei("2.05");

    const MhtOnRamp = await ethers.getContractFactory("MhtOnRamp");
    mhtOnRamp = await upgrades.deployProxy(MhtOnRamp, [
      operator.address,
      mht.address,
      farm.address,
      '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',//pancakeswaprouter testnet
      '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee', //busd address testnet
      swapFeePercentage,
      operator.address,//treasury
    ]);
    await mhtOnRamp.deployed();

    await mht.transfer(farm.address, mhtAmount.toFixed());
    await mht.transfer(user1.address, mhtAmount.toFixed());
    await mht.connect(user1).approve(mhtOnRamp.address, mhtAmount.toFixed());

    const allowedAmounts = await getAllowedAmounts();
    await mhtOnRamp.connect(operator).setAllowedAmounts(allowedAmounts);
  });

  describe("Deposit", function () {
    const quantityPack1 = 0
    const quantityPack2 = 1
    const quantityPack3 = 1;
    const quantity = [quantityPack1, quantityPack2, quantityPack3];
    it("should allow deposit", async function () {
      await mhtOnRamp.connect(user1).deposit(quantity);
    })
  });
});

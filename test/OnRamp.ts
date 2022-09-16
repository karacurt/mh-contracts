import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";

const zeroAddress = ethers.constants.AddressZero;
const toWei = ethers.utils.parseEther;
const initialBalance = toWei("10000");
const slippagePercentage = toWei("2");
const swapFeePercentage = toWei("2.05");

describe("UniswapV2Twap", () => {
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let operator: SignerWithAddress;
  /* eslint-disable no-unused-vars */
  let deployer: SignerWithAddress;
  /* eslint-disable no-unused-vars */

  let OnRamp: ContractFactory;
  let MHT: ContractFactory;
  let BUSD: ContractFactory;

  let onramp: Contract;
  let mht: Contract;
  let busd: Contract;

  /* eslint-disable no-unused-vars */
  before(async function () {
    [deployer, owner, operator, user] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // CONTRACT FACTORIES

    MHT = await ethers.getContractFactory("MouseHauntToken");
    mht = await MHT.deploy(owner.address);
    await mht.deployed();
    OnRamp = await ethers.getContractFactory("OnRamp");
    onramp = await upgrades.deployProxy(OnRamp, [
      "0xD99D1c33F9fC3444f8101754aBC46c52416550D1", //pancakeswaprouter testnet
      //"0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd", //wbnb address testnet wbnb
      "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee", //busd address testnet
      mht.address,
      swapFeePercentage,
    ]);
    await onramp.deployed();

    await mht.connect(owner).transfer(user.address, initialBalance);
    await mht.connect(user).approve(onramp.address, initialBalance);
  });

  it.skip("should calculate slipagge correctly ..", async () => {
    const amount = toWei("100");

    const minValue = await onramp.connect(user).slippageMinValueOf(amount);
    const maxValue = await onramp.connect(user).slippageMaxValueOf(amount);

    console.log("amount", ethers.utils.formatEther(amount));
    console.log("slippagePercentage: ", ethers.utils.formatEther(slippagePercentage), "%");
    console.log("minValue", ethers.utils.formatEther(minValue));
    console.log("maxValue", ethers.utils.formatEther(maxValue));
  });
  it("should calculate swapFee correctly ..", async () => {
    const amount = toWei("100");

    const value = await onramp.connect(user).swapFeeOf(amount);

    console.log("swap fee: ", ethers.utils.formatEther(value), "%");
    console.log("amount", ethers.utils.formatEther(value));
  });
  it.skip("should swap correctly ..", async () => {
    // @Karacurt, ajusta esse teste, pls?
    const amount = toWei("1");
    const targetMHT = toWei("1");

    const value = await onramp.connect(user).buyMHT(amount, targetMHT);

    console.log("swap value: ", value);
  });
});

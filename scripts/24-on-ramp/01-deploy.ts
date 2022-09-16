import { ethers, upgrades } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();
import { print, colors, confirmOrDie } from "../../src/utils/misc";

const toWei = ethers.utils.parseEther;
const swapFeePercentage = toWei("2.05");

async function main() {
  print(colors.highlight, `Deploying OnRamp on ${CONFIG.name}...`);

  await confirmOrDie(`Are you sure you would like to deploy the OnRamp on ${CONFIG.name}?`);

  const OnRamp = await ethers.getContractFactory("OnRamp");
  const onramp = await upgrades.deployProxy(OnRamp, [
    //"0xD99D1c33F9fC3444f8101754aBC46c52416550D1", //pancakeswaprouter testnet
    //"0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd", //weth address testnet
    //"0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee", //busd address testnet
    "0x10ED43C718714eb63d5aA57B78B54704E256024E", // pancakeswaprouter MAINNET
    "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // busd MAINNET
    CONFIG.MouseHauntToken.address,
    swapFeePercentage,
  ]);
  await onramp.deployed();

  console.log("OnRamp deployed to:", onramp.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

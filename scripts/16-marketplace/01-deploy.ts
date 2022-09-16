import { ethers, upgrades } from "hardhat";
/* eslint-disable node/no-missing-import */
import { print, colors } from "../../src/utils/misc";

import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

async function main() {
  print(colors.highlight, `Deploying Marketplace on ${CONFIG.name}...`);

  const swapFeePercentage = ethers.utils.parseEther("2.05");

  const MarketplaceFactory = await ethers.getContractFactory("MarketplaceV3");
  const marketplace = await upgrades.deployProxy(MarketplaceFactory, [
    CONFIG.MouseHauntToken.address,
    "50000", //ownerCutPerMillion
    "0", //publicationFeeInWei
    CONFIG.Marketplace.owner, //treasury
    CONFIG.BUSD.address, //BUSD address
    "0x10ED43C718714eb63d5aA57B78B54704E256024E", //PancakeSwapRouter address
    swapFeePercentage, //swapFeePercentage
    CONFIG.Marketplace.owner, //vault (can be zero)
  ]);

  await marketplace.deployed();

  print(colors.bigSuccess, `Marketplace deployed to: ${marketplace.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

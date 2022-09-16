import { ethers, upgrades } from "hardhat";
import { print, colors, confirmOrDie } from "../../src/utils/misc";

import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

const MARKETPLACE_CURRENT_CONTRACT = "MarketplaceV3";
const MARKETPLACE_NEW_CONTRACT = "MarketplaceV3AntiMEV";

async function main() {
  print(colors.highlight, `Upgrading ${MARKETPLACE_CURRENT_CONTRACT} on ${CONFIG.name}...`);

  print(
    colors.cyan,
    `${MARKETPLACE_CURRENT_CONTRACT} current address: ${CONFIG[MARKETPLACE_CURRENT_CONTRACT].address}`
  );

  await confirmOrDie(
    `Are you sure you would like to upgrade ${MARKETPLACE_CURRENT_CONTRACT} with ${MARKETPLACE_NEW_CONTRACT} on ${CONFIG.name}?`
  );

  const UpgradedMarketplaceFactory = await ethers.getContractFactory(MARKETPLACE_NEW_CONTRACT);
  const upgradedMarketplace = await upgrades.upgradeProxy(
    CONFIG[MARKETPLACE_CURRENT_CONTRACT].address,
    UpgradedMarketplaceFactory
  );

  await upgradedMarketplace.deployed();

  print(colors.bigSuccess, `Marketplace upgraded! Address: ${upgradedMarketplace.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

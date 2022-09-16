import { ethers, upgrades } from "hardhat";
import { print, colors, confirmOrDie } from "../../src/utils/misc";

import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

const NEW_CONTRACT = "MhtOnRamp";

async function main() {
  print(colors.highlight, `Upgrading the MhtOnRamp on ${CONFIG.name}...`);

  await confirmOrDie(
    `Are you sure you would like to upgrade the MhtOnRamp with ${NEW_CONTRACT} on ${CONFIG.name}?`
  );

  const UpgradedFactory = await ethers.getContractFactory(NEW_CONTRACT);
  const upgradedMarketplace = await upgrades.upgradeProxy(
    CONFIG.MhtOnRamp.address,
    UpgradedFactory
  );

  await upgradedMarketplace.deployed();

  print(colors.bigSuccess, `MhtOnRamp upgraded! Address: ${upgradedMarketplace.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

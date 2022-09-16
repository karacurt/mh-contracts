import { ethers, upgrades } from "hardhat";
import { print, colors, confirmOrDie } from "../../src/utils/misc";

import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

const NEW_CONTRACT = "OnRamp";

async function main() {
  print(colors.highlight, `Upgrading the OnRamp on ${CONFIG.name}...`);

  await confirmOrDie(
    `Are you sure you would like to upgrade the Marketplace with ${NEW_CONTRACT} on ${CONFIG.name}?`
  );

  const UpgradedFactory = await ethers.getContractFactory(NEW_CONTRACT);
  const upgradedContract = await upgrades.upgradeProxy(CONFIG.OnRamp.address, UpgradedFactory);

  await upgradedContract.deployed();

  print(colors.bigSuccess, `OnRamp upgraded! Address: ${upgradedContract.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers, upgrades } from "hardhat";
import { print, colors, confirmOrDie } from "../../src/utils/misc";

import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

const NEW_CONTRACT = "SwapTransfer";

async function main() {
  print(colors.highlight, `Upgrading the Swap on ${CONFIG.name}...`);

  await confirmOrDie(
    `Are you sure you would like to upgrade the Swap with ${NEW_CONTRACT} on ${CONFIG.name}?`
  );

  const UpgradedSwapFactory = await ethers.getContractFactory(NEW_CONTRACT);
  const upgradedSwap = await upgrades.upgradeProxy(CONFIG.Swap.address, UpgradedSwapFactory);

  await upgradedSwap.deployed();

  print(colors.bigSuccess, `Swap upgraded! Address: ${upgradedSwap.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

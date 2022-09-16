import { ethers, upgrades } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();
import { print, colors, confirmOrDie } from "../../src/utils/misc";

import {
  getAllowedPeriodsToStash,
  getRanges,
  getTiers,
} from "../../test/fixture/MouseHauntStashingFixture";

async function main() {
  print(colors.highlight, `Deploying Stasher on ${CONFIG.name}...`);

  await confirmOrDie(`Are you sure you would like to deploy the Stasher on ${CONFIG.name}?`);

  const Stasher = await ethers.getContractFactory("MouseHauntStashing");
  const stasher = await upgrades.deployProxy(Stasher, [
    CONFIG.MouseHauntStashing.owner, //don't forget to add the contract operator before deploy
    CONFIG.MouseHauntToken.address, //trusted token already setted
  ]);

  const deployTx = await stasher.deployed();
  print(colors.success, `Deploy done TX: ${deployTx.hash}`);
  print(colors.bigSuccess, `Stasher deployed to: ${stasher.address}`);

  //const trustedTokensTx = await stasher.setTrustedToken(CONFIG.MouseHauntToken.address);
  //print(colors.success, `Register TX done: ${trustedTokensTx.hash}`);

  const allowedPeriods = getAllowedPeriodsToStash();
  print(colors.cyan, `Setting allowedPeriods: ${JSON.stringify(allowedPeriods)}`);
  const periodsTx = await stasher.setPeriods(allowedPeriods);
  print(colors.success, `Set Periods done, TX: ${periodsTx.hash}`);

  const ranges = getRanges();
  print(colors.cyan, `Setting ranges: ${JSON.stringify(ranges)}`);
  const rangesTx = await stasher.setRanges(ranges);
  print(colors.success, `Set Ranges done, TX: ${rangesTx.hash}`);

  const tiers = getTiers();
  print(colors.cyan, `Setting tiers: ${JSON.stringify(tiers)}`);
  const tiersTx = await stasher.setTiers(tiers);
  print(colors.success, `Set Tiers done, TX: ${tiersTx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers, upgrades } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();
import { print, colors, confirmOrDie } from "../../src/utils/misc";
import { BURN_FEE_PERCENTAGE } from "../../test/fixture/SwapFixture";
const toWei = ethers.utils.parseEther;

async function main() {
  print(colors.highlight, `Deploying Swap on ${CONFIG.name}...`);

  await confirmOrDie(`Are you sure you would like to deploy the Swap on ${CONFIG.name}?`);

  const burnFeePercentage = toWei(BURN_FEE_PERCENTAGE);

  const Swap = await ethers.getContractFactory("Swap");
  const swap = await upgrades.deployProxy(Swap, [
    CONFIG.Swap.owner,
    CONFIG.Swap.treasury,
    CONFIG.MouseHauntToken.address,
    CONFIG.MouseHero.address,
    burnFeePercentage,
    CONFIG.MouseHauntStashing.address,
  ]);
  await swap.deployed();

  console.log("Swap deployed to:", swap.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

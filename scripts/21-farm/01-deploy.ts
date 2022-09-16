import { ethers, upgrades } from "hardhat";
import { print, colors } from "../../src/utils/misc";
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

async function main() {
  print(colors.wait, `Deploying Farm on ${CONFIG.name}...`);

  const FarmFactory = await ethers.getContractFactory("Farm");
  const farm = await upgrades.deployProxy(FarmFactory, [
    CONFIG.chainId,
    CONFIG.Farm.validators,
    CONFIG.Farm.operator,
    CONFIG.MouseHauntToken.address,
  ]);

  await farm.deployed();
  print(colors.success, `Farm deployed to: ${farm.address}`);

  print(colors.bigSuccess, `~~~ DONE ~~~`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

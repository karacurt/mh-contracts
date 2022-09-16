import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

import { print, colors, confirmOrDie } from "../../src/utils/misc";

async function main() {
  print(colors.highlight, `Deploying MouseHauntNFTBox on ${CONFIG.name}...`);

  await confirmOrDie(
    `Are you sure you would like to deploy the MouseHauntNFTBox on ${CONFIG.name}?`
  );

  const MouseHauntBoxFactory = await ethers.getContractFactory("MouseHauntBox");

  const name = "Legendary Ghost Box";
  const symbol = "MHGBL";
  const maxSupply = 2000000;
  const operator = CONFIG.BGL.owner;
  const nftAddress = CONFIG.Ghost.address;

  const mousehauntbox = await MouseHauntBoxFactory.deploy(
    name,
    symbol,
    operator,
    nftAddress,
    maxSupply
  );

  await mousehauntbox.deployed();

  console.log(`Mouse Haunt Box - ${name} deployed to:`, mousehauntbox.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

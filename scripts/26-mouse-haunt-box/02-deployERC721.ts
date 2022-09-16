import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

import { print, colors, confirmOrDie } from "../../src/utils/misc";

const name = "Legendary Ghost Box NFT";
const symbol = "MHGBL";
const baseTokenURI = "https://nft.mousehaunt.com/public/boxes/ghost/legendary/";
const nftAddress = "0x4A701fa920339D484e10deA12871bc5c7C88a18f";
const launchPadAddress = "0x4A701fa920339D484e10deA12871bc5c7C88a18f";
const maxSupply = 50000;
//const nftAddress = CONFIG.GhostVillain.address; // TODO: after deploying it, change it on the blockchain!

async function main() {
  print(colors.highlight, `Deploying ${name} on ${CONFIG.name}...`);

  await confirmOrDie(
    `Are you sure you would like to deploy the ${name} (${symbol}) on ${CONFIG.name}?`
  );

  const MouseHauntBoxFactory = await ethers.getContractFactory("NftMouseHauntBox");

  const mousehauntbox = await MouseHauntBoxFactory.deploy(
    name,
    symbol,
    baseTokenURI,
    nftAddress,
    launchPadAddress,
    maxSupply
  );

  await mousehauntbox.deployed();

  print(colors.bigSuccess, `${name} (${symbol}) deployed to: ${mousehauntbox.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

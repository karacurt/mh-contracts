import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const BMHTG = await ethers.getContractFactory("BMHTG");
  const bmhtg = await BMHTG.deploy(config[network].BMHTG.owner);

  await bmhtg.deployed();

  console.log("BMHTG deployed to:", bmhtg.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

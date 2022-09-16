import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const BMHTL = await ethers.getContractFactory("BMHTL");
  const bmhtl = await BMHTL.deploy(config[network].BMHTL.owner);

  await bmhtl.deployed();

  console.log("BMHTL deployed to:", bmhtl.address);

  const BMHTE = await ethers.getContractFactory("BMHTE");
  const bmhte = await BMHTE.deploy(config[network].BMHTE.owner);

  await bmhte.deployed();

  console.log("BMHTE deployed to:", bmhte.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

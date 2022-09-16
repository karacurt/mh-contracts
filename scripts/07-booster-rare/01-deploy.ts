import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const BMHTR = await ethers.getContractFactory("BMHTR");
  const bmhtr = await BMHTR.deploy(config[network].BMHTR.owner);

  await bmhtr.deployed();

  console.log("BMHTR deployed to:", bmhtr.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

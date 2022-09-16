import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const MouseHauntToken = await ethers.getContractFactory("MouseHauntToken");
  const mht = await MouseHauntToken.deploy(config[network].MouseHauntToken.owner);

  await mht.deployed();

  console.log("Mouse Haunt Token deployed to:", mht.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

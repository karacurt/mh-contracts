import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const BMHTHFactory = await ethers.getContractFactory("BMHTH");
  const bmhth = await BMHTHFactory.deploy(
    config[network].BMHTH.owner,
    config[network].MouseHero.address
  );

  await bmhth.deployed();

  console.log("BMHTH deployed to:", bmhth.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

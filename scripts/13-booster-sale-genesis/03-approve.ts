import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const BMHTG = await ethers.getContractFactory("BMHTG");
  const bmhtg = BMHTG.attach(config[network].BMHTG.address);

  console.log(
    "BoosterSaleGenesis approve",
    config[network].BoosterSale.Genesis.address,
    bmhtg.address,
    config[network].BoosterSale.Genesis.available
  );

  await bmhtg.approve(
    config[network].BoosterSale.Genesis.address,
    config[network].BoosterSale.Genesis.available
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

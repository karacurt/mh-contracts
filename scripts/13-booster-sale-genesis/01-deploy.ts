import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const wei = ethers.utils.parseEther;

  const BoosterSaleGenesis = await ethers.getContractFactory("BoosterSaleGenesis");
  const boosterSaleGenesis = await BoosterSaleGenesis.deploy(
    config[network].BoosterSale.Genesis.owner,
    config[network].MouseHauntToken.address,
    config[network].BMHTG.address,
    wei(config[network].BoosterSale.Genesis.mhtPrice)
  );

  await boosterSaleGenesis.deployed();

  console.log("BoosterSaleGenesis deployed to:", boosterSaleGenesis.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

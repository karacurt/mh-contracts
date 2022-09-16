import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const wei = ethers.utils.parseEther;

  const BoosterSale = await ethers.getContractFactory("BoosterSale");
  const boosterSale = await BoosterSale.deploy(
    config[network].BoosterSale.PrivateSale1.owner,
    config[network].BUSD.address,
    config[network].BMHTL.address,
    config[network].BMHTE.address,
    wei(config[network].BoosterSale.PrivateSale1.BMHTL.busdPrice),
    wei(config[network].BoosterSale.PrivateSale1.BMHTE.busdPrice)
  );

  await boosterSale.deployed();

  console.log("BoosterSale deployed to:", boosterSale.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

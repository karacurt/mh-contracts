import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const wei = ethers.utils.parseEther;

  const BoosterSale3 = await ethers.getContractFactory("BoosterSale3");
  const boosterSale3 = await BoosterSale3.deploy(
    config[network].BoosterSale.PrivateSale3.owner,
    config[network].BUSD.address,
    config[network].BMHTE.address,
    config[network].BMHTR.address,
    wei(config[network].BoosterSale.PrivateSale3.BMHTE.busdPrice),
    wei(config[network].BoosterSale.PrivateSale3.BMHTR.busdPrice)
  );

  await boosterSale3.deployed();

  console.log("BoosterSale3 deployed to:", boosterSale3.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const BMHTL = await ethers.getContractFactory("BMHTL");
  const bmhtl = BMHTL.attach(config[network].BMHTL.address);

  const BMHTE = await ethers.getContractFactory("BMHTE");
  const bmhte = BMHTE.attach(config[network].BMHTE.address);

  const BoosterSale = await ethers.getContractFactory("BoosterSale");
  const boosterSale = BoosterSale.attach(config[network].BoosterSale.PrivateSale1.address);

  const wei = ethers.utils.parseEther;

  console.log(
    "BoosterSale approve",
    boosterSale.address,
    bmhtl.address,
    wei(config[network].BoosterSale.PrivateSale1.BMHTL.available),
    bmhte.address,
    wei(config[network].BoosterSale.PrivateSale1.BMHTE.available)
  );

  await bmhtl.approve(
    boosterSale.address,
    wei(config[network].BoosterSale.PrivateSale1.BMHTL.available)
  );
  await bmhte.approve(
    boosterSale.address,
    wei(config[network].BoosterSale.PrivateSale1.BMHTE.available)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

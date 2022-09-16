import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const BMHTE = await ethers.getContractFactory("BMHTE");
  const bmhte = BMHTE.attach(config[network].BMHTE.address);

  const BMHTR = await ethers.getContractFactory("BMHTR");
  const bmhtr = BMHTR.attach(config[network].BMHTR.address);

  const BoosterSale3 = await ethers.getContractFactory("BoosterSale3");
  const boosterSale3 = BoosterSale3.attach(config[network].BoosterSale.PrivateSale3.address);

  const wei = ethers.utils.parseEther;

  console.log(
    "BoosterSale3 approve",
    boosterSale3.address,
    bmhte.address,
    wei(config[network].BoosterSale.PrivateSale3.BMHTE.available).toString(),
    bmhtr.address,
    config[network].BoosterSale.PrivateSale3.BMHTR.available
  );

  await bmhte.approve(
    boosterSale3.address,
    wei(config[network].BoosterSale.PrivateSale2.BMHTE.available)
  );

  await bmhtr.approve(
    boosterSale3.address,
    config[network].BoosterSale.PrivateSale3.BMHTR.available
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

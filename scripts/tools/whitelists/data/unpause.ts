import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const BoosterSale3 = await ethers.getContractFactory("BoosterSale3");
  const boosterSale3 = BoosterSale3.attach(config[network].BoosterSale.PrivateSale3.address);

  console.log("BoosterSale unpause");
  const tx = await boosterSale3.unpause();

  await tx.wait();

  const WhitelistSale = await ethers.getContractFactory("WhitelistSale");
  const privateSale3 = WhitelistSale.attach(config[network].WhitelistSale.PrivateSale3.address);

  console.log("Private Sale unpause");
  await privateSale3.unpause();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

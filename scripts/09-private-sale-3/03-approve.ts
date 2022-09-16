import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const MouseHauntToken = await ethers.getContractFactory("MouseHauntToken");
  const mht = MouseHauntToken.attach(config[network].MouseHauntToken.address);

  const wei = ethers.utils.parseEther;
  const amount = wei(config[network].WhitelistSale.PrivateSale3.available);

  console.log(`MHT approve`, config[network].WhitelistSale.PrivateSale3.address, amount.toString());

  await mht.approve(config[network].WhitelistSale.PrivateSale3.address, amount);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const MouseHauntToken = await ethers.getContractFactory("MouseHauntToken");
  const mht = MouseHauntToken.attach(config[network].MouseHauntToken.address);
  const wei = ethers.utils.parseEther;

  for await (const sale of config[network].WhitelistSale.PreSales) {
    const amount = wei(sale.amount);

    console.log(`MHT approve`, sale.address, amount.toString());

    await mht.approve(sale.address, amount);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const WhitelistSale = await ethers.getContractFactory("WhitelistSale");
  for await (const sale of config[network].WhitelistSale.PreSales) {
    const whitelistSale = WhitelistSale.attach(sale.address);

    await whitelistSale.addToWhitelist([sale.whitelisted]);

    console.log("PreSale", sale.address, "Whitelisted", sale.whitelisted);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

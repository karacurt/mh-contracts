import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const WhitelistSale = await ethers.getContractFactory("WhitelistSale");

  const preSales = [
    config[network].WhitelistSale.PrivateSale1,
    config[network].WhitelistSale.PrivateSale2,
    config[network].WhitelistSale.PrivateSale3,
    ...config[network].WhitelistSale.PreSales,
  ];

  for await (const sale of preSales) {
    const whitelistSale = WhitelistSale.attach(sale.address);

    const isPaused = await whitelistSale.paused();
    try {
      if (isPaused) {
        console.log(`WhitelistSale ${sale.address} unpause`);
        await whitelistSale.unpause();
      } else {
        console.log(`WhitelistSale ${sale.address} not paused`);
      }
      const timestamp = config[network].WhitelistSale.igoTimestamp;
      console.log(`WhitelistSale ${sale.address} set IGO timestamp to ${timestamp}`);
      await whitelistSale.setIgoTimestamp(timestamp);
    } catch (err: any) {
      console.log(err.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

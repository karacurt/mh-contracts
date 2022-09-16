import { ethers } from "hardhat";

// eslint-disable-next-line node/no-missing-import
import { print, colors, wei } from "../../src/utils/misc";
import { getContractAt } from "../../src/utils/support";
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

const marketplaceContractName = "MarketplaceV3";
const tokenSymbol = "MouseHero";

const orderId = "1";

async function main() {
  print(colors.highlight, `Cancelling Order ${orderId} on ${CONFIG.name}...`);

  const markeplace = await getContractAt(marketplaceContractName, CONFIG.Marketplace.address);

  const tx = await markeplace.cancelOrder(orderId);
  print(colors.magenta, `TX: ${JSON.stringify(tx, null, 2)}`);
  print(colors.bigSuccess, `Order cancelled. Tx:${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from "hardhat";

// eslint-disable-next-line node/no-missing-import
import { print, colors, wei } from "../../src/utils/misc";
import { getContractAt } from "../../src/utils/support";
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

const marketplaceContractName = "MarketplaceV3";
const tokenSymbol = "MouseHero";

const tokenId = "35839";

async function main() {
  print(colors.highlight, `Creating Sell Order on ${CONFIG.name}...`);

  const markeplace = await getContractAt(marketplaceContractName, CONFIG.Marketplace.address);

  const tokenFactory = await ethers.getContractFactory("MouseHero");
  const token = tokenFactory.attach(CONFIG[tokenSymbol].address);

  const allowanceTx = await token.approve(markeplace.address, tokenId);
  await allowanceTx.wait();

  const tx = await markeplace.createOrder(token.address, tokenId, 1, wei("1"));
  print(colors.magenta, `TX: ${JSON.stringify(tx, null, 2)}`);
  print(colors.bigSuccess, `Order created. Tx:${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

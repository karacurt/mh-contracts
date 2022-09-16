import { ethers } from "hardhat";

// eslint-disable-next-line node/no-missing-import
import { print, colors, wei } from "../../src/utils/misc";
import { getContractAt } from "../../src/utils/support";
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

const marketplaceContractName = "Marketplace";
const orderId = "97";

async function main() {
  print(colors.highlight, `Creating Sell Order on ${CONFIG.name}...`);

  const markeplace = await getContractAt(
    marketplaceContractName,
    CONFIG[marketplaceContractName].address
  );

  const mht = await getContractAt("MouseHauntToken", CONFIG["MouseHauntToken"].address);

  const allowanceTx = await mht.approve(markeplace.address, "99999999999999999999999");
  await allowanceTx.wait();
  const tx = await markeplace.executeOrder(orderId);

  print(colors.magenta, `TX: ${JSON.stringify(tx, null, 2)}`);

  print(colors.bigSuccess, `Order executed. Tx:${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

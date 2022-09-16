import { print, colors, confirmOrDie } from "../../src/utils/misc";

import * as ENV from "../../src/utils/env";
import { getContractAt } from "../../src/utils/support";
const CONFIG = ENV.getConfig();

const MARKETPLACE_NEW_CONTRACT = "MarketplaceV2";

async function main() {
  print(colors.highlight, `Upgrading the Marketplace on ${CONFIG.name}...`);

  await confirmOrDie(
    `Are you sure you would like to set version in the Marketplace on ${CONFIG.name}?`
  );

  const marketplace = await getContractAt(MARKETPLACE_NEW_CONTRACT, CONFIG["Marketplace"].address);
  const lastOrderId = await marketplace.getOrderCount();
  const orderId = lastOrderId.sub(1).toString();

  const tx = await marketplace.setVersionToOrderId(1, orderId);

  print(colors.bigSuccess, `Marketplace Version setted! tx: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

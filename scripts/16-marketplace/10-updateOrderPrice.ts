const BN = require("bignumber.js");

import { print, colors, toWeiString, random, delay, confirmOrDie } from "../../src/utils/misc";
import { getContractAt } from "../../src/utils/support";

import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

const marketplaceContractName = "MarketplaceV3Auction";
const marketplaceConfigName = "MarketplaceV3";

const orderIds = [14];
const priceUpdateMinPercentage: any = 2;
const priceUpdateMaxPercentage: any = 4;
//const minimumPrice = 1270;
const minimumPrice = 2;
const minimumPriceBN = BN(toWeiString(minimumPrice.toString())); // this is in Ether!

const DRY_RUN = false;
const delayTime = DRY_RUN ? 200 : 10 * 1000; // 10 seconds

// The mktplace contract
let marketplace: any;

async function main() {
  print(colors.highlight, `Updating price for orders ${orderIds} on ${CONFIG.name}...`);
  if (DRY_RUN) {
    print(colors.h_green, "THIS IS A DRY RUN. NOTHING WILL BE SENT TO THE BLOCKHAIN.");
  }

  marketplace = await getContractAt(marketplaceContractName, CONFIG[marketplaceConfigName].address);

  await confirmOrDie(`Are you sure you would like to update orders ${orderIds} on ${CONFIG.name}?`);

  for (let j = 0; j < 100; j++) {
    let newPrice;
    for (let i = 0; i < orderIds.length; i++) {
      newPrice = await getRandomNewValue(orderIds[i]);

      if (DRY_RUN) {
        print(
          colors.h_cyan,
          `Would have updated order ${orderIds[i]} with a new price: ${newPrice} MHT`
        );
      } else {
        // @SOL: updateOrderPrice(uint256 orderId, uint256 newPrice)
        const tx = await marketplace.updateOrderPrice(orderIds[i], newPrice);
        await tx.wait();
        print(
          colors.bigSuccess,
          `Order ${orderIds[i]} updated with a new price: ${newPrice} MHT\nTx Hash:${tx.hash}`
        );
      }

      await delay(delayTime);
    }
  }
}

async function getRandomNewValue(orderId: number) {
  // Fetch the actual currentPrice
  const order = await marketplace.getOrder(orderId);
  const currentPriceBN = BN(String(order[5]));

  // If it's already at minimum, print and return;
  if (currentPriceBN.lte(minimumPriceBN)) {
    print(colors.h_magenta, `Price of order ${orderId} is already at minimum. Skipping.`);
  }

  // Apply a random percentual decrement
  const randomResult = Number(random(priceUpdateMinPercentage, priceUpdateMaxPercentage, 0)); // number between 5 and 10
  const multiplier = 1 - randomResult / 100;
  let newPriceBN = currentPriceBN.times(BN(multiplier));

  // Pick Math.max between the new price and the minimum price
  if (newPriceBN.lte(minimumPriceBN)) {
    print(colors.highlight, `Lowest price reached for order ${orderId}`);
    newPriceBN = BN(toWeiString(minimumPrice.toString()));
  }

  // Return the new price in WeiString
  return newPriceBN.toString();
}

main().catch((error) => {
  print(colors.error, error?.error);
  console.error(error);
  process.exitCode = 1;
});

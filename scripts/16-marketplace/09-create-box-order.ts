import { print, colors, wei, random, delay, confirmOrDie } from "../../src/utils/misc";
import { getContractAt } from "../../src/utils/support";
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

const marketplaceContractName = "MarketplaceV3";
const tokenSymbol = "BMHTH";

const amountToSell = 19;
const initialPrice = 88;
const priceStepMin = 0.1;
const priceStepMax = 0.8;

const DRY_RUN = false;
const delayTime = DRY_RUN ? 200 : 2 * 1000; // 2 seconds

async function main() {
  print(colors.highlight, `Creating ${tokenSymbol} Sell Orders on ${CONFIG.name}...`);
  if (DRY_RUN) {
    print(colors.h_green, "THIS IS A DRY RUN. NOTHING WILL BE SENT TO THE BLOCKHAIN.");
  }

  const marketplace = await getContractAt(
    marketplaceContractName,
    CONFIG[marketplaceContractName].address
  );
  const token = await getContractAt(tokenSymbol, CONFIG[tokenSymbol].address);

  await confirmOrDie(
    `Are you sure you would like to create ${amountToSell} sell orders of ${tokenSymbol} on ${CONFIG.name}?`
  );

  if (DRY_RUN) {
  } else {
    const allowanceTx = await token.approve(marketplace.address, amountToSell);
    await allowanceTx.wait();
  }

  let currentVal;
  for (let i = 0; i < amountToSell; i++) {
    if (i === 0) {
      currentVal = initialPrice;
    } else {
      currentVal = getRandomNewValue(currentVal);
    }

    if (DRY_RUN) {
      print(
        colors.h_cyan,
        `Would have created order:\nTokenAddress: ${token.address}\nPrice: ${currentVal} MHT`
      );
    } else {
      const tx = await marketplace.createOrder(token.address, 0, 1, wei(currentVal.toString()));
      await tx.wait();
      print(colors.bigSuccess, `Order created for ${currentVal} MHT.\nTx Hash:${tx.hash}`);
    }

    await delay(delayTime);
  }
}

function getRandomNewValue(currentValue: any) {
  return Number(currentValue) + Number(random(priceStepMin, priceStepMax));
}

main().catch((error) => {
  print(colors.error, error?.error);
  console.error(error);
  process.exitCode = 1;
});

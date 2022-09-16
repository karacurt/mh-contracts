import Web3 from "web3";

import { print, colors } from "../../../src/utils/misc";
import splitterTargets from "./data/splitterTargets11_REFUND_CALC.json";

// Will print the final list of recipients
const PRINT_RECIPIENT_LIST = true;

// The number of Months passed since the first airdrop
const MONTHS_SO_FAR = 4;

// Percentage paid on contract signed
const INITIAL_AIRDROP_PCT = 8;

// How much each KOL receives per month
const MONTHLY_ALLOCATION_PCT = (100 - INITIAL_AIRDROP_PCT) / 12;

// How much should the refund be
//const REFUND_PCT = 100 - INITIAL_AIRDROP_PCT - MONTHLY_ALLOCATION_PCT * MONTHS_SO_FAR;
const REFUND_PCT = 61;

async function main() {
  splitterTargets.forEach((item) => {
    item.refundInBUSD = String(Number(item.AllocationGranted_BUSD) * (Number(REFUND_PCT) / 100));
  });

  if (PRINT_RECIPIENT_LIST) {
    //print(colors.highlight, `finalRecipientList: ${JSON.stringify(splitterTargets, null, 2)}`);
  }

  let toBeRefunded: any = [];
  let toBeContinued: any = [];
  let totalRefundInBUSD = 0;
  let totalRefundKols = 0;
  let totalMHTToSend = 0;
  let totalMHTKols = 0;
  splitterTargets.forEach((item) => {
    if (item.askedForRefund) {
      totalRefundInBUSD += Number(item.refundInBUSD);
      totalRefundKols++;
      toBeRefunded.push(item);
    } else {
      totalMHTToSend += Number(Web3.utils.fromWei(item.amount));
      totalMHTKols++;
      toBeContinued.push(item);
    }
  });

  print(colors.h_green, `Using a refund percentage of ${REFUND_PCT}%`);
  print(
    colors.h_yellow,
    `There are ${totalRefundKols} KOLs that asked for a refund. We'll spend ${totalRefundInBUSD} BUSD in total.`
  );
  print(
    colors.h_yellow,
    `There are ${totalMHTKols} KOLs that will continue with us. We'll spend ${totalMHTToSend} MHT in total.`
  );

  // Now, prepare the list to be checked by George
  toBeRefunded.forEach((item: any) => {
    item.MHT_per_month = item.amount;
    delete item.amount;
    delete item.TXID;
    delete item.MHT_per_month;
  });

  toBeContinued.forEach((item: any) => {
    item.MHT_per_month = item.amount;
    delete item.amount;
    delete item.TXID;
    delete item.refundInBUSD;
  });

  print(colors.h_blue, `To be Refunded list: ${JSON.stringify(toBeRefunded, null, 2)}`);
  print(colors.h_cyan, `To be Continued list: ${JSON.stringify(toBeContinued, null, 2)}`);

  print(colors.bigSuccess, `~~~ DONE ~~~`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

import Web3 from "web3";
import { getContractAt } from "../../../src/utils/support";
import { print, colors, confirmOrDie } from "../../../src/utils/misc";
import * as ENV from "../../../src/utils/env";
const CONFIG = ENV.getConfig();

import splitterTargets from "./data/toBeRefunded.json";

const BN = require("bignumber.js");

// If this is true, we'll multiply amounts by 1e18
const AMOUNTS_ARE_IN_ETHER = true;

// Should we just run the algo without sending tokens, for testing purposes only?
const DRY_RUN = true;

// Will print the final list of recipients
const PRINT_RECIPIENT_LIST = true;

// We'll send MHT if this is true, and send BUSD if it's not true;
const TOKEN_IS_MHT = false;

async function main() {
  const tokenScreenName = TOKEN_IS_MHT ? "MHT" : "BUSD";

  print(colors.highlight, `Running the Splitter on ${CONFIG.name}`);
  if (DRY_RUN) {
    print(colors.h_green, `THIS IS A DRY RUN! TOKENS WILL NOT BE TRANSFERRED.`);
  }

  // Log the grand total
  const grandAmounts = splitterTargets.map((item) => item.refundInBUSD);
  let grandTotal = grandAmounts.reduce((a, b) => BN(a).plus(BN(b)).toFixed());
  if (AMOUNTS_ARE_IN_ETHER) {
    splitterTargets.forEach((item) => {
      item.refundInBUSD = Web3.utils.toWei(item.refundInBUSD as string);
    });

    grandTotal = Web3.utils.toWei(grandTotal as string);
  }

  if (PRINT_RECIPIENT_LIST) {
    print(colors.highlight, `finalRecipientList: ${JSON.stringify(splitterTargets, null, 2)}`);
  }

  print(
    colors.h_cyan,
    `Will send a grand total of ${grandTotal} ${tokenScreenName} to ${splitterTargets.length} addresses`
  );

  await confirmOrDie(`Are you sure you would like to continue this script on ${CONFIG.name}?`);

  // Connect to the Splitter
  const splitter = await getContractAt("Splitter", CONFIG.Splitter.address);

  let token;
  if (TOKEN_IS_MHT) {
    // Connect to MHT (the splitter could be used for any BEP20 token, but we want MHT right now)
    token = await getContractAt("MouseHauntToken", CONFIG.MouseHauntToken.address);
  } else {
    //BUSD:
    token = await getContractAt("MouseHauntToken", "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56");
  }

  // Approve an allowance to the splitter:
  if (DRY_RUN) {
    print(colors.success, `[would have sent the allowance TX]`);
  } else {
    print(colors.wait, `Approving an allowance to the Splitter...`);
    const approveTx = await token.approve(splitter.address, grandTotal);
    const approveReceipt = await approveTx.wait();
    print(colors.success, `ApproveTx Hash: ${approveReceipt.transactionHash}`);
  }

  // Now iterate through the list and create chunks of no more than 500 recipients
  const STEP = 500;
  const START = 0;
  for (let i = START; i * STEP < splitterTargets.length; i++) {
    const from = i * STEP;
    const to = (i + 1) * STEP;
    const targets = [...splitterTargets].slice(from, to);
    const addresses = targets.map((item) => item.address);
    const amounts = targets.map((item) => item.refundInBUSD);
    const total = amounts.reduce((a, b) => BN(a).plus(BN(b)).toFixed());

    print(
      colors.wait,
      `Round ${i + 1}/${Math.ceil(
        splitterTargets.length / STEP
      )}: Sending a total of ${total} tokens to ${Math.min(
        to - 1,
        splitterTargets.length
      )} addresses...`
    );

    if (DRY_RUN) {
      print(
        colors.success,
        `Transaction [would have been] sent. Total: ${total} ${tokenScreenName}`
      );
    } else {
      const tx = await splitter.send(token.address, addresses, amounts);
      print(colors.success, `Transaction sent: ${tx.hash}`);
    }
  }

  print(colors.bigSuccess, `~~~ DONE ~~~`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

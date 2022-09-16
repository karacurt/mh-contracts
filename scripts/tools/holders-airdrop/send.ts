import { ethers } from "hardhat";
import Web3 from "web3";
/* eslint-disable node/no-missing-import */
import { getContractAt } from "../../../src/utils/support";
import * as ENV from "../../../src/utils/env";
const CONFIG = ENV.getConfig();
import { print, colors, confirmOrDie } from "../../../src/utils/misc";
/* eslint-disable node/no-missing-import */
import splitterTargets from "./data/june-5th.json";

const BN = require("bignumber.js");

// If this is true, we'll multiply amounts by 1e18
const AMOUNTS_ARE_IN_ETHER = true;

// Should we just run the algo without sending tokens, for testing purposes only?
const DRY_RUN = true;

// We'll send MHT if this is true, and send BUSD if it's not true;
const TOKEN_IS_MHT = true;

// Will log the final JSON
const SHOW_TARGETS = true;

const airdropBonus: any = {
  E: "7.5",
  D: "15",
  C: "30",
  B: "50",
  A: "75",
  S: "112.5",
  SS: "250",
};

async function main() {
  const tokenScreenName = TOKEN_IS_MHT ? "MHT" : "BUSD";

  print(colors.highlight, `Running the Splitter on ${CONFIG.name}`);

  const prunedTargets = [];
  const noTierTargets = [];
  for (let i = 0; i < splitterTargets.length; i++) {
    const element = splitterTargets[i];
    if (element.tier && element.tier !== "F") {
      element.amount = airdropBonus[element.tier];
      prunedTargets.push(element);
    } else {
      noTierTargets.push(element);
      //console.log(`NO TIER! element: ${JSON.stringify(element, null, 2)}`);
    }
  }

  print(colors.magenta, `noTierTargets: ${noTierTargets.length}`);

  // Log the grand total
  const grandAmounts = prunedTargets.map((item) => item.amount);
  let grandTotal = grandAmounts.reduce((a, b) => String(BN(a).plus(BN(b))));
  if (AMOUNTS_ARE_IN_ETHER) {
    prunedTargets.forEach((item) => {
      item.amount = Web3.utils.toWei(item.amount as string);
    });

    grandTotal = Web3.utils.toWei(grandTotal as string);
  }

  print(
    colors.h_cyan,
    `Will send a grand total of ${grandTotal} ${tokenScreenName} to ${prunedTargets.length} addresses`
  );

  if (SHOW_TARGETS) {
    print(colors.h_green, `TARGETS: ${JSON.stringify(prunedTargets, null, 2)}`);
  }

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
  for (let i = START; i * STEP < prunedTargets.length; i++) {
    const from = i * STEP;
    const to = (i + 1) * STEP;
    const targets = [...prunedTargets].slice(from, to);
    const addresses = targets.map((item) => item.address);
    const amounts = targets.map((item) => item.amount);
    const total = BN(amounts.reduce((a, b) => String(BN(a).plus(BN(b))))).toFixed();

    print(
      colors.wait,
      `Round ${i + 1}/${Math.ceil(
        prunedTargets.length / STEP
      )}: Sending a total of ${total} tokens to ${addresses.length} addresses...`
    );

    if (DRY_RUN) {
      print(colors.success, `Transaction [would have been] sent. Total: ${total}`);
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

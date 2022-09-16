import { ethers } from "hardhat";
import Web3 from "web3";
/* eslint-disable node/no-missing-import */
import { getContractAt } from "../../../src/utils/support";
import { print, colors, confirmOrDie, delay } from "../../../src/utils/misc";
import * as ENV from "../../../src/utils/env";
const CONFIG = ENV.getConfig();
/* eslint-disable node/no-missing-import */
import targets from "./data/2022-may-busd.json";

const BN = ethers.BigNumber;

const AMOUNTS_ARE_IN_ETHER = true;

const USE_BUSD = true;

const DRY_RUN = false;

async function main() {
  print(colors.highlight, `Running the Salary Payer on ${CONFIG.name}`);
  if (DRY_RUN) {
    print(colors.h_green, `THIS IS A DRY RUN: NO TOKENS WILL BE TRANSFERRED`);
  }

  // Log the grand total
  const grandAmounts = targets.map((item) => item.amount);
  let grandTotal = grandAmounts.reduce((a, b) => String(BN.from(a).add(BN.from(b))));
  print(
    colors.h_cyan,
    `Will send a grand total of ${grandTotal} tokens to ${targets.length} addresses`
  );

  await confirmOrDie("Are you sure you would like to continue?");

  if (AMOUNTS_ARE_IN_ETHER) {
    targets.forEach((item) => {
      item.amount = Web3.utils.toWei(item.amount);
    });

    grandTotal = Web3.utils.toWei(grandTotal);
  }

  // print(colors.highlight, `Final list: ${JSON.stringify(targets, null, 2)}`);

  // Either BUSD or MHT
  const tokenAddress = USE_BUSD
    ? "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
    : CONFIG.MouseHauntToken.address;

  // Dev, ignore the name "MouseHauntToken" here, it's just an ERC20 interface! It works for both MHT and BUSD.
  const token = await getContractAt("MouseHauntToken", tokenAddress);

  for (let i = 0; i < targets.length; i++) {
    print(
      colors.wait,
      `Sending to: ${targets[i]["Full Name"]} (${targets[i].address} - ${targets[i].amount} tokens)`
    );

    if (DRY_RUN) {
      print(
        colors.success,
        `[DRY RUN] Would have sent a Transaction to ${targets[i]["Full Name"]} (${targets[i].address} - ${targets[i].amount} tokens)`
      );
    } else {
      const tx = await token.transfer(targets[i].address, targets[i].amount);
      print(
        colors.success,
        `Transaction sent to ${targets[i]["Full Name"]} (${targets[i].address} - ${targets[i].amount} MHT): ${tx.hash}`
      );

      await delay(10000);
    }
  }

  print(colors.bigSuccess, `~~~ DONE ~~~`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

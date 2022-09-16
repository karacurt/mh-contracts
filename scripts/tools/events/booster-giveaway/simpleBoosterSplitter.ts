import { ethers } from "hardhat";
/* eslint-disable node/no-missing-import */
import { getContractAt } from "../../../../src/utils/support";
import { print, colors, confirmOrDie } from "../../../../src/utils/misc";

import * as ENV from "../../../../src/utils/env";
const CONFIG = ENV.getConfig();
/* eslint-disable node/no-missing-import */
import splitterTargets from "./event-08.json";

import { Splitter } from "../../../../typechain";

const BN = ethers.BigNumber;

type ContractName = "BMHTL" | "BMHTE" | "BMHTR" | "BMHTG" | "BMHTH";

interface Recipient {
  booster: string;
  address: string;
  amount: string;
}

let splitter: Splitter;

// If true, won't actually send the tokens
const DRY_RUN = false;

// Will print the final list of recipients
const PRINT_RECIPIENT_LIST = true;

// Do we expect an array of address only? If so, we must fill the following constants:
const FROM_RAW_LIST_OF_ADDRESSES = true;
const DEFAULT_BOX_NAME = "Heroic";
const DEFAULT_AMOUNT = "20";

async function main() {
  print(colors.highlight, `Running the Splitter on ${CONFIG.name}`);
  if (DRY_RUN) {
    print(colors.h_green, `THIS IS A DRY RUN! TOKENS WILL NOT BE TRANSFERRED.`);
  }

  // Connect to the Splitter
  splitter = (await getContractAt("Splitter", CONFIG.Splitter.address)) as Splitter;

  // Enrich the list
  const list = enrichList(splitterTargets);

  // for loop to send to each list
  print(colors.wait, `Looping through the list...`);
  if (list.length > 0) {
    await send(screenNameToContractName(DEFAULT_BOX_NAME) as ContractName, list);
  }

  // success message
  print(colors.bigSuccess, `~~~ DONE ~~~`);
}

function enrichList(targets: any) {
  print(colors.wait, `Enriching list...`);

  let finalTargets = [];
  if (FROM_RAW_LIST_OF_ADDRESSES) {
    print(colors.cyan, `FROM_RAW_LIST_OF_ADDRESSES: true`);
    for (let i = 0; i < targets.length; i++) {
      const address = targets[i];
      finalTargets.push({
        address,
        booster: DEFAULT_BOX_NAME,
        amount: DEFAULT_AMOUNT,
      });
    }
  } else {
    finalTargets = targets;
  }

  print(colors.success, `List has been enriched`);

  return finalTargets;
}

function screenNameToContractName(screenName: string): ContractName | null {
  switch (screenName) {
    case "Rare":
      return "BMHTR";

    case "Epic":
      return "BMHTE";

    case "Legendary":
      return "BMHTL";

    case "Genesis":
      return "BMHTG";

    case "Heroic":
      return "BMHTH";

    default:
      return null;
  }
}

async function send(contractName: ContractName, recipients: Recipient[]) {
  print(colors.wait, `Sending...`);

  // Log the grand total
  const grandAmounts = recipients.map((item) => item.amount);
  const grandTotal = grandAmounts.reduce((a, b) => String(BN.from(a).add(BN.from(b))));
  print(
    colors.h_cyan,
    `Will send a grand total of ${grandTotal} ${contractName} to ${recipients.length} addresses`
  );

  // Connect to the token
  const tokenConfig = CONFIG[contractName];
  const token = await getContractAt(contractName, tokenConfig.address);

  // Adjust amounts in case we have decimals
  let finalRecipientList: Recipient[];
  if (tokenConfig.decimals > 0) {
    finalRecipientList = recipients.map((item) => {
      item.amount = ethers.utils.parseEther(item.amount).toString();
      return item;
    });
  } else {
    finalRecipientList = recipients;
  }

  if (PRINT_RECIPIENT_LIST) {
    print(colors.highlight, `finalRecipientList: ${JSON.stringify(finalRecipientList, null, 2)}`);
  }

  await confirmOrDie(`Are you sure you would like to continue this script on ${CONFIG.name}?`);

  // Approve an allowance to the splitter:
  print(colors.wait, `Approving an allowance to the Splitter...`);
  let approveTx;
  let approveReceipt;
  if (DRY_RUN) {
    print(colors.success, `[DRY RUN] ApproveTx Hash: xxxxxxxxxxxxxx`);
  } else {
    approveTx = await token.approve(splitter.address, grandTotal);
    approveReceipt = await approveTx.wait();
    print(colors.success, `ApproveTx Hash: ${approveReceipt.transactionHash}`);
  }

  // Now iterate through the list and create chunks of no more than 500 recipients
  const STEP = 500;
  const START = 0;
  for (let i = START; i * STEP < finalRecipientList.length; i++) {
    const from = i * STEP;
    const to = (i + 1) * STEP;
    const targets = [...finalRecipientList].slice(from, to - 1);
    const addresses = targets.map((item) => item.address);
    const amounts = targets.map((item) => item.amount);
    const total = amounts.reduce((a, b) => String(BN.from(a).add(BN.from(b))));

    print(
      colors.wait,
      `Round ${i + 1}/${Math.ceil(
        finalRecipientList.length / STEP
      )}: Sending a total of ${total} ${contractName} to ${Math.min(
        to - 1,
        finalRecipientList.length
      )} addresses...`
    );

    if (DRY_RUN) {
      print(colors.success, `[DRY RUN] Transaction sent: xxxxxxxxxxxxxxxxxx`);
    } else {
      const tx = await splitter.send(token.address, addresses, amounts);
      print(colors.success, `Transaction sent: ${tx.hash}`);
    }
  }

  print(colors.success, `----- Done with ${contractName} -----`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

/**
 * This script transfers BEP20 tokens to a list of addresses & amounts.
 * It will look for the file ./event-01.json
 * Example:
[
  {
    "booster": "Heroic",
    "address": "0xB885C1f5e2EB2C4e7731728B91E30d2cD45dFFc9",
    "amount": "10"
  },
  {
    "booster": "Legendary",
    "address": "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    "amount": "5"
  },
]
 *
 * Notice:
 * This script must be executed by an account that has enough balance to send tokens.
 *
 * How it works:
 * This script will approve an allowance from the EOA to the Splitter itself.
 * Then, the Splitter calls `transferFrom(EOA)` on the token,
 * effetively splitting the tokens between the recipients.
 *
 * Usage: set the following variables in your .env
 * URL_BSC=https://bsc-dataseed.binance.org/
 * PRIVATE_KEY_BSC=XXXXXXXXXXXXXXXXXXXXXX
 * NETWORK=bsc
 *
 * Then, run the command `npx hardhat run scripts/tools/events/booster-giveaway/boosterSplitter.ts --network bsc`
 */

import { ethers } from "hardhat";
/* eslint-disable node/no-missing-import */
import { getContractAt } from "../../../../src/utils/support";
import { print, colors } from "../../../../src/utils/misc";
import config, { Network } from "../../../../src/config";
/* eslint-disable node/no-missing-import */
import splitterTargets from "./event-04.json";

import { Splitter } from "../../../../typechain";

const BN = ethers.BigNumber;

type ContractName = "BMHTL" | "BMHTE" | "BMHTR" | "BMHTG" | "BMHTH";

interface Recipient {
  booster: string;
  address: string;
  amount: string;
}

const network: Network = (process.env.NETWORK as Network) || "bscTestnet";

let splitter: Splitter;

// If true, won't actually send the tokens
const DRY_RUN = true;

// Will print the final list of recipients
const PRINT_RECIPIENT_LIST = true;

// Do we expect an array of address only? If so, we must fill the following constants:
const FROM_RAW_LIST_OF_ADDRESSES = true;
const DEFAULT_BOX_NAME = "Heroic";
const DEFAULT_AMOUNT = "1";

async function main() {
  print(colors.highlight, `Running the Splitter on ${network}`);
  if (DRY_RUN) {
    print(colors.h_green, `THIS IS A DRY RUN! TOKENS WILL NOT BE TRANSFERRED.`);
  }

  // Connect to the Splitter
  print(colors.wait, `Connecting to the Splitter...`);
  splitter = (await getContractAt("Splitter", config[network].Splitter.address)) as Splitter;
  print(colors.success, `Connected to the Splitter`);

  // split the lists by booster type
  print(colors.wait, `Splitting lists...`);
  const lists = splitLists(splitterTargets as any);
  print(colors.success, `Lists have been split: ${JSON.stringify(lists, null, 2)}`);

  // for loop to send to each list
  print(colors.wait, `Looping through the list...`);
  for (let i = 0; i < lists.length; i++) {
    if (lists[i].length > 0) {
      await send(screenNameToContractName(lists[i][0].booster) as ContractName, lists[i]);
    }
  }

  // success message
  print(colors.bigSuccess, `~~~ DONE ~~~`);
}

function splitLists(targets: any): Array<Array<Recipient>> {
  const boosterTypes = ["Rare", "Epic", "Legendary", "Genesis", "Heroic"];
  const listOfLists: Array<Array<Recipient>> = [];

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

  boosterTypes.forEach((boosterType) => {
    listOfLists.push(
      targets.filter((item: any) => {
        return item.booster === boosterType;
      })
    );
  });

  return listOfLists;
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
  const tokenConfig = config[network][contractName];
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

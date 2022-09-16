import { ethers } from "hardhat";
import Web3 from "web3";
/* eslint-disable node/no-missing-import */
import { getContractAt } from "../../../src/utils/support";
import { print, colors } from "../../../src/utils/misc";
import config, { Network } from "../../../src/config";
/* eslint-disable node/no-missing-import */
import splitterTargets from "./data/2022-march-busd.json";

const BN = ethers.BigNumber;

const AMOUNTS_ARE_IN_ETHER = true;

// TODO deal with multiple tokens depending on the json (could be MHT, BUSD, or any booster)

async function main() {
  const network: Network = process.env.NETWORK as Network;
  print(colors.highlight, `Running the Splitter on ${network}`);

  // Log the grand total
  const grandAmounts = splitterTargets.map((item) => item.amount);
  let grandTotal = grandAmounts.reduce((a, b) => String(BN.from(a).add(BN.from(b))));
  print(
    colors.h_cyan,
    `Will send a grand total of ${grandTotal} tokens to ${splitterTargets.length} addresses`
  );

  if (AMOUNTS_ARE_IN_ETHER) {
    splitterTargets.forEach((item) => {
      item.amount = Web3.utils.toWei(item.amount);
    });

    grandTotal = Web3.utils.toWei(grandTotal);
  }

  // print(colors.highlight, `Final list: ${JSON.stringify(splitterTargets, null, 2)}`);

  // Connect to the Splitter
  const splitter = await getContractAt("Splitter", config[network].Splitter.address);

  // Connect to MHT (the splitter could be used for any BEP20 token, but we want MHT right now)
  //const mht = await getContractAt("MouseHauntToken", config[network].MouseHauntToken.address);
  const token = await getContractAt(
    "MouseHauntToken",
    "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
  );

  // Approve an allowance to the splitter:
  print(colors.wait, `Approving an allowance to the Splitter...`);
  const approveTx = await token.approve(splitter.address, grandTotal);
  const approveReceipt = await approveTx.wait();
  print(colors.success, `ApproveTx Hash: ${approveReceipt.transactionHash}`);

  // Now iterate through the list and create chunks of no more than 500 recipients
  const STEP = 500;
  const START = 0;
  for (let i = START; i * STEP < splitterTargets.length; i++) {
    const from = i * STEP;
    const to = (i + 1) * STEP;
    const targets = [...splitterTargets].slice(from, to - 1);
    const addresses = targets.map((item) => item.address);
    const amounts = targets.map((item) => item.amount);
    const total = amounts.reduce((a, b) => String(BN.from(a).add(BN.from(b))));

    print(
      colors.wait,
      `Round ${i + 1}/${Math.ceil(
        splitterTargets.length / STEP
      )}: Sending a total of ${total} tokens to ${Math.min(
        to - 1,
        splitterTargets.length
      )} addresses...`
    );

    const tx = await splitter.send(token.address, addresses, amounts);

    print(colors.success, `Transaction sent: ${tx.hash}`);
  }

  print(colors.bigSuccess, `~~~ DONE ~~~`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

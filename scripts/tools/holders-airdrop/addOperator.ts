import { ethers } from "hardhat";
import Web3 from "web3";
/* eslint-disable node/no-missing-import */
import { getContractAt } from "../../../src/utils/support";
import * as ENV from "../../../src/utils/env";
const CONFIG = ENV.getConfig();
import { print, colors, confirmOrDie } from "../../../src/utils/misc";

async function main() {
  print(colors.highlight, `Addin OP to the Splitter on ${CONFIG.name}`);

  // Connect to the Splitter
  const splitter = await getContractAt("Splitter", CONFIG.Splitter.address);

  print(colors.wait, `Adding OP to the Splitter...`);
  const addTx = await splitter.grantRole(
    ethers.utils.id("OPERATOR_ROLE"),
    "0x866FA60a31768828fB33aB453dc7B1FE24754827"
  );
  const receipt = await addTx.wait();
  print(colors.success, `Tx Hash: ${receipt.transactionHash}`);

  print(colors.bigSuccess, `~~~ DONE ~~~`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

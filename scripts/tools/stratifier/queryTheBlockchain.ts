import { ethers } from "hardhat";
import Web3 from "web3";
import { getContractAt } from "../../../src/utils/support";
import { print, colors, confirmOrDie } from "../../../src/utils/misc";
import * as ENV from "../../../src/utils/env";
const CONFIG = ENV.getConfig();

//const BN = require("bignumber.js");
const BN = ethers.BigNumber;

// The name of a known smart contract
const CONTRACT_NAME = "MouseHauntStashing";

// The name of the function we want to call
const FUNCTION_NAME = "getStashes";

// Will execute the function treatData after fetching the raw data.
// Use this to adapt the data you get from the blockchain.
const TREAT_DATA = true;

// If this is true, we'll divide wei amounts by 1e18
const AMOUNTS_IN_ETHER = true;

async function main() {
  print(colors.highlight, `GET STASHES :: RUN`);

  // Connect to the smart contract
  const contract = await getContractAt(CONTRACT_NAME, CONFIG[CONTRACT_NAME].address);

  print(colors.wait, `Querying the ${CONTRACT_NAME} contract. Please wait...`);
  const result = await contract[FUNCTION_NAME]();

  const finalResult = TREAT_DATA ? treatData(result) : result;

  print(colors.success, `RESULTS:\n${JSON.stringify(finalResult, null, 2)}`);

  print(colors.bigSuccess, `~~~ DONE ~~~`);
}

function treatData(result: any) {
  const parsedResults: any = [];
  for (let i = 0; i < result.length; i++) {
    const element = result[i];

    const object = {
      stashId: BN.from(element.id).toString(),
      address: element.ownerAddress,
      deposit: AMOUNTS_IN_ETHER
        ? Web3.utils.fromWei(BN.from(element.amount).toString())
        : BN.from(element.amount).toString(),
      period: BN.from(element.period).toString(),
      timestamp: BN.from(element.timestamp).toString(),
    };

    parsedResults.push(object);
  }

  return parsedResults;
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

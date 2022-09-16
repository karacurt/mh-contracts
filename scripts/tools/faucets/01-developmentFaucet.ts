/**
 * This script sends MHT, BMHTL, BMHTE, BMHTR, BMHTG, BMHTH and ERC20Mock (simulates BUSD)
 * to an address of your choosing.
 * 
 * Usage:
 * First set the basic .env variables like so:
 * 
```
NETWORK=bscTestnet
URL_BSC_TESTNET=https://data-seed-prebsc-1-s1.binance.org:8545/
PRIVATE_KEY_BSC_TESTNET=XXXXXXXXXXXXXXXXX 
```
 * Make sure your using the TEST OPERATOR private key
 * (it corresponds to the address 0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1)
 * 
 * Then set the extra .env variables SCRIPT_CONTRACT_NAME, SCRIPT_AMOUNT and SCRIPT_RECIPIENT, like so:
 * SCRIPT_CONTRACT_NAME="MouseHauntToken"
 * SCRIPT_AMOUNT="1000"
 * SCRIPT_RECIPIENT="0x92349670E3ACD498996cA34f5FAd3a11ff0A929f"
 * 
 * Then, call the script like so:
`npx hardhat run scripts/tools/04-faucet.ts --network bscTestnet`
 * 
 * Done!
 * 
 * --------------------------
 * As an alternative, you may export env variables directly, and execute the script like so:
`SCRIPT_CONTRACT_NAME="MouseHauntToken" SCRIPT_AMOUNT="1000" SCRIPT_RECIPIENT="0x92349670E3ACD498996cA34f5FAd3a11ff0A929f" npx hardhat run scripts/tools/04-faucet.ts --network bscTestnet`
*/

import { ethers } from "hardhat";
/* eslint-disable node/no-missing-import */
import config from "../../../src/config";
import { print, colors } from "../../../src/utils/misc";
import { getContractAt } from "../../../src/utils/support";
import { Contract } from "ethers";
/* eslint-disable node/no-missing-import */

type ContractName =
  | "MouseHauntToken"
  | "BMHTL"
  | "BMHTE"
  | "BMHTR"
  | "BMHTG"
  | "BMHTH"
  | "ERC20Mock";

const DEFAULT_OPERATOR = "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1";

// Default value is the "User A (MH - Test 3)" account
const DEFAULT_ACCOUNT: string[] = ["0x92349670E3ACD498996cA34f5FAd3a11ff0A929f"];

// Default value is MHT
const CONTRACTS_NAME: ContractName[] = (process.env.SCRIPT_CONTRACT_NAME?.split(
  ","
) as ContractName[]) ?? ["BMHTL", "BMHTE", "BMHTR", "BMHTG", "BMHTH"];

// Default value is 20
const AMOUNT = process.env.SCRIPT_AMOUNT ?? "20";

const RECIPIENTS = process.env.SCRIPT_RECIPIENT?.split(",") ?? DEFAULT_ACCOUNT;

// To use to multiple transfers BMHTR and BMHTG
const IS_NFT_WITH_DECIMALS = process.env.SCRIPT_IS_NFT_WITH_DECIMALS ?? "false";

async function main() {
  print(colors.highlight, `RUNNING FAUCET`);

  const [operator] = await ethers.getSigners();
  print(colors.account, `OPERATOR: ${operator.address}`);

  if (operator.address !== DEFAULT_OPERATOR) {
    throw new Error(`OPERATOR MISMATCH: should be ${DEFAULT_OPERATOR}`);
  }

  for (const contractName of CONTRACTS_NAME) {
    const contract = await getContractAt(
      contractName,
      config.bscTestnet[contractName as ContractName].address
    );

    if (IS_NFT_WITH_DECIMALS) await transfer(contract, contractName, Number(AMOUNT));
    // This for is used to BMHTR | BMHTG
    else for (let i = 0; i < Number(AMOUNT); i++) await transfer(contract, contractName, 1);
  }
}

async function transfer(contract: Contract, contractName: string, amount: number) {
  for (const recipient of RECIPIENTS) {
    print(colors.wait, `Sending ${amount} ${contractName}s to ${recipient}...`);
    const tx = await contract.transfer(recipient, amount);

    print(colors.success, `Success! TxHash: ${tx.hash}`);
    print(colors.bigSuccess, `Transferred ${amount} ${contractName}s to ${recipient}`);
  }
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

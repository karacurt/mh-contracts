/**
 * This script sends MHT, BMHTL, BMHTE, BMHTR, BMHTG, ERC20Mock (simulates BUSD)
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
/* eslint-disable node/no-missing-import */

type ContractName = "MouseHero";

const DEFAULT_OPERATOR = "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1";

// Default value is the "Operator" account
const DEFAULT_ACCOUNT: string[] = ["0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1"];

// Default value is MHT
const CONTRACTS_NAME: ContractName[] = (process.env.SCRIPT_CONTRACT_NAME?.split(
  ","
) as ContractName[]) ?? ["MouseHero"];

// Default value is 1000
const AMOUNT = process.env.SCRIPT_AMOUNT ?? "1";

const RECIPIENTS = process.env.SCRIPT_RECIPIENT?.split(",") ?? DEFAULT_ACCOUNT;

async function main() {
  print(colors.highlight, `RUNNING NFT FAUCET`);

  const [operator] = await ethers.getSigners();
  print(colors.account, `OPERATOR: ${operator.address}`);

  if (operator.address !== DEFAULT_OPERATOR) {
    throw new Error(`OPERATOR MISMATCH: should be ${DEFAULT_OPERATOR}`);
  }

  for (const CONTRACT_NAME of CONTRACTS_NAME) {
    const contract = await getContractAt(
      CONTRACT_NAME,
      config.bscTestnet[CONTRACT_NAME as ContractName].address
    );
    for (let i = 0; i < Number(AMOUNT); i++) {
      for (const RECIPIENT of RECIPIENTS) {
        print(colors.wait, `Minting 1 ${CONTRACT_NAME} to ${RECIPIENT}...`);
        const tx = await contract.mintMouseHeroByRarity(
          RECIPIENT,
          "0x25ac6de9ED3a6B3D22D8A9b485eFcb86051CB6dE"
        );

        print(colors.success, `Success! TxHash: ${tx.hash}`);
        print(colors.bigSuccess, `Minted 1 ${CONTRACT_NAME} to ${RECIPIENT}`);
      }
    }
  }
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

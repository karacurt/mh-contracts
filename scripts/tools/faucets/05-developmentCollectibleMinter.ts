/**
 * This script sends MousePrize NFTs to an address of your choosing.
 * 
 * Usage:
 * First set the basic .env variables like so:
 * 
```
NETWORK=bscTestnet
URL_BSC_TESTNET=https://data-seed-prebsc-1-s2.binance.org:8545/
PRIVATE_KEY_BSC_TESTNET=XXXXXXXXXXXXXXXXX 
```
 * Make sure your using the TEST OPERATOR private key
 * (it corresponds to the address 0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1)
 * 
 * Then set the extra .env variable SCRIPT_RECIPIENT and SCRIPT_NFT_ID, like so:
 * SCRIPT_RECIPIENT="0x92349670E3ACD498996cA34f5FAd3a11ff0A929f"
 * SCRIPT_NFT_ID=0
 * 
 * Then, call the script like so:
`npx hardhat run scripts/tools/07-nftPrizeMinter.ts --network bscTestnet`
 * 
 * Done!
 * 
 * --------------------------
 * As an alternative, you may export env variables directly, and execute the script like so:
`SCRIPT_RECIPIENT="0x92349670E3ACD498996cA34f5FAd3a11ff0A929f" npx hardhat run scripts/tools/07-nftPrizeMinter.ts --network bscTestnet`
*/

import { ethers } from "hardhat";
/* eslint-disable node/no-missing-import */
import config from "../../../src/config";
import { print, colors } from "../../../src/utils/misc";
import { getContractAt } from "../../../src/utils/support";
/* eslint-disable node/no-missing-import */

// Default value is the "User A (MH - Test 3)" account
const RECIPIENT = process.env.SCRIPT_RECIPIENT ?? "0x92349670E3ACD498996cA34f5FAd3a11ff0A929f";

async function main() {
  print(colors.highlight, `RUNNING COLLECTIBLE FAUCET`);

  const [operator] = await ethers.getSigners();
  print(colors.account, `OPERATOR: ${operator.address}`);

  const contract = await getContractAt("Collectible", config.bscTestnet.Collectible.address);

  print(colors.wait, `Minting a Collectible to ${RECIPIENT}...`);
  const tx = await contract.mint(RECIPIENT, "cool-hat");

  print(colors.success, `Success! TxHash: ${tx.hash}`);
  print(colors.bigSuccess, `Minted 1 Collectible to ${RECIPIENT}`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

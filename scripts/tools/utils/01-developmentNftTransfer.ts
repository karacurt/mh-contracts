import { ethers } from "hardhat";
/* eslint-disable node/no-missing-import */
import config from "../../../src/config";
import { print, colors } from "../../../src/utils/misc";
import { getContractAt } from "../../../src/utils/support";
/* eslint-disable node/no-missing-import */

type ContractName = "MouseHero";

// Default value is MHT
const CONTRACT_NAME: ContractName =
  (process.env.SCRIPT_CONTRACT_NAME as ContractName) ?? "MouseHero";

// Default value is the "User A (MH - Test 3)" account
const RECIPIENT = process.env.SCRIPT_RECIPIENT ?? "0x92349670E3ACD498996cA34f5FAd3a11ff0A929f";

// NFT to be transferred
const NFT_ID = 403;

async function main() {
  print(colors.highlight, `RUNNING NFT TRANSFER SCRIPT`);

  const [operator] = await ethers.getSigners();
  print(colors.account, `OPERATOR: ${operator.address}`);

  const contract = await getContractAt(
    CONTRACT_NAME,
    config.bscTestnet[CONTRACT_NAME as ContractName].address
  );

  print(colors.wait, `Transferring 1 ${CONTRACT_NAME} to ${RECIPIENT}...`);
  const tx = await contract.transferFrom(operator.address, RECIPIENT, NFT_ID);

  print(colors.success, `Success! TxHash: ${tx.hash}`);
  print(colors.bigSuccess, `Transferred ${CONTRACT_NAME} #${NFT_ID} to ${RECIPIENT}`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

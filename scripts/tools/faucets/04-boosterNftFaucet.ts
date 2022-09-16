import { ethers } from "hardhat";
/* eslint-disable node/no-missing-import */
import config, { Network } from "../../../src/config";
import { print, colors } from "../../../src/utils/misc";
import { getContractAt } from "../../../src/utils/support";
/* eslint-disable node/no-missing-import */

const DEFAULT_OPERATOR = "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1";

const AMOUNT = process.env.SCRIPT_AMOUNT ?? "50";

const RECIPIENT = "0x92349670E3ACD498996cA34f5FAd3a11ff0A929f";

async function main() {
  const network: Network = process.env.NETWORK as Network;
  print(colors.highlight, `RUNNING BOOSTER NFT FAUCET ON ${network}`);

  const [operator] = await ethers.getSigners();
  print(colors.account, `OPERATOR: ${operator.address}`);

  if (operator.address !== DEFAULT_OPERATOR) {
    throw new Error(`OPERATOR MISMATCH: should be ${DEFAULT_OPERATOR}`);
  }

  const contract = await getContractAt("NftBooster", config[network]["BMHTH_nft"].address);

  print(colors.wait, `Minting ${AMOUNT} BMHTH_nft to ${RECIPIENT}...`);

  const tx = await contract.bulkMint(RECIPIENT, AMOUNT);

  print(colors.success, `Success! TxHash: ${tx.hash}`);

  print(colors.bigSuccess, `Minted ${AMOUNT} BMHTH_nft to ${RECIPIENT}`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

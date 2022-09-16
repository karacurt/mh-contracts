/* eslint-disable node/no-missing-import */
import { ethers } from "hardhat";
import { print, colors, delay } from "../../src/utils/misc";
import { getContractAt } from "../../src/utils/support";
import { MINTER_ROLE } from "../../src/utils/roles";
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

const NAME: string = "Mouse Haunt NFT HEROIC Box";

const targetAddress = "0x11aE9715472E88bc355F473c60879fD422D4A937";
const amount = 100;
const repetitions = 1;

async function main() {
  print(colors.highlight, `Minting ${amount} ${NAME} on ${CONFIG.name}...`);

  const booster = await getContractAt("NftBooster", CONFIG.BMHTH_nft.address);

  const [operator] = await ethers.getSigners();
  const isMinter = await booster.hasRole(MINTER_ROLE, operator.address);
  if (!isMinter) {
    print(colors.error, `Operator (${operator.address}) is not a minter! Aborted.`);
  } else {
    print(colors.success, `Operator (${operator.address}) is a registered minter.`);
  }

  let tx;
  for (let i = 0; i < repetitions; i++) {
    print(colors.wait, `Minting...`);
    tx = await booster.bulkMint(targetAddress, amount);
    await delay(5000);
    print(colors.bigSuccess, `${NAME} minted! TxHash: ${tx.hash}`);
  }

  print(colors.bigSuccess, `~~~ DONE ~~~`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

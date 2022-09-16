import { ethers } from "hardhat";
/* eslint-disable node/no-missing-import */
import config, { Network } from "../../../src/config";
import { print, colors, delay } from "../../../src/utils/misc";
import { getContractAt } from "../../../src/utils/support";
/* eslint-disable node/no-missing-import */

const DEFAULT_OPERATOR = "0x4A701fa920339D484e10deA12871bc5c7C88a18f"; // PROD
//const DEFAULT_OPERATOR = "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1"; // HOMOLOG
const AMOUNT = "885";

// Mad Manager wallet
const RECIPIENT = "0x31Bd99a403a941a7caA98511E56f44088c0aa888"; // PROD
//const RECIPIENT = "0xfc854524613dA7244417908d199857754189633c"; // HOMOLOG

const DELAY_MS = 4000;
const MAX_RETRIES = 6;

async function main() {
  const network: Network = process.env.NETWORK as Network;
  print(colors.highlight, `RUNNING NFT MINTER on ${config[network].name}...`);

  const [operator] = await ethers.getSigners();
  print(colors.account, `OPERATOR: ${operator.address}`);

  if (operator.address !== DEFAULT_OPERATOR) {
    throw new Error(`OPERATOR MISMATCH: should be ${DEFAULT_OPERATOR}`);
  }

  const contract = await getContractAt("MouseHero", config[network].MouseHero.address);

  for (let i = 0; i < Number(AMOUNT); i++) {
    print(colors.wait, `Minting 1 MHH to ${RECIPIENT}...`);

    await mintIt(contract, config[network].MouseHero.address);
  }

  print(colors.bigSuccess, `Minted AMOUNT MHH to ${RECIPIENT}`);
}

async function mintIt(contract: any, address: any, tries: number = 0): Promise<any> {
  print(colors.wait, `Waiting for ${DELAY_MS / 1000}s...`);
  await delay(DELAY_MS);

  print(colors.wait, `Minting (${tries} failed tries so far)...`);
  tries++;
  try {
    const tx = await contract.mintMouseHeroByRarity(RECIPIENT, address);
    print(colors.success, `Success! Minted 1 MHH to ${RECIPIENT}: ${tx.hash}`);

    Promise.resolve();
  } catch (e) {
    if (tries <= MAX_RETRIES) {
      return await mintIt(contract, address, tries);
    } else {
      print(colors.error, `Abandoned this transaction after ${tries} tries.`);
      Promise.resolve();
    }
  }
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

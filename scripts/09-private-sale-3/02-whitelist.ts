import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";
import whitelist3 from "../whitelist-3.json";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const WhitelistSale = await ethers.getContractFactory("WhitelistSale");

  const whitelistSale = WhitelistSale.attach(config[network].WhitelistSale.PrivateSale3.address);

  console.log("WhitelistSale whitelist", whitelist3.length, `entries`);

  const STEP = 500;
  const START = 0;
  for (let i = START; i * STEP < whitelist3.length; i++) {
    const from = i * STEP;
    const to = (i + 1) * STEP;
    const wallets = [...whitelist3].slice(from, to);

    console.log(i, `${from}..${to - 1}`, `${whitelist3[from]} ${whitelist3[to - 1]}`);

    const tx = await whitelistSale.addToWhitelist(wallets);

    console.log("Wait for tx");
    const receipt = await tx.wait();
    console.log("Hash", receipt.transactionHash);
    console.log("Wait 15s");
    await new Promise((resolve) => setTimeout(resolve, 15e3));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

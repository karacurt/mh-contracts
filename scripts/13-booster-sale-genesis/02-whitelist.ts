import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";
// eslint-disable-next-line node/no-missing-import
import { isValidAddress } from "../../src/utils/address";
import whitelistGenesis from "./whitelist-genesis.json";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const BoosterSaleGenesis = await ethers.getContractFactory("BoosterSaleGenesis");
  const boosterSaleGenesis = BoosterSaleGenesis.attach(config[network].BoosterSale.Genesis.address);

  console.log(`BoosterSaleGenesis setWhitelist`, whitelistGenesis.length, `entries`);
  const STEP = 500;
  const START = 0;
  for (let i = START; i * STEP < whitelistGenesis.length; i++) {
    const from = i * STEP;
    const to = (i + 1) * STEP;
    const wallets = whitelistGenesis.slice(from, to);

    console.log(i, `${from}..${to - 1}`, `${whitelistGenesis[from]} ${whitelistGenesis[to - 1]}`);

    const validWallets = wallets.filter((wallet) => isValidAddress(wallet));

    const tx = await boosterSaleGenesis.setWhitelist(
      validWallets,
      config[network].BoosterSale.Genesis.cap
    );

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

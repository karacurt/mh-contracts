import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";
// eslint-disable-next-line node/no-missing-import
import { isValidAddress } from "../../src/utils/address";
import whitelistHeroic from "./heroic-sale-prod.json";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const BoosterSaleHeroic = await ethers.getContractFactory("BoosterSaleHeroic");
  const boosterSaleHeroic = BoosterSaleHeroic.attach(config[network].BoosterSale.Heroic.address);

  console.log(`BoosterSaleHeroic setWhitelist`, whitelistHeroic.length, `entries`);
  const STEP = 500;
  const START = 0;
  for (let i = START; i * STEP < whitelistHeroic.length; i++) {
    const from = i * STEP;
    const to = (i + 1) * STEP;
    const wallets = whitelistHeroic.slice(from, to);

    console.log(i, `${from}..${to - 1}`, `${whitelistHeroic[from]} ${whitelistHeroic[to - 1]}`);

    const validWallets = wallets.filter((wallet) => isValidAddress(wallet));

    const tx = await boosterSaleHeroic.setWhitelist(
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

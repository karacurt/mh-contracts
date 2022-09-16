import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";
import whitelist2 from "../whitelist-2.json";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const BoosterSale = await ethers.getContractFactory("BoosterSale");
  const boosterSale = BoosterSale.attach(config[network].BoosterSale.PrivateSale2.address);

  console.log(`BoosterSale setWhitelist`, whitelist2.length, `entries`);
  const STEP = 200;
  const SKIP = 0;
  for (let i = SKIP; i * STEP < whitelist2.length; i++) {
    const from = i * STEP;
    const to = (i + 1) * STEP;
    const wallets = [...whitelist2].slice(from, to);

    console.log(`${from}..${to - 1}\t${whitelist2[from]} ${whitelist2[to - 1]}`);

    const tx = await boosterSale.setWhitelist(
      wallets,
      wallets.map(() => Number(config[network].BoosterSale.PrivateSale2.BMHTL.cap)),
      wallets.map(() => Number(config[network].BoosterSale.PrivateSale2.BMHTE.cap))
    );

    await tx.wait();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

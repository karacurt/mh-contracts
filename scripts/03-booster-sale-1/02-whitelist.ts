import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";
import whitelist from "../whitelist.json";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const BoosterSale = await ethers.getContractFactory("BoosterSale");
  const boosterSale = BoosterSale.attach(config[network].BoosterSale.PrivateSale1.address);

  console.log(`BoosterSale setWhitelist`, whitelist);
  await boosterSale.setWhitelist(
    whitelist.buyers,
    whitelist.legendaryAllowances,
    whitelist.epicAllowances
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";
import whitelist from "../whitelist.json";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const WhitelistSale = await ethers.getContractFactory("WhitelistSale");

  const whitelistSale = WhitelistSale.attach(config[network].WhitelistSale.PrivateSale1.address);

  console.log("WhitelistSale whitelist", whitelist);
  await whitelistSale.addToWhitelist(whitelist.buyers);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const MHT = await ethers.getContractFactory("MouseHauntToken");
  const mht = MHT.attach(config[network].MouseHauntToken.address);

  const wei = ethers.utils.parseEther;

  const WhitelistSale = await ethers.getContractFactory("WhitelistSale");
  const whitelistSale = await WhitelistSale.deploy(
    config[network].WhitelistSale.PrivateSale2.owner,
    mht.address,
    config[network].BUSD.address,
    wei(config[network].WhitelistSale.PrivateSale2.available),
    wei(config[network].WhitelistSale.PrivateSale2.MHTtoBUSD),
    wei(config[network].WhitelistSale.PrivateSale2.minMhtAmount),
    wei(config[network].WhitelistSale.PrivateSale2.maxMhtAmount),
    config[network].WhitelistSale.PrivateSale2.unlockAtIGOPercent,
    config[network].WhitelistSale.PrivateSale2.cliffMonths,
    config[network].WhitelistSale.PrivateSale2.vestingPeriodMonths
  );

  await whitelistSale.deployed();

  console.log("WhitelistSale deployed to:", whitelistSale.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

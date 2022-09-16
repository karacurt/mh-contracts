import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";

async function main() {
  const network: Network = process.env.NETWORK as Network;

  const wei = ethers.utils.parseEther;

  const WhitelistSale = await ethers.getContractFactory("WhitelistSale");
  for await (const sale of config[network].WhitelistSale.PreSales) {
    const whitelistSale = await WhitelistSale.deploy(
      sale.owner,
      config[network].MouseHauntToken.address,
      config[network].BUSD.address,
      wei(sale.amount),
      wei(sale.MHTtoBUSD),
      wei(sale.amount),
      wei(sale.amount),
      sale.unlockAtIGOPercent,
      sale.cliffMonths,
      sale.vestingPeriodMonths
    );

    await whitelistSale.deployed();

    console.log("PreSale", sale.MHTtoBUSD, sale.whitelisted, "deployed to", whitelistSale.address);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

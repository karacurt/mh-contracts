import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";
import { deployContract } from "../../src/utils/support";
import { colors, print, toWeiString } from "../../src/utils/misc";

async function main() {
  const network: Network = process.env.NETWORK as Network;
  print(colors.highlight, `Deploying the Booster Sale on ${network}`);

  const boosterSaleHeroic = await deployContract("BoosterSaleHeroic", [
    config[network].BoosterSale.Heroic.owner,
    config[network].MouseHauntToken.address,
    config[network].BMHTH.address,
    toWeiString(config[network].BoosterSale.Heroic.mhtPrice),
  ]);

  print(colors.bigSuccess, `Booster Sale deployed to: ${boosterSaleHeroic.address}`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

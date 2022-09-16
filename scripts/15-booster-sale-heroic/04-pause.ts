// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";
import { getContractAt } from "../../src/utils/support";
import { colors, print } from "../../src/utils/misc";

async function main() {
  const network: Network = process.env.NETWORK as Network;
  print(colors.highlight, `Pausing Heroic Whitelist on ${network}`);

  const boosterSaleHeroic = await getContractAt(
    "BoosterSaleHeroic",
    config[network].BoosterSale.Heroic.address
  );

  await boosterSaleHeroic.pause();

  print(colors.bigSuccess, `Heroic Whitelist paused!`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

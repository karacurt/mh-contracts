// eslint-disable-next-line node/no-missing-import
import config, { Network } from "../../src/config";
import { getContractAt } from "../../src/utils/support";
import { colors, print } from "../../src/utils/misc";

async function main() {
  const network: Network = process.env.NETWORK as Network;
  print(colors.highlight, `Approving the Booster Sale to spend BMHTH on ${network}`);

  const bmhth = await getContractAt("BMHTH", config[network].BMHTH.address);

  print(colors.wait, `Sending transaction, please wait...`);

  await bmhth.approve(
    config[network].BoosterSale.Heroic.address,
    config[network].BoosterSale.Heroic.available
  );

  print(colors.bigSuccess, `Approved the Booster Sale to spend BMHTH on ${network}`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

/* eslint-disable node/no-missing-import */
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();
import { print, colors, confirmOrDie } from "../../src/utils/misc";
import { getContractAt } from "../../src/utils/support";
import { getTiers } from "../../test/fixture/MouseHauntStashingFixture";

async function main() {
  print(colors.highlight, `Setting tiers on ${CONFIG.name}...`);

  await confirmOrDie(`Are you sure you would like to set the Stasher Tiers on ${CONFIG.name}?`);

  const CONTRACT_NAME = "MouseHauntStashing";

  const contract = await getContractAt(CONTRACT_NAME, CONFIG[CONTRACT_NAME].address);

  const tiers = getTiers();
  const txRegister = await contract.setTiers(tiers);

  print(colors.bigSuccess, `Tiers registered. Tx:${txRegister.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

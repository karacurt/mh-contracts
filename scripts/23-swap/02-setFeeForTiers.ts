/* eslint-disable node/no-missing-import */
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();
import { print, colors, confirmOrDie } from "../../src/utils/misc";
import { getContractAt } from "../../src/utils/support";
import { getFeesForTiers } from "../../test/fixture/SwapFixture";

async function main() {
  print(colors.highlight, `Setting fess of Swap on ${CONFIG.name}...`);

  await confirmOrDie(`Are you sure you would like to set the Swap Fees on ${CONFIG.name}?`);

  const CONTRACT_NAME = "Swap";

  const fees = getFeesForTiers();

  const contract = await getContractAt(CONTRACT_NAME, CONFIG[CONTRACT_NAME].address);

  const txRegister = await contract.setFeePerTier(fees);

  print(colors.bigSuccess, `fees registered. Tx:${txRegister.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

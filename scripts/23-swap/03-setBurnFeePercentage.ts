/* eslint-disable node/no-missing-import */
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();
import { print, colors, confirmOrDie, toWei } from "../../src/utils/misc";
import { getContractAt } from "../../src/utils/support";
import { BURN_FEE_PERCENTAGE } from "../../test/fixture/SwapFixture";

async function main() {
  print(colors.highlight, `Setting Burn Fee Percentage of Swap on ${CONFIG.name}...`);

  await confirmOrDie(
    `Are you sure you would like to set the Burn Fee Percentage on ${CONFIG.name}?`
  );

  const CONTRACT_NAME = "Swap";
  const contract = await getContractAt(CONTRACT_NAME, CONFIG[CONTRACT_NAME].address);

  const burnFeePercentage = toWei(BURN_FEE_PERCENTAGE);
  console.log("burnFeePercentage", burnFeePercentage.toString());
  const txRegister = await contract.setBurnFeePercentage(burnFeePercentage);

  print(colors.bigSuccess, `Burn Fee Percentage registered. Tx:${txRegister.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

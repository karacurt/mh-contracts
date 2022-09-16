/* eslint-disable node/no-missing-import */
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();
import { print, colors, confirmOrDie } from "../../src/utils/misc";
import { getContractAt } from "../../src/utils/support";

async function main() {
  print(colors.highlight, `Setting trusted token on ${CONFIG.name}...`);

  await confirmOrDie(`Are you sure you would like to set the Farm Contract on ${CONFIG.name}?`);

  const CONTRACT_NAME = "MhtOnRamp";

  const contract = await getContractAt(CONTRACT_NAME, CONFIG[CONTRACT_NAME].address);

  const txRegister = await contract.setFarmingContract(CONFIG.Farm.address);

  print(colors.bigSuccess, `trusted token registered. Tx:${txRegister.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

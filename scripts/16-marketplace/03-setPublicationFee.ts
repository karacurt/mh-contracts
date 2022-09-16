// eslint-disable-next-line node/no-missing-import
import { print, colors } from "../../src/utils/misc";
import { getContractAt } from "../../src/utils/support";
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

const CONTRACT_NAME = "MarketplaceV3";

async function main() {
  print(colors.highlight, `Setting publication fee on ${CONFIG.name}...`);

  const contract = await getContractAt(CONTRACT_NAME, CONFIG[CONTRACT_NAME].address);
  const txRegister = await contract.setPublicationFee(0);

  print(colors.bigSuccess, `Publication fee changed. Tx:${txRegister.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

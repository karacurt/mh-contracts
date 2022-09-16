/* eslint-disable node/no-missing-import */
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();
import { print, colors, confirmOrDie, toWei } from "../../src/utils/misc";
import { getContractAt } from "../../src/utils/support";
import { getFeesForTiers } from "../../test/fixture/SwapFixture";

async function main() {
  print(colors.highlight, `Swap BUSD for MHT in OnRamp on ${CONFIG.name}...`);

  await confirmOrDie(`Are you sure you would like to Swap BUSD for MHT on ${CONFIG.name}?`);

  const CONTRACT_NAME = "OnRamp";

  const contract = await getContractAt(CONTRACT_NAME, CONFIG[CONTRACT_NAME].address);

  /* print(colors.wait, `Allowing WBNB for contract...`);
  const wbnb = await getContractAt("MouseHauntToken", "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd");
  await wbnb.approve(contract.address, toWei("99999999999999999999999999999"));

  print(colors.wait, `Allowing BUSD for contract...`);
  const busd = await getContractAt("MouseHauntToken", "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee");
  await busd.approve(contract.address, toWei("99999999999999999999999999999"));
 */
  print(colors.wait, `Swaping...`);
  const amount = toWei("1");
  const targetMHT = toWei("1");
  const txRegister = await contract.buyMHT(amount, targetMHT);
  console.log({ txRegister });
  print(colors.bigSuccess, `Swap BUSD for MHT. Tx:${txRegister.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

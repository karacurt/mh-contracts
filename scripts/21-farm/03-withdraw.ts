import { ethers, upgrades } from "hardhat";
/* eslint-disable node/no-missing-import */
import { print, colors } from "../../src/utils/misc";
import { getContractAt } from "../../src/utils/support";
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

const digest = "0xaf5d8b2b6432203588bd2e1612ffbee1499a72ed8e8e516f680789fa9e01fc55";
const claimData = [
  "0x609630832c6d10C8DC138C2B1Cdd677B98851dE4",
  "0x92349670E3ACD498996cA34f5FAd3a11ff0A929f",
  "1000000",
  "224358",
  "57692",
  97,
  6,
  28,
];

const sig = [
  "0xfc854524613dA7244417908d199857754189633c",
  27,
  "0x394bf8f126065b33acdc9a166f49dc34a0b8b44e39df45fc381dfa4ef8ee8817",
  "0x52017c0f4cb9c5ea35d889775324276c26a1bec9a8e490ca72baff1d7aea37c7",
];

async function main() {
  print(colors.wait, `Deploying Farm on ${CONFIG.name}...`);

  const farm = await getContractAt("Farm", "0x609630832c6d10C8DC138C2B1Cdd677B98851dE4");

  const tx = await farm.withdraw(digest, claimData, sig);

  print(colors.success, `SUCCESS: ${JSON.stringify(tx, null, 2)}`);

  print(colors.bigSuccess, `~~~ DONE ~~~`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/* eslint-disable node/no-missing-import */
import { print, colors } from "../../src/utils/misc";
import { getContractAt } from "../../src/utils/support";
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

/* eslint-disable no-unused-vars */
enum AssetType {
  NIL,
  ERC20,
  ERC721,
}
/* eslint-disable no-unused-vars */

async function main() {
  print(colors.highlight, `Registring accepted boosters ${CONFIG.name}...`);

  const CONTRACT_NAME = "MouseHero";

  // Get known boosters
  const epicBooster = CONFIG.BMHTE;
  const legendaryBooster = CONFIG.BMHTL;
  const rareBooster = CONFIG.BMHTR;
  const genesisBooster = CONFIG.BMHTG;
  const heroicBox = CONFIG.BMHTH;
  const heroicBox_nft = CONFIG.BMHTH_nft;

  const contract = await getContractAt(CONTRACT_NAME, CONFIG[CONTRACT_NAME].address);
  const txRegister = await contract.setAcceptedBoosters([heroicBox_nft.address], [true]);

  print(colors.bigSuccess, `Accepted Boosters registered. Tx:${txRegister.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

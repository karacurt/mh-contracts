/* eslint-disable node/no-missing-import */
import { print, colors } from "../../src/utils/misc";
import { deployContract } from "../../src/utils/support";
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

const NAME: string = process.env.NFT_NAME ?? "Mouse Hero";
const SYMBOL: string = process.env.NFT_SYMBOL ?? "MHH";
const BASE_URI: string = process.env.NFT_BASE_URI ?? "https://nft.api.mousehaunt.com/public/mice/";

async function main() {
  print(colors.highlight, `Deploying MouseHero on ${CONFIG.name}...`);

  const mouseHero = await deployContract("MouseHero", [NAME, SYMBOL, BASE_URI]);

  // Get known boosters
  const rareBooster = CONFIG.BMHTR;
  const epicBooster = CONFIG.BMHTE;
  const legendaryBooster = CONFIG.BMHTL;
  const genesisBooster = CONFIG.BMHTG;
  const heroicBooster = CONFIG.BMHTH;

  // Register known boosters
  const registerTx = await mouseHero.setAcceptedBoosters(
    [
      rareBooster.address,
      epicBooster.address,
      legendaryBooster.address,
      genesisBooster.address,
      heroicBooster.address,
    ],
    [true, true, true, true, true]
  );

  print(colors.success, `Accepted Boosters registered ${registerTx.hash}`);

  print(
    colors.bigSuccess,
    `Mouse Hero has been successfully deployed and initialized on ${CONFIG.name}`
  );
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

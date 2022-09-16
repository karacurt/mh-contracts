/* eslint-disable node/no-missing-import */
import { print, colors } from "../../src/utils/misc";
import { deployContract } from "../../src/utils/support";
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

const NAME: string = process.env.NFT_NAME ?? "Collectible";
const SYMBOL: string = process.env.NFT_SYMBOL ?? "MHC";
const BASE_URI: string =
  process.env.NFT_BASE_URI ?? "https://nft.api.mousehaunt.com/public/collectibles";

async function main() {
  print(colors.highlight, `Deploying Collectible on ${CONFIG.name}...`);

  const mouseHero = await deployContract("Collectible", [NAME, SYMBOL, BASE_URI]);

  print(colors.bigSuccess, `Collectible address: ${mouseHero.address}`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

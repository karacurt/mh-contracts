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

  const CONTRACT_NAME = "MarketplaceV3";

  // Get known boosters
  const epicBooster = CONFIG.BMHTE;
  const legendaryBooster = CONFIG.BMHTL;
  const rareBooster = CONFIG.BMHTR;
  const genesisBooster = CONFIG.BMHTG;
  const heroicBooster = CONFIG.BMHTH;
  const heroic_nftBooster = CONFIG.BMHTH_nft;
  const mouseHero = CONFIG.MouseHero;
  const legendaryGhostBooster = CONFIG.MHGBL;

  const MouseHauntTokens = [
    { addr: epicBooster.address, assetType: AssetType.ERC20 },
    { addr: legendaryBooster.address, assetType: AssetType.ERC20 },
    { addr: rareBooster.address, assetType: AssetType.ERC20 },
    { addr: genesisBooster.address, assetType: AssetType.ERC20 },
    { addr: heroicBooster.address, assetType: AssetType.ERC20 },
    { addr: heroic_nftBooster.address, assetType: AssetType.ERC721 },
    { addr: mouseHero.address, assetType: AssetType.ERC721 },
    { addr: legendaryGhostBooster.address, assetType: AssetType.ERC721 },
  ];

  const contract = await getContractAt(CONTRACT_NAME, CONFIG[CONTRACT_NAME].address);
  const txRegister = await contract.setNFTs(MouseHauntTokens);

  print(colors.bigSuccess, `Accepted Boosters registered. Tx:${txRegister.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/* eslint-disable node/no-missing-import */
import { print, colors } from "../../src/utils/misc";
import { deployContract, getContractAt } from "../../src/utils/support";
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

/* eslint-disable no-unused-vars */
enum AssetType {
  NIL,
  ERC20,
  ERC721,
}

// How many tokens Galler can mint
const MAX_GALLER_SUPPLY = process.env.MAX_GALLER_SUPPLY ?? 2500;

const NAME: string = process.env.NFT_NAME ?? "Mouse Haunt NFT HEROIC Box";
const SYMBOL: string = process.env.NFT_SYMBOL ?? "BMHTH";
const BASE_URI: string =
  process.env.NFT_BASE_URI ?? "https://nft.mousehaunt.com/public/boxes/heroic/";

// Galler's Launchpad TESTNET address: 0xe53d5bF04f7fE2e3C255274fcE6594D64b6EfBaD
// Galler's Launchpad MAINNET address: 0xa88f57dAF834572f994eEa20c3Ba6924ad3bF00f
const GALLER_LAUNCHPAD_ADDRESS =
  process.env.GALLER_LAUNCHPAD_ADDRESS ?? "0xa88f57dAF834572f994eEa20c3Ba6924ad3bF00f";

async function main() {
  print(colors.highlight, `Deploying ${NAME} on ${CONFIG.name}...`);

  const booster = await deployContract("NftBooster", [
    NAME,
    SYMBOL,
    BASE_URI,
    CONFIG.MouseHero.address,
    GALLER_LAUNCHPAD_ADDRESS,
    MAX_GALLER_SUPPLY.toString(),
  ]);

  // Register the new booster in our MouseHero contract:
  print(colors.wait, `Registering the new booster (${booster.address}) in MouseHero...`);
  const mouseHero = await getContractAt("MouseHero", CONFIG.MouseHero.address);
  const mouseHeroRegisterTx = await mouseHero.setAcceptedBoosters([booster.address], [true]);
  print(colors.success, `mouseHeroRegisterTx hash: ${mouseHeroRegisterTx.hash}`);

  // Register the new booster in our Marketplace contract:
  print(colors.wait, `Registering the new booster (${booster.address}) in Marketplace...`);
  const tokens = [{ addr: booster.address, assetType: AssetType.ERC721 }];
  const marketplace = await getContractAt("Marketplace", CONFIG.Marketplace.address);
  const marketplaceRegisterTx = await marketplace.setNFTs(tokens);
  print(colors.success, `marketplaceRegisterTx hash: ${marketplaceRegisterTx.hash}`);

  print(colors.bigSuccess, `${NAME} address: ${booster.address}`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

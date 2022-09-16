import axios from "axios";

// eslint-disable-next-line node/no-missing-import
import { print, colors, wei, delay } from "../../../src/utils/misc";
/* eslint-disable node/no-missing-import */
import config, { Network } from "../../../src/config";
import { getContractAt } from "../../../src/utils/support";
/* eslint-disable node/no-missing-import */

const marketplaceContractName = "Marketplace";
const MouseHeroContractName = "MouseHero";

const firstTokenId = 40288;
const lastTokenId = 40664;

const DELAY_MS = 4000;

const MAX_RETRIES = 6;

const API_URL = "https://nft.api.mousehaunt.com/public/mice/";

const pricePerRarity: any = {
  Common: "38",
  Rare: "110",
  Epic: "275",
  Legendary: "1100",
};

const DRY_RUN = false;

async function main() {
  const network: Network = process.env.NETWORK as Network;
  print(colors.highlight, `Creating Sell Orders on ${config[network].name}...`);

  const markeplace = await getContractAt(
    marketplaceContractName,
    config[network][marketplaceContractName].address
  );

  const mouseHero = await getContractAt(
    MouseHeroContractName,
    config[network][MouseHeroContractName].address
  );

  /* Already gave allowance for all
  if (DRY_RUN) {
    print(colors.yellow, `[DRY RUN] Would have sent the approval tx.`);
  } else {
    const allowanceTx = await mouseHero.setApprovalForAll(markeplace.address, true);
    await allowanceTx.wait();
    print(colors.success, `Sent the approval tx: ${allowanceTx.transactionHash}`);
  }
  */

  for (let i = firstTokenId; i <= lastTokenId; i++) {
    print(colors.magenta, `---------------------------------------`);
    print(colors.wait, `Fething Rarity of mouse ${i}...`);
    const rarity = await _fetchMouseRarityByNftId(i);
    const priceInMHT = pricePerRarity[rarity as any];

    print(colors.cyan, `Found rarity and price of nft ${i}: ${rarity} | ${priceInMHT} MHT`);

    if (DRY_RUN) {
      print(colors.yellow, `[DRY RUN] Would have created a sell order for tokenID ${i}.`);
    } else {
      //const tx = await markeplace.createOrder(mouseHero.address, i, 1, wei(priceInMHT));
      //print(colors.magenta, `TX for token id ${i}: ${tx.transactionHash}`);
      await sellIt(markeplace, mouseHero.address, i, wei(priceInMHT));
    }
    print(colors.magenta, `---------------------------------------`);
  }

  const range = lastTokenId - firstTokenId + 1;

  if (DRY_RUN) {
    print(colors.h_yellow, `[DRY RUN] ${range} orders created!`);
  } else {
    print(colors.bigSuccess, `${range} orders created!`);
  }
}

/**
 * Exemple of response:
 {
  "id": 1000,
  "name": "Best Nerdy Boss",
  "description": "Best Nerdy Boss is a “good vibes”, easy going mouse hero that doesn’t miss a good party with stinky cheese and bread crumbs. Boss hates the winter!",
  "image": "https://mousehaunt.s3.amazonaws.com/c8a9b7e628d02181c7351c0d3d98cbf71cd7dd25",
  "attributes": [
    {
      "trait_type": "Rarity",
      "value": "Common"
    },
    {
      "trait_type": "Torso",
      "value": "Lawful",
      "display_type": "outfit"
    },
    {
      "trait_type": "Box Type",
      "value": "Heroic"
    }
  ]
}
 */
async function _fetchMouseRarityByNftId(nftId: string | number): Promise<any> {
  const url = `${API_URL}${nftId}`;

  const response: any = await axios.get(url).catch((e) => {
    throw e;
  });

  if (!response?.data || response?.error) {
    print(colors.warn, `${JSON.stringify(response?.error, null, 2)}`);
    return await _fetchMouseRarityByNftId(nftId);
  }

  let rarity;
  for (let i = 0; i < response?.data?.attributes?.length; i++) {
    const element = response.data.attributes[i];
    if (element.trait_type === "Rarity") {
      rarity = element.value;
    }
  }

  return rarity;
}

async function sellIt(
  contract: any,
  address: any,
  nftId: any,
  priceInWei: any,
  tries: number = 0
): Promise<any> {
  print(colors.wait, `Trying to sell NFT ID ${nftId}... (waiting for ${DELAY_MS / 1000}s)`);
  await delay(DELAY_MS);

  print(colors.wait, `Sending tx... (${tries} failed tries so far)`);
  tries++;

  try {
    const tx = await contract.createOrder(address, nftId, 1, priceInWei);

    print(colors.success, `Success! Created sell order for NFT ${nftId}: ${tx.hash}`);
    Promise.resolve();
  } catch (e: any) {
    if (tries <= MAX_RETRIES) {
      print(colors.blue, `Failed sending tx for NFT ID ${nftId} (${e.message}).\nRetrying...`);
      return await sellIt(contract, address, nftId, priceInWei, tries);
    } else {
      print(
        colors.h_blue,
        `Permanently failed sending tx for NFT ID ${nftId} after ${tries} tries. Abandoned.`
      );
      Promise.resolve();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

/*
Usage:
npx hardhat run scripts/tools/stratifier/stratifier.ts > scripts/tools/stratifier/data/Strat-2022-03-21.json

*/

import { BigNumber } from "ethers";
import axios from "axios";

/* eslint-disable node/no-missing-import */
import { print, colors } from "../../../src/utils/misc";
import * as ENV from "../../../src/utils/env";
const CONFIG = ENV.getConfig();

const rawFetchedLists: any = [];
const finalLists: any = [];

export default async function exec() {
  try {
    const addressList = [
      { name: "MHH", address: CONFIG.MouseHero.address },
      /*{ name: "MHT", address: CONFIG.MouseHauntToken.address },
      { name: "Legendary", address: CONFIG.BMHTL.address },
      { name: "Epic", address: CONFIG.BMHTE.address },
      { name: "Rare", address: CONFIG.BMHTR.address },
      { name: "Genesis", address: CONFIG.BMHTG.address },
      { name: "Heroic", address: CONFIG.BMHTH.address },*/
    ];

    const baseUrl = CONFIG.services.holders.baseUrl;
    const apiKey = CONFIG.services.holders.apiKey;
    const chainId = CONFIG.chainId;

    const urlEnding = `/token_holders/?key=${apiKey}&page-size=999999`;

    for (let i = 0; i < addressList.length; i++) {
      // example: "https://api.covalenthq.com/v1/56/tokens/0x5Cb2C3Ed882E37DA610f9eF5b0FA25514d7bc85B/token_holders/?key=ckey_3e2bebb71b564e71bdaa5d87dca&page-size=999999"
      const url = `${baseUrl}${chainId}/tokens/${addressList[i].address}${urlEnding}`;
      const response: any = await axios.get(url).catch((e) => {
        // print(colors.error, e.message);
        throw e;
      });

      rawFetchedLists.push({ name: addressList[i].name, holders: response.data });
    }

    for (let i = 0; i < rawFetchedLists.length; i++) {
      const list = rawFetchedLists[i];
      const newList = [];
      for (let j = 0; j < list.holders.data.items.length; j++) {
        const element = list.holders.data.items[j];
        newList.push({
          address: element.address,
          balance: element.balance,
        });
      }

      finalLists.push({
        asset: list.name,
        total_count: list.holders.data.pagination.total_count,
        items: newList,
      });
    }

    return finalLists;
  } catch (e: any) {
    print(colors.error, e.stack);
    process.exitCode = 1;
  }
}

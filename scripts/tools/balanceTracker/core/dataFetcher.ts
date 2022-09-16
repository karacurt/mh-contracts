import axios from "axios";
import { getBlockByDate } from "../../../../src/utils/dataApi";
import { delay } from "../../../../src/utils/misc";
import * as ENV from "../../../../src/utils/env";
const CONFIG = ENV.getConfig();

const DELAY_MS = 1000;

export async function fetchData(targetDate: Date, contractName: String, contractAddress: string) {
  try {
    const baseUrl = CONFIG.services.holders.baseUrl;
    const apiKey = CONFIG.services.holders.apiKey;
    const chainId = CONFIG.chainId;

    const blockHeight = await getBlockByDate(targetDate);

    const queryBlock = blockHeight == null ? "" : `&block-height=${blockHeight}`;

    const urlEnding = `/token_holders/?key=${apiKey}&page-size=999999${queryBlock}`;

    // example: "https://api.covalenthq.com/v1/56/tokens/0x5Cb2C3Ed882E37DA610f9eF5b0FA25514d7bc85B/token_holders/?key=ckey_3e2bebb71b564e71bdaa5d87dca&page-size=999999"
    const url = `${baseUrl}${chainId}/tokens/${contractAddress}${urlEnding}`;

    const response: any = await axios.get(url).catch((e) => {
      throw e;
    });

    const holders = response.data.data.items;
    const newList = [];
    for (let i = 0; i < holders.length; i++) {
      newList.push({
        address: holders[i].address.toLowerCase(),
        balance: holders[i].balance,
      });
    }

    await delay(DELAY_MS);

    return {
      asset: contractName,
      date: targetDate.toISOString().split("T")[0],
      total_count: response.data.data.pagination.total_count,
      items: newList,
    };
  } catch (e: any) {
    console.log({ e });
    process.exitCode = 1;
  }
}

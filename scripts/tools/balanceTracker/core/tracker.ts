import { BigNumber } from "ethers";
import { fetchData } from "./dataFetcher";

export async function track(DATES: Date[], ADDRESSES: string[], TOKENS: any) {
  const greatList = [];

  ADDRESSES.forEach((item, index) => {
    ADDRESSES[index] = item.toLowerCase();
  });

  for (let i = 0; i < DATES.length; i++) {
    const date = DATES[i];
    for (let j = 0; j < TOKENS.length; j++) {
      const list = await fetchData(date, TOKENS[j].name, TOKENS[j].address).catch((e: any) => {
        throw e;
      });

      greatList.push(list);
    }
  }

  const dictionary: any = {};

  for (let i = 0; i < greatList.length; i += TOKENS.length) {
    for (let j = 0; j < TOKENS.length; j++) {
      const list = greatList[i + j] as any;

      for (let k = 0; k < list.items.length; k++) {
        const element = list.items[k];
        const address = element.address;
        const asset = list.asset;
        const date = list.date;

        if (!dictionary[address]) {
          dictionary[address] = {};
        }

        if (!dictionary[address][asset]) {
          dictionary[address][asset] = {};
        }

        if (asset === "BMHTE" || asset === "BMHTL" || asset === "MHT" || asset === "BUSD") {
          dictionary[address][asset][date] = BigNumber.from(element.balance)
            .div("1000000000000000000")
            .toString();
        } else {
          dictionary[address][asset][date] = element.balance;
        }
      }
    }
  }

  // now, create a new list only with those addresses that are in ADDRESSES
  const keys = Object.keys(dictionary);
  const crossDictionary: any = {};
  keys.forEach((key) => {
    if (ADDRESSES.includes(key)) {
      crossDictionary[key] = dictionary[key];
    }
  });

  return crossDictionary;
}

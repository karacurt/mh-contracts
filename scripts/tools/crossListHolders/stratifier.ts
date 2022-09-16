import { BigNumber } from "ethers";

/* eslint-disable node/no-missing-import */
import { print, colors, addr } from "../../../src/utils/misc";

import { default as fetchData } from "./dataFetcher";

import shortlist from "./data/shortlist.json";

async function main() {
  // print(colors.highlight, `Executing Stratifier`);

  const greatList = await fetchData().catch((e: any) => {
    throw e;
  });

  const dictionary: any = {};

  for (let i = 0; i < greatList.length; i++) {
    const list: any = greatList[i];
    for (let j = 0; j < list.items.length; j++) {
      const element = list.items[j];
      if (dictionary[element.address]) {
        if (list.asset === "Epic" || list.asset === "Legendary" || list.asset === "MHT") {
          dictionary[element.address][list.asset] = BigNumber.from(element.balance)
            .div("1000000000000000000")
            .toString();
        } else {
          dictionary[element.address][list.asset] = element.balance;
        }
      } else {
        dictionary[element.address] = {};
        if (list.asset === "Epic" || list.asset === "Legendary" || list.asset === "MHT") {
          dictionary[element.address][list.asset] = BigNumber.from(element.balance)
            .div("1000000000000000000")
            .toString();
        } else {
          dictionary[element.address][list.asset] = element.balance;
        }
      }
    }
  }

  const totalCount = Object.keys(dictionary).length;

  let normalizedBalanceList = Object.keys(dictionary);
  normalizedBalanceList = normalizedBalanceList.map((address) => {
    return addr(address);
  });

  const normalizedShortlist = shortlist.map((address) => {
    return addr(address);
  });

  const crossList: any = [];
  normalizedShortlist.forEach((address) => {
    if (normalizedBalanceList.includes(address)) {
      crossList.push("YES");
    } else {
      crossList.push("NO");
    }
  });

  const reorganized = {
    totalCount: totalCount,
    crossList,
    holders: { ...dictionary },
  };

  console.log(JSON.stringify(reorganized, null, 2));

  // print(colors.bigSuccess, `SUCCESS`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

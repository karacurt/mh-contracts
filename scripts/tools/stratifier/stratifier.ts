/*
Usage:
npx hardhat run scripts/tools/stratifier/stratifier.ts --network bsc > strat-2022-04-01.json
*/

import { BigNumber } from "ethers";

/* eslint-disable node/no-missing-import */
import { print, colors } from "../../../src/utils/misc";

import { default as fetchData } from "./dataFetcher";

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

      if (!dictionary[element.address]) {
        dictionary[element.address] = {};
      }

      if (
        list.asset === "Epic" ||
        list.asset === "Legendary" ||
        list.asset === "MHT" ||
        list.asset === "BUSD"
      ) {
        dictionary[element.address][list.asset] = BigNumber.from(element.balance)
          .div("1000000000000000000")
          .toString();
      } else {
        dictionary[element.address][list.asset] = element.balance;
      }
    }
  }

  const totalCount = Object.keys(dictionary).length;

  const MHT_Holders = Object.keys(dictionary).filter((key: any) => {
    if (dictionary[key].MHT as any) return true;
    if ((dictionary[key].MHT as any) === "0") return true;
    if ((dictionary[key].MHT as any) === 0) return true;
  });

  const Booster_Holders = Object.keys(dictionary).filter((key: any) => {
    if (dictionary[key].Legendary as any) return true;
    if (dictionary[key].Epic as any) return true;
    if (dictionary[key].Rare as any) return true;
    if (dictionary[key].Genesis as any) return true;
    if (dictionary[key].Heroic as any) return true;
  });

  const MHH_Holders = Object.keys(dictionary).filter((key: any) => {
    if (dictionary[key].MHH as any) return true;
    if ((dictionary[key].MHH as any) === "0") return true;
    if ((dictionary[key].MHH as any) === 0) return true;
  });

  const MHT_only_Holders = Object.keys(dictionary).filter((key: any) => {
    if (
      (dictionary[key].MHT as any) &&
      (!dictionary[key].MHH as any) &&
      (!dictionary[key].Legendary as any) &&
      (!dictionary[key].Epic as any) &&
      (!dictionary[key].Rare as any) &&
      (!dictionary[key].Genesis as any) &&
      (!dictionary[key].Heroic as any)
    )
      return true;
  });

  const Booster_only_Holders = Object.keys(dictionary).filter((key: any) => {
    if (
      (!dictionary[key].MHT as any) &&
      (!dictionary[key].MHH as any) &&
      ((dictionary[key].Legendary as any) ||
        (dictionary[key].Epic as any) ||
        (dictionary[key].Rare as any) ||
        (dictionary[key].Genesis as any) ||
        (dictionary[key].Heroic as any))
    )
      return true;
  });

  const MHH_only_holders = Object.keys(dictionary).filter((key: any) => {
    if (
      (dictionary[key].MHH as any) &&
      (!dictionary[key].MHT as any) &&
      (!dictionary[key].Legendary as any) &&
      (!dictionary[key].Epic as any) &&
      (!dictionary[key].Rare as any) &&
      (!dictionary[key].Genesis as any) &&
      (!dictionary[key].Heroic as any)
    )
      return true;
  });

  const MHT_plus_Booster_holders = Object.keys(dictionary).filter((key: any) => {
    if (
      (dictionary[key].MHT as any) &&
      ((dictionary[key].Legendary as any) ||
        (dictionary[key].Epic as any) ||
        (dictionary[key].Rare as any) ||
        (dictionary[key].Genesis as any) ||
        (dictionary[key].Heroic as any))
    )
      return true;
  });

  const MHH_plus_Booster_holders = Object.keys(dictionary).filter((key: any) => {
    if (
      (dictionary[key].MHH as any) &&
      ((dictionary[key].Legendary as any) ||
        (dictionary[key].Epic as any) ||
        (dictionary[key].Rare as any) ||
        (dictionary[key].Genesis as any) ||
        (dictionary[key].Heroic as any))
    )
      return true;
  });

  const MHT_plus_MHH_holders = Object.keys(dictionary).filter((key: any) => {
    if ((dictionary[key].MHT as any) && (dictionary[key].MHH as any)) return true;
  });

  const MHT_plus_Booster_plus_MHH_holders = Object.keys(dictionary).filter((key: any) => {
    if (
      (dictionary[key].MHT as any) &&
      (dictionary[key].MHH as any) &&
      ((dictionary[key].Legendary as any) ||
        (dictionary[key].Epic as any) ||
        (dictionary[key].Rare as any) ||
        (dictionary[key].Genesis as any) ||
        (dictionary[key].Heroic as any))
    )
      return true;
  });

  const reorganized = {
    date: greatList[0].date.split("T")[0],
    totalCount: totalCount,
    MHT_Holders: MHT_Holders.length,
    Booster_Holders: Booster_Holders.length,
    MHH_Holders: MHH_Holders.length,
    MHT_only_holders: MHT_only_Holders.length,
    Booster_only_Holders: Booster_only_Holders.length,
    MHH_only_holders: MHH_only_holders.length,
    MHT_AND_Booster_holders: MHT_plus_Booster_holders.length,
    MHH_AND_Booster_holders: MHH_plus_Booster_holders.length,
    MHT_AND_MHH_holders: MHT_plus_MHH_holders.length,
    MHT_AND_Booster_AND_MHH_holders: MHT_plus_Booster_plus_MHH_holders.length,
    Holders: { ...dictionary },
  };

  console.log(JSON.stringify(reorganized, null, 2));

  // print(colors.bigSuccess, `SUCCESS`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

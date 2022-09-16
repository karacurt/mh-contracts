/*
Usage:
npx hardhat run scripts/tools/balanceTracker/MHTHolderMembership.ts > scripts/tools/balanceTracker/data/AlphaHolders-2022-04-03.json
*/

import { track } from "./core/tracker";
import { DATES, ADDRESSES, TOKENS, TIERS, MH_WALLETS, getTier } from "./MHTHolderMembership_config";

async function main() {
  const start = new Date().getTime();

  normalizeMHWallets();

  const dictionary = await track(DATES, ADDRESSES, TOKENS);

  makeStats(dictionary);
  makeTiers(dictionary);
  const finalDictionary = pruneForMHTHolderEvent(dictionary);

  const end = (new Date().getTime() - start) / 1000;
  console.log(`Finished in ${end} seconds`);

  console.log(JSON.stringify(finalDictionary, null, 2));
}

function normalizeMHWallets() {
  MH_WALLETS.forEach((item, index) => {
    MH_WALLETS[index] = item.toLowerCase();
  });
}

function makeStats(dictionary: any) {
  const keys = Object.keys(dictionary);
  for (let i = 0; i < keys.length; i++) {
    const playerTokens = Object.keys(dictionary[keys[i]]);
    for (let j = 0; j < playerTokens.length; j++) {
      const stringValues = Object.values(dictionary[keys[i]][playerTokens[j]]);
      const numberValues = stringValues.map((item: any) => {
        return parseInt(item);
      });
      const sum = numberValues.reduce((partialSum: number, a: number) => partialSum + a, 0);
      const min = Math.min(...numberValues);
      const med = sum / numberValues.length;
      const max = Math.max(...numberValues);
      const med_in_period = sum / DATES.length;

      dictionary[keys[i]][playerTokens[j]].stats = {
        min,
        med,
        max,
        med_in_period,
      };
    }
  }
}

function makeTiers(dictionary: any) {
  const keys = Object.keys(dictionary);
  for (let i = 0; i < keys.length; i++) {
    const playerTokens = Object.keys(dictionary[keys[i]]);
    for (let j = 0; j < playerTokens.length; j++) {
      const stats = dictionary[keys[i]][playerTokens[j]].stats;
      const tier = getTier(stats.med_in_period);
      dictionary[keys[i]][playerTokens[j]].stats.tier = tier;
    }
  }
}

function pruneForMHTHolderEvent(dictionary: any) {
  const prunedDictionary: any = {};
  for (let i = 0; i < TIERS.length; i++) {
    prunedDictionary[TIERS[i].name] = [];
  }

  const keys = Object.keys(dictionary);
  for (let i = 0; i < keys.length; i++) {
    // skip if it's one of our wallets
    if (MH_WALLETS.includes(keys[i].toLowerCase())) continue;

    // add the player to that tier list
    prunedDictionary[dictionary[keys[i]].MHT.stats.tier].push({
      address: keys[i],
      median: dictionary[keys[i]].MHT.stats.med_in_period,
    });
  }

  prunedDictionary.stats = {};
  for (let i = 0; i < TIERS.length; i++) {
    // get the tier
    const tier = TIERS[i].name;

    // sort the tier
    prunedDictionary[tier] = prunedDictionary[tier].sort((a: any, b: any) => b.median - a.median);

    // add the count
    prunedDictionary.stats[TIERS[i].name] = prunedDictionary[tier].length;
  }

  return prunedDictionary;
}

main().catch((e) => {
  console.log({ e });
  process.exitCode = 1;
});

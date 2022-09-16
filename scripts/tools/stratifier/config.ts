import * as ENV from "../../../src/utils/env";
const CONFIG = ENV.getConfig();

export const TARGET_DATE = new Date("2022-08-10");

export const tokenList = [
  { name: "MHH", address: CONFIG.MouseHero.address },
  { name: "MHT", address: CONFIG.MouseHauntToken.address },
  /*
  { name: "Legendary", address: CONFIG.BMHTL.address },
  { name: "Epic", address: CONFIG.BMHTE.address },
  { name: "Rare", address: CONFIG.BMHTR.address },
  { name: "Genesis", address: CONFIG.BMHTG.address },
  { name: "Heroic", address: CONFIG.BMHTH.address },
  */
];

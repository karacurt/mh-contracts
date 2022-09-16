import { toWei } from "../../src/utils/misc";
import { Tier } from "./MouseHauntStashingFixture";

export function getFeesForTiers() {
  return [
    { tier: Tier.NIL, fee: toWei("8.25") },
    { tier: Tier.F, fee: toWei("7") },
    { tier: Tier.E, fee: toWei("5.75") },
    { tier: Tier.D, fee: toWei("4.75") },
    { tier: Tier.C, fee: toWei("3.75") },
    { tier: Tier.B, fee: toWei("2.75") },
    { tier: Tier.A, fee: toWei("1.75") },
    { tier: Tier.S, fee: toWei("1.25") },
    { tier: Tier.SS, fee: toWei("1") },
  ];
}

// How much should we burn in each payment?
export const BURN_FEE_PERCENTAGE = "75";

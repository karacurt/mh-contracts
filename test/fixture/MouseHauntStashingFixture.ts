import { toWei } from "../../src/utils/misc";

export enum Tier {
  NIL,
  F,
  E,
  D,
  C,
  B,
  A,
  S,
  SS,
}
export function getRanges() {
  return [
    { range: toWei("60"), isActive: true },
    { range: toWei("250"), isActive: true },
    { range: toWei("500"), isActive: true },
    { range: toWei("1000"), isActive: true },
    { range: toWei("2500"), isActive: true },
    { range: toWei("5000"), isActive: true },
    { range: toWei("15000"), isActive: true },
  ];
}
export function getAllowedPeriodsToStash() {
  return [
    { period: 30, isActive: true },
    { period: 60, isActive: true },
    { period: 90, isActive: true },
    { period: 120, isActive: true },
    { period: 150, isActive: true },
    { period: 180, isActive: true },
  ];
}
export function getTiers() {
  return [
    { period: 30, range: toWei("60"), tier: Tier.NIL },
    { period: 30, range: toWei("250"), tier: Tier.NIL },
    { period: 30, range: toWei("500"), tier: Tier.F },
    { period: 30, range: toWei("1000"), tier: Tier.E },
    { period: 30, range: toWei("2500"), tier: Tier.D },
    { period: 30, range: toWei("5000"), tier: Tier.B },
    { period: 30, range: toWei("15000"), tier: Tier.A },

    { period: 60, range: toWei("60"), tier: Tier.NIL },
    { period: 60, range: toWei("250"), tier: Tier.F },
    { period: 60, range: toWei("500"), tier: Tier.E },
    { period: 60, range: toWei("1000"), tier: Tier.D },
    { period: 60, range: toWei("2500"), tier: Tier.C },
    { period: 60, range: toWei("5000"), tier: Tier.A },
    { period: 60, range: toWei("15000"), tier: Tier.S },

    { period: 90, range: toWei("60"), tier: Tier.F },
    { period: 90, range: toWei("250"), tier: Tier.E },
    { period: 90, range: toWei("500"), tier: Tier.D },
    { period: 90, range: toWei("1000"), tier: Tier.C },
    { period: 90, range: toWei("2500"), tier: Tier.B },
    { period: 90, range: toWei("5000"), tier: Tier.S },
    { period: 90, range: toWei("15000"), tier: Tier.SS },

    { period: 120, range: toWei("60"), tier: Tier.E },
    { period: 120, range: toWei("250"), tier: Tier.D },
    { period: 120, range: toWei("500"), tier: Tier.C },
    { period: 120, range: toWei("1000"), tier: Tier.B },
    { period: 120, range: toWei("2500"), tier: Tier.A },
    { period: 120, range: toWei("5000"), tier: Tier.SS },
    { period: 120, range: toWei("15000"), tier: Tier.SS },

    { period: 150, range: toWei("60"), tier: Tier.D },
    { period: 150, range: toWei("250"), tier: Tier.C },
    { period: 150, range: toWei("500"), tier: Tier.B },
    { period: 150, range: toWei("1000"), tier: Tier.A },
    { period: 150, range: toWei("2500"), tier: Tier.S },
    { period: 150, range: toWei("5000"), tier: Tier.SS },
    { period: 150, range: toWei("15000"), tier: Tier.SS },

    { period: 180, range: toWei("60"), tier: Tier.C },
    { period: 180, range: toWei("250"), tier: Tier.B },
    { period: 180, range: toWei("500"), tier: Tier.A },
    { period: 180, range: toWei("1000"), tier: Tier.S },
    { period: 180, range: toWei("2500"), tier: Tier.SS },
    { period: 180, range: toWei("5000"), tier: Tier.SS },
    { period: 180, range: toWei("15000"), tier: Tier.SS },
  ];
}

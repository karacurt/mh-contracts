import csv from "csvtojson";

export async function toJson(csvFilePath: string) {
  return await csv({ noheader: true }).fromFile(csvFilePath);
}

export async function toJsonWithHeader(csvFilePath: string) {
  return await csv().fromFile(csvFilePath);
}

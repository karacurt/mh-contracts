import * as dotenv from "dotenv";
dotenv.config();

import config, { Network } from "../../src/config";

export function getString(variableName: string) {
  return process.env[variableName] || undefined;
}

export function getBool(variableName: string) {
  return !!process.env[variableName] || false;
}

export function getNumber(variableName: string) {
  return Number(process.env[variableName]) || 0;
}

export function getConfig() {
  const netString = getString(`NETWORK_${getString("ENV")}`);
  return config[netString as Network];
}

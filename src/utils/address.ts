// eslint-disable-next-line node/no-unpublished-import
import { ethers } from "hardhat";

export function isValidAddress(address: string): boolean {
  try {
    ethers.utils.getAddress(address);
  } catch (e) {
    return false;
  }
  return true;
}

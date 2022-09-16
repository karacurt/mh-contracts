import { BigNumber } from "ethers";
import { toWei } from "../../src/utils/misc";

interface AllowedAmount {
  amount: BigNumber;
  isAllowed: boolean;
}
export async function getAllowedAmounts(): Promise<BigNumber[]> {
  // return [{ amount: toWei('100'), isAllowed: true }, { amount: toWei('500'), isAllowed: false }, { amount: toWei('1000'), isAllowed: true }];
  return [toWei('100'), toWei('500'), toWei('1000')];
}
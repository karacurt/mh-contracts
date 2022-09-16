import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { signHash, getDigestClaim } from "./SignatureFixture";

// The web3 signature expects these field types
const typesInWeb3Signature = [
  "address", // guardianAddress
  "address", // playerAddress
  "uint256", // net
  "uint256", // tax
  "uint256", // burn
  "int64", // networkDescriptor
  "int64", // playerNonce
  "int64", // withdrawId
];

// The ts signature expects these fields;
// note that big numbers and addresses are represented as strings;
export type WithdrawClaimData = {
  guardianAddress: string; // address
  playerAddress: string; // address
  net: string; // it's a number string because we need uint256 here (amount of ERC20 or ID of ERC721)
  tax: string; // it's a number string because we need uint256 here (amount of ERC20 or ID of ERC721)
  burn: string; // it's a number string because we need uint256 here (amount of ERC20 or ID of ERC721)
  networkDescriptor: number; // int64
  playerNonce: number; // int64
  withdrawId: number; // int64
};

/**
 * Creates a valid claim
 * @returns { digest, signature }
 */
export async function getValidWithdrawClaim(validator: SignerWithAddress, data: WithdrawClaimData) {
  const digest = getDigestClaim(Object.values(data), typesInWeb3Signature);
  const signature = await signHash(validator, digest);

  return {
    digest,
    signature,
  };
}

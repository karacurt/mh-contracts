import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export type StructuredSig = {
  signer: string;
  _v: number;
  _r: string;
  _s: string;
};

// todo fix :any
export function getDigestClaim(data: any, types: string[]) {
  if (!Array.isArray(data)) {
    throw new Error("Input Error: not array");
  }

  /*if (types.length !== data.length) {
    throw new Error("sigGuardianFixture::getDigestClaim: invalid data length");
  }*/

  const digest = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(types, data));

  return digest;
}

export async function signHash(signer: SignerWithAddress, hash: string): Promise<StructuredSig> {
  const sig = await signer.signMessage(ethers.utils.arrayify(hash));
  const splitSig = ethers.utils.splitSignature(sig);
  const structuredSig: StructuredSig = {
    signer: signer.address,
    _v: splitSig.v,
    _r: splitSig.r,
    _s: splitSig.s,
  };

  return structuredSig;
}

/**
 * Creates a valid claim
 * @returns { digest, signature }
 */
export async function getValidClaim(validator: SignerWithAddress, data: any) {
  const types = [`tuple(uint256 dataType,bytes data,string key)[]`];

  const dataExtracted: any[] = [];

  Object.values(data).forEach((value) => {
    dataExtracted.push(Object.values(value as any));
  });

  const digest = getDigestClaim([data], types);
  const signature = await signHash(validator, digest);

  const result = {
    digest,
    signature,
  };

  return result;
}

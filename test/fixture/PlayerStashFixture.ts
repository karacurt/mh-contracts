import { ethers } from "ethers";
import { getValidClaim } from "./sigGuardianFixture";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { DataType, IData, Identifiers } from "../types";

function getValidData(claimData: any, types: string[]): IData[] {
  const data: IData[] = [];

  Object.keys(claimData).map((value, index) => {
    const dataInfo: IData = {
      dataType: DataType[types[index].toUpperCase() as any],
      data: ethers.utils.defaultAbiCoder.encode([types[index]], [claimData[value]]),
      key: value,
    };
    data.push(dataInfo);
  });

  return data;
}
export async function getValidWithdrawNFT(
  tokenAddress: string,
  tokenId: string,
  playerAddress: string,
  guardianAddress: string,
  networkDescriptor: number,
  validator: SignerWithAddress,
  playerNonce: number
) {
  const claimData: any = {
    guardianAddress,
    playerAddress,
    tokenAddress,
    tokenId,
    networkDescriptor,
    playerNonce,
  };

  const types = [
    "address", // guardianAddress
    "address", // playerAddress
    "address", // tokenAddress
    "uint256", // value
    "int64", // networkDescriptor
    "int64", // _playerNonce
  ];

  const data = getValidData(claimData, types);

  const { digest, signature } = await getValidClaim(validator, data);

  return { digest, data, signature };
}
export async function getValidWithdrawCoin(
  tokenAddress: string,
  gross: string,
  playerAddress: string,
  net: string,
  guardianAddress: string,
  networkDescriptor: number,
  validator: SignerWithAddress,
  playerNonce: number
) {
  const claimData: any = {
    guardianAddress,
    playerAddress,
    tokenAddress,
    gross,
    net,
    networkDescriptor,
    playerNonce,
  };

  const types = [
    "address", // guardianAddress
    "address", // playerAddress
    "address", // tokenAddress
    "uint256", // gross
    "uint256", // net
    "int64", // networkDescriptor
    "int64", // _playerNonce
  ];

  const data = getValidData(claimData, types);

  const { digest, signature } = await getValidClaim(validator, data);

  return { digest, data, signature };
}
export async function getValidDepositNFT(
  identifier: Identifiers,
  tokenAddress: string,
  tokenId: number,
  playerAddress: string,
  guardianAddress: string,
  networkDescriptor: number,
  validator: SignerWithAddress,
  playerNonce: number
) {
  const claimData: any = {
    guardianAddress,
    playerAddress,
    tokenAddress,
    tokenId,
    identifier,
    networkDescriptor,
    playerNonce,
  };

  const types = [
    "address", // guardianAddress
    "address", // playerAddress
    "address", // tokenAddress
    "uint256", // tokenId
    "uint256", // identifier
    "int64", // networkDescriptor
    "int64", // _playerNonce
  ];

  const data = getValidData(claimData, types);

  const { digest, signature } = await getValidClaim(validator, data);

  return { digest, data, signature };
}
export async function getValidDepositCoin(
  tokenAddress: string,
  playerAddress: string,
  amount: string,
  guardianAddress: string,
  networkDescriptor: number,
  validator: SignerWithAddress,
  playerNonce: number
) {
  const claimData: any = {
    guardianAddress,
    playerAddress,
    tokenAddress,
    amount,
    networkDescriptor,
    playerNonce,
  };

  const types = [
    "address", // guardianAddress
    "address", // playerAddress
    "address", // tokenAddress
    "uint256", // amount
    "int64", // networkDescriptor
    "int64", // _playerNonce
  ];

  const data = getValidData(claimData, types);

  const { digest, signature } = await getValidClaim(validator, data);

  return { digest, data, signature };
}
export async function getValidDepositGeneric(
  index: number,
  value: number,
  playerAddress: string,
  guardianAddress: string,
  networkDescriptor: number,
  validator: SignerWithAddress,
  playerNonce: number
) {
  const claimData = {
    guardianAddress,
    playerAddress,
    index,
    value,
    networkDescriptor,
    playerNonce,
  };

  const types = [
    "address", // guardianAddress
    "address", // playerAddress
    "uint256", // index
    "uint256", // value
    "int64", // networkDescriptor
    "int64", // _playerNonce
  ];

  const data = getValidData(claimData, types);

  const { digest, signature } = await getValidClaim(validator, data);

  return { digest, data, signature };
}
export async function getValidWithdrawGeneric(
  index: number,
  value: number,
  playerAddress: string,
  guardianAddress: string,
  networkDescriptor: number,
  validator: SignerWithAddress,
  playerNonce: number
) {
  const claimData = {
    guardianAddress,
    playerAddress,
    index: index,
    value: value,
    networkDescriptor,
    playerNonce,
  };

  const types = [
    "address", // guardianAddress
    "address", // playerAddress
    "uint256", // index
    "uint256", // value
    "int64", // networkDescriptor
    "int64", // _playerNonce
  ];

  const data = getValidData(claimData, types);

  const { digest, signature } = await getValidClaim(validator, data);

  return { digest, data, signature };
}

import { ethers } from "ethers";
import { getValidClaim } from "./sigGuardianFixture";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { DataType, IData } from "../types";

export async function getValidCreateRentOrder(
  playerAddress: string,
  tokenAddress: string,
  tokenId: number,
  valuePerDay: number,
  maxDays: number,
  guardianAddress: string,
  networkDescriptor: number,
  playerNonce: number,
  validator: SignerWithAddress
) {
  const claimData: any = {
    guardianAddress,
    playerAddress,
    tokenAddress,
    tokenId: tokenId.toString(),
    valuePerDay: valuePerDay.toString(),
    maxDays: maxDays.toString(),
    networkDescriptor,
    playerNonce,
  };

  const data: IData[] = [];

  const types = [
    "address", // guardianAddress
    "address", // playerAddress
    "address", // tokenAddress
    "uint256", // tokenId
    "uint256", // valuePerDay
    "uint256", // maxDays
    "int64", // networkDescriptor
    "int64", // _playerNonce
  ];

  Object.keys(claimData).map((value, index) => {
    const dataInfo: IData = {
      dataType: DataType[types[index].toUpperCase() as any],
      data: ethers.utils.defaultAbiCoder.encode([types[index]], [claimData[value]]),
      key: value,
    };
    data.push(dataInfo);
  });

  const { digest, signature } = await getValidClaim(validator, data);
  return { digest, data, signature };
}

export async function getValidCancelRentOrder(
  playerAddress: string,
  rentOrderId: number,
  guardianAddress: string,
  networkDescriptor: number,
  playerNonce: number,
  validator: SignerWithAddress
) {
  const claimData: any = {
    guardianAddress,
    playerAddress,
    rentOrderId: rentOrderId.toString(),
    networkDescriptor,
    playerNonce,
  };

  const data: IData[] = [];

  const types = [
    "address", // guardianAddress
    "address", // playerAddress
    "uint256", // rentOrderId
    "int64", // networkDescriptor
    "int64", // _playerNonce
  ];

  Object.keys(claimData).map((value, index) => {
    const dataInfo: IData = {
      dataType: DataType[types[index].toUpperCase() as any],
      data: ethers.utils.defaultAbiCoder.encode([types[index]], [claimData[value]]),
      key: value,
    };
    data.push(dataInfo);
  });

  const { digest, signature } = await getValidClaim(validator, data);

  return { digest, data, signature };
}

export async function getValidExecuteRentOrder(
  playerAddress: string,
  rentOrderId: number,
  daysForRent: number,
  paymentTokenAddress: string,
  guardianAddress: string,
  networkDescriptor: number,
  playerNonce: number,
  validator: SignerWithAddress
) {
  const claimData: any = {
    guardianAddress,
    playerAddress,
    rentOrderId: rentOrderId.toString(),
    daysForRent: daysForRent.toString(),
    paymentTokenAddress,
    networkDescriptor,
    playerNonce,
  };

  const data: IData[] = [];

  const types = [
    "address", // guardianAddress
    "address", // playerAddress
    "uint256", // rentOrderId
    "uint256", // daysForRent
    "address", // paymentTokenAddress
    "int64", // networkDescriptor
    "int64", // _playerNonce
  ];

  Object.keys(claimData).map((value, index) => {
    const dataInfo: IData = {
      dataType: DataType[types[index].toUpperCase() as any],
      data: ethers.utils.defaultAbiCoder.encode([types[index]], [claimData[value]]),
      key: value,
    };
    data.push(dataInfo);
  });

  const { digest, signature } = await getValidClaim(validator, data);
  return { digest, data, signature };
}

export async function getValidSetRentOrderAvailability(
  playerAddress: string,
  rentOrderId: number,
  isAvailable: boolean,
  guardianAddress: string,
  networkDescriptor: number,
  playerNonce: number,
  validator: SignerWithAddress
) {
  const claimData: any = {
    guardianAddress,
    playerAddress,
    rentOrderId: rentOrderId.toString(),
    isAvailable: isAvailable,
    networkDescriptor,
    playerNonce,
  };

  const data: IData[] = [];

  const types = [
    "address", // guardianAddress
    "address", // playerAddress
    "uint256", // rentOrderId
    "bool", // isAvailable
    "int64", // networkDescriptor
    "int64", // _playerNonce
  ];

  Object.keys(claimData).map((value, index) => {
    const dataInfo: IData = {
      dataType: DataType[types[index].toUpperCase() as any],
      data: ethers.utils.defaultAbiCoder.encode([types[index]], [claimData[value]]),
      key: value,
    };
    data.push(dataInfo);
  });

  const { digest, signature } = await getValidClaim(validator, data);

  return { digest, data, signature };
}

// eslint-disable-next-line node/no-unpublished-import
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { print, colors } from "../../src/utils/misc";

/**
 * Connects a contract to its deployed instance
 * @param contractName The name of a contract that exists in our codebase
 * @param contractAddress The address of the deployed contract
 * @returns The ethers contract object
 */
export async function getContractAt(contractName: string, contractAddress: string) {
  print(colors.wait, `Connecting to ${contractName}...`);
  const factory = await ethers.getContractFactory(contractName);
  const contract = factory.attach(contractAddress);
  print(colors.success, `Connected to ${contractName}`);

  return contract;
}

/**
 * Deploys a contract
 * @dev The contract cannot be proxied
 * @param contractName The name of a contract that exists in our codebase
 * @param constructorParams List of arguments to be passed to the contract's constructor
 * @returns The ethers contract object
 */
export async function deployContract(contractName: string, constructorParams: any[] = []) {
  print(colors.wait, `Deploying ${contractName}. Please wait...`);

  const factory = await ethers.getContractFactory(contractName);
  const instance = await factory.deploy(...constructorParams);
  await instance.deployed();

  print(colors.success, `${contractName} deployed to: ${instance.address}`);

  return instance;
}

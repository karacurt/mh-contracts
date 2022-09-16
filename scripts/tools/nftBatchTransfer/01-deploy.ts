import { ethers } from "hardhat";
import config, { Network } from "../../../src/config";
// eslint-disable-next-line node/no-missing-import
import { print, colors } from "../../../src/utils/misc";

async function main() {
  const network: Network = process.env.NETWORK as Network;
  print(colors.highlight, `Deploying NftBatchTransfer on ${config[network].name}...`);

  const NftBatchTransferFactory = await ethers.getContractFactory("NftBatchTransfer");
  const nftBatchTransfer = await NftBatchTransferFactory.deploy();
  await nftBatchTransfer.deployed();

  print(colors.bigSuccess, `NftBatchTransfer deployed to ${nftBatchTransfer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

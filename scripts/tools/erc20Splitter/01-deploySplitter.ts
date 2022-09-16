import { ethers, network } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { print, colors } from "../../../src/utils/misc";

async function main() {
  print(colors.highlight, `Deploying the Splitter on ${network.name}...`);

  const SplitterFactory = await ethers.getContractFactory("Splitter");
  const splitter = await SplitterFactory.deploy();
  await splitter.deployed();

  print(colors.bigSuccess, `Splitter deployed to ${splitter.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

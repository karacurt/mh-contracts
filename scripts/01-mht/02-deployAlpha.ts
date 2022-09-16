import { ethers } from "hardhat";

async function main() {
  const MouseHauntAlphaTokenFactory = await ethers.getContractFactory("MouseHauntAlphaToken");
  const mhtA = await MouseHauntAlphaTokenFactory.deploy();

  await mhtA.deployed();

  console.log("Mouse Haunt ALPHA Token deployed to:", mhtA.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

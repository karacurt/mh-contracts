import { ethers, upgrades } from "hardhat";
/* eslint-disable node/no-missing-import */
import { print, colors } from "../../src/utils/misc";
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

/* eslint-disable no-unused-vars */
enum AssetType {
  NIL,
  ERC20,
  ERC721,
}
/* eslint-disable no-unused-vars */

async function main() {
  print(colors.wait, `Deploying Player Stash on ${CONFIG.name}...`);

  const PlayerStashFactory = await ethers.getContractFactory("PlayerStash");
  const playerStash = await upgrades.deployProxy(PlayerStashFactory, [
    CONFIG.chainId, // networkDescriptor
    CONFIG.PlayerStash.validators, // initialValidators
    CONFIG.PlayerStash.owner, // operator
  ]);

  await playerStash.deployed();
  print(colors.success, `Player Stash deployed to: ${playerStash.address}`);

  // set accepted tokens (for now, MHT and MHH)
  print(colors.wait, `Configuring Player Stash...`);
  const trustedTokens = [
    { addr: CONFIG.MouseHauntToken.address, tokenType: AssetType.ERC20 },
    { addr: CONFIG.MouseHero.address, tokenType: AssetType.ERC721 },
  ];
  const trustedTokensTx = await playerStash.setTrustedTokens(trustedTokens);
  print(colors.success, `Player Stash configuration TX: ${trustedTokensTx.hash}`);

  print(colors.bigSuccess, `~~~ DONE ~~~`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

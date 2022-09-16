import { ethers, upgrades } from "hardhat";
import { deployContract, getContractAt } from "../../../src/utils/support";

import * as ENV from "../../../src/utils/env";
const CONFIG = ENV.getConfig();
import { print, colors, confirmOrDie } from "../../../src/utils/misc";

import { BURN_FEE_PERCENTAGE } from "../../../test/fixture/SwapFixture";
const toWei = ethers.utils.parseEther;

/* eslint-disable no-unused-vars */
enum AssetType {
  NIL,
  ERC20,
  ERC721,
}

const contracts = {
  MouseHero: { name: "MouseHero", symbol: "MHH", instance: null },
  MouseHauntToken: { name: "MouseHauntToken", symbol: "MHT", instance: null },
  ERC20Mock: { name: "ERC20Mock", symbol: "BUSD", instance: null },
  BMHTL: { name: "BMHTL", symbol: "BMHTL", instance: null },
  BMHTE: { name: "BMHTE", symbol: "BMHTE", instance: null },
  BMHTR: { name: "BMHTR", symbol: "BMHTR", instance: null },
  BMHTG: { name: "BMHTG", symbol: "BMHTG", instance: null },
  BMHTH: { name: "BMHTH", symbol: "BMHTH", instance: null },
  collectible: { name: "collectible", symbol: "MHC", instance: null },
};

async function main() {
  //await deployBaseContracts();
  await deployExtraContracts();
}

async function deployBaseContracts() {
  print(colors.highlight, `Deploying TEST BASE contracts on BSC Testnet...`);

  const [operator] = await ethers.getSigners();
  print(colors.account, `OPERATOR: ${operator.address}`);

  let MHT, BUSD, BMHTL, BMHTE, BMHTR, BMHTG, BMHTH, MHH, collectible;

  /*
  contracts["MHT"].instance = await deployContract("MouseHauntToken", [operator.address]);
  contracts["BUSD"].instance = await deployContract("ERC20Mock");
  contracts["BMHTL"].instance = await deployContract("BMHTL", [operator.address]);
  contracts["BMHTE"].instance = await deployContract("BMHTE", [operator.address]);
  contracts["BMHTR"].instance = await deployContract("BMHTR", [operator.address]);
  contracts["BMHTG"].instance = await deployContract("BMHTG", [operator.address]);
  contracts["MHH"].instance = await deployContract("MouseHero", [
    "Mouse Hero",
    "MHH",
    "https://dev-nft.api.mousehaunt.com/public/mice/",
  ]);
  contracts["BMHTH"].instance = await deployContract("BMHTH", [operator.address, mouseHero.address]);
  */

  if (!MHH) {
    MHH = await getContractAt("MouseHero", CONFIG.MouseHero.address);
  }
  if (!MHT) {
    MHT = await getContractAt("MouseHauntToken", CONFIG.MouseHauntToken.address);
  }
  if (!BUSD) {
    BUSD = await getContractAt("ERC20Mock", CONFIG.BUSD.address);
  }
  if (!BMHTL) {
    BMHTL = await getContractAt("BMHTL", CONFIG.BUSD.address);
  }
  if (!BMHTE) {
    BMHTE = await getContractAt("BMHTE", CONFIG.BMHTE.address);
  }
  if (!BMHTR) {
    BMHTR = await getContractAt("BMHTR", CONFIG.BMHTR.address);
  }
  if (!BMHTG) {
    BMHTG = await getContractAt("BMHTG", CONFIG.BMHTG.address);
  }
  if (!BMHTH) {
    BMHTH = await getContractAt("BMHTH", CONFIG.BMHTH.address);
  }

  // Register known boosters
  print(colors.wait, `Registering accepted tokens (Mouse Hero)...`);
  const mouseHeroRegisterTx = await MHH.setAcceptedBoosters(
    [BMHTR.address, BMHTE.address, BMHTL.address, BMHTG.address, BMHTH.address],
    [true, true, true, true, true]
  );
  print(colors.success, `Register accepted tokens (MouseHero) hash: ${mouseHeroRegisterTx.hash}`);

  // Deploy the Marketplace
  print(colors.wait, `Deploying the Marketplace...`);
  const MarketplaceFactory = await ethers.getContractFactory("MarketplaceV3AntiMEV");
  const marketplace = await upgrades.deployProxy(MarketplaceFactory, [
    MHT.address,
    "10",
    "0",
    operator.address,
    BUSD.address,
    BUSD.address,
    "0",
    operator.address,
  ]);
  await marketplace.deployed();
  print(colors.success, `Marketplace deployed to: ${marketplace.address}`);

  print(colors.wait, `Registering accepted tokens (Marketplace)...`);
  const MouseHauntTokens = [
    { addr: BMHTE.address, assetType: AssetType.ERC20 },
    { addr: BMHTL.address, assetType: AssetType.ERC20 },
    { addr: BMHTR.address, assetType: AssetType.ERC20 },
    { addr: BMHTG.address, assetType: AssetType.ERC20 },
    { addr: BMHTH.address, assetType: AssetType.ERC20 },
    { addr: MHH.address, assetType: AssetType.ERC721 },
  ];
  const marketplaceRegisterTx = await marketplace.setNFTs(MouseHauntTokens);
  print(
    colors.success,
    `Register accepted tokens (Marketplace) hash: ${marketplaceRegisterTx.hash}`
  );

  print(colors.bigSuccess, `All contracts successfully deployed!`);
}

async function deployExtraContracts() {
  print(colors.highlight, `Deploying TEST EXTRA contracts on BSC Testnet...`);

  const [operator] = await ethers.getSigners();
  print(colors.account, `OPERATOR: ${operator.address}`);

  const farmFactory = await ethers.getContractFactory("Farm");
  const farm = await upgrades.deployProxy(farmFactory, [
    String(CONFIG.chainId),
    CONFIG.Farm.validators,
    CONFIG.Farm.operator,
    CONFIG.MouseHauntToken.address,
  ]);
  await farm.deployed();
  print(colors.success, `Farm deployed to: ${farm.address}`);

  const stasherFactory = await ethers.getContractFactory("MouseHauntStashing");
  const stashing = await upgrades.deployProxy(stasherFactory, [
    CONFIG.MouseHauntStashing.owner,
    CONFIG.MouseHauntToken.address,
  ]);
  await stashing.deployed();
  print(colors.success, `Stashing deployed to: ${stashing.address}`);

  const burnFeePercentage = toWei(BURN_FEE_PERCENTAGE);
  const swapFactory = await ethers.getContractFactory("Swap");
  const swap = await upgrades.deployProxy(swapFactory, [
    CONFIG.Swap.owner,
    farm.address,
    CONFIG.MouseHauntToken.address,
    CONFIG.MouseHero.address,
    burnFeePercentage,
    stashing.address,
  ]);
  await swap.deployed();
  print(colors.success, `Swap deployed to: ${swap.address}`);

  const mhtOnRampFactory = await ethers.getContractFactory("MhtOnRamp");
  const mhtOnRamp = await upgrades.deployProxy(mhtOnRampFactory, [
    CONFIG.MhtOnRamp.owner,
    CONFIG.MouseHauntToken.address,
    farm.address,
  ]);
  await mhtOnRamp.deployed();
  print(colors.success, `MhtOnRamp deployed to: ${mhtOnRamp.address}`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

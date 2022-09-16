import { ethers, upgrades } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();
import { print, colors, confirmOrDie, toWei } from "../../src/utils/misc";

async function main() {
  print(colors.highlight, `Deploying MHT On Ramp on ${CONFIG.name}...`);

  await confirmOrDie(`Are you sure you would like to deploy the MhtOnRamp on ${CONFIG.name}?`);
  const swapFeePercentage = toWei("2.05");
  const MhtRamp = await ethers.getContractFactory("MhtOnRamp");
  const mhtramp = await upgrades.deployProxy(MhtRamp, [
    CONFIG.MhtOnRamp.owner, //don't forget to add the contract operator before deploy
    CONFIG.MouseHauntToken.address, //trusted token already setted
    CONFIG.Farm.address, //farming contract already setted
    '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3',//router testnet
    '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee', //busd address testnet
    swapFeePercentage,
    CONFIG.MhtOnRamp.owner,
  ]);

  const deployTx = await mhtramp.deployed();
  print(colors.success, `Deploy done TX: ${deployTx.hash}`);
  print(colors.bigSuccess, `mht onramp deployed to: ${mhtramp.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

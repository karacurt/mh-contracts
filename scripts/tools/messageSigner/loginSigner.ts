import { ethers } from "hardhat";

/* eslint-disable node/no-missing-import */
import { print, colors } from "../../../src/utils/misc";

const UUID = "a07a8c8e-4ace-4075-b03a-e2da6b251747";
const messageToSign = `I love Mouse Haunt!${UUID}`;

let operator;

async function main() {
  print(colors.highlight, `Executing Login Signer`);

  [operator] = await ethers.getSigners();

  console.log(`operator.address: ${operator.address}`);

  const sig = await operator.signMessage(messageToSign);

  const signer = ethers.utils.verifyMessage(messageToSign, sig);

  print(colors.success, `Message signed:\n${sig}`);
  print(colors.success, `Signer:\n${signer}`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

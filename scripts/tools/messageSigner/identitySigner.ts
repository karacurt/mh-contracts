import { ethers } from "hardhat";

/* eslint-disable node/no-missing-import */
import { print, colors } from "../../../src/utils/misc";

//const address = "0x6F165B30ee4bFc9565E977Ae252E4110624ab147";
//const nickname = "Kozika";
//const code = "0x8ae24bf2f6eac99c4d098cb3ef7a3ef10c2ddbca5f019f23dc59f0c7c4bfd888";

//const address = "0x6F165B30ee4bFc9565E977Ae252E4110624ab147";
//const nickname = "Kozika";

//const address = "0xfc854524613dA7244417908d199857754189633c";
//const nickname = "Mameluco";

const address = "0x4A701fa920339D484e10deA12871bc5c7C88a18f";
const nickname = "OP";

//const address = "0x53269BAf68ED80580DF23415BcfeC73B6E061171";
//const nickname = "PabloGH#6657";

const messageToSign = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes(`${ethers.utils.getAddress(address)}${nickname}`)
);

let operator;

async function main() {
  print(colors.highlight, `Executing Identity Signer`);

  [operator] = await ethers.getSigners();

  const sig = await operator.signMessage(messageToSign);
  //const sig =
  //"0x2aa56b93e8645c078864c1f224b15fb511da8a8c8e7e2f4962a6cd40019fd0e94f7f1c194d3cf23195661202ab569d06";

  const signer = ethers.utils.verifyMessage(messageToSign, sig);

  print(colors.success, `Code:\n${messageToSign}`);
  print(colors.success, `Message signed:\n${sig}`);
  print(colors.success, `Signer:\n${signer}`);
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

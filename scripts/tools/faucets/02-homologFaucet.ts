/**
 * This script sends MHT, BMHTL, BMHTE, BMHTR, BMHTG, BMHTH and ERC20Mock (simulates BUSD)
 * to N addresses of your choosing.
 * 
 * Usage:
 * First set the basic .env variables like so:
 * 
```
NETWORK=bscHomolog
URL_BSC_TESTNET=https://data-seed-prebsc-1-s1.binance.org:8545/
PRIVATE_KEY_BSC_TESTNET=XXXXXXXXXXXXXXXXX 
```
 * Make sure your using the TEST OPERATOR private key
 * (it corresponds to the address 0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1)
 * 
 * Then, adjust the value of the constant variable RECIPIENTS
 * 
 * Finally, call the script like so:
 * `npx hardhat run scripts/tools/08-homologFaucet.ts --network bscHomolog`
*/

import { ethers } from "hardhat";
/* eslint-disable node/no-missing-import */
import config from "../../../src/config";
import { print, colors } from "../../../src/utils/misc";
import { getContractAt } from "../../../src/utils/support";

const BN = ethers.BigNumber;
/* eslint-disable node/no-missing-import */

type ContractName =
  | "MouseHauntToken"
  | "BMHTL"
  | "BMHTE"
  | "BMHTR"
  | "BMHTG"
  | "BMHTH"
  | "ERC20Mock";

// Default value is MHT
const CONTRACTS_NAMES: ContractName[] = [
  /*"BMHTL",
  "BMHTE",
  "BMHTR",
  "BMHTG",
  "BMHTH",
  */
  "MouseHauntToken",
  //"ERC20Mock",
];

// Don't change this
const DEFAULT_OPERATOR = "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1";

// Amount of boosters of each type to be transferred
const BOOSTERS_AMOUNT = "10";

// 10k
const MHT_BUSD_AMOUNT = "10000";

// ONLY TEST ACCOUNTS BELOW (NEVER USE A MAINNET ACCOUNT HERE!)
const RECIPIENTS: string[] = [
  //"0x92349670E3ACD498996cA34f5FAd3a11ff0A929f", // User A ("MH - Test 3")
  //"0x525290a493bcE906a6e4B8C61D67bbf1D333275A", // User B ("MH - Test 4")
  //"0x09dcF02C01849231Bb22CC76233c31f35Db6fAac", // CEO: Pedro
  //"0xfc854524613dA7244417908d199857754189633c", // TechTeam: Kozika
  //"0xe990F3e0c80DEaa43728A945e172138A7f4cC873", // TechTeam: Bluemonk
  //"0xDD5Af84b1A2307054311a32e5aa25467D2e0253c", // TechTeam: Juo
  //"0x73aEb1731c0d7a5C8F0Cb072F761ea00aBe914a6", // TechTeam: PedroWand
  //"0x248fF3ecc40F5642103d30A33bb923a75649b8bb", // Marketing: Kyoni
  //"0xCb6e8C7494B93Cba629e6413880881715893c0ec", // Marketing: Tadakuma
  //"0xeaa1baD710966f9EF69a42535Bd49Fc385507140", // Mod: Danilorde
  //"0xd1f671caB45901665cD844E332538A7FE8cbCd4D", // Mod: Gustavo
  //"0xCC45987Ad3F3EAd335035a385A0171c5521a0C8C", // Mod: Kanks
  //"0x741b096CE09dE76E2f69456b3B2CcB4232347CC9", // Mod: Nz
  //"0x9628564D8277A020a3C1E05AE683cb110e1f0bd8", // Mod: DarkVoid
  //"0x5e8330DB7C92d74b6A8980C5796c5f46655c4Fa5", // Mod: Hiko
  //"0x8d09dA04168Aad3f6A0C904EB0E6E7D8B9213fC6", // Mod: Choper
  //"0x00392382DC678C8Dd3dFF37eF37Ca7Cb0Fe3eA81", // Mod: Balanaar
  //"0x32Fe8CA660809E319f74883110125cB535e8b18D", // Mod: Gabriel
  //"0x087B58029f7251E7054153Bc8775e14A68490286", // Advisors: Aviggiano
  // "0xcd548AEA3a9c8E7BE59766692ee2e63c77069999", // PM: Rafa
  // "0x6Ad655ccFC644F4373Ac39cfB6348A7946BBDB90", // Rohit
  // "0xeB54e82425403ec02b37a199cfAabFA8DC961b5f", // Mike
  // "0xe32f904A6Cec9F361631b8b2F8e7f72Ae4b76A1b", // SLowestSloth
  "0xD05beA001E38e608f98C8C3B3a0E0832Bb3A2828", // Rafa new wallet
];

async function main() {
  print(colors.highlight, `RUNNING FAUCET`);

  const [operator] = await ethers.getSigners();
  print(colors.account, `OPERATOR: ${operator.address}`);

  if (operator.address !== DEFAULT_OPERATOR) {
    throw new Error(`OPERATOR MISMATCH: should be ${DEFAULT_OPERATOR}`);
  }

  for (const contractName of CONTRACTS_NAMES) {
    const tokenConfig = config.bscHomolog[contractName as ContractName];
    const contract = await getContractAt(contractName, tokenConfig.address);

    let amount: string;
    if (contractName === "MouseHauntToken" || contractName === "ERC20Mock") {
      amount = BN.from(MHT_BUSD_AMOUNT).mul("1000000000000000000").toString();
    } else {
      if (tokenConfig.decimals > 0) {
        amount = BN.from(BOOSTERS_AMOUNT).mul("1000000000000000000").toString();
      } else {
        amount = BOOSTERS_AMOUNT;
      }
    }

    const balance = await contract.balanceOf(operator.address);
    print(colors.h_blue, `Operator ${contractName} balance: ${balance}`);

    for (let i = 0; i < RECIPIENTS.length; i++) {
      print(colors.wait, `Sending ${amount} ${contractName}s to ${RECIPIENTS[i]}...`);
      const tx = await contract.transfer(RECIPIENTS[i], amount);

      print(colors.success, `Success! TxHash: ${tx.hash}`);
      print(colors.bigSuccess, `Transferred ${amount} ${contractName}s to ${RECIPIENTS[i]}`);
    }
  }
}

main().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

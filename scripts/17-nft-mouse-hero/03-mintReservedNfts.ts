/* eslint-disable node/no-missing-import */
import { print, colors } from "../../src/utils/misc";
import { getContractAt } from "../../src/utils/support";
import * as ENV from "../../src/utils/env";
const CONFIG = ENV.getConfig();

const tokensToMint = 12;
const recipient = "0x2124b4912532f6cD235081fEA2223EB3C0Af301d";
const mintedFrom = "BMHTL";

let failedToUnpause = false;

async function main() {
  print(colors.highlight, `Minting reserved NFTs on ${CONFIG.name}...`);

  const contract = await getContractAt("MouseHero", CONFIG.MouseHero.address);
  const rarityContractAddress = CONFIG[mintedFrom].address;

  // Unpause the contract:
  print(colors.wait, `Unpausing the NFT contract...`);
  await contract.unpause().catch(() => {
    failedToUnpause = true;
    print(colors.warn, "Contract was already unpaused");
  });
  print(colors.success, `Contract unpaused`);

  print(colors.yellow, `Minting ${tokensToMint} tokens...`);
  const hashes = [];
  for (let i = 0; i < tokensToMint; i++) {
    print(colors.wait, `Minting token #${i + 1}...`);
    const tx = await contract.mintMouseHeroByRarity(recipient, rarityContractAddress);
    hashes.push(tx.hash);
  }

  // Pause the contract again:
  if (!failedToUnpause) {
    print(colors.wait, `Pausing the NFT contract...`);

    await contract.pause().catch((e: any) => {
      print(colors.warn, "Contract was already paused");
    });

    print(colors.success, `Contract paused`);
  }

  print(colors.success, `Hashes: ${hashes.join(", ")}`);

  print(colors.bigSuccess, `~~~ DONE! ~~~`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

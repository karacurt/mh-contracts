/**
 * Usage:
 * npx hardhat run scripts/tools/historian/dataFetcher.ts --network bsc > scripts/tools/historian/data/2022-02-28.json
 */

//import fs from "fs";
import axios from "axios";
import Web3 from "web3";
import { ethers } from "hardhat";

/* eslint-disable node/no-missing-import */
import { print, colors, delay, generateTodayFilename } from "../../../src/utils/misc";
import config, { Network } from "../../../src/config";

import mouseHauntWallets from "./mouseHauntWallets.json";
import seedifyKols from "./seedifyKols.json";

const rawFetchedLists: any = [];
const finalLists: any = [];

/*
const destinationFile = generateTodayFilename({
  directory: "src/scripts/tools/data",
  prefix: "historian",
  extension: "json",
});
*/

export default async function exec() {
  try {
    const network: Network = process.env.NETWORK as Network;
    // print(colors.highlight, `Running DataFetcher on ${network}`);

    const addressList = [...mouseHauntWallets, ...seedifyKols];

    const tokenList = [
      { name: "BUSD", address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", hasDecimals: true },
      { name: "MHT", address: config[network].MouseHauntToken.address, hasDecimals: true },
      { name: "Genesis Booster", address: config[network].BMHTG.address },
      { name: "Heroic Box", address: config[network].BMHTH.address },
      { name: "Rare Booster", address: config[network].BMHTR.address },
      { name: "Epic Booster", address: config[network].BMHTE.address, hasDecimals: true },
      { name: "Legendary Booster", address: config[network].BMHTL.address, hasDecimals: true },
    ];

    const baseUrl = config[network].services.holders.baseUrl;
    const apiKey = config[network].services.holders.apiKey;
    const chainId = config[network].chainId;

    const urlEnding = `&key=${apiKey}&page-size=999999`;

    for (let i = 0; i < addressList.length; i++) {
      for (let j = 0; j < tokenList.length; j++) {
        const token = tokenList[j];

        // example: https://api.covalenthq.com/v1/56/address/0x2124b4912532f6cD235081fEA2223EB3C0Af301d/transfers_v2/?contract-address=0x5Cb2C3Ed882E37DA610f9eF5b0FA25514d7bc85B&key=ckey_3e2bebb71b564e71bdaa5d87dca&page-size=999999
        const url = `${baseUrl}${chainId}/address/${addressList[i].address}/transfers_v2/?contract-address=${token.address}${urlEnding}`;

        const response: any = await axios.get(url).catch((e) => {
          throw e;
        });

        // example: https://api.covalenthq.com/v1/56/address/0x2124b4912532f6cD235081fEA2223EB3C0Af301d/balances_v2/?contract-address=0x5Cb2C3Ed882E37DA610f9eF5b0FA25514d7bc85B&key=ckey_3e2bebb71b564e71bdaa5d87dca&page-size=999999
        const balanceUrl = `${baseUrl}${chainId}/address/${addressList[i].address}/balances_v2/?contract-address=${token.address}${urlEnding}`;

        const balanceResponse: any = await axios.get(balanceUrl).catch((e) => {
          throw e;
        });

        const balanceArray = balanceResponse.data.data.items.filter((item: any) => {
          return item.contract_address.toLowerCase() === token.address.toLowerCase();
        });

        console.log(`contractAddress: ${token.address}`);
        console.log(`balanceArray[0]: ${balanceArray[0]}`);

        let balance;
        if (balanceArray.length == 0) {
          balance = "0";
        } else {
          balance = token.hasDecimals
            ? Web3.utils.fromWei(balanceArray[0].balance)
            : balanceArray[0].balance;
        }

        rawFetchedLists.push({
          wallet: addressList[i].name,
          walletAddress: addressList[i].address,
          token: token.name,
          balance,
          hasDecimals: token.hasDecimals,
          totalCount: response.data.data.pagination.total_count,
          transactions: response.data.data.items,
        });

        delay(500);
      }
    }

    for (let i = 0; i < rawFetchedLists.length; i++) {
      const list = rawFetchedLists[i];
      const newList: any = [];
      for (let j = 0; j < list.transactions.length; j++) {
        const element = list.transactions[j];

        for (let m = 0; m < element.transfers.length; m++) {
          const transfer = element.transfers[m];
          newList.push({
            date: transfer.block_signed_at,
            direction: transfer.transfer_type,
            from: transfer.from_address,
            to: transfer.to_address,
            amount: list.hasDecimals ? Web3.utils.fromWei(transfer.delta) : transfer.delta,
            hash: transfer.tx_hash,
          });
        }
      }

      finalLists.push({
        wallet: list.wallet,
        walletAddress: list.walletAddress,
        token: list.token,
        balance: list.balance,
        txCount: list.totalCount,
        transactions: newList,
      });
    }

    console.log(JSON.stringify(finalLists, null, 2));
    //fs.writeFileSync(destinationFile, JSON.stringify(finalLists, null, 2));
  } catch (e: any) {
    print(colors.error, e.stack);
    process.exitCode = 1;
  }
}

exec().catch((error) => {
  print(colors.error, error.stack);
  process.exitCode = 1;
});

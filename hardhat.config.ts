import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-web3";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-contract-sizer";
import "@openzeppelin/hardhat-upgrades";

import * as ENV from "./src/utils/env";

const PRIVATE_KEYS = ENV.getString("PRIVATE_KEY")?.split(",") ?? [];

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    bscTestnet: {
      url: ENV.getString("NETWORK_URL_DEV"),
      accounts: PRIVATE_KEYS,
    },
    bscHomolog: {
      url: ENV.getString("NETWORK_URL_HOM"),
      accounts: PRIVATE_KEYS,
    },
    bsc: {
      url: ENV.getString("NETWORK_URL_PROD"),
      accounts: PRIVATE_KEYS,
      timeout: 999999,
    },
  },
  gasReporter: {
    enabled: ENV.getString("REPORT_GAS") !== undefined,
    coinmarketcap: ENV.getString("COINMARKETCAP_API_KEY"),
    currency: "USD",
  },
  etherscan: {
    apiKey: ENV.getString("ETHERSCAN_API_KEY"),
  },
};

export default config;

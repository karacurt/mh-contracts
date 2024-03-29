// eslint-disable-next-line node/no-missing-import
import PreSales from "./presale";

const bscTestnet = {
  name: "BSC Testnet",
  chainId: 97,
  MHGBL: {
    address: "0x0",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
  },
  GhostVillain: {
    address: "0x0",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
  },
  MhtOnRamp: {
    address: "0x960b1B58dc08726092B5928C053c5506C6DE1C11",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
  },
  Swap: {
    address: "0x3260Db64FD97ecEc935fa35695fF5B303De42E2e",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    treasury: "0x454dB75b7ACAE509A5d51C7326c686473988C3c7",
  },
  MouseHauntStashing: {
    address: "0xf7beBc0905A327E9Afe59f33b4e882DC2468D319",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    logic: "",
    validators: ["0xfc854524613dA7244417908d199857754189633c"],
  },
  OnRamp: {
    address: "",
  },
  MouseHauntToken: {
    address: "0xAaE073a0b11D42ba787456819FFF84468Ae65E7e",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    image: "https://mousehaunt.com/images/logo.png",
    symbol: "MHT",
    decimals: 18,
  },
  MouseHauntAlphaToken: {
    address: "",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
  },
  Farm: {
    address: "0x454dB75b7ACAE509A5d51C7326c686473988C3c7",
    logicAddress: "",
    operator: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    validators: ["0xfc854524613dA7244417908d199857754189633c"],
    tokenName: "MouseHauntToken",
  },
  AlphaFarm: {
    address: "",
    logicAddress: "",
    operator: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    validators: [""],
    tokenName: "MouseHauntAlphaToken",
  },
  BUSD: {
    address: "0x8C3dfc2023CDeA1d034C339B25FB2e2C21189Fa2",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    decimals: 18,
  },
  ERC20Mock: {
    address: "0x8C3dfc2023CDeA1d034C339B25FB2e2C21189Fa2",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    decimals: 18,
    description: "To be used as BUSD or any other ERC20 token",
  },
  Marketplace: {
    address: "",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    proxyAdmin: "0xB885C1f5e2EB2C4e7731728B91E30d2cD45dFFc9",
  },
  MarketplaceV3: {
    address: "0xFB09f30d966942e198683F424373B0E59116715a",
    logicAddress: "",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
  },
  WhitelistSale: {
    igoTimestamp: "1639843200",
    PreSales,
    PrivateSale1: {
      address: "",
      owner: "0x087B58029f7251E7054153Bc8775e14A68490286",
      MHTtoBUSD: "0.0015",
      minMhtAmount: "50",
      maxMhtAmount: "400",
      unlockAtIGOPercent: "8",
      cliffMonths: "0",
      vestingPeriodMonths: "12",
      available: "4000000",
    },
    PrivateSale2: {
      address: "",
      owner: "0x087B58029f7251E7054153Bc8775e14A68490286",
      MHTtoBUSD: "0.00175",
      minMhtAmount: "57",
      maxMhtAmount: "114",
      unlockAtIGOPercent: "8",
      cliffMonths: "0",
      vestingPeriodMonths: "12",
      available: "571500",
    },
    PrivateSale3: {
      address: "",
      owner: "0x087B58029f7251E7054153Bc8775e14A68490286",
      MHTtoBUSD: "0.0019",
      minMhtAmount: "115",
      maxMhtAmount: "115",
      unlockAtIGOPercent: "8",
      cliffMonths: "0",
      vestingPeriodMonths: "12",
      available: "575000",
    },
  },
  BMHTL: {
    address: "0x716D2b65DAb9647A5Ef12e413c8FE988ac6206F4",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    image: "https://mousehaunt.com/images/legendary.png",
    symbol: "BMHTL",
    decimals: 18,
  },
  BMHTE: {
    address: "0x4E6c2150c7BCea0938a770f70093a69CDAebEeBd",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    image: "https://mousehaunt.com/images/epic.png",
    symbol: "BMHTE",
    decimals: 18,
  },
  BMHTR: {
    address: "0xFf3573609ece16da9171E9B71Df53eb13296Fc2b",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    image: "https://mousehaunt.com/images/rare.png",
    symbol: "BMHTR",
    decimals: 0,
  },
  BMHTG: {
    address: "0x7999B9D1B8d40DeAbc3068B03e88FeDeDf23311D",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    image: "https://mousehaunt.com/images/genesis.png",
    symbol: "BMHTG",
    decimals: 0,
  },
  BMHTH: {
    address: "0xd6d6641b5c96479C4fA2C9134E1a8084E24F6b57",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    image: "https://mousehaunt.com/images/heroic.png",
    symbol: "BMHTH",
    decimals: 0,
  },
  BMHTH_nft: {
    address: "",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    image: "https://mousehaunt.com/images/heroic.png",
    symbol: "BMHTH",
    decimals: 0,
    isERC721: true,
  },
  MouseHero: {
    address: "0xF0Ae308901ab882EfCE57d21f7bC3646324E8183",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    symbol: "MHH",
    decimals: 0,
    isERC721: true,
  },
  Collectible: {
    address: "0x3Acd94f8FB1e9CbE13728e4c5302a70Bd27f1c5c",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    symbol: "MHC",
    decimals: 0,
    isERC721: true,
  },
  BoosterSale: {
    PrivateSale1: {
      address: "",
      owner: "0x087B58029f7251E7054153Bc8775e14A68490286",
      BMHTL: {
        busdPrice: "0.025",
        cap: "2",
        available: "2000",
      },
      BMHTE: {
        busdPrice: "0.075",
        cap: "6",
        available: "6000",
      },
    },
    PrivateSale2: {
      address: "",
      owner: "0x087B58029f7251E7054153Bc8775e14A68490286",
      BMHTL: {
        busdPrice: "0.005",
        cap: "1",
        available: "500",
      },
      BMHTE: {
        busdPrice: "0.0015",
        cap: "1",
        available: "5000",
      },
    },
    PrivateSale3: {
      address: "",
      owner: "0x087B58029f7251E7054153Bc8775e14A68490286",
      BMHTE: {
        busdPrice: "0.0150",
        cap: "1",
        available: "3333",
      },
      BMHTR: {
        busdPrice: "0.0045",
        cap: "2",
        available: "10000",
      },
    },
    Genesis: {
      address: "",
      owner: "0x087B58029f7251E7054153Bc8775e14A68490286",
      mhtPrice: "0.003",
      cap: "10",
      available: "30000",
    },
    Heroic: {
      address: "",
      owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
      mhtPrice: "30",
      cap: "10",
      available: "10000",
    },
  },
  Splitter: {
    address: "",
    owner: "0x9808Bceec8ECF87854f102a9B0B51F08c540E691",
  },
  NftBatchTransfer: {
    address: "",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
  },
  PlayerStash: {
    address: "0xf7beBc0905A327E9Afe59f33b4e882DC2468D319",
    logicAddress: "",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    validators: ["0xfc854524613dA7244417908d199857754189633c"],
  },
  services: {
    holders: {
      provider: "covalenthq",
      type: "holders",
      baseUrl: "https://api.covalenthq.com/v1/",
      params: ":chainId/tokens/:contractAddress/token_holders/?key=:apiKey&page-size=999999",
      apiKey: "ckey_3e2bebb71b564e71bdaa5d87dca",
    },
  },
};

export default bscTestnet;

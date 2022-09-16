// eslint-disable-next-line node/no-missing-import
import PreSales from "./presale";

const bscHomolog = {
  name: "BSC Homolog",
  chainId: 97,
  MHGBL: {
    address: "0x3B946149B209B75c1Ba62d23DaF29457eEb364BA",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1"
  },
  GhostVillain: {
    address: "0x0",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1"
  },
  MhtOnRamp: {
    address: "0x8A8e485594B30Af0F3E37A2a9B41a9B9293a4a51",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
  },
  Swap: {
    address: "0x591cEE9f6373B86828854F97280b29a1dcfb636F",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    treasury: "0xC68910228CdDBe7936c753387a0d4627f2Ab2180",
  },
  MouseHauntStashing: {
    address: "0x5F2690b71bE812b3BdB6132a481dD69E46B4C061",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    logic: "0x29Ca991A266b39a862fe94D7cC13ca87C6E87d9d",
  },
  OnRamp: {
    address: "0xbB094C1C5787E47E0cEeC18E8854840184141418",
  },
  MouseHauntToken: {
    address: "0x7659969076659B313CaE64F0BCD75829FC3B07d7",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    image: "https://mousehaunt.com/images/logo.png",
    symbol: "MHT",
    decimals: 18,
  },
  MouseHauntAlphaToken: {
    address: "0xac8842409d1106763D272d7beCb884f9eEE166CB",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
  },
  Farm: {
    address: "0x609630832c6d10C8DC138C2B1Cdd677B98851dE4",
    logicAddress: "0x9090177c04d24dcAF361BaE712Bf271C9b4C0A6b",
    operator: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    validators: ["0xfc854524613dA7244417908d199857754189633c"],
    tokenName: "MouseHauntToken",
  },
  AlphaFarm: {
    address: "0x0e9561Ce383226DD520A48e3c0d656a44C2C2220",
    logicAddress: "0x9090177c04d24dcAF361BaE712Bf271C9b4C0A6b",
    operator: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    validators: ["0xfc854524613dA7244417908d199857754189633c"],
    tokenName: "MouseHauntAlphaToken",
  },
  BUSD: {
    address: "0xD44145B3F42d591Ea7418AD236c0f99F6E1DeFDB",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    decimals: 18,
  },
  Marketplace: {
    address: "0x3e62Aa5BeabC3528A380B358c3D71AAdeb0959f4",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    proxyAdmin: "0xD030716DC60fFCC2211F9765e90937Ec26c1b971",
    description: "Upgraded to V3 on 2022-27-05",
    logic: "0x2dbd6f07f8f2a909a4ff0aac72d89f965e0044cf",
  },
  MarketplaceV3: {
    address: "0xf15bEdB3Dcce7A5e28BbBF761c27acD4d7C24F21",
    logicAddress: "",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
  },
  WhitelistSale: {
    igoTimestamp: "1639843200",
    PreSales,
    PrivateSale1: {
      address: "0x693348553511106405a0544f98765b0332daF507",
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
      address: "0x644e548960437F2d2c1C1C0dE9e9c7f559f67c27",
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
      address: "0x28236cFB512398b676cc2149b169B5f2f0D5bC91",
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
    address: "0x2af5274A248D9CC80f703DC80F72fffEE2F47Ea8",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    image: "https://mousehaunt.com/images/legendary.png",
    symbol: "BMHTL",
    decimals: 18,
  },
  BMHTE: {
    address: "0xc880dfb34604F25365345b0Ee64f1872A32Ed46F",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    image: "https://mousehaunt.com/images/epic.png",
    symbol: "BMHTE",
    decimals: 18,
  },
  BMHTR: {
    address: "0x558f6c61d0D768d29C9a15482D217188c9049Aae",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    image: "https://mousehaunt.com/images/rare.png",
    symbol: "BMHTR",
    decimals: 0,
  },
  BMHTG: {
    address: "0x438649E4F786556c1651682b2C6e662A34D0AF77",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    image: "https://mousehaunt.com/images/genesis.png",
    symbol: "BMHTG",
    decimals: 0,
  },
  BMHTH: {
    address: "0x712b8f0064fA6e73E10bc8a5bd9996035918f66b",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    image: "https://mousehaunt.com/images/heroic.png",
    symbol: "BMHTH",
    decimals: 0,
  },
  BMHTH_nft: {
    address: "0xC7142837218A067C63c6B35b9b28670695E24431",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    image: "https://mousehaunt.com/images/heroic.png",
    symbol: "BMHTH",
    decimals: 0,
    isERC721: true,
  },
  MouseHero: {
    address: "0x173b13e2c98864DcEd56ce00CeD029456fabf1D4",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    symbol: "MHH",
    decimals: 0,
    isERC721: true,
  },
  Collectible: {
    address: "0x13675E425f4a292A3635A2d79D3097C91B69ED70",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    symbol: "MHC",
    decimals: 0,
    isERC721: true,
  },
  ERC20Mock: {
    address: "0xD44145B3F42d591Ea7418AD236c0f99F6E1DeFDB",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    decimals: 18,
    description: "To be used as BUSD or any other ERC20 token",
  },
  BoosterSale: {
    PrivateSale1: {
      address: "0x6Bb9c33F26Ba1CFbdaA1192484682469776019D8",
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
      address: "0xDF27461F27cea9FB6085f8A6574474dBB61a5603",
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
      address: "0x279Ee6C9EBa5C5DD23eaA482860969CcFa27EB68",
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
      address: "0x4a8F601bf65a46b5F119F648D68932dCB6a43778",
      owner: "0x087B58029f7251E7054153Bc8775e14A68490286",
      mhtPrice: "0.003",
      cap: "10",
      available: "30000",
    },
    Heroic: {
      address: "0x4E79Af540b752c41b0efCe1bfE4fa196A3fFaD82",
      owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
      mhtPrice: "30",
      cap: "10",
      available: "10000",
    },
  },
  Splitter: {
    address: "0xE2feC97a896aeE2aB4E74701E9E7276B9e1f0191",
    owner: "0x9808Bceec8ECF87854f102a9B0B51F08c540E691",
  },
  NftBatchTransfer: {
    address: "0x461F9f3BeE46e9d913d1EAA1eFa72A33F27780cc",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
  },
  PlayerStash: {
    address: "0x4814822D9599b354cbb55F102fd0145b39580e78",
    logicAddress: "0x59a8f27c4a1780d6ad6522e96f160d1302c2f68a",
    owner: "0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1",
    validators: ["0x15B5728C2A7ce5f9281c51822F09F5e50e8561C1"],
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

export default bscHomolog;

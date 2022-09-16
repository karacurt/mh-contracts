// eslint-disable-next-line node/no-missing-import
import PreSales from "./presale";

const bsc = {
  name: "BSC MAINNET",
  chainId: 56,
  MHGBL: {
    address: "0xC9230c0B064222B3965bA2726bbE1A89cb6efD8E",
    owner: "0x4A701fa920339D484e10deA12871bc5c7C88a18f",
  },
  GhostVillain: {
    address: "0x0",
    owner: "0x4A701fa920339D484e10deA12871bc5c7C88a18f",
  },
  s3: {
    bucket: "nft.mousehaunt.com",
  },
  MhtOnRamp: {
    address: "",
    owner: "",
    logic: "",
    operator: "",
  },
  Swap: {
    address: "0x0F03ABA30ADCaAF0022777320B46008D7684C7aE",
    owner: "0x4A701fa920339D484e10deA12871bc5c7C88a18f",
    treasury: "0x874e7e66f520480E0E3468D4274db6B5cCaD11C4", // It's the Farm contract
    logic: "0x07a53da2fa0f633b14d3fcdf9939f8a986b6b549",
  },
  MouseHauntStashing: {
    address: "0x87c4887a73fD5A872815aebf482EA7C9F318b31E",
    owner: "0x4A701fa920339D484e10deA12871bc5c7C88a18f",
    logic: "0x5d3A64463EAAc36748fD52cd5Ddc4a7dcf476775",
  },
  OnRamp: {
    address: "0xfC639D6B7b84B40F1c4a1F54288ad67febfac4C9",
    logic: "0xbcb6097aef76b08e682b0af7c475d5b370b67baa",
    operator: "0x4A701fa920339D484e10deA12871bc5c7C88a18f",
  },
  MouseHauntToken: {
    address: "0x5Cb2C3Ed882E37DA610f9eF5b0FA25514d7bc85B",
    owner: "0x8e3f936932AbDa7a4C31EFE83068A00aeB69122B",
    image: "https://mousehaunt.com/images/logo.png",
    symbol: "MHT",
    decimals: 18,
  },
  MouseHauntAlphaToken: {
    address: "0x6f196fb79145A69246cB95598A0c3b624397aC2E",
    owner: "0x4A701fa920339D484e10deA12871bc5c7C88a18f",
  },
  Farm: {
    address: "0x874e7e66f520480E0E3468D4274db6B5cCaD11C4",
    logicAddress: "0xb8c70868484fBafc26aC91fe5164768b231C5046",
    operator: "0x4A701fa920339D484e10deA12871bc5c7C88a18f",
    validators: ["0xA455155786d7630fa6c3c4d63316632bE1430Dc3"],
    tokenName: "MouseHauntToken",
  },
  AlphaFarm: {
    address: "0x09Cb298a848969a2a22edfc14870C7734Fa7D500",
    logicAddress: "0xb8c70868484fBafc26aC91fe5164768b231C5046",
    operator: "0x4A701fa920339D484e10deA12871bc5c7C88a18f",
    validators: ["0xA455155786d7630fa6c3c4d63316632bE1430Dc3"],
    tokenName: "MouseHauntAlphaToken",
  },
  BUSD: {
    address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    decimals: 18,
  },
  Marketplace: {
    address: "0x85579a32eC2a20a374a9b8C1aa9B526760830b95",
    logicAddress: "0x343b0cedcc7e779f69123134a77ff7d82491bca1",
    owner: "0x87c0173bA28A9e3603f7286052196d87Cf10bF1e",
    proxyAdmin: "0x2a41CEb28196Ea18C346CF77152e22fbC0cFB9EE",
  },
  MarketplaceV3: {
    address: "0xc3009928012139729d52bD88d1865458E9c53421",
    logicAddress: "0xa032a546c620459866825107c2aae31b12f46a7e",
    owner: "0xA455155786d7630fa6c3c4d63316632bE1430Dc3",
  },
  WhitelistSale: {
    igoTimestamp: "1640102400",
    PreSales,
    PrivateSale1: {
      address: "0x4A3833566032BfB394D13B0b356fF0E8e3Bc206F",
      owner: "0x5FEe4568C79542682C2819a87f8868AbaFA97793",
      MHTtoBUSD: "0.15",
      minMhtAmount: "500",
      maxMhtAmount: "4000",
      unlockAtIGOPercent: "8",
      cliffMonths: "0",
      vestingPeriodMonths: "12",
      available: "4000000",
    },
    PrivateSale2: {
      address: "0x7a5390CFda7C68A3503613577702925191e26384",
      owner: "0x5FEe4568C79542682C2819a87f8868AbaFA97793",
      MHTtoBUSD: "0.175",
      minMhtAmount: "57",
      maxMhtAmount: "114",
      unlockAtIGOPercent: "8",
      cliffMonths: "0",
      vestingPeriodMonths: "12",
      available: "571500",
    },
    PrivateSale3: {
      address: "0x0Aa2B2F7Ba37a628037c8f815d792eCccA5F717B",
      owner: "0x5FEe4568C79542682C2819a87f8868AbaFA97793",
      MHTtoBUSD: "0.19",
      minMhtAmount: "115",
      maxMhtAmount: "115",
      unlockAtIGOPercent: "8",
      cliffMonths: "0",
      vestingPeriodMonths: "12",
      available: "575000",
    },
  },
  BMHTL: {
    address: "0x29421DF4FEAA2ff2eA08b7A8F221425C8aFD424C",
    owner: "0x2124b4912532f6cD235081fEA2223EB3C0Af301d",
    image: "https://mousehaunt.com/images/legendary.png",
    symbol: "BMHTL",
    decimals: 18,
  },
  BMHTE: {
    address: "0x2DE83F4243ff0200624a44011777a373aF7E9f72",
    owner: "0x2124b4912532f6cD235081fEA2223EB3C0Af301d",
    image: "https://mousehaunt.com/images/epic.png",
    symbol: "BMHTE",
    decimals: 18,
  },
  BMHTR: {
    address: "0x9b0D5A9e64aD9461f4D5B6E893FBf8655d21CBE4",
    owner: "0x2124b4912532f6cD235081fEA2223EB3C0Af301d",
    image: "https://mousehaunt.com/images/rare.png",
    symbol: "BMHTR",
    decimals: 0,
  },
  BMHTG: {
    address: "0x6700A1d1FCD32ac8749124648B4e89DdA12dfa6d",
    owner: "0x2124b4912532f6cD235081fEA2223EB3C0Af301d",
    image: "https://mousehaunt.com/images/genesis.png",
    symbol: "BMHTG",
    decimals: 0,
  },
  BMHTH: {
    address: "0x78371a555a669Ffac6513E7d6e7580E38CB6D369",
    owner: "0x2124b4912532f6cD235081fEA2223EB3C0Af301d",
    image: "https://mousehaunt.com/images/heroic.png",
    symbol: "BMHTH",
    decimals: 0,
  },
  BMHTH_nft: {
    address: "0xFaf18191aE03A511558e928db7eafeF599D7fbaB",
    owner: "0x2124b4912532f6cD235081fEA2223EB3C0Af301d",
    image: "https://mousehaunt.com/images/heroic.png",
    symbol: "BMHTH",
    decimals: 0,
    isERC721: true,
  },
  BoosterSale: {
    PrivateSale1: {
      address: "0xa7Ee9AE77671934FE936706b2193E33Bc3F6461C",
      owner: "0x2124b4912532f6cD235081fEA2223EB3C0Af301d",
      BMHTL: {
        busdPrice: "250",
        cap: "2",
        available: "2000",
      },
      BMHTE: {
        busdPrice: "75",
        cap: "6",
        available: "6000",
      },
    },
    PrivateSale2: {
      address: "0xd10fe236c990e423b35383c2a574992FE11B89c6",
      owner: "0x2124b4912532f6cD235081fEA2223EB3C0Af301d",
      BMHTL: {
        busdPrice: "350",
        cap: "1",
        available: "500",
      },
      BMHTE: {
        busdPrice: "105",
        cap: "1",
        available: "5000",
      },
    },
    PrivateSale3: {
      address: "0x674d68fDe432A0ED962080cE44865A6E8241311C",
      owner: "0x2124b4912532f6cD235081fEA2223EB3C0Af301d",
      BMHTE: {
        busdPrice: "150",
        cap: "1",
        available: "3333",
      },
      BMHTR: {
        busdPrice: "45",
        cap: "2",
        available: "20000",
      },
    },
    Genesis: {
      address: "0x6385a7F39E2F0a678979Fa35Db7CDd5F4a4E2Af6",
      owner: "0x2124b4912532f6cD235081fEA2223EB3C0Af301d",
      mhtPrice: "30",
      cap: "10",
      available: "30000",
    },
    Heroic: {
      address: "0x3E0dAB19b014438dD296be7bA470aD0a2CadDf12",
      owner: "0x2124b4912532f6cD235081fEA2223EB3C0Af301d",
      mhtPrice: "30",
      cap: "10",
      available: "10000",
    },
  },
  MouseHero: {
    address: "0x402Ce39d46899D91e648824E36AB08317F4e611E",
    owner: "0x2124b4912532f6cD235081fEA2223EB3C0Af301d",
    decimals: 0,
    isERC721: true,
  },
  Collectible: {
    address: "",
    owner: "",
    decimals: 0,
    isERC721: true,
  },
  Splitter: {
    address: "0x1ad9f4bB1c605DD56325a9Fd6F9A95A814DA8624",
    owner: "0x6F165B30ee4bFc9565E977Ae252E4110624ab147",
  },
  NftBatchTransfer: {
    address: "0xBb317D9De5853d98EE24Ba7372aaB711C0A6cf48",
    owner: "0x4A701fa920339D484e10deA12871bc5c7C88a18f",
  },
  PlayerStash: {
    address: "0x87c4887a73fD5A872815aebf482EA7C9F318b31E",
    logicAddress: "0xfe16a3f3480211ed65558450c3323f6ec566c8dc",
    owner: "0x2124b4912532f6cD235081fEA2223EB3C0Af301d",
    validators: ["0xA455155786d7630fa6c3c4d63316632bE1430Dc3"],
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

export default bsc;

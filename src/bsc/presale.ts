const seedSale = [
  {
    whitelisted: "0xd1Eda3dffF2ABC84216800fF1293E9a53805e04c",
    amount: "20000",
    address: "0xb9d734EF0043606A4F82198033417EDC7cC16e9E",
  },
  {
    whitelisted: "0xcA3c14A64FF12E35a130F75aD7bD0b9F5b256D8F",
    amount: "20000",
    address: "0x601b2731a19Aaa9Ed7642D37B06318555061280F",
  },
  {
    whitelisted: "0xBB54a0C06c3B3D44c3A4DA0c10EFdEAFe5A6b3a3",
    amount: "16000",
    address: "0xB0c175d8F3829Ce6934f86f99d93b49D1225E171",
  },
  {
    whitelisted: "0x643d721556aA6BD05aCd63e682f06f6321A66c08",
    amount: "3200",
    address: "0x4fBEBFcb66ceDdd13C14E3111F6d0055CA01eD8E",
  },
  {
    whitelisted: "0x343BD4e802BaE35F89e043299B82067aab38dfd3",
    amount: "20000",
    address: "0x1362695BF244637A3c7f41F73aF235843a49192C",
  },
  {
    whitelisted: "0x1E87D6EF0C6bC53434Ce54ebC98A823Ba319d9f2",
    amount: "20000",
    address: "0x1eB4470CA6E51A3CA6e66BE618Ec9135FC4c83aA",
  },
  {
    whitelisted: "0xe1B5c81559AA875497e49702D65DB5FFc2289B8E",
    amount: "20000",
    address: "0xF865b4c8281527764520744bD101017818a3915c",
  },
  {
    whitelisted: "0x01051D0eA83a7C6D797524Dc71e470Aa9e9dF328",
    amount: "20000",
    address: "0xbf3567874178C04aE51667808eDd4BacD6f10783",
  },
].map((term) => ({
  ...term,
  owner: "0xb53A11c980f6E3b4725977A69672A373954B0157",
  MHTtoBUSD: "0.125",
  unlockAtIGOPercent: "4",
  cliffMonths: "0",
  vestingPeriodMonths: "12",
}));

const privateSale = [
  {
    whitelisted: "0xaE4D837cAA0C53579f8a156633355Df5058B02f3",
    amount: "200000",
    address: "0x8Aa450dBd6Ce2362cbE6EB0925FEaa23ECE39B33",
  },
  {
    whitelisted: "0x157144869CEe7FFf519C31ABd6648c8D19b12555",
    amount: "33340",
    address: "0x89FD7fbE1ee3bC6abC2363d989f7768D4b384198",
  },
  {
    whitelisted: "0x079eed46b77BCfEB267E80f19Afff1b284FFB5d1",
    amount: "115",
    address: "0xf5f4A0B78293722c71E075a9025723347474dc6f",
  },
  {
    whitelisted: "0x843359bc8881f26f87c77dF422730B341694585E",
    amount: "6680",
    address: "0x370eb658694E257B3F8f86d5800f5Daad3a869d1",
  },
  {
    whitelisted: "0x280330b2D00b67D394b650176Ee3EBE53B0fa497",
    amount: "3340",
    address: "0x077db6D7Ac65B172342FFc0731FC861310aC951e",
  },
  {
    whitelisted: "0xB96A80aC3a2F493c33c0Eb87C6944a62E7c1621f",
    amount: "200000",
    address: "0xBf400b14208b07249575e0463A51dE30dc13680B",
  },
].map((term) => ({
  ...term,
  owner: "0x5FEe4568C79542682C2819a87f8868AbaFA97793",
  MHTtoBUSD: "0.15",
  unlockAtIGOPercent: "8",
  cliffMonths: "0",
  vestingPeriodMonths: "12",
}));

const presales = [...seedSale, ...privateSale];
export default presales;

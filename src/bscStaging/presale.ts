const seedSale = [
  {
    address: "0x13Cf973FCc661CD8f660d701E72e149400a83E0a",
    whitelisted: "0x343BD4e802BaE35F89e043299B82067aab38dfd3",
    amount: "200",
  },
  {
    address: "0xBdA50Cb68fdCC46116d43b30D48A191BF77cb7b1",
    whitelisted: "0x7CDf072cb005fF3008E19E4F22f04c961023CF8c",
    amount: "190",
  },
].map((term) => ({
  ...term,
  owner: "0x087B58029f7251E7054153Bc8775e14A68490286",
  MHTtoBUSD: "0.00125",
  unlockAtIGOPercent: "4",
  cliffMonths: "0",
  vestingPeriodMonths: "12",
}));

const privateSale = [
  {
    address: "0xe55bfd75CCE7Df335bfC096b0A7ACC1D8Aa1eFE0",
    whitelisted: "0xDe15C3D6845D6Cc7A8a8f80aFD6514b0494dA91A",
    amount: "180",
  },
  {
    address: "0x9312C4352442E456F2a8d75daDb08c0f77CBd96b",
    whitelisted: "0x09dcF02C01849231Bb22CC76233c31f35Db6fAac",
    amount: "170",
  },
].map((term) => ({
  ...term,
  owner: "0x087B58029f7251E7054153Bc8775e14A68490286",
  MHTtoBUSD: "0.0015",
  unlockAtIGOPercent: "8",
  cliffMonths: "0",
  vestingPeriodMonths: "12",
}));

const presales = [...seedSale, ...privateSale];
export default presales;

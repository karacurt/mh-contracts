# Mouse Haunt contracts

Mouse Haunt is a kick ass play to earn universe. Built in Unreal Engine 5 and integrated with Binance Chain, you will be able to enjoy different ways to earn with amazing game play. Play on!

## Test coverage

<!-- COVERAGE START -->

```
-------------------------------|----------|----------|----------|----------|----------------|
File                           |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
-------------------------------|----------|----------|----------|----------|----------------|
 contracts/                    |        0 |        0 |        0 |        0 |                |
  MouseHauntToken.sol          |        0 |      100 |        0 |        0 |... 16,20,24,32 |
  WhitelistSale.sol            |        0 |        0 |        0 |        0 |... 77,78,82,90 |
 contracts/booster/            |        0 |        0 |        0 |        0 |                |
  BMHTE.sol                    |        0 |      100 |        0 |        0 |... 16,20,24,32 |
  BMHTG.sol                    |        0 |      100 |        0 |        0 |... 20,24,28,36 |
  BMHTL.sol                    |        0 |      100 |        0 |        0 |... 16,20,24,32 |
  BMHTR.sol                    |        0 |      100 |        0 |        0 |... 20,24,28,36 |
  BoosterSale2.sol             |        0 |        0 |        0 |        0 |... 76,84,85,86 |
  BoosterSale3.sol             |        0 |        0 |        0 |        0 |... 73,81,82,83 |
  BoosterSaleGenesis.sol       |        0 |        0 |        0 |        0 |... 62,64,71,72 |
  Random.sol                   |        0 |      100 |        0 |        0 |          10,11 |
 contracts/booster/interfaces/ |      100 |      100 |      100 |      100 |                |
  IBooster.sol                 |      100 |      100 |      100 |      100 |                |
 contracts/marketplace/        |        0 |        0 |        0 |        0 |                |
  Marketplace.sol              |        0 |        0 |        0 |        0 |... 375,376,379 |
  MarketplaceDebug.sol         |        0 |        0 |        0 |        0 |... 49,53,57,61 |
  MarketplaceV2.sol            |        0 |      100 |        0 |        0 |              8 |
 contracts/nft/                |        0 |        0 |        0 |        0 |                |
  MouseHero.sol                |        0 |        0 |        0 |        0 |... 216,217,220 |
 contracts/utils/              |        0 |        0 |        0 |        0 |                |
  ERC20Mock.sol                |        0 |      100 |        0 |        0 |           9,13 |
  Splitter.sol                 |        0 |        0 |        0 |        0 |... 35,37,38,39 |
  TokenAllocation.sol          |        0 |        0 |        0 |        0 |... 155,156,157 |
  Whitelist.sol                |        0 |        0 |        0 |        0 |... 23,28,29,30 |
-------------------------------|----------|----------|----------|----------|----------------|
All files                      |        0 |        0 |        0 |        0 |                |
-------------------------------|----------|----------|----------|----------|----------------|
```

<!-- COVERAGE END -->

## Addresses (Binance Smart Chain)

| Contract                              | Address                                                                                                                | Total Supply |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------ |
| Mouse Haunt Token (MHT)               | [`0x5Cb2C3Ed882E37DA610f9eF5b0FA25514d7bc85B`](https://bscscan.com/token/0x5Cb2C3Ed882E37DA610f9eF5b0FA25514d7bc85B)   | 100,000,000  |
| Mouse Haunt Booster LEGENDARY (BMHTL) | [`0x29421DF4FEAA2ff2eA08b7A8F221425C8aFD424C`](https://bscscan.com/token/0x29421DF4FEAA2ff2eA08b7A8F221425C8aFD424C)   | 8,250        |
| Mouse Haunt Booster EPIC (BMHTE)      | [`0x2DE83F4243ff0200624a44011777a373aF7E9f72`](https://bscscan.com/token/0x2DE83F4243ff0200624a44011777a373aF7E9f72)   | 66,000       |
| Mouse Haunt Booster RARE (BMHTR)      | [`0x9b0D5A9e64aD9461f4D5B6E893FBf8655d21CBE4`](https://bscscan.com/token/0x9b0D5A9e64aD9461f4D5B6E893FBf8655d21CBE4)   | 187,500      |
| Booster Sale 1                        | [`0xa7Ee9AE77671934FE936706b2193E33Bc3F6461C`](https://bscscan.com/address/0xa7Ee9AE77671934FE936706b2193E33Bc3F6461C) |              |
| Private Sale 1                        | [`0x4A3833566032BfB394D13B0b356fF0E8e3Bc206F`](https://bscscan.com/address/0x4A3833566032BfB394D13B0b356fF0E8e3Bc206F) |              |
| Booster Sale 2                        | [`0xd10fe236c990e423b35383c2a574992FE11B89c6`](https://bscscan.com/address/0xd10fe236c990e423b35383c2a574992FE11B89c6) |              |
| Private Sale 2                        | [`0x7a5390CFda7C68A3503613577702925191e26384`](https://bscscan.com/address/0x7a5390CFda7C68A3503613577702925191e26384) |              |
| Booster Sale 3                        | [`0x674d68fDe432A0ED962080cE44865A6E8241311C`](https://bscscan.com/address/0x674d68fDe432A0ED962080cE44865A6E8241311C) |              |
| Private Sale 3                        | [`0x0Aa2B2F7Ba37a628037c8f815d792eCccA5F717B`](https://bscscan.com/address/0x0Aa2B2F7Ba37a628037c8f815d792eCccA5F717B) |              |
| Booster Sale Genesis                  | [`0x6385a7F39E2F0a678979Fa35Db7CDd5F4a4E2Af6`](https://bscscan.com/address/0x6385a7F39E2F0a678979Fa35Db7CDd5F4a4E2Af6) |              |

## Code audits

| Company                          | Date       | Report                                                                                                                                                                       | Reviewed                                                    |
| -------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| [0xGuard](https://0xguard.com/)  | 2021-11-08 | [MouseHaunt_final-audit-report.pdf](https://github.com/0xGuard-com/audit-reports/blob/1259f5da70996a31066beac6a593e4f9407ebe46/mousehaunt/MouseHaunt_final-audit-report.pdf) | [✅](../../commit/04eb145f4b3e192bfcca009bacca6791d681b1bb) |
| [Omniscia](https://omniscia.io/) | 2022-01-02 | [NFT Sale System Security Audit](https://omniscia.io/mousehaunt-nft-sale-system/)                                                                                            | [✅](../../commit/e353aac3427b7653a490573bcf887635d2ea043a) |

## Documentation

Coming soon

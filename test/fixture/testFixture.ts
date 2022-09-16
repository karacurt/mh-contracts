import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// eslint-disable-next-line
import { BMHTR, BMHTE, BMHTL, BMHTG, MouseHero, Marketplace, SoulBound, Ghost, BMHTH, MouseHauntBox } from "../../typechain";
export type Rarity = "legendary" | "epic" | "rare" | "genesis" | "heroic"
export interface ContractInstances {
  booster: {
    mouse: {
      rare: BMHTR;
      epic: BMHTE;
      legendary: BMHTL;
      genesis: BMHTG;
      heroic: BMHTH;
    }
  },
  box: {
    ghost: {
      rare: MouseHauntBox;
      epic: MouseHauntBox;
      legendary: MouseHauntBox;
      genesis: MouseHauntBox;
      heroic: MouseHauntBox;
    }
  }
  nft: {
    mouse: MouseHero;
    soulbound: SoulBound;
    ghost: Ghost;
  };
  /*
  platform: {
    marketplace: Marketplace;
  };
  */

}

export async function getContractFactories() {
  return {
    booster: {
      mouse: {
        rare: await ethers.getContractFactory("BMHTR"),
        epic: await ethers.getContractFactory("BMHTE"),
        legendary: await ethers.getContractFactory("BMHTL"),
        genesis: await ethers.getContractFactory("BMHTG"),
        heroic: await ethers.getContractFactory("BMHTH")
      },
    },
    box: {
      ghost: {
        rare: await ethers.getContractFactory("MouseHauntBox"),
        epic: await ethers.getContractFactory("MouseHauntBox"),
        legendary: await ethers.getContractFactory("MouseHauntBox"),
        genesis: await ethers.getContractFactory("MouseHauntBox"),
        heroic: await ethers.getContractFactory("MouseHauntBox"),
      }
    },
    nft: {
      mouse: await ethers.getContractFactory("MouseHero"),
      collectible: await ethers.getContractFactory("Collectible"),
      soulbound: await ethers.getContractFactory("SoulBound"),
      ghost: await ethers.getContractFactory("Ghost"),
    },
    platform: {
      marketplace: await ethers.getContractFactory("Marketplace"),
    },
  };
}

export async function deployBaseContracts(
  deployer: SignerWithAddress,
  owner: SignerWithAddress
): Promise<ContractInstances> {
  const Factory = await getContractFactories();
  const mouse = await Factory.nft.mouse
    .connect(deployer)
    .deploy("MouseHero", "MHN", "https://nft.mousehaunt.com/hero/")

  const ghost = await Factory.nft.ghost.connect(deployer).deploy("Ghost", "GH", "https://nft.mousehaunt.com/ghost/")
  const contracts: ContractInstances = {
    booster: {
      mouse: {
        rare: await Factory.booster.mouse.rare.connect(deployer).deploy(owner.address),
        epic: await Factory.booster.mouse.epic.connect(deployer).deploy(owner.address),
        legendary: await Factory.booster.mouse.legendary.connect(deployer).deploy(owner.address),
        genesis: await Factory.booster.mouse.genesis.connect(deployer).deploy(owner.address),
        heroic: await Factory.booster.mouse.heroic.connect(deployer).deploy(owner.address, mouse.address),
      },
    },
    box: {
      ghost: {
        rare: await Factory.box.ghost.rare.connect(deployer).deploy("Rare Ghost Box", "BGR", owner.address, ghost.address, 200000),
        epic: await Factory.box.ghost.epic.connect(deployer).deploy("Epic Ghost Box", "BGE", owner.address, ghost.address, 200000),
        legendary: await Factory.box.ghost.legendary.connect(deployer).deploy("Legendary Ghost Box", "BGL", owner.address, ghost.address, 200000),
        genesis: await Factory.box.ghost.genesis.connect(deployer).deploy("Genesis Ghost Box", "BGG", owner.address, ghost.address, 200000),
        heroic: await Factory.box.ghost.heroic.connect(deployer).deploy("Heroic Ghost Box", "BGH", owner.address, ghost.address, 200000),
      }
    },
    nft: {
      mouse,
      soulbound: await Factory.nft.soulbound.connect(deployer).deploy("SoulBound", "SB", "https://nft.mousehaunt.com/soulbound/"),
      ghost,
    },
    /*
    platform: {
      marketplace: await upgrades.deployProxy(Factory.platform.marketplace, <PARAMS>),
    },
    */
  };

  const mouseBoosters = Object.keys(contracts.booster.mouse)
  for (const mouseBooster of mouseBoosters) {
    await contracts.booster.mouse[mouseBooster as Rarity].deployed();
  }

  const ghostBusters/*👻🚫*/ = Object.keys(contracts.box.ghost)
  for (const ghostBuster of ghostBusters/*👻🚫*/) {
    await contracts.box.ghost[ghostBuster as Rarity].deployed();
  }

  await contracts.nft.mouse.deployed();
  await contracts.nft.soulbound.deployed();
  await contracts.nft.ghost.deployed();
  // await contracts.platform.marketplace.deployed();

  return contracts;
}

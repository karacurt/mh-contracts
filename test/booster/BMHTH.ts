import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";

describe("Mouse Haunt Booster HEROIC", function () {
  let operator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  let nft: Contract;
  let bmhth: Contract;

  const boosterName = "Mouse Haunt Booster HEROIC";
  const boosterSymbol = "BMHTH";
  const innitialSupply = "200000";
  const baseURI = "https://nft.mousehaunt.com/hero/0";

  before(async function () {
    [operator, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const NftFactory = await ethers.getContractFactory("MouseHero");
    nft = await NftFactory.deploy(boosterName, boosterSymbol, baseURI);
    await nft.deployed();

    const BMHTHFactory = await ethers.getContractFactory("BMHTH");
    bmhth = await BMHTHFactory.deploy(operator.address, nft.address);
    await bmhth.deployed();

    await nft.setAcceptedBoosters([bmhth.address], [true]);
  });

  it("Should be an ERC20 token", async function () {
    expect(await bmhth.name()).to.equal(boosterName);
    expect(await bmhth.symbol()).to.equal(boosterSymbol);
    expect(await bmhth.totalSupply()).to.equal(innitialSupply);
  });

  it("Should be pausable", async function () {
    await bmhth.pause();

    await expect(bmhth.transfer(user1.address, 1)).to.revertedWith("Pausable: paused");

    await bmhth.unpause();

    const tx = bmhth.transfer(user1.address, 1);
    await expect(tx).to.emit(bmhth, "Transfer").withArgs(operator.address, user1.address, 1);
  });

  it("Should setup allowance to marketing account", async function () {
    await bmhth.approve(user2.address, 42);

    await expect(bmhth.connect(user2).transferFrom(operator.address, user2.address, 42))
      .to.emit(bmhth, "Transfer")
      .withArgs(operator.address, user2.address, 42);
  });

  it("Should allow a user to burn their own tokens", async function () {
    const initialBalance = 100;
    const amountToBurn = 50;

    await bmhth.transfer(user1.address, initialBalance);

    await expect(bmhth.connect(user1).burn(amountToBurn))
      .to.emit(bmhth, "Transfer")
      .withArgs(user1.address, ethers.constants.AddressZero, amountToBurn);

    const user1Balance = await bmhth.balanceOf(user1.address);
    expect(user1Balance).to.equal((initialBalance - amountToBurn).toString());
  });

  it("Should allow a user to crack a box without a previous approval", async function () {
    await bmhth.transfer(user1.address, 1);

    await expect(nft.connect(user1).unboxBooster(bmhth.address, 1))
      .to.emit(nft, "BoosterUnboxed")
      .withArgs(bmhth.address, user1.address, 0);

    const tokenListUser1 = await nft.tokensOfOwner(user1.address);
    expect(tokenListUser1.join(",") === "0");

    // make sure boosters were burned
    expect(await bmhth.balanceOf(user1.address)).to.equal(0);
  });
});

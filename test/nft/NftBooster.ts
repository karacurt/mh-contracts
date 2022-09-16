import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";

describe("Mouse Haunt Booster HEROIC (NFT)", function () {
  let operator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let gallerLaunchPad: SignerWithAddress;

  let mouseHero: Contract;
  let nftBooster: Contract;

  const boosterName = "Mouse Haunt NFT HEROIC Box";
  const boosterSymbol = "BMHTH";
  const innitialSupply = "250";
  const baseURI = "https://nft.mousehaunt.com/public/boxes/heroic/";
  const maxGallerSupply = 6000;

  before(async function () {
    [operator, user1, user2, gallerLaunchPad] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const MouseHeroFactory = await ethers.getContractFactory("MouseHero");
    mouseHero = await MouseHeroFactory.deploy(boosterName, boosterSymbol, baseURI);
    await mouseHero.deployed();

    const NftBoosterFactory = await ethers.getContractFactory("NftBooster");
    nftBooster = await NftBoosterFactory.deploy(
      boosterName,
      boosterSymbol,
      baseURI,
      mouseHero.address,
      gallerLaunchPad.address,
      maxGallerSupply
    );
    await nftBooster.deployed();

    await mouseHero.setAcceptedBoosters([nftBooster.address], [true]);
  });

  it("Should be an ERC721 token", async function () {
    const interfaceId = "0x80ac58cd";
    expect(await nftBooster.supportsInterface(interfaceId)).to.equal(true);
  });

  it("Should have a baseURI", async function () {
    await expect(nftBooster.mint(user1.address))
      .to.emit(nftBooster, "Transfer")
      .withArgs(ethers.constants.AddressZero, user1.address, 0);

    // expect it to have a URI
    expect(await nftBooster.tokenURI(0)).to.equal(`${baseURI}0`);
  });

  it("Should be pausable", async function () {
    await expect(nftBooster.mint(operator.address))
      .to.emit(nftBooster, "Transfer")
      .withArgs(ethers.constants.AddressZero, operator.address, 0);

    await nftBooster.pause();

    await expect(nftBooster.transferFrom(operator.address, user1.address, 0)).to.revertedWith(
      "ERC721Pausable: token transfer while paused"
    );

    await nftBooster.unpause();

    const tx = nftBooster.transferFrom(operator.address, user1.address, 0);
    await expect(tx).to.emit(nftBooster, "Transfer").withArgs(operator.address, user1.address, 0);
  });

  it("Should set Galler's LAUNCH_MAX_SUPPLY correctly", async function () {
    const LAUNCH_MAX_SUPPLY = await nftBooster.LAUNCH_MAX_SUPPLY();

    expect(LAUNCH_MAX_SUPPLY).to.equal(maxGallerSupply);
  });

  it("Should setup allowance to marketing account", async function () {
    await expect(nftBooster.mint(operator.address))
      .to.emit(nftBooster, "Transfer")
      .withArgs(ethers.constants.AddressZero, operator.address, 0);

    await nftBooster.approve(user2.address, 0);

    await expect(nftBooster.connect(user2).transferFrom(operator.address, user2.address, 0))
      .to.emit(nftBooster, "Transfer")
      .withArgs(operator.address, user2.address, 0);
  });

  it("Should allow a user to burn their own tokens", async function () {
    await expect(nftBooster.mint(operator.address))
      .to.emit(nftBooster, "Transfer")
      .withArgs(ethers.constants.AddressZero, operator.address, 0);

    await nftBooster.transferFrom(operator.address, user1.address, 0);

    await expect(nftBooster.connect(user1).burn(0))
      .to.emit(nftBooster, "Transfer")
      .withArgs(user1.address, ethers.constants.AddressZero, 0);

    const user1Balance = await nftBooster.balanceOf(user1.address);
    expect(user1Balance).to.equal(0);
  });

  it("Should allow a user to crack a box without a previous approval", async function () {
    await expect(nftBooster.mint(operator.address))
      .to.emit(nftBooster, "Transfer")
      .withArgs(ethers.constants.AddressZero, operator.address, 0);

    await nftBooster.transferFrom(operator.address, user1.address, 0);

    await expect(mouseHero.connect(user1).unboxBooster(nftBooster.address, 0))
      .to.emit(mouseHero, "BoosterUnboxed")
      .withArgs(nftBooster.address, user1.address, 0);

    const tokenListUser1 = await mouseHero.tokensOfOwner(user1.address);
    expect(tokenListUser1.join(",") === "0");

    // make sure boosters were burned
    expect(await nftBooster.balanceOf(user1.address)).to.equal(0);
  });

  it("Should NOT allow a user to crack a box with insufficient funds", async function () {
    await expect(mouseHero.connect(user1).unboxBooster(nftBooster.address, 0)).to.be.revertedWith(
      "ERC721: operator query for nonexistent token"
    );

    const tokenListUser1 = await mouseHero.tokensOfOwner(user1.address);
    expect(tokenListUser1.join(",") === "");

    // make sure boosters were burned
    expect(await nftBooster.balanceOf(user1.address)).to.equal(0);
  });

  it("Should NOT allow a user to crack a box from someone else", async function () {
    await expect(nftBooster.mint(operator.address))
      .to.emit(nftBooster, "Transfer")
      .withArgs(ethers.constants.AddressZero, operator.address, 0);

    await expect(mouseHero.connect(user1).unboxBooster(nftBooster.address, 0)).to.be.revertedWith(
      "Account does not own the token"
    );

    const tokenListUser1 = await mouseHero.tokensOfOwner(user1.address);
    expect(tokenListUser1.join(",") === "");

    // make sure boosters were burned
    expect(await nftBooster.balanceOf(user1.address)).to.equal(0);
  });

  it("Should allow the operator to mint tokens in a bulk", async function () {
    await nftBooster.bulkMint(operator.address, innitialSupply);

    expect(await nftBooster.balanceOf(operator.address)).to.equal(innitialSupply);
  });

  it("Should allow Galler to mint tokens in a bulk", async function () {
    await expect(nftBooster.connect(gallerLaunchPad).mintTo(user1.address, 10))
      .to.emit(nftBooster, "Transfer")
      .withArgs(ethers.constants.AddressZero, user1.address, 0)
      .to.emit(nftBooster, "Transfer")
      .withArgs(ethers.constants.AddressZero, user1.address, 1)
      .to.emit(nftBooster, "Transfer")
      .withArgs(ethers.constants.AddressZero, user1.address, 2)
      .to.emit(nftBooster, "Transfer")
      .withArgs(ethers.constants.AddressZero, user1.address, 3)
      .to.emit(nftBooster, "Transfer")
      .withArgs(ethers.constants.AddressZero, user1.address, 4)
      .to.emit(nftBooster, "Transfer")
      .withArgs(ethers.constants.AddressZero, user1.address, 5)
      .to.emit(nftBooster, "Transfer")
      .withArgs(ethers.constants.AddressZero, user1.address, 6)
      .to.emit(nftBooster, "Transfer")
      .withArgs(ethers.constants.AddressZero, user1.address, 7)
      .to.emit(nftBooster, "Transfer")
      .withArgs(ethers.constants.AddressZero, user1.address, 8)
      .to.emit(nftBooster, "Transfer")
      .withArgs(ethers.constants.AddressZero, user1.address, 9);

    const userBalance = await nftBooster.balanceOf(user1.address);
    expect(userBalance).to.equal(10);

    const LAUNCH_SUPPLY = await nftBooster.LAUNCH_SUPPLY();
    expect(LAUNCH_SUPPLY).to.equal(10);
  });

  it("Should revert when mintTo is called by someone other than Galler's Launchpad", async function () {
    await expect(nftBooster.mintTo(user1.address, 10)).to.be.revertedWith("must call by launchpad");
  });

  it("Should revert if Galler tries to mint more than their allocation", async function () {
    // Redeploy with lower max supply:
    const MouseHeroFactory2 = await ethers.getContractFactory("MouseHero");
    const mouseHero2 = await MouseHeroFactory2.deploy(boosterName, boosterSymbol, baseURI);
    await mouseHero2.deployed();

    const NftBoosterFactory2 = await ethers.getContractFactory("NftBooster");
    const nftBooster2 = await NftBoosterFactory2.deploy(
      boosterName,
      boosterSymbol,
      baseURI,
      mouseHero.address,
      gallerLaunchPad.address,
      9
    );
    await nftBooster2.deployed();

    await mouseHero2.setAcceptedBoosters([nftBooster2.address], [true]);

    await expect(nftBooster2.connect(gallerLaunchPad).mintTo(user1.address, 10)).to.be.revertedWith(
      "max supply reached"
    );

    const userBalance = await nftBooster.balanceOf(user1.address);
    expect(userBalance).to.equal(0);

    const LAUNCH_SUPPLY = await nftBooster.LAUNCH_SUPPLY();
    expect(LAUNCH_SUPPLY).to.equal(0);
  });
});

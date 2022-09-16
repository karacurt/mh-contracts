import { expect } from "chai";
import { ethers } from "hardhat";
/* eslint-disable node/no-missing-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Collectible } from "../../typechain";
import { OPERATOR_ROLE, MINTER_ROLE, PAUSER_ROLE, DEFAULT_ADMIN_ROLE } from "../../src/utils/roles";

/* eslint-disable node/no-missing-import */
describe("Collectible (NFT)", function () {
  // A very explicit way of fetching and naming accounts that will be used during the tests
  let operator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  // The contract
  let collectible: Collectible;

  // Default values
  const nftName = "Mouse Prize";
  const nftSymbol = "MHP";
  const nftTokenUri = "https://nft.mousehaunt.com/collectible/";
  const baseData = "gooseHat-";
  const expectedNftId = 0;
  const expectedEvent1 = "Transfer";
  const expectedEvent2 = "CollectibleMinted";

  before(async function () {
    [operator, user1, user2, user3] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const collectibleFactory = await ethers.getContractFactory("Collectible");
    collectible = await collectibleFactory.deploy(nftName, nftSymbol, nftTokenUri);
    await collectible.deployed();
  });

  describe("NFT Basics", function () {
    it("Should be an ERC721 token", async function () {
      const interfaceId = "0x80ac58cd";
      expect(await collectible.supportsInterface(interfaceId)).to.equal(true);
    });

    it("Should have a baseURI", async function () {
      // When an NFT is minted, we'll always have a Transfer event, apart from the PrizeMinted event
      await expect(collectible.mint(user1.address, `${baseData}${expectedNftId}`))
        .to.emit(collectible, expectedEvent1)
        .withArgs(ethers.constants.AddressZero, user1.address, expectedNftId)
        .to.emit(collectible, expectedEvent2)
        .withArgs(`${baseData}${expectedNftId}`, user1.address, expectedNftId);

      // expect it to have the correct URI
      expect(await collectible.tokenURI(expectedNftId)).to.equal(`${nftTokenUri}${expectedNftId}`);
    });

    it("Should automatically increment the baseURI", async function () {
      // Mint the first one
      await expect(collectible.mint(user1.address, `${baseData}${expectedNftId}`))
        .to.emit(collectible, expectedEvent1)
        .withArgs(ethers.constants.AddressZero, user1.address, expectedNftId)
        .to.emit(collectible, expectedEvent2)
        .withArgs(`${baseData}${expectedNftId}`, user1.address, expectedNftId);

      // expect it to have the correct URI
      expect(await collectible.tokenURI(expectedNftId)).to.equal(`${nftTokenUri}${expectedNftId}`);

      // Mint another one
      await expect(collectible.mint(user1.address, `${baseData}${expectedNftId + 1}`))
        .to.emit(collectible, expectedEvent1)
        .withArgs(ethers.constants.AddressZero, user1.address, expectedNftId + 1)
        .to.emit(collectible, expectedEvent2)
        .withArgs(`${baseData}${expectedNftId + 1}`, user1.address, expectedNftId + 1);

      // expect it to have the correct URI
      expect(await collectible.tokenURI(expectedNftId + 1)).to.equal(
        `${nftTokenUri}${expectedNftId + 1}`
      );

      // Mint a third nft
      await expect(collectible.mint(user1.address, `${baseData}${expectedNftId + 2}`))
        .to.emit(collectible, expectedEvent1)
        .withArgs(ethers.constants.AddressZero, user1.address, expectedNftId + 2)
        .to.emit(collectible, expectedEvent2)
        .withArgs(`${baseData}${expectedNftId + 2}`, user1.address, expectedNftId + 2);

      // expect it to have the correct URI
      expect(await collectible.tokenURI(expectedNftId + 2)).to.equal(
        `${nftTokenUri}${expectedNftId + 2}`
      );
    });

    it("Should throw when querying a nonexistent token", async function () {
      // No NFT has been minted yet
      await expect(collectible.tokenURI(0)).to.be.revertedWith(
        "ERC721Metadata: URI query for nonexistent token"
      );
    });

    it("Should be enumberable", async function () {
      // Mint 5 NFTs, alternating users
      await collectible.mint(user1.address, `${baseData}${expectedNftId}`);
      await collectible.mint(user2.address, `${baseData}${expectedNftId + 1}`);
      await collectible.mint(user1.address, `${baseData}${expectedNftId + 2}`);
      await collectible.mint(user2.address, `${baseData}${expectedNftId + 3}`);
      await collectible.mint(user1.address, `${baseData}${expectedNftId + 4}`);

      const tokenListUser1 = await collectible.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "0,2,4");

      const tokenListUser2 = await collectible.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "1,3");
    });

    it("Should enumerate correctly after transfers, mints and burns", async function () {
      // Mint 5 NFTs, alternating users
      await collectible.mint(user1.address, `${baseData}${expectedNftId}`);
      await collectible.mint(user2.address, `${baseData}${expectedNftId + 1}`);
      await collectible.mint(user1.address, `${baseData}${expectedNftId + 2}`);
      await collectible.mint(user2.address, `${baseData}${expectedNftId + 3}`);
      await collectible.mint(user1.address, `${baseData}${expectedNftId + 4}`);

      let tokenListUser1 = await collectible.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "0,2,4");

      let tokenListUser2 = await collectible.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "1,3");

      // Now transfer token 0 from user1 to user2:
      await expect(collectible.connect(user1).transferFrom(user1.address, user2.address, 0))
        .to.emit(collectible, "Transfer")
        .withArgs(user1.address, user2.address, 0);

      tokenListUser1 = await collectible.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "2,4");

      tokenListUser2 = await collectible.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "0,1,3");

      // Mint another one to user1
      await collectible.mint(user1.address, `${baseData}${expectedNftId + 5}`);

      // Mint another one to user2
      await collectible.mint(user1.address, `${baseData}${expectedNftId + 6}`);

      tokenListUser1 = await collectible.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "2,4,5");

      tokenListUser2 = await collectible.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "0,1,3,6");

      // User 2 burns token id(4)
      await expect(collectible.connect(user2).burn(3))
        .to.emit(collectible, "Transfer")
        .withArgs(user2.address, ethers.constants.AddressZero, 3);

      tokenListUser1 = await collectible.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "2,4,5");

      tokenListUser2 = await collectible.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "0,1,6");

      // Now transfer token 2 from user2 to user1:
      await expect(collectible.connect(user2).transferFrom(user2.address, user1.address, 1))
        .to.emit(collectible, "Transfer")
        .withArgs(user2.address, user1.address, 1);

      tokenListUser1 = await collectible.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "1,2,4,5");

      tokenListUser2 = await collectible.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "0,6");
    });

    it("Should allow spender to transfer tokens", async function () {
      // Mint an NFT
      await collectible.mint(user1.address, `${baseData}${expectedNftId}`);

      // Approve user2 as spender
      await expect(collectible.connect(user1).approve(user2.address, 0))
        .to.emit(collectible, "Approval")
        .withArgs(user1.address, user2.address, 0);

      // User2 transfers the token to user3
      await expect(collectible.connect(user2).transferFrom(user1.address, user3.address, 0))
        .to.emit(collectible, "Transfer")
        .withArgs(user1.address, user3.address, 0);

      const tokenListUser1 = await collectible.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "");

      const tokenListUser2 = await collectible.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "");

      const tokenListUser3 = await collectible.tokensOfOwner(user3.address);
      expect(tokenListUser3.join(",") === "0");
    });

    it("Should allow spender to burn tokens", async function () {
      // Mint an NFT
      await collectible.mint(user1.address, `${baseData}${expectedNftId}`);

      // Approve user2 as spender
      await expect(collectible.connect(user1).approve(user2.address, 0))
        .to.emit(collectible, "Approval")
        .withArgs(user1.address, user2.address, 0);

      // User2 burns the token
      await expect(collectible.connect(user2).burn(0))
        .to.emit(collectible, "Transfer")
        .withArgs(user1.address, ethers.constants.AddressZero, 0);

      const tokenListUser1 = await collectible.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "");

      const tokenListUser2 = await collectible.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "");
    });

    it("Should be pausable", async function () {
      // Mint an NFT 'manually' (without cracking a booster open)
      await expect(collectible.mint(user1.address, `${baseData}${expectedNftId}`))
        .to.emit(collectible, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // Pause
      await expect(collectible.pause()).to.emit(collectible, "Paused").withArgs(operator.address);

      // Try and fail to mint
      await expect(
        collectible.mint(user1.address, `${baseData}${expectedNftId + 1}`)
      ).to.be.revertedWith("ERC721Pausable: token transfer while paused");

      // Try and fail to burn
      await expect(collectible.connect(user1).burn(0)).to.be.revertedWith(
        "ERC721Pausable: token transfer while paused"
      );

      // Try and fail to transfer
      await expect(
        collectible.connect(user1).transferFrom(user1.address, user2.address, 0)
      ).to.be.revertedWith("ERC721Pausable: token transfer while paused");
    });
  });

  describe("Role Based Access Control", function () {
    it("Should revert when non-minter tries to mint", async function () {
      await expect(
        collectible.connect(user1).mint(user1.address, `${baseData}${expectedNftId}`)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });

    it("Should allow newly assigned minter to mint", async function () {
      await expect(collectible.grantRole(MINTER_ROLE, user1.address))
        .to.emit(collectible, "RoleGranted")
        .withArgs(MINTER_ROLE, user1.address, operator.address);

      await expect(collectible.connect(user1).mint(user1.address, `${baseData}${expectedNftId}`))
        .to.emit(collectible, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);
    });

    it("Should allow the operator to revoke the minter role from a minter", async function () {
      await expect(collectible.grantRole(MINTER_ROLE, user1.address))
        .to.emit(collectible, "RoleGranted")
        .withArgs(MINTER_ROLE, user1.address, operator.address);

      await expect(collectible.revokeRole(MINTER_ROLE, user1.address))
        .to.emit(collectible, "RoleRevoked")
        .withArgs(MINTER_ROLE, user1.address, operator.address);

      await expect(
        collectible.connect(user1).mint(user1.address, `${baseData}${expectedNftId}`)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });

    it("Should allow a minter to renounce the role", async function () {
      await expect(collectible.grantRole(MINTER_ROLE, user1.address))
        .to.emit(collectible, "RoleGranted")
        .withArgs(MINTER_ROLE, user1.address, operator.address);

      await expect(collectible.connect(user1).renounceRole(MINTER_ROLE, user1.address))
        .to.emit(collectible, "RoleRevoked")
        .withArgs(MINTER_ROLE, user1.address, user1.address);

      await expect(
        collectible.connect(user1).mint(user1.address, `${baseData}${expectedNftId}`)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });

    it("Should revert when non-admin tries to grant or revoke roles", async function () {
      await expect(
        collectible.connect(user1).grantRole(MINTER_ROLE, user1.address)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );

      await expect(
        collectible.connect(user1).grantRole(PAUSER_ROLE, user1.address)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );

      await expect(
        collectible.connect(user1).grantRole(OPERATOR_ROLE, user1.address)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );

      await expect(
        collectible.connect(user1).grantRole(DEFAULT_ADMIN_ROLE, user1.address)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );

      await expect(
        collectible.connect(user1).revokeRole(MINTER_ROLE, operator.address)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );

      await expect(
        collectible.connect(user1).revokeRole(PAUSER_ROLE, operator.address)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );

      await expect(
        collectible.connect(user1).revokeRole(OPERATOR_ROLE, operator.address)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );

      await expect(
        collectible.connect(user1).revokeRole(DEFAULT_ADMIN_ROLE, operator.address)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );
    });

    it("Should revert when non-pauser tries to pause", async function () {
      await expect(collectible.connect(user1).pause()).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${PAUSER_ROLE}`
      );
    });

    it("Should allow newly assigned pauser to pause", async function () {
      await expect(collectible.grantRole(PAUSER_ROLE, user1.address))
        .to.emit(collectible, "RoleGranted")
        .withArgs(PAUSER_ROLE, user1.address, operator.address);

      await expect(collectible.connect(user1).pause())
        .to.emit(collectible, "Paused")
        .withArgs(user1.address);
    });

    it("Should revert when non-operator tries to set the baseURI", async function () {
      await expect(collectible.connect(user1).setBaseURI("www.CHANGED.com/")).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${OPERATOR_ROLE}`
      );
    });

    it("Should allow newly assigned operator to set the baseURI", async function () {
      await expect(collectible.grantRole(OPERATOR_ROLE, user1.address))
        .to.emit(collectible, "RoleGranted")
        .withArgs(OPERATOR_ROLE, user1.address, operator.address);

      await collectible.connect(user1).setBaseURI("www.CHANGED.com/");

      expect(await collectible.baseTokenURI()).to.equal("www.CHANGED.com/");
    });

    it("Should return the newly set baseURI in all future calls", async function () {
      // mint a new nft
      await expect(collectible.mint(user1.address, `${baseData}${expectedNftId}`))
        .to.emit(collectible, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, expectedNftId);

      // expect the nft to return the correct URL
      expect(await collectible.tokenURI(0)).to.equal(`${nftTokenUri}${expectedNftId}`);

      // Change the URI
      await collectible.setBaseURI("www.CHANGED.com/");
      expect(await collectible.baseTokenURI()).to.equal("www.CHANGED.com/");

      // mint another nft
      await expect(collectible.mint(user1.address, `${baseData}${expectedNftId + 1}`))
        .to.emit(collectible, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 1);

      // expect both tokens to return the new URL
      expect(await collectible.tokenURI(0)).to.equal("www.CHANGED.com/0");
      expect(await collectible.tokenURI(1)).to.equal("www.CHANGED.com/1");
    });
  });
});

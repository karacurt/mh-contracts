import { expect } from "chai";
import { ethers } from "hardhat";
/* eslint-disable node/no-missing-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BMHTR, BMHTE, BMHTL, BMHTG, SoulBound } from "../../typechain";

import { OPERATOR_ROLE, MINTER_ROLE, PAUSER_ROLE, DEFAULT_ADMIN_ROLE } from "../../src/utils/roles";
import { deployBaseContracts, ContractInstances } from "../fixture/testFixture";
/* eslint-disable node/no-missing-import */
describe("SoulBound (NFT)", function () {
  // A very explicit way of fetching and naming accounts that will be used during the tests
  let operator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  // List of usable contracts
  let contracts: ContractInstances;

  // Helpers
  let nft: SoulBound;
  let rare: BMHTR;
  let epic: BMHTE;
  let legendary: BMHTL;
  let genesis: BMHTG;

  // Helpers
  const amount1 = 1;
  const amount2 = 2;
  const amount3 = 3;
  const amount1E18 = ethers.utils.parseEther("1");
  const amount2E18 = ethers.utils.parseEther("2");
  const amount3E18 = ethers.utils.parseEther("3");
  const transferLimit = 10;

  before(async function () {
    [operator, user1, user2, user3] = await ethers.getSigners();
  });

  beforeEach(async function () {
    contracts = await deployBaseContracts(operator, operator);

    // helpers
    nft = contracts.nft.soulbound;
    rare = contracts.booster.mouse.rare;
    epic = contracts.booster.mouse.epic;
    legendary = contracts.booster.mouse.legendary;
    genesis = contracts.booster.mouse.genesis;
  });

  describe("NFT Basics", function () {
    beforeEach(async function () {
      // Register one booster to be able to mint it directly
      // await nft.setAcceptedBoosters([rare.address], [true]);
    });

    it("Should be an ERC721 token", async function () {
      const interfaceId = "0x80ac58cd";
      expect(await nft.supportsInterface(interfaceId)).to.equal(true);
    });

    it("Should have a baseURI", async function () {
      await expect(nft.mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // expect it to have a URI
      expect(await nft.tokenURI(0)).to.equal("https://nft.mousehaunt.com/soulbound/0");
    });

    it("Should automatically increment the baseURI", async function () {
      // Mint an NFT 'manually' (without cracking a booster open)
      await expect(nft.mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // expect it to have a URI
      expect(await nft.tokenURI(0)).to.equal("https://nft.mousehaunt.com/soulbound/0");

      // Mint another NFT 'manually' (without cracking a booster open)
      await expect(nft.mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 1);

      // expect it to have a URI
      expect(await nft.tokenURI(1)).to.equal("https://nft.mousehaunt.com/soulbound/1");

      // Mint yet another NFT 'manually' (without cracking a booster open)
      await expect(nft.mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 2);

      // expect it to have a URI
      expect(await nft.tokenURI(2)).to.equal("https://nft.mousehaunt.com/soulbound/2");
    });

    it("Should throw when querying a nonexistent token", async function () {
      // No NFT has been minted yet
      await expect(nft.tokenURI(0)).to.be.revertedWith(
        "ERC721Metadata: URI query for nonexistent token"
      );
    });

    it("Should be enumberable", async function () {
      // Mint an NFT 'manually' (without cracking a booster open)
      await expect(nft.mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // Mint another NFT 'manually' (without cracking a booster open)
      await expect(nft.mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 1);

      // Mint another NFT to someone else
      await expect(nft.mintSoulBound(user2.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user2.address, 2);

      // Mint yet another NFT 'manually' (without cracking a booster open)
      await expect(nft.mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 3);

      // Mint another NFT to someone else
      await expect(nft.mintSoulBound(user2.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user2.address, 4);

      const tokenListUser1 = await nft.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "0,1,3");

      const tokenListUser2 = await nft.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "2,4");
    });

    it("Should enumerate correctly after transfers, mints and burns", async function () {
      // Mint an NFT 'manually' (without cracking a booster open)
      await expect(nft.mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // Mint another NFT 'manually' (without cracking a booster open)
      await expect(nft.mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 1);

      // Mint another NFT to someone else
      await expect(nft.mintSoulBound(user2.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user2.address, 2);

      // Mint yet another NFT 'manually' (without cracking a booster open)
      await expect(nft.mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 3);

      // Mint another NFT to someone else
      await expect(nft.mintSoulBound(user2.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user2.address, 4);

      let tokenListUser1 = await nft.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "0,1,3");

      let tokenListUser2 = await nft.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "2,4");

      // Now transfer token 0 from user1 to user2:
      await expect(nft.connect(user1).transferFrom(user1.address, user2.address, 0))
        .to.emit(nft, "Transfer")
        .withArgs(user1.address, user2.address, 0);

      tokenListUser1 = await nft.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "1,3");

      tokenListUser2 = await nft.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "0,2,4");

      // Mint another one to user1
      await expect(nft.mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 5);

      // Mint another one to user2
      await expect(nft.mintSoulBound(user2.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user2.address, 6);

      tokenListUser1 = await nft.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "1,3,5");

      tokenListUser2 = await nft.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "0,2,4,6");

      // User 2 burns token id(4)
      await expect(nft.connect(user2).burn(4))
        .to.emit(nft, "Transfer")
        .withArgs(user2.address, ethers.constants.AddressZero, 4);

      tokenListUser1 = await nft.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "1,3,5");

      tokenListUser2 = await nft.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "0,2,6");

      // Now transfer token 2 from user2 to user1:
      await expect(nft.connect(user2).transferFrom(user2.address, user1.address, 2))
        .to.emit(nft, "Transfer")
        .withArgs(user2.address, user1.address, 2);

      tokenListUser1 = await nft.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "1,2,3");

      tokenListUser2 = await nft.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "0,4");
    });

    it("Should allow spender to transfer tokens", async function () {
      // Mint an NFT 'manually' (without cracking a booster open)
      await expect(nft.mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // Approve user2 as spender
      await expect(nft.connect(user1).approve(user2.address, 0))
        .to.emit(nft, "Approval")
        .withArgs(user1.address, user2.address, 0);

      // User2 transfers the token to user3
      await expect(nft.connect(user2).transferFrom(user1.address, user3.address, 0))
        .to.emit(nft, "Transfer")
        .withArgs(user1.address, user3.address, 0);

      const tokenListUser1 = await nft.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "");

      const tokenListUser2 = await nft.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "");

      const tokenListUser3 = await nft.tokensOfOwner(user3.address);
      expect(tokenListUser3.join(",") === "0");
    });

    it("Should allow spender to burn tokens", async function () {
      // Mint an NFT 'manually' (without cracking a booster open)
      await expect(nft.mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // Approve user2 as spender
      await expect(nft.connect(user1).approve(user2.address, 0))
        .to.emit(nft, "Approval")
        .withArgs(user1.address, user2.address, 0);

      // User2 transfers the token to user3
      await expect(nft.connect(user2).burn(0))
        .to.emit(nft, "Transfer")
        .withArgs(user1.address, ethers.constants.AddressZero, 0);

      const tokenListUser1 = await nft.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "");

      const tokenListUser2 = await nft.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "");
    });

    it("Should be pausable", async function () {
      // Mint an NFT 'manually' (without cracking a booster open)
      await expect(nft.mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // Pause
      await expect(nft.pause()).to.emit(nft, "Paused").withArgs(operator.address);

      // Try and fail to mint
      await expect(nft.mintSoulBound(user1.address, transferLimit)).to.be.revertedWith(
        "ERC721Pausable: token transfer while paused"
      );

      // Try and fail to burn
      await expect(nft.connect(user1).burn(0)).to.be.revertedWith(
        "ERC721Pausable: token transfer while paused"
      );

      // Try and fail to transfer
      await expect(
        nft.connect(user1).transferFrom(user1.address, user1.address, 0)
      ).to.be.revertedWith("ERC721Pausable: token transfer while paused");
    });
  });

  describe("Role Based Access Control", function () {
    it("Should revert when non-minter tries to mint", async function () {
      await expect(
        nft.connect(user1).mintSoulBound(user1.address, transferLimit)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });

    it("Should allow newly assigned minter to mint", async function () {
      await expect(nft.grantRole(MINTER_ROLE, user1.address))
        .to.emit(nft, "RoleGranted")
        .withArgs(MINTER_ROLE, user1.address, operator.address);

      await expect(nft.connect(user1).mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);
    });

    it("Should allow the operator to revoke the minter role from a minter", async function () {
      await expect(nft.grantRole(MINTER_ROLE, user1.address))
        .to.emit(nft, "RoleGranted")
        .withArgs(MINTER_ROLE, user1.address, operator.address);

      await expect(nft.revokeRole(MINTER_ROLE, user1.address))
        .to.emit(nft, "RoleRevoked")
        .withArgs(MINTER_ROLE, user1.address, operator.address);

      await expect(
        nft.connect(user1).mintSoulBound(user1.address, transferLimit)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });

    it("Should allow a minter to renounce the role", async function () {
      await expect(nft.grantRole(MINTER_ROLE, user1.address))
        .to.emit(nft, "RoleGranted")
        .withArgs(MINTER_ROLE, user1.address, operator.address);

      await expect(nft.connect(user1).renounceRole(MINTER_ROLE, user1.address))
        .to.emit(nft, "RoleRevoked")
        .withArgs(MINTER_ROLE, user1.address, user1.address);

      await expect(
        nft.connect(user1).mintSoulBound(user1.address, transferLimit)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });

    it("Should revert when non-admin tries to grant or revoke roles", async function () {
      await expect(nft.connect(user1).grantRole(MINTER_ROLE, user1.address)).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );

      await expect(nft.connect(user1).grantRole(PAUSER_ROLE, user1.address)).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );

      await expect(nft.connect(user1).grantRole(OPERATOR_ROLE, user1.address)).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );

      await expect(
        nft.connect(user1).grantRole(DEFAULT_ADMIN_ROLE, user1.address)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );

      await expect(nft.connect(user1).revokeRole(MINTER_ROLE, operator.address)).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );

      await expect(nft.connect(user1).revokeRole(PAUSER_ROLE, operator.address)).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );

      await expect(
        nft.connect(user1).revokeRole(OPERATOR_ROLE, operator.address)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );

      await expect(
        nft.connect(user1).revokeRole(DEFAULT_ADMIN_ROLE, operator.address)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
      );
    });

    it("Should revert when non-pauser tries to pause", async function () {
      await expect(nft.connect(user1).pause()).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${PAUSER_ROLE}`
      );
    });

    it("Should allow newly assigned pauser to pause", async function () {
      await expect(nft.grantRole(PAUSER_ROLE, user1.address))
        .to.emit(nft, "RoleGranted")
        .withArgs(PAUSER_ROLE, user1.address, operator.address);

      await expect(nft.connect(user1).pause()).to.emit(nft, "Paused").withArgs(user1.address);
    });

    it("Should revert when non-operator tries to set the baseURI", async function () {
      await expect(nft.connect(user1).setBaseURI("www.CHANGED.com/")).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${OPERATOR_ROLE}`
      );
    });

    it("Should allow newly assigned operator to set the baseURI", async function () {
      await expect(nft.grantRole(OPERATOR_ROLE, user1.address))
        .to.emit(nft, "RoleGranted")
        .withArgs(OPERATOR_ROLE, user1.address, operator.address);

      await nft.connect(user1).setBaseURI("www.CHANGED.com/");

      expect(await nft.baseTokenURI()).to.equal("www.CHANGED.com/");
    });

    it("Should return the newly set baseURI in all future calls", async function () {
      // mint a new nft
      await expect(nft.mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // expect the nft to return the correct URL
      expect(await nft.tokenURI(0)).to.equal("https://nft.mousehaunt.com/soulbound/0");

      // Change the URI
      await nft.setBaseURI("www.CHANGED.com/");
      expect(await nft.baseTokenURI()).to.equal("www.CHANGED.com/");

      // mint another nft
      await expect(nft.mintSoulBound(user1.address, transferLimit))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 1);

      // expect both tokens to return the new URL
      expect(await nft.tokenURI(0)).to.equal("www.CHANGED.com/0");
      expect(await nft.tokenURI(1)).to.equal("www.CHANGED.com/1");
    });

    it("Should revert when non-operator tries to set the accepted boosters", async function () {
      await expect(
        nft.connect(user1).setAcceptedBoosters([rare.address], [false])
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${OPERATOR_ROLE}`
      );
    });

    it("Should allow newly assigned operator to set the accepted boosters", async function () {
      await expect(nft.grantRole(OPERATOR_ROLE, user1.address))
        .to.emit(nft, "RoleGranted")
        .withArgs(OPERATOR_ROLE, user1.address, operator.address);

      await expect(nft.connect(user1).setAcceptedBoosters([rare.address], [false])).to.not.be
        .reverted;
    });
  });

  describe("SoulBound: Minting Special NFTs", function () {
    it("Should mint a special hero", async function () {
      await expect(nft.mintSpecialSoulBound(user1.address, "mySpecialStringHere", transferLimit))
        .to.emit(nft, "SpecialSoulBoundMinted")
        .withArgs("mySpecialStringHere", user1.address, 0, transferLimit);
    });
  });

  describe("SoulBound: Can only transfer x times", async function () {
    let nftId: string;
    beforeEach(async function () {
      // mint a soulbound nft
      const tx = await nft.mintSoulBound(user1.address, transferLimit);
      const receipt = await tx.wait();
      nftId = receipt.events?.find((e) => e.event === "Transfer")?.args?.tokenId.toString();
      console.log({ nftId });
    });

    it("Should bound after transfer more than x times", async function () {
      // mint a new nft
      let owner = user1;
      let other = user2;
      for (let i = 1; i <= transferLimit; i++) {
        console.log("transferred times:", i);

        if (i == transferLimit) {
          await expect(nft.connect(owner).transferFrom(owner.address, other.address, nftId))
            .to.be.emit(nft, "SoulBounded")
            .withArgs(other.address, nftId);
          break;
        } else {
          await nft.connect(owner).transferFrom(owner.address, other.address, nftId);
          const temp = owner;
          owner = other;
          other = temp;
        }
      }
    });

    it("Should not transfer anymore after soul bounded", async function () {
      // mint a new nft
      let owner = user1;
      let other = user2;
      for (let i = 1; i <= transferLimit; i++) {
        console.log("transferred times:", i);

        if (i == transferLimit) {
          await expect(nft.connect(owner).transferFrom(owner.address, other.address, nftId))
            .to.be.emit(nft, "SoulBounded")
            .withArgs(other.address, nftId);
        } else {
          await nft.connect(owner).transferFrom(owner.address, other.address, nftId);
        }
        const temp = owner;
        owner = other;
        other = temp;
      }

      await expect(
        nft.connect(owner).transferFrom(owner.address, other.address, nftId)
      ).to.revertedWith("SOUL_BOUNDED");
    });

    it("Should not transfer if minted already soul bounded", async function () {
      const tx = await nft.mintSoulBound(user1.address, 0);
      const receipt = await tx.wait();
      const nftId2 = receipt.events?.find((e) => e.event === "Transfer")?.args?.tokenId.toString();

      await expect(
        nft.connect(user1).transferFrom(user1.address, user2.address, nftId2)
      ).to.revertedWith("SOUL_BOUNDED");
    });
  });
});

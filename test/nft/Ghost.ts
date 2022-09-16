import { expect } from "chai";
import { ethers } from "hardhat";
/* eslint-disable node/no-missing-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Ghost, MouseHauntBox } from "../../typechain";

import { OPERATOR_ROLE, MINTER_ROLE, PAUSER_ROLE, DEFAULT_ADMIN_ROLE } from "../../src/utils/roles";
import { deployBaseContracts, ContractInstances } from "../fixture/testFixture";
import { BigNumber } from "ethers";
/* eslint-disable node/no-missing-import */
describe("Ghost (NFT)", function () {
  // A very explicit way of fetching and naming accounts that will be used during the tests
  let operator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  // List of usable contracts
  let contracts: ContractInstances;

  // Helpers
  let nft: Ghost;
  let rare: MouseHauntBox;
  let epic: MouseHauntBox;
  let legendary: MouseHauntBox;
  let genesis: MouseHauntBox;
  let heroic: MouseHauntBox;

  // Helpers
  const amount1 = 1;
  const amount2 = 2;
  const amount3 = 3;

  before(async function () {
    [operator, user1, user2, user3] = await ethers.getSigners();
  });

  beforeEach(async function () {
    contracts = await deployBaseContracts(operator, operator);

    // helpers
    nft = contracts.nft.ghost;
    rare = contracts.box.ghost.rare;
    epic = contracts.box.ghost.epic;
    legendary = contracts.box.ghost.legendary;
    genesis = contracts.box.ghost.genesis;
    heroic = contracts.box.ghost.heroic;
  });

  describe("NFT Basics", function () {
    beforeEach(async function () {
      // Register one box to be able to mint it directly
      await nft.setAcceptedBoosters([rare.address], [true]);
    });

    it("Should be an ERC721 token", async function () {
      const interfaceId = "0x80ac58cd";
      expect(await nft.supportsInterface(interfaceId)).to.equal(true);
    });

    it("Should have a baseURI", async function () {
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // expect it to have a URI
      expect(await nft.tokenURI(0)).to.equal("https://nft.mousehaunt.com/ghost/0");
    });

    it("Should automatically increment the baseURI", async function () {
      // Mint an NFT 'manually' (without cracking a box open)
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // expect it to have a URI
      expect(await nft.tokenURI(0)).to.equal("https://nft.mousehaunt.com/ghost/0");

      // Mint another NFT 'manually' (without cracking a box open)
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 1);

      // expect it to have a URI
      expect(await nft.tokenURI(1)).to.equal("https://nft.mousehaunt.com/ghost/1");

      // Mint yet another NFT 'manually' (without cracking a box open)
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 2);

      // expect it to have a URI
      expect(await nft.tokenURI(2)).to.equal("https://nft.mousehaunt.com/ghost/2");
    });

    it("Should throw when querying a nonexistent token", async function () {
      // No NFT has been minted yet
      await expect(nft.tokenURI(0)).to.be.revertedWith(
        "ERC721Metadata: URI query for nonexistent token"
      );
    });

    it("Should be enumberable", async function () {
      // Mint an NFT 'manually' (without cracking a box open)
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // Mint another NFT 'manually' (without cracking a box open)
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 1);

      // Mint another NFT to someone else
      await expect(nft.mintGhostByRarity(user2.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user2.address, 2);

      // Mint yet another NFT 'manually' (without cracking a box open)
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 3);

      // Mint another NFT to someone else
      await expect(nft.mintGhostByRarity(user2.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user2.address, 4);

      const tokenListUser1 = await nft.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "0,1,3");

      const tokenListUser2 = await nft.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "2,4");
    });

    it("Should enumerate correctly after transfers, mints and burns", async function () {
      // Mint an NFT 'manually' (without cracking a box open)
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // Mint another NFT 'manually' (without cracking a box open)
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 1);

      // Mint another NFT to someone else
      await expect(nft.mintGhostByRarity(user2.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user2.address, 2);

      // Mint yet another NFT 'manually' (without cracking a box open)
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 3);

      // Mint another NFT to someone else
      await expect(nft.mintGhostByRarity(user2.address, rare.address))
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
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 5);

      // Mint another one to user2
      await expect(nft.mintGhostByRarity(user2.address, rare.address))
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
      // Mint an NFT 'manually' (without cracking a box open)
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
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
      // Mint an NFT 'manually' (without cracking a box open)
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
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
      // Mint an NFT 'manually' (without cracking a box open)
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // Pause
      await expect(nft.pause()).to.emit(nft, "Paused").withArgs(operator.address);

      // Try and fail to mint
      await expect(nft.mintGhostByRarity(user1.address, rare.address)).to.be.revertedWith(
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
        nft.connect(user1).mintGhostByRarity(user1.address, rare.address)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });

    it("Should allow newly assigned minter to mint", async function () {
      await expect(nft.grantRole(MINTER_ROLE, user1.address))
        .to.emit(nft, "RoleGranted")
        .withArgs(MINTER_ROLE, user1.address, operator.address);

      await expect(nft.connect(user1).mintGhostByRarity(user1.address, rare.address))
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
        nft.connect(user1).mintGhostByRarity(user1.address, rare.address)
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
        nft.connect(user1).mintGhostByRarity(user1.address, rare.address)
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
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // expect the nft to return the correct URL
      expect(await nft.tokenURI(0)).to.equal("https://nft.mousehaunt.com/ghost/0");

      // Change the URI
      await nft.setBaseURI("www.CHANGED.com/");
      expect(await nft.baseTokenURI()).to.equal("www.CHANGED.com/");

      // mint another nft
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 1);

      // expect both tokens to return the new URL
      expect(await nft.tokenURI(0)).to.equal("www.CHANGED.com/0");
      expect(await nft.tokenURI(1)).to.equal("www.CHANGED.com/1");
    });

    it("Should revert when non-operator tries to set the accepted boxes", async function () {
      await expect(
        nft.connect(user1).setAcceptedBoosters([rare.address], [false])
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${OPERATOR_ROLE}`
      );
    });

    it("Should allow newly assigned operator to set the accepted boxes", async function () {
      await expect(nft.grantRole(OPERATOR_ROLE, user1.address))
        .to.emit(nft, "RoleGranted")
        .withArgs(OPERATOR_ROLE, user1.address, operator.address);

      await expect(nft.connect(user1).setAcceptedBoosters([rare.address], [false])).to.not.be
        .reverted;
    });
  });

  // BoosterCracker
  describe("Ghost: Unboxing", function () {
    beforeEach(async function () {
      // send boxes to users
      await rare.transfer(user1.address, amount1);
      await epic.transfer(user1.address, amount1);
      await legendary.transfer(user1.address, amount1);
      await genesis.transfer(user1.address, amount1);
      await heroic.transfer(user1.address, amount1);

      await rare.transfer(user2.address, amount2);
      await epic.transfer(user2.address, amount2);
      await legendary.transfer(user2.address, amount2);
      await genesis.transfer(user2.address, amount2);
      await heroic.transfer(user2.address, amount2);

      await rare.transfer(user3.address, amount3);
      await epic.transfer(user3.address, amount3);
      await legendary.transfer(user3.address, amount3);
      await genesis.transfer(user3.address, amount3);
      await heroic.transfer(user3.address, amount3);

      // users 1 and 2 approve the Ghost contract (user 3 doesn't)
      await rare.connect(user1).approve(nft.address, amount1);
      await epic.connect(user1).approve(nft.address, amount1);
      await legendary.connect(user1).approve(nft.address, amount1);
      await genesis.connect(user1).approve(nft.address, amount1);
      await heroic.connect(user1).approve(nft.address, amount1);

      await rare.connect(user2).approve(nft.address, amount2);
      await epic.connect(user2).approve(nft.address, amount2);
      await legendary.connect(user2).approve(nft.address, amount2);
      await genesis.connect(user2).approve(nft.address, amount2);
      await heroic.connect(user2).approve(nft.address, amount2);

      // Operator sets the accepted boxes:
      await nft.setAcceptedBoosters(
        [rare.address, epic.address, legendary.address, genesis.address, heroic.address],
        [true, true, true, true, true]
      );
    });

    describe("Mouse Haunt Box", function () {
      it("Should unbox a box", async function () {
        await expect(nft.connect(user1).unboxBooster(legendary.address, amount1))
          .to.emit(nft, "BoosterUnboxed")
          .withArgs(legendary.address, user1.address, 0);

        const tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "0");

        // make sure boxes were burned
        expect(await legendary.balanceOf(user1.address)).to.equal(0);
      });

      it("Should NOT unbox more than one box at once", async function () {
        await expect(
          nft.connect(user2).unboxBooster(legendary.address, amount2)
        ).to.be.revertedWith("INV_AMOUNT");

        const tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "0,1");

        // make sure boxes were burned
        expect(await legendary.balanceOf(user2.address)).to.equal(amount2);
      });

      it("Should revert when trying to unbox more boxes than balance", async function () {
        // Transfer the full balance to another account:
        await legendary.connect(user2).transfer(user1.address, amount2);

        await expect(
          nft.connect(user2).unboxBooster(legendary.address, amount1)
        ).to.be.revertedWith("Insufficient funds");

        const tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "");

        // make sure boxes were NOT burned
        expect(await legendary.balanceOf(user2.address)).to.equal(0);
      });

      it("Should revert when trying to crack 0 boxes open", async function () {
        await expect(nft.connect(user1).unboxBooster(legendary.address, 0)).to.be.revertedWith(
          "INV_AMOUNT"
        );

        const tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "");

        // make sure boxes were NOT burned
        expect(await legendary.balanceOf(user1.address)).to.equal(amount1);
      });

      it("Should allow to unbox boxes in more than one step", async function () {
        await expect(nft.connect(user2).unboxBooster(legendary.address, amount1))
          .to.emit(nft, "BoosterUnboxed")
          .withArgs(legendary.address, user2.address, 0);

        let tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "0");

        // make sure boxes were burned
        expect(await legendary.balanceOf(user2.address)).to.equal(amount1);

        await expect(nft.connect(user2).unboxBooster(legendary.address, amount1))
          .to.emit(nft, "BoosterUnboxed")
          .withArgs(legendary.address, user2.address, 1);

        tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "0,1");

        // make sure boxes were burned
        expect(await legendary.balanceOf(user2.address)).to.equal(0);
      });
      it("Should not allow burn from a address without burner role", async function () {
        await expect(legendary.connect(user1).burnFrom(legendary.address, amount1)).to.be.reverted;
      })
    });


    describe("Fake Boosters", function () {
      it("Should revert when trying to unbox an unaccepted box", async function () {
        await expect(nft.connect(user1).unboxBooster(user2.address, 1)).to.be.revertedWith(
          "INV_BOOSTER"
        );

        const tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "");
      });

      it("Should revert when trying to unbox an unaccepted box that was previously accepted", async function () {
        // Make sure we have `amount1` rare boxes
        expect(await rare.balanceOf(user1.address)).to.equal(amount1);

        // Set it as NOT accepted
        await nft.setAcceptedBoosters([rare.address], [false]);

        // Try to unbox and fail
        await expect(nft.connect(user1).unboxBooster(rare.address, amount1)).to.be.revertedWith(
          "INV_BOOSTER"
        );

        // Make sure we have NOT minted any NFTs
        let tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "");

        // make sure boxes were NOT burned
        expect(await rare.balanceOf(user1.address)).to.equal(amount1);

        // Now let's unbox a different box to see it go through as expected
        await expect(nft.connect(user1).unboxBooster(genesis.address, amount1))
          .to.emit(nft, "Transfer")
          .withArgs(ethers.constants.AddressZero, user1.address, 0);

        // Make sure we now have one NFT
        tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "0");

        // make sure boxes were burned accordingly
        expect(await genesis.balanceOf(user1.address)).to.equal(0);
      });
    });
  });

  describe("Ghost: Minting by Rarity", function () {
    beforeEach(async function () {
      // Operator sets the accepted boxes:
      await nft.setAcceptedBoosters(
        [rare.address, epic.address, legendary.address],
        [true, true, true]
      );
    });

    it("Should mint a rare ghost", async function () {
      await expect(nft.mintGhostByRarity(user1.address, rare.address))
        .to.emit(nft, "GhostMinted")
        .withArgs(rare.address, user1.address, 0);
    });

    it("Should mint an epic ghost", async function () {
      await expect(nft.mintGhostByRarity(user1.address, epic.address))
        .to.emit(nft, "GhostMinted")
        .withArgs(epic.address, user1.address, 0);
    });

    it("Should mint a legendary ghost", async function () {
      await expect(nft.mintGhostByRarity(user1.address, legendary.address))
        .to.emit(nft, "GhostMinted")
        .withArgs(legendary.address, user1.address, 0);
    });
  });

  describe("Ghost: Minting Special NFTs", function () {
    it("Should mint a special ghost", async function () {
      await expect(nft.mintSpecialGhost(user1.address, "mySpecialStringHere"))
        .to.emit(nft, "SpecialGhostMinted")
        .withArgs("mySpecialStringHere", user1.address, 0);
    });
  });
});

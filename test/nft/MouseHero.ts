import { expect } from "chai";
import { ethers } from "hardhat";
/* eslint-disable node/no-missing-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BMHTR, BMHTE, BMHTL, BMHTG, MouseHero } from "../../typechain";

import { OPERATOR_ROLE, MINTER_ROLE, PAUSER_ROLE, DEFAULT_ADMIN_ROLE } from "../../src/utils/roles";
import { deployBaseContracts, ContractInstances } from "../fixture/testFixture";
/* eslint-disable node/no-missing-import */
describe("MouseHero (NFT)", function () {
  // A very explicit way of fetching and naming accounts that will be used during the tests
  let operator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  // List of usable contracts
  let contracts: ContractInstances;

  // Helpers
  let nft: MouseHero;
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

  before(async function () {
    [operator, user1, user2, user3] = await ethers.getSigners();
  });

  beforeEach(async function () {
    contracts = await deployBaseContracts(operator, operator);

    // helpers
    nft = contracts.nft.mouse;
    rare = contracts.booster.mouse.rare;
    epic = contracts.booster.mouse.epic;
    legendary = contracts.booster.mouse.legendary;
    genesis = contracts.booster.mouse.genesis;
  });

  describe("NFT Basics", function () {
    beforeEach(async function () {
      // Register one booster to be able to mint it directly
      await nft.setAcceptedBoosters([rare.address], [true]);
    });

    it("Should be an ERC721 token", async function () {
      const interfaceId = "0x80ac58cd";
      expect(await nft.supportsInterface(interfaceId)).to.equal(true);
    });

    it("Should have a baseURI", async function () {
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // expect it to have a URI
      expect(await nft.tokenURI(0)).to.equal("https://nft.mousehaunt.com/hero/0");
    });

    it("Should automatically increment the baseURI", async function () {
      // Mint an NFT 'manually' (without cracking a booster open)
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // expect it to have a URI
      expect(await nft.tokenURI(0)).to.equal("https://nft.mousehaunt.com/hero/0");

      // Mint another NFT 'manually' (without cracking a booster open)
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 1);

      // expect it to have a URI
      expect(await nft.tokenURI(1)).to.equal("https://nft.mousehaunt.com/hero/1");

      // Mint yet another NFT 'manually' (without cracking a booster open)
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 2);

      // expect it to have a URI
      expect(await nft.tokenURI(2)).to.equal("https://nft.mousehaunt.com/hero/2");
    });

    it("Should throw when querying a nonexistent token", async function () {
      // No NFT has been minted yet
      await expect(nft.tokenURI(0)).to.be.revertedWith(
        "ERC721Metadata: URI query for nonexistent token"
      );
    });

    it("Should be enumberable", async function () {
      // Mint an NFT 'manually' (without cracking a booster open)
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // Mint another NFT 'manually' (without cracking a booster open)
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 1);

      // Mint another NFT to someone else
      await expect(nft.mintMouseHeroByRarity(user2.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user2.address, 2);

      // Mint yet another NFT 'manually' (without cracking a booster open)
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 3);

      // Mint another NFT to someone else
      await expect(nft.mintMouseHeroByRarity(user2.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user2.address, 4);

      const tokenListUser1 = await nft.tokensOfOwner(user1.address);
      expect(tokenListUser1.join(",") === "0,1,3");

      const tokenListUser2 = await nft.tokensOfOwner(user2.address);
      expect(tokenListUser2.join(",") === "2,4");
    });

    it("Should enumerate correctly after transfers, mints and burns", async function () {
      // Mint an NFT 'manually' (without cracking a booster open)
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // Mint another NFT 'manually' (without cracking a booster open)
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 1);

      // Mint another NFT to someone else
      await expect(nft.mintMouseHeroByRarity(user2.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user2.address, 2);

      // Mint yet another NFT 'manually' (without cracking a booster open)
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 3);

      // Mint another NFT to someone else
      await expect(nft.mintMouseHeroByRarity(user2.address, rare.address))
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
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 5);

      // Mint another one to user2
      await expect(nft.mintMouseHeroByRarity(user2.address, rare.address))
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
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
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
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
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
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // Pause
      await expect(nft.pause()).to.emit(nft, "Paused").withArgs(operator.address);

      // Try and fail to mint
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address)).to.be.revertedWith(
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
        nft.connect(user1).mintMouseHeroByRarity(user1.address, rare.address)
      ).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${MINTER_ROLE}`
      );
    });

    it("Should allow newly assigned minter to mint", async function () {
      await expect(nft.grantRole(MINTER_ROLE, user1.address))
        .to.emit(nft, "RoleGranted")
        .withArgs(MINTER_ROLE, user1.address, operator.address);

      await expect(nft.connect(user1).mintMouseHeroByRarity(user1.address, rare.address))
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
        nft.connect(user1).mintMouseHeroByRarity(user1.address, rare.address)
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
        nft.connect(user1).mintMouseHeroByRarity(user1.address, rare.address)
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
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
        .to.emit(nft, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, 0);

      // expect the nft to return the correct URL
      expect(await nft.tokenURI(0)).to.equal("https://nft.mousehaunt.com/hero/0");

      // Change the URI
      await nft.setBaseURI("www.CHANGED.com/");
      expect(await nft.baseTokenURI()).to.equal("www.CHANGED.com/");

      // mint another nft
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
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

  // BoosterCracker
  describe("MouseHero: Unboxing", function () {
    beforeEach(async function () {
      // send boosters to users
      await rare.transfer(user1.address, amount1);
      await epic.transfer(user1.address, amount1E18);
      await legendary.transfer(user1.address, amount1E18);
      await genesis.transfer(user1.address, amount1);

      await rare.transfer(user2.address, amount2);
      await epic.transfer(user2.address, amount2E18);
      await legendary.transfer(user2.address, amount2E18);
      await genesis.transfer(user2.address, amount2);

      await rare.transfer(user3.address, amount3);
      await epic.transfer(user3.address, amount3E18);
      await legendary.transfer(user3.address, amount3E18);
      await genesis.transfer(user3.address, amount3);

      // users 1 and 2 approve the MouseHero contract (user 3 doesn't)
      await rare.connect(user1).approve(nft.address, amount1);
      await epic.connect(user1).approve(nft.address, amount1E18);
      await legendary.connect(user1).approve(nft.address, amount1E18);
      await genesis.connect(user1).approve(nft.address, amount1);

      await rare.connect(user2).approve(nft.address, amount2);
      await epic.connect(user2).approve(nft.address, amount2E18);
      await legendary.connect(user2).approve(nft.address, amount2E18);
      await genesis.connect(user2).approve(nft.address, amount2);

      // Operator sets the accepted boosters:
      await nft.setAcceptedBoosters(
        [rare.address, epic.address, legendary.address, genesis.address],
        [true, true, true, true]
      );
    });

    describe("Rare Booster", function () {
      it("Should unbox a booster", async function () {
        await expect(nft.connect(user1).unboxBooster(rare.address, amount1))
          .to.emit(nft, "BoosterUnboxed")
          .withArgs(rare.address, user1.address, 0);

        const tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "0");

        // make sure boosters were burned
        expect(await rare.balanceOf(user1.address)).to.equal(0);
      });

      it("Should NOT unbox more than one booster at once", async function () {
        await expect(nft.connect(user2).unboxBooster(rare.address, amount2)).to.be.revertedWith(
          "INV_AMOUNT"
        );

        const tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "0,1");

        // make sure boosters were burned
        expect(await rare.balanceOf(user2.address)).to.equal(2);
      });

      it("Should revert when trying to unbox more boosters than balance", async function () {
        // Transfer the full balance to another account:
        await rare.connect(user2).transfer(user1.address, amount2);

        await expect(nft.connect(user2).unboxBooster(rare.address, 1)).to.be.revertedWith(
          "ERC20: burn amount exceeds balance"
        );

        const tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "");

        // make sure boosters were NOT burned
        expect(await rare.balanceOf(user2.address)).to.equal(0);
      });

      it("Should revert when trying to crack 0 boosters open", async function () {
        await expect(nft.connect(user1).unboxBooster(rare.address, 0)).to.be.revertedWith(
          "INV_AMOUNT"
        );

        const tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "");

        // make sure boosters were NOT burned
        expect(await rare.balanceOf(user1.address)).to.equal(amount1);
      });

      it("Should allow to unbox boosters in more than one step", async function () {
        await expect(nft.connect(user2).unboxBooster(rare.address, amount2 / 2))
          .to.emit(nft, "BoosterUnboxed")
          .withArgs(rare.address, user2.address, 0);

        let tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "0");

        // make sure boosters were burned
        expect(await rare.balanceOf(user2.address)).to.equal(1);

        await expect(nft.connect(user2).unboxBooster(rare.address, amount2 / 2))
          .to.emit(nft, "BoosterUnboxed")
          .withArgs(rare.address, user2.address, 1);

        tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "0,1");

        // make sure boosters were burned
        expect(await rare.balanceOf(user2.address)).to.equal(0);
      });

      it("Should revert when trying to unbox a booster without having approved MouseHero", async function () {
        // set allowance to zero
        await rare.connect(user3).approve(nft.address, 0);

        await expect(nft.connect(user3).unboxBooster(rare.address, amount1)).to.be.revertedWith(
          "ERC20: burn amount exceeds allowance"
        );

        const tokenListUser3 = await nft.tokensOfOwner(user3.address);
        expect(tokenListUser3.join(",") === "");

        // make sure boosters were NOT burned
        expect(await rare.balanceOf(user3.address)).to.equal(amount3);
      });
    });

    describe("Epic Booster", function () {
      it("Should unbox a booster", async function () {
        await expect(nft.connect(user1).unboxBooster(epic.address, amount1E18))
          .to.emit(nft, "BoosterUnboxed")
          .withArgs(epic.address, user1.address, 0);

        const tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "0");

        // make sure boosters were burned
        expect(await epic.balanceOf(user1.address)).to.equal(0);
      });

      it("Should NOT unbox more than one booster at once", async function () {
        await expect(nft.connect(user2).unboxBooster(epic.address, amount2E18)).to.be.revertedWith(
          "INV_AMOUNT"
        );

        const tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "0,1");

        // make sure boosters were burned
        expect(await epic.balanceOf(user2.address)).to.equal(amount2E18);
      });

      it("Should revert when trying to unbox more boosters than balance", async function () {
        // Transfer the full balance to another account:
        await epic.connect(user2).transfer(user1.address, amount2E18);

        await expect(nft.connect(user2).unboxBooster(epic.address, amount1E18)).to.be.revertedWith(
          "ERC20: burn amount exceeds balance"
        );

        const tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "");

        // make sure boosters were NOT burned
        expect(await epic.balanceOf(user2.address)).to.equal(0);
      });

      it("Should revert when trying to crack 0 boosters open", async function () {
        await expect(nft.connect(user1).unboxBooster(epic.address, 0)).to.be.revertedWith(
          "INV_AMOUNT"
        );

        const tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "");

        // make sure boosters were NOT burned
        expect(await epic.balanceOf(user1.address)).to.equal(amount1E18);
      });

      it("Should allow to unbox boosters in more than one step", async function () {
        await expect(nft.connect(user2).unboxBooster(epic.address, amount1E18))
          .to.emit(nft, "BoosterUnboxed")
          .withArgs(epic.address, user2.address, 0);

        let tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "0");

        // make sure boosters were burned
        expect(await epic.balanceOf(user2.address)).to.equal(amount1E18);

        await expect(nft.connect(user2).unboxBooster(epic.address, amount1E18))
          .to.emit(nft, "BoosterUnboxed")
          .withArgs(epic.address, user2.address, 1);

        tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "0,1");

        // make sure boosters were burned
        expect(await epic.balanceOf(user2.address)).to.equal(0);
      });

      it("Should revert when trying to unbox a booster without having approved MouseHero", async function () {
        // set allowance to zero
        await epic.connect(user3).approve(nft.address, 0);

        await expect(nft.connect(user3).unboxBooster(epic.address, amount1E18)).to.be.revertedWith(
          "ERC20: burn amount exceeds allowance"
        );

        const tokenListUser3 = await nft.tokensOfOwner(user3.address);
        expect(tokenListUser3.join(",") === "");

        // make sure boosters were NOT burned
        expect(await epic.balanceOf(user3.address)).to.equal(amount3E18);
      });

      it("Should revert when trying to crack a fraction of a booster", async function () {
        await expect(nft.connect(user1).unboxBooster(epic.address, amount1)).to.be.revertedWith(
          "DECIMAL_AMOUNT"
        );

        const tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "");

        // make sure boosters were NOT burned
        expect(await epic.balanceOf(user1.address)).to.equal(amount1E18);
      });
    });

    describe("Legendary Booster", function () {
      it("Should unbox a booster", async function () {
        await expect(nft.connect(user1).unboxBooster(legendary.address, amount1E18))
          .to.emit(nft, "BoosterUnboxed")
          .withArgs(legendary.address, user1.address, 0);

        const tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "0");

        // make sure boosters were burned
        expect(await legendary.balanceOf(user1.address)).to.equal(0);
      });

      it("Should NOT unbox more than one booster at once", async function () {
        await expect(
          nft.connect(user2).unboxBooster(legendary.address, amount2E18)
        ).to.be.revertedWith("INV_AMOUNT");

        const tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "0,1");

        // make sure boosters were burned
        expect(await legendary.balanceOf(user2.address)).to.equal(amount2E18);
      });

      it("Should revert when trying to unbox more boosters than balance", async function () {
        // Transfer the full balance to another account:
        await legendary.connect(user2).transfer(user1.address, amount2E18);

        await expect(
          nft.connect(user2).unboxBooster(legendary.address, amount1E18)
        ).to.be.revertedWith("ERC20: burn amount exceeds balance");

        const tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "");

        // make sure boosters were NOT burned
        expect(await legendary.balanceOf(user2.address)).to.equal(0);
      });

      it("Should revert when trying to crack 0 boosters open", async function () {
        await expect(nft.connect(user1).unboxBooster(legendary.address, 0)).to.be.revertedWith(
          "INV_AMOUNT"
        );

        const tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "");

        // make sure boosters were NOT burned
        expect(await legendary.balanceOf(user1.address)).to.equal(amount1E18);
      });

      it("Should allow to unbox boosters in more than one step", async function () {
        await expect(nft.connect(user2).unboxBooster(legendary.address, amount1E18))
          .to.emit(nft, "BoosterUnboxed")
          .withArgs(legendary.address, user2.address, 0);

        let tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "0");

        // make sure boosters were burned
        expect(await legendary.balanceOf(user2.address)).to.equal(amount1E18);

        await expect(nft.connect(user2).unboxBooster(legendary.address, amount1E18))
          .to.emit(nft, "BoosterUnboxed")
          .withArgs(legendary.address, user2.address, 1);

        tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "0,1");

        // make sure boosters were burned
        expect(await legendary.balanceOf(user2.address)).to.equal(0);
      });

      it("Should revert when trying to unbox a booster without having approved MouseHero", async function () {
        // set allowance to zero
        await legendary.connect(user3).approve(nft.address, 0);

        await expect(
          nft.connect(user3).unboxBooster(legendary.address, amount1E18)
        ).to.be.revertedWith("ERC20: burn amount exceeds allowance");

        const tokenListUser3 = await nft.tokensOfOwner(user3.address);
        expect(tokenListUser3.join(",") === "");

        // make sure boosters were NOT burned
        expect(await legendary.balanceOf(user3.address)).to.equal(amount3E18);
      });

      it("Should revert when trying to crack a fraction of a booster", async function () {
        await expect(
          nft.connect(user1).unboxBooster(legendary.address, amount1)
        ).to.be.revertedWith("DECIMAL_AMOUNT");

        const tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "");

        // make sure boosters were NOT burned
        expect(await legendary.balanceOf(user1.address)).to.equal(amount1E18);
      });
    });

    describe("Genesis Booster", function () {
      it("Should unbox a booster", async function () {
        await expect(nft.connect(user1).unboxBooster(genesis.address, amount1))
          .to.emit(nft, "BoosterUnboxed")
          .withArgs(genesis.address, user1.address, 0);

        const tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "1");

        // make sure boosters were burned
        expect(await genesis.balanceOf(user1.address)).to.equal(0);
      });

      it("Should NOT unbox more than one booster at once", async function () {
        await expect(nft.connect(user2).unboxBooster(genesis.address, amount2)).to.be.revertedWith(
          "INV_AMOUNT"
        );

        const tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "0,1");

        // make sure boosters were burned
        expect(await genesis.balanceOf(user2.address)).to.equal(2);
      });

      it("Should revert when trying to unbox more boosters than balance", async function () {
        // Transfer the full balance to another account:
        await genesis.connect(user2).transfer(user1.address, amount2);

        await expect(nft.connect(user2).unboxBooster(genesis.address, 1)).to.be.revertedWith(
          "ERC20: burn amount exceeds balance"
        );

        const tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "");

        // make sure boosters were NOT burned
        expect(await genesis.balanceOf(user2.address)).to.equal(0);
      });

      it("Should revert when trying to crack 0 boosters open", async function () {
        await expect(nft.connect(user1).unboxBooster(genesis.address, 0)).to.be.revertedWith(
          "INV_AMOUNT"
        );

        const tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "");

        // make sure boosters were NOT burned
        expect(await genesis.balanceOf(user1.address)).to.equal(amount1);
      });

      it("Should allow to unbox boosters in more than one step", async function () {
        await expect(nft.connect(user2).unboxBooster(genesis.address, amount2 / 2))
          .to.emit(nft, "BoosterUnboxed")
          .withArgs(genesis.address, user2.address, 0);

        let tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "0");

        // make sure boosters were burned
        expect(await genesis.balanceOf(user2.address)).to.equal(1);

        await expect(nft.connect(user2).unboxBooster(genesis.address, amount2 / 2))
          .to.emit(nft, "BoosterUnboxed")
          .withArgs(genesis.address, user2.address, 1);

        tokenListUser2 = await nft.tokensOfOwner(user2.address);
        expect(tokenListUser2.join(",") === "0,1");

        // make sure boosters were burned
        expect(await genesis.balanceOf(user2.address)).to.equal(0);
      });

      it("Should revert when trying to unbox a booster without having approved MouseHero", async function () {
        // set allowance to zero
        await genesis.connect(user3).approve(nft.address, 0);

        await expect(nft.connect(user3).unboxBooster(genesis.address, amount1)).to.be.revertedWith(
          "ERC20: burn amount exceeds allowance"
        );

        const tokenListUser3 = await nft.tokensOfOwner(user3.address);
        expect(tokenListUser3.join(",") === "");

        // make sure boosters were NOT burned
        expect(await genesis.balanceOf(user3.address)).to.equal(amount3);
      });
    });

    describe("Fake Boosters", function () {
      it("Should revert when trying to unbox an unaccepted booster", async function () {
        await expect(nft.connect(user1).unboxBooster(user2.address, 1)).to.be.revertedWith(
          "INV_BOOSTER"
        );

        const tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "");
      });

      it("Should revert when trying to unbox an unaccepted booster that was previously accepted", async function () {
        // Make sure we have `amount1` rare boosters
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

        // make sure boosters were NOT burned
        expect(await rare.balanceOf(user1.address)).to.equal(amount1);

        // Now let's unbox a different booster to see it go through as expected
        await expect(nft.connect(user1).unboxBooster(genesis.address, amount1))
          .to.emit(nft, "Transfer")
          .withArgs(ethers.constants.AddressZero, user1.address, 0);

        // Make sure we now have one NFT
        tokenListUser1 = await nft.tokensOfOwner(user1.address);
        expect(tokenListUser1.join(",") === "0");

        // make sure boosters were burned accordingly
        expect(await genesis.balanceOf(user1.address)).to.equal(0);
      });
    });
  });

  describe("MouseHero: Minting by Rarity", function () {
    beforeEach(async function () {
      // Operator sets the accepted boosters:
      await nft.setAcceptedBoosters(
        [rare.address, epic.address, legendary.address],
        [true, true, true]
      );
    });

    it("Should mint a rare hero", async function () {
      await expect(nft.mintMouseHeroByRarity(user1.address, rare.address))
        .to.emit(nft, "HeroMinted")
        .withArgs(rare.address, user1.address, 0);
    });

    it("Should mint an epic hero", async function () {
      await expect(nft.mintMouseHeroByRarity(user1.address, epic.address))
        .to.emit(nft, "HeroMinted")
        .withArgs(epic.address, user1.address, 0);
    });

    it("Should mint a legendary hero", async function () {
      await expect(nft.mintMouseHeroByRarity(user1.address, legendary.address))
        .to.emit(nft, "HeroMinted")
        .withArgs(legendary.address, user1.address, 0);
    });
  });

  describe("MouseHero: Minting Special NFTs", function () {
    it("Should mint a special hero", async function () {
      await expect(nft.mintSpecialMouseHero(user1.address, "mySpecialStringHere"))
        .to.emit(nft, "SpecialHeroMinted")
        .withArgs("mySpecialStringHere", user1.address, 0);
    });
  });
});

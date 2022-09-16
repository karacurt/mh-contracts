import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
/* eslint-disable node/no-missing-import */
import { OPERATOR_ROLE } from "../../src/utils/roles";
import { print, colors, anyValidEvmAddress } from "../../src/utils/misc";
/* eslint-disable node/no-missing-import */

describe("Nft Batch Transfer", function () {
  // A very explicit way of fetching and naming accounts that will be used during the tests
  let operator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  let nft: Contract;
  let nftBatchTransferContract: Contract;

  const boosterName = "Mouse Haunt NFT HEROIC Box";
  const boosterSymbol = "BMHTH";
  const baseURI = "https://nft.mousehaunt.com/public/boxes/heroic/";
  const maxGallerSupply = 6000;

  const innitialSupply = 200;
  const sendAmount = 100;

  before(async function () {
    [operator, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // Redeploy the nft and mint to the deployer
    const nftFactory = await ethers.getContractFactory("NftBooster");
    nft = await nftFactory.deploy(
      boosterName,
      boosterSymbol,
      baseURI,
      anyValidEvmAddress,
      anyValidEvmAddress,
      maxGallerSupply
    );
    await nft.deployed();

    // Redeploy the nftBatchTransferContract
    const nftBatchTransferContractFactory = await ethers.getContractFactory("NftBatchTransfer");
    nftBatchTransferContract = await nftBatchTransferContractFactory.deploy();
    await nftBatchTransferContract.deployed();

    // Mint NFTs to the operator
    await nft.bulkMint(operator.address, innitialSupply);

    // Operator grants the nftBatchTransferContract allowance
    await nft.connect(operator).setApprovalForAll(nftBatchTransferContract.address, true);
  });

  describe("Send", async function () {
    it("Should send NFTs with sequential IDs to another user", async function () {
      // Operator sends to user1
      await nftBatchTransferContract
        .connect(operator)
        .sendSequentialIds(nft.address, user1.address, sendAmount, 0);

      // Check if user1 received the money
      const user1BalanceAfter = await nft.balanceOf(user1.address);
      expect(user1BalanceAfter).to.equal(sendAmount);

      // Check if the money left the operator's account
      const operatorBalanceAfter = await nft.balanceOf(operator.address);
      expect(operatorBalanceAfter).to.equal(innitialSupply - sendAmount);

      // Make sure user1 now owns tokens 0 and ${sendAmount-1}
      const Nft0Owner = await nft.ownerOf(0);
      const lastNftOwner = await nft.ownerOf(sendAmount - 1);
      expect(Nft0Owner).to.equal(user1.address);
      expect(lastNftOwner).to.equal(user1.address);
    });

    it("Should send NFTs with scattered IDs to another user", async function () {
      const operatorBalanceBefore = await nft.balanceOf(operator.address);
      expect(operatorBalanceBefore).to.equal(innitialSupply);

      // Scatter IDs by sending some Nfts to user2
      // This will move the last tokens user1 owns to these positions in the tokensOfOwner array
      await nft.connect(operator).transferFrom(operator.address, user2.address, 1);
      await nft.connect(operator).transferFrom(operator.address, user2.address, 3);
      await nft.connect(operator).transferFrom(operator.address, user2.address, 5);
      await nft.connect(operator).transferFrom(operator.address, user2.address, 99);

      // Operator sends to user1
      const amountToSend = 100;
      await nftBatchTransferContract
        .connect(operator)
        .sendScatteredIds(nft.address, user1.address, amountToSend);

      // Check if user1 received the money
      const user1BalanceAfter = await nft.balanceOf(user1.address);
      expect(user1BalanceAfter).to.equal(amountToSend);

      // Check if user2 received the money
      const user2BalanceAfter = await nft.balanceOf(user2.address);
      expect(user2BalanceAfter).to.equal(4);

      // Check if the money left the operator's account
      const operatorBalanceAfter = await nft.balanceOf(operator.address);
      expect(operatorBalanceAfter).to.equal(innitialSupply - amountToSend - 4);

      // Make sure user2 now owns tokens 1, 3, 5 and 99
      const Nft1Owner = await nft.ownerOf(1);
      expect(Nft1Owner).to.equal(user2.address);
      const Nft3Owner = await nft.ownerOf(3);
      expect(Nft3Owner).to.equal(user2.address);
      const Nft5Owner = await nft.ownerOf(5);
      expect(Nft5Owner).to.equal(user2.address);
      const Nft99Owner = await nft.ownerOf(99);
      expect(Nft99Owner).to.equal(user2.address);

      // Make sure user1 now owns tokens 0, 199, 198, 197 and 196
      // Since we moved them to the first positions inside the tokensOfOwner array
      const Nft0Owner = await nft.ownerOf(0);
      expect(Nft0Owner).to.equal(user1.address);
      const Nft199Owner = await nft.ownerOf(innitialSupply - 1);
      expect(Nft199Owner).to.equal(user1.address);
      const Nft198Owner = await nft.ownerOf(innitialSupply - 2);
      expect(Nft198Owner).to.equal(user1.address);
      const Nft197Owner = await nft.ownerOf(innitialSupply - 3);
      expect(Nft197Owner).to.equal(user1.address);
      const Nft196Owner = await nft.ownerOf(innitialSupply - 4);
      expect(Nft196Owner).to.equal(user1.address);
    });
  });
});

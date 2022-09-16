import { expect } from "chai";
import { ethers } from "hardhat";
/* eslint-disable node/no-missing-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { SigGuardian, MouseHauntToken, MouseHero } from "../../typechain";
import { getValidClaim } from "../fixture/sigGuardianFixture";
import { MouseHeroFixture } from "../fixture/MouseHeroFixture";
import { DataType, IData } from "../types";

type ClaimIndex =
  | "guardianAddress"
  | "playerAddress"
  | "tokenAddress"
  | "value"
  | "networkDescriptor"
  | "playerNonce";

/* eslint-disable node/no-missing-import */
describe("Signature Guardian", function () {
  // A very explicit way of fetching and naming accounts that will be used during the tests
  let operator: SignerWithAddress;
  let validator: SignerWithAddress;
  let validator2: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  // The Guardian contract
  let sigGuardian: SigGuardian;

  // The MHT contract
  let mht: MouseHauntToken;

  // The MHH contract
  let mouseheroContract: MouseHero;

  let mousehero: MouseHeroFixture;
  // Default values
  const networkDescriptor = 56;
  const mhtAmount = "123456789987654321";
  let assetId = 0;

  before(async function () {
    [operator, validator, validator2, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async function () {
    const sigGuardianFactory = await ethers.getContractFactory("SigGuardian");
    sigGuardian = await sigGuardianFactory.deploy();
    await sigGuardian.deployed();
    await sigGuardian.initSigGuardian(networkDescriptor, [validator.address, validator2.address]);

    const mhtFactory = await ethers.getContractFactory("MouseHauntToken");
    mht = await mhtFactory.deploy(operator.address);
    await mht.deployed();

    const mouseheroFactory = await ethers.getContractFactory("MouseHero");
    mouseheroContract = await mouseheroFactory
      .connect(operator)
      .deploy("MouseHero", "MHH", "https://nft.api.mousehaunt.com/public/mice/");
    await mouseheroContract.deployed();

    mousehero = new MouseHeroFixture(mouseheroContract, operator);

    assetId = await mousehero.mintMouseHeroTo(user1.address);
  });

  describe("Iniatialize SigGuardian", function () {
    it("Should initialize with correct values", async function () {
      const isValidatorCorrect = await sigGuardian.validators(validator.address);
      expect(isValidatorCorrect).to.be.true;

      const isValidator2Correct = await sigGuardian.validators(validator2.address);
      expect(isValidator2Correct).to.be.true;
    });

    it("Should NOT revert when validating a correct request", async function () {
      const claimData = {
        guardianAddress: sigGuardian.address,
        playerAddress: user1.address,
        tokenAddress: mht.address,
        value: mhtAmount,
        networkDescriptor,
        playerNonce: 1,
      };

      const data: IData[] = [];

      const types = [
        "address", // guardianAddress
        "address", // playerAddress
        "address", // tokenAddress
        "uint256", // value
        "int64", // networkDescriptor
        "int64", // _playerNonce
      ];

      Object.keys(claimData).map((value, index) => {
        const dataInfo: IData = {
          dataType: DataType[types[index].toUpperCase() as any],
          data: ethers.utils.defaultAbiCoder.encode(
            [types[index]],
            [claimData[value as ClaimIndex]]
          ),
          key: value,
        };
        data.push(dataInfo);
      });

      const { digest, signature } = await getValidClaim(validator, data);

      await sigGuardian.validateReq(digest, data, signature);
    });

    it("Should revert when validating a claim with wrong token data", async function () {
      const claimData = {
        guardianAddress: sigGuardian.address,
        playerAddress: user1.address,
        tokenAddress: mht.address,
        value: mhtAmount,
        networkDescriptor,
        playerNonce: 1,
      };

      type ClaimIndex =
        | "guardianAddress"
        | "playerAddress"
        | "tokenAddress"
        | "value"
        | "networkDescriptor"
        | "playerNonce";

      const data: IData[] = [];

      const types = [
        "address", // guardianAddress
        "address", // playerAddress
        "address", // tokenAddress
        "uint256", // value
        "int64", // networkDescriptor
        "int64", // _playerNonce
      ];

      Object.keys(claimData).map((value, index) => {
        const dataInfo: IData = {
          dataType: DataType[types[index].toUpperCase() as any],
          data: ethers.utils.defaultAbiCoder.encode(
            [types[index]],
            [claimData[value as ClaimIndex]]
          ),
          key: value,
        };
        data.push(dataInfo);
      });

      const { signature } = await getValidClaim(validator, data);

      const wrongClaimData = {
        guardianAddress: sigGuardian.address,
        playerAddress: user2.address,
        tokenAddress: mht.address,
        value: mhtAmount,
        networkDescriptor,
        playerNonce: 1,
      };

      const wrongData: IData[] = [];

      Object.keys(wrongClaimData).map((value, index) => {
        const dataInfo: IData = {
          dataType: DataType[types[index].toUpperCase() as any],
          data: ethers.utils.defaultAbiCoder.encode(
            [types[index]],
            [wrongClaimData[value as ClaimIndex]]
          ),
          key: value,
        };
        wrongData.push(dataInfo);
      });

      const { digest: wrongDigest } = await getValidClaim(validator, wrongData);

      await expect(sigGuardian.validateReq(wrongDigest, data, signature)).to.be.revertedWith(
        "INV_DATA"
      );
    });

    it("Should revert when validating a claim with wrong networkDescriptor", async function () {
      const claimData = {
        guardianAddress: sigGuardian.address,
        playerAddress: user1.address,
        tokenAddress: mht.address,
        value: mhtAmount,
        networkDescriptor: 1,
        playerNonce: 1,
      };

      const data: IData[] = [];

      const types = [
        "address", // guardianAddress
        "address", // playerAddress
        "address", // tokenAddress
        "uint256", // value
        "int64", // networkDescriptor
        "int64", // _playerNonce
      ];

      Object.keys(claimData).map((value, index) => {
        const dataInfo: IData = {
          dataType: DataType[types[index].toUpperCase() as any],
          data: ethers.utils.defaultAbiCoder.encode(
            [types[index]],
            [claimData[value as ClaimIndex]]
          ),
          key: value,
        };
        data.push(dataInfo);
      });

      const { digest, signature } = await getValidClaim(validator, data);

      await expect(sigGuardian.validateReq(digest, data, signature)).to.be.revertedWith(
        "INV_NETWORK"
      );
    });

    it("Should revert when validating a claim with wrong nonce", async function () {
      const claimData = {
        guardianAddress: sigGuardian.address,
        playerAddress: user1.address,
        tokenAddress: mht.address,
        value: mhtAmount,
        networkDescriptor,
        playerNonce: 2,
      };

      const data: IData[] = [];

      const types = [
        "address", // guardianAddress
        "address", // playerAddress
        "address", // tokenAddress
        "uint256", // value
        "int64", // networkDescriptor
        "int64", // _playerNonce
      ];

      Object.keys(claimData).map((value, index) => {
        const dataInfo: IData = {
          dataType: DataType[types[index].toUpperCase() as any],
          data: ethers.utils.defaultAbiCoder.encode(
            [types[index]],
            [claimData[value as ClaimIndex]]
          ),
          key: value,
        };
        data.push(dataInfo);
      });

      const { digest, signature } = await getValidClaim(validator, data);

      await expect(sigGuardian.validateReq(digest, data, signature)).to.be.revertedWith(
        "INV_NONCE"
      );
    });

    it("Should revert when validating a claim with wrong signer", async function () {
      const claimData = {
        guardianAddress: sigGuardian.address,
        playerAddress: user1.address,
        tokenAddress: mht.address,
        value: mhtAmount,
        networkDescriptor,
        playerNonce: 1,
      };

      const data: IData[] = [];

      const types = [
        "address", // guardianAddress
        "address", // playerAddress
        "address", // tokenAddress
        "uint256", // value
        "int64", // networkDescriptor
        "int64", // _playerNonce
      ];

      Object.keys(claimData).map((value, index) => {
        const dataInfo: IData = {
          dataType: DataType[types[index].toUpperCase() as any],
          data: ethers.utils.defaultAbiCoder.encode(
            [types[index]],
            [claimData[value as ClaimIndex]]
          ),
          key: value,
        };
        data.push(dataInfo);
      });

      const { digest, signature } = await getValidClaim(validator, data);
      signature.signer = validator2.address;

      await expect(sigGuardian.validateReq(digest, data, signature)).to.be.revertedWith(
        "INV_SIGNER"
      );
    });

    it("Should revert when validating a claim with non-validator", async function () {
      const claimData = {
        guardianAddress: sigGuardian.address,
        playerAddress: user1.address,
        tokenAddress: mht.address,
        value: mhtAmount,
        networkDescriptor,
        playerNonce: 1,
      };

      const data: IData[] = [];

      const types = [
        "address", // guardianAddress
        "address", // playerAddress
        "address", // tokenAddress
        "uint256", // value
        "int64", // networkDescriptor
        "int64", // _playerNonce
      ];

      Object.keys(claimData).map((value, index) => {
        const dataInfo: IData = {
          dataType: DataType[types[index].toUpperCase() as any],
          data: ethers.utils.defaultAbiCoder.encode(
            [types[index]],
            [claimData[value as ClaimIndex]]
          ),
          key: value,
        };
        data.push(dataInfo);
      });

      const { digest, signature } = await getValidClaim(user1, data);

      await expect(sigGuardian.validateReq(digest, data, signature)).to.be.revertedWith(
        "INV_VALIDATOR"
      );
    });
  });
});

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, network } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { now } from "../src/utils/time";

describe("WhitelistSale", function () {
  let deployer: SignerWithAddress;
  let whitelistOperations: SignerWithAddress;
  let mhtOwner: SignerWithAddress;
  let whitelistSaleWallet: SignerWithAddress;
  let buyer: SignerWithAddress;
  let buyer2: SignerWithAddress;

  let mht: Contract;
  let busd: Contract;

  const mhtOnSale = ethers.utils.parseEther("5000").toString();
  const mhtToBusd = ethers.utils.parseEther("0.15").toString();
  const minMhtAmount = ethers.utils.parseEther("500").toString();
  const maxMhtAmount = ethers.utils.parseEther("4000").toString();
  const unlockAtIGOPercent = "8";
  const cliffMonths = "0";
  const vestingPeriodMonths = "12";

  let whitelistSale: Contract;

  beforeEach(async function () {
    [deployer, whitelistOperations, mhtOwner, buyer, buyer2, whitelistSaleWallet] =
      await ethers.getSigners();

    const MHT = await ethers.getContractFactory("MouseHauntToken");
    mht = await MHT.deploy(mhtOwner.address);
    await mht.deployed();

    const BUSD = await ethers.getContractFactory("MouseHauntToken");
    busd = await BUSD.deploy(buyer.address);
    await busd.deployed();
    await busd.connect(buyer).transfer(buyer2.address, "50000000000000000000000000");

    const WhitelistSale = await ethers.getContractFactory("WhitelistSale");
    whitelistSale = await WhitelistSale.deploy(
      whitelistSaleWallet.address,
      mht.address,
      busd.address,
      mhtOnSale,
      mhtToBusd,
      minMhtAmount,
      maxMhtAmount,
      unlockAtIGOPercent,
      cliffMonths,
      vestingPeriodMonths
    );
    await whitelistSale.deployed();
  });

  it("Should check constructor parameters", async function () {
    const WhitelistSale = await ethers.getContractFactory("WhitelistSale");
    await expect(
      WhitelistSale.deploy(
        "0x0000000000000000000000000000000000000000",
        mht.address,
        busd.address,
        mhtOnSale,
        mhtToBusd,
        minMhtAmount,
        maxMhtAmount,
        unlockAtIGOPercent,
        cliffMonths,
        vestingPeriodMonths
      )
    ).to.be.revertedWith("zero mhtOwner");
    await expect(
      WhitelistSale.deploy(
        whitelistSaleWallet.address,
        "0x0000000000000000000000000000000000000000",
        busd.address,
        mhtOnSale,
        mhtToBusd,
        minMhtAmount,
        maxMhtAmount,
        unlockAtIGOPercent,
        cliffMonths,
        vestingPeriodMonths
      )
    ).to.be.revertedWith("zero mht");
    await expect(
      WhitelistSale.deploy(
        whitelistSaleWallet.address,
        mht.address,
        "0x0000000000000000000000000000000000000000",
        mhtOnSale,
        mhtToBusd,
        minMhtAmount,
        maxMhtAmount,
        unlockAtIGOPercent,
        cliffMonths,
        vestingPeriodMonths
      )
    ).to.be.revertedWith("zero busd");
    await expect(
      WhitelistSale.deploy(
        whitelistSaleWallet.address,
        mht.address,
        busd.address,
        mhtOnSale,
        mhtToBusd,
        minMhtAmount,
        maxMhtAmount,
        101,
        cliffMonths,
        vestingPeriodMonths
      )
    ).to.be.revertedWith("unlockAtIGOPercent must lte 100");
  });

  it("Should have owner different than deployer", async function () {
    const adminRole = await whitelistSale.DEFAULT_ADMIN_ROLE();
    expect(await whitelistSale.hasRole(adminRole, deployer.address)).to.equal(false);
    expect(await whitelistSale.hasRole(adminRole, whitelistSaleWallet.address)).to.equal(true);
  });

  it("Should be pausable", async function () {
    await whitelistSale.connect(whitelistSaleWallet).pause();

    await expect(
      whitelistSale.connect(whitelistSaleWallet).addToWhitelist([buyer.address])
    ).to.be.revertedWith("Pausable: paused");

    await whitelistSale.connect(whitelistSaleWallet).unpause();

    await whitelistSale.connect(whitelistSaleWallet).addToWhitelist([buyer.address]);
  });

  it("Should have roles", async function () {
    await whitelistSale
      .connect(whitelistSaleWallet)
      .grantRole(ethers.utils.id("OPERATIONS_ROLE"), whitelistOperations.address);

    await whitelistSale.connect(whitelistOperations).pause();

    await expect(
      whitelistSale.connect(whitelistOperations).addToWhitelist([buyer.address])
    ).to.be.revertedWith("Pausable: paused");

    await whitelistSale.connect(whitelistOperations).unpause();

    await whitelistSale.connect(whitelistOperations).addToWhitelist([buyer.address]);
  });

  it("Should not allow users to purchase more MHT than what is on sale", async function () {
    const mhtToBuy = ethers.utils.parseEther("4000");
    const busdTotal = ethers.utils.parseEther("300000");

    await mht.connect(mhtOwner).transfer(whitelistSaleWallet.address, mhtToBuy);

    await whitelistSale
      .connect(whitelistSaleWallet)
      .addToWhitelist([buyer.address, buyer2.address]);

    await mht.connect(whitelistSaleWallet).approve(whitelistSale.address, mhtToBuy);

    await busd.connect(buyer).approve(whitelistSale.address, busdTotal);
    await busd.connect(buyer2).approve(whitelistSale.address, busdTotal);

    await whitelistSale.connect(buyer).buy(mhtToBuy);

    await expect(whitelistSale.connect(buyer2).buy(mhtToBuy)).to.be.revertedWith(
      "Sale: total MHT on sale reached"
    );
  });

  it("Should emit events on addToWhitelist and removeFromWhitelist", async function () {
    const add = whitelistSale
      .connect(whitelistSaleWallet)
      .addToWhitelist([buyer.address, mhtOwner.address]);

    await expect(add)
      .to.emit(whitelistSale, "AddedToWhitelist")
      .withArgs(buyer.address)
      .to.emit(whitelistSale, "AddedToWhitelist")
      .withArgs(mhtOwner.address);

    const remove = whitelistSale
      .connect(whitelistSaleWallet)
      .removeFromWhitelist([buyer.address, mhtOwner.address]);

    await expect(remove)
      .to.emit(whitelistSale, "RemovedFromWhitelist")
      .withArgs(buyer.address)
      .to.emit(whitelistSale, "RemovedFromWhitelist")
      .withArgs(mhtOwner.address);
  });

  it("Should buy MHT if whitelisted and approve pattern", async function () {
    const mhtToBuy = ethers.utils.parseEther("531.415");
    const busdTotal = ethers.utils.parseEther("79.71225");

    await mht.connect(mhtOwner).transfer(whitelistSaleWallet.address, mhtToBuy);

    await whitelistSale.connect(whitelistSaleWallet).addToWhitelist([buyer.address]);

    await mht.connect(whitelistSaleWallet).approve(whitelistSale.address, mhtToBuy);
    await busd.connect(buyer).approve(whitelistSale.address, busdTotal);

    await whitelistSale.connect(buyer).buy(mhtToBuy);

    expect(await mht.balanceOf(buyer.address)).to.equal(ethers.utils.parseEther("0"));

    await whitelistSale.connect(whitelistSaleWallet).removeFromWhitelist([buyer.address]);

    await expect(whitelistSale.buy(1)).to.be.revertedWith("Whitelist: not whitelisted");
  });

  it("Should claim cliffed MHT after IGO", async function () {
    const mhtToBuy = ethers.utils.parseEther("1000");
    const busdTotal = ethers.utils.parseEther("150");

    await mht.connect(mhtOwner).transfer(whitelistSaleWallet.address, mhtToBuy);

    await whitelistSale.connect(whitelistSaleWallet).addToWhitelist([buyer.address]);

    await mht.connect(whitelistSaleWallet).approve(whitelistSale.address, mhtToBuy);
    await busd.connect(buyer).approve(whitelistSale.address, busdTotal);

    await whitelistSale.connect(buyer).buy(mhtToBuy);

    expect(await mht.balanceOf(buyer.address)).to.equal(ethers.utils.parseEther("0"));

    await expect(whitelistSale.connect(buyer).claim()).to.be.revertedWith("Unavailable before IGO");
    const nowTimestamp = await now(ethers);

    const tx = whitelistSale.connect(whitelistSaleWallet).setIgoTimestamp(nowTimestamp);
    await expect(tx).to.emit(whitelistSale, "IGO").withArgs(nowTimestamp);

    await whitelistSale.connect(buyer).claim();

    expect(await mht.balanceOf(buyer.address)).to.equal(ethers.utils.parseEther("80"));
  });

  it("Should buy greater than minimum and less than maximum MHT", async function () {
    const lessThan500MHT = ethers.utils.parseEther("499");
    const greaterThan4000MHT = ethers.utils.parseEther("4001");

    await whitelistSale.connect(whitelistSaleWallet).addToWhitelist([buyer.address]);

    await expect(whitelistSale.connect(buyer).buy(lessThan500MHT)).to.be.revertedWith(
      "Sale: amount less than min"
    );
    await expect(whitelistSale.connect(buyer).buy(greaterThan4000MHT)).to.be.revertedWith(
      "Sale: amount greater than max"
    );
  });

  it("Should not buy after IGO", async function () {
    const amount = ethers.utils.parseEther("500");

    await whitelistSale.connect(whitelistSaleWallet).addToWhitelist([buyer.address]);

    const nowTimestamp = await now(ethers);
    const tomorrow = nowTimestamp + 60 * 60 * 24;

    const tx = whitelistSale.connect(whitelistSaleWallet).setIgoTimestamp(tomorrow);
    await expect(tx).to.emit(whitelistSale, "IGO").withArgs(tomorrow);
    await network.provider.send("evm_mine", [tomorrow]);

    await expect(whitelistSale.connect(buyer).buy(amount)).to.be.revertedWith(
      "Unavailable after IGO"
    );
  });

  it("Should create release schedule with cliff", async function () {
    const unlockAtIGOPercent = "0";
    const cliffMonths = "2";
    const vestingPeriodMonths = "3";
    const WhitelistSale = await ethers.getContractFactory("WhitelistSale");
    whitelistSale = await WhitelistSale.deploy(
      whitelistSaleWallet.address,
      mht.address,
      busd.address,
      mhtOnSale,
      mhtToBusd,
      minMhtAmount,
      maxMhtAmount,
      unlockAtIGOPercent,
      cliffMonths,
      vestingPeriodMonths
    );
    await whitelistSale.deployed();

    const mhtToBuy = ethers.utils.parseEther("2222");
    const busdTotal = ethers.utils
      .parseEther("2222")
      .mul(ethers.utils.parseEther("0.15"))
      .div(ethers.utils.parseEther("1"));

    await mht.connect(mhtOwner).transfer(whitelistSaleWallet.address, mhtToBuy);

    await whitelistSale.connect(whitelistSaleWallet).addToWhitelist([buyer.address]);

    await mht.connect(whitelistSaleWallet).approve(whitelistSale.address, mhtToBuy);
    await busd.connect(buyer).approve(whitelistSale.address, busdTotal);

    await whitelistSale.connect(buyer).buy(mhtToBuy);

    expect(await mht.balanceOf(buyer.address)).to.equal(ethers.utils.parseEther("0"));

    await expect(whitelistSale.connect(buyer).claim()).to.be.revertedWith("Unavailable before IGO");

    const nowTimestamp = await now(ethers);
    const tomorrow = nowTimestamp + 60 * 60 * 24;

    const tx = whitelistSale.connect(whitelistSaleWallet).setIgoTimestamp(tomorrow);
    await expect(tx).to.emit(whitelistSale, "IGO").withArgs(tomorrow);
    await network.provider.send("evm_mine", [tomorrow]);
    await whitelistSale.connect(buyer).claim();
    expect(await mht.balanceOf(buyer.address)).to.equal("0");

    const month1 = tomorrow + 60 * 60 * 24 * 30;
    await network.provider.send("evm_mine", [month1]);
    await whitelistSale.connect(buyer).claim();
    await whitelistSale.connect(buyer).claim();
    expect(await mht.balanceOf(buyer.address)).to.equal("0");

    const month2 = tomorrow + 2 * 60 * 60 * 24 * 30;
    await network.provider.send("evm_mine", [month2]);
    await whitelistSale.connect(buyer).claim();
    expect(await mht.balanceOf(buyer.address)).to.equal("0");

    const month3 = tomorrow + 3 * 60 * 60 * 24 * 30;
    await network.provider.send("evm_mine", [month3]);
    const claimMonth3 = whitelistSale.connect(buyer).claim();
    const monthlyAmount = ethers.utils.parseEther("2222").div("3");
    await expect(claimMonth3)
      .to.emit(whitelistSale, "Claimed")
      .withArgs(buyer.address, 3, monthlyAmount);
    expect(await mht.balanceOf(buyer.address)).to.equal(monthlyAmount);

    const month4 = tomorrow + 4 * 60 * 60 * 24 * 30;
    await network.provider.send("evm_mine", [month4]);
    const claimMonth4 = whitelistSale.connect(buyer).claim();
    await expect(claimMonth4)
      .to.emit(whitelistSale, "Claimed")
      .withArgs(buyer.address, 4, monthlyAmount);
    expect(await mht.balanceOf(buyer.address)).to.equal(monthlyAmount.mul(2));

    const month5 = tomorrow + 5 * 60 * 60 * 24 * 30;
    await network.provider.send("evm_mine", [month5]);
    const claimMonth5 = whitelistSale.connect(buyer).claim();
    await expect(claimMonth5)
      .to.emit(whitelistSale, "Claimed")
      .withArgs(buyer.address, 5, mhtToBuy.sub(monthlyAmount.mul(2)));
    expect(await mht.balanceOf(buyer.address)).to.equal(mhtToBuy);

    const monthExceeding = tomorrow + 6 * 60 * 60 * 24 * 30;
    await network.provider.send("evm_mine", [monthExceeding]);
    await expect(whitelistSale.connect(buyer).claim()).to.be.revertedWith("Not enough tokens");
  });

  it("Should allow users to claim late", async function () {
    const unlockAtIGOPercent = "0";
    const cliffMonths = "2";
    const vestingPeriodMonths = "3";
    const WhitelistSale = await ethers.getContractFactory("WhitelistSale");
    whitelistSale = await WhitelistSale.deploy(
      whitelistSaleWallet.address,
      mht.address,
      busd.address,
      mhtOnSale,
      mhtToBusd,
      minMhtAmount,
      maxMhtAmount,
      unlockAtIGOPercent,
      cliffMonths,
      vestingPeriodMonths
    );
    await whitelistSale.deployed();

    const mhtToBuy = ethers.utils.parseEther("600");
    const busdTotal = ethers.utils.parseEther("90");

    await mht.connect(mhtOwner).transfer(whitelistSaleWallet.address, mhtToBuy);

    await whitelistSale.connect(whitelistSaleWallet).addToWhitelist([buyer.address]);

    await mht.connect(whitelistSaleWallet).approve(whitelistSale.address, mhtToBuy);
    await busd.connect(buyer).approve(whitelistSale.address, busdTotal);

    await whitelistSale.connect(buyer).buy(mhtToBuy);

    expect(await mht.balanceOf(buyer.address)).to.equal(ethers.utils.parseEther("0"));

    const nowTimestamp = await now(ethers);
    const tomorrow = nowTimestamp + 60 * 60 * 24;
    const nextYear = nowTimestamp + 60 * 60 * 24 * 30 * 12;

    const tx = whitelistSale.connect(whitelistSaleWallet).setIgoTimestamp(tomorrow);
    await expect(tx).to.emit(whitelistSale, "IGO").withArgs(tomorrow);
    await network.provider.send("evm_mine", [tomorrow]);
    await network.provider.send("evm_mine", [nextYear]);

    expect(await mht.balanceOf(buyer.address)).to.equal("0");

    const monthlyAmount = mhtToBuy.div(3);
    const claim = whitelistSale.connect(buyer).claim();
    await expect(claim)
      .to.emit(whitelistSale, "Claimed")
      .withArgs(buyer.address, 3, monthlyAmount)
      .to.emit(whitelistSale, "Claimed")
      .withArgs(buyer.address, 4, monthlyAmount)
      .to.emit(whitelistSale, "Claimed")
      .withArgs(buyer.address, 5, monthlyAmount);
    expect(await mht.balanceOf(buyer.address)).to.equal(mhtToBuy);

    await expect(whitelistSale.connect(buyer).claim()).to.be.revertedWith("Not enough tokens");
  });

  it("Should allow users to buy more than once", async function () {
    const unlockAtIGOPercent = "0";
    const cliffMonths = "2";
    const vestingPeriodMonths = "3";
    const WhitelistSale = await ethers.getContractFactory("WhitelistSale");
    whitelistSale = await WhitelistSale.deploy(
      whitelistSaleWallet.address,
      mht.address,
      busd.address,
      mhtOnSale,
      mhtToBusd,
      minMhtAmount,
      maxMhtAmount,
      unlockAtIGOPercent,
      cliffMonths,
      vestingPeriodMonths
    );
    await whitelistSale.deployed();

    const mhtToBuy = ethers.utils.parseEther("3300");
    const busdTotal = ethers.utils.parseEther("100000");

    await mht.connect(mhtOwner).transfer(whitelistSaleWallet.address, mhtToBuy);

    await whitelistSale.connect(whitelistSaleWallet).addToWhitelist([buyer.address]);

    await mht.connect(whitelistSaleWallet).approve(whitelistSale.address, mhtToBuy);
    await busd.connect(buyer).approve(whitelistSale.address, busdTotal);

    await whitelistSale.connect(buyer).buy(mhtToBuy.div(3));

    expect(
      (await whitelistSale.addressToUserInfo(buyer.address)).map((x: any) => x.toString())
    ).to.deep.equal([mhtToBuy.div(3).toString(), mhtToBuy.div(3).toString(), "-1"]);

    await whitelistSale.connect(buyer).buy(mhtToBuy.div(3));

    expect(
      (await whitelistSale.addressToUserInfo(buyer.address)).map((x: any) => x.toString())
    ).to.deep.equal([mhtToBuy.mul(2).div(3).toString(), mhtToBuy.mul(2).div(3).toString(), "-1"]);

    await whitelistSale.connect(buyer).buy(mhtToBuy.div(3));

    expect(
      (await whitelistSale.addressToUserInfo(buyer.address)).map((x: any) => x.toString())
    ).to.deep.equal([mhtToBuy.toString(), mhtToBuy.toString(), "-1"]);

    await expect(whitelistSale.connect(buyer).buy(mhtToBuy.div(3))).to.be.revertedWith(
      "Sale: total greater than max"
    );
  });

  it("Should not allow users to buy after distrubition has begun", async function () {
    const unlockAtIGOPercent = "0";
    const cliffMonths = "0";
    const vestingPeriodMonths = "3";
    const WhitelistSale = await ethers.getContractFactory("WhitelistSale");
    whitelistSale = await WhitelistSale.deploy(
      whitelistSaleWallet.address,
      mht.address,
      busd.address,
      mhtOnSale,
      mhtToBusd,
      minMhtAmount,
      maxMhtAmount,
      unlockAtIGOPercent,
      cliffMonths,
      vestingPeriodMonths
    );
    await whitelistSale.deployed();

    const mhtToBuy = ethers.utils.parseEther("3300");
    const busdTotal = ethers.utils.parseEther("100000");

    await mht.connect(mhtOwner).transfer(whitelistSaleWallet.address, mhtToBuy);

    await whitelistSale.connect(whitelistSaleWallet).addToWhitelist([buyer.address]);

    await mht.connect(whitelistSaleWallet).approve(whitelistSale.address, mhtToBuy);
    await busd.connect(buyer).approve(whitelistSale.address, busdTotal);

    await whitelistSale.connect(buyer).buy(mhtToBuy.div(3));

    expect(
      (await whitelistSale.addressToUserInfo(buyer.address)).map((x: any) => x.toString())
    ).to.deep.equal([mhtToBuy.div(3).toString(), mhtToBuy.div(3).toString(), "-1"]);

    await whitelistSale.connect(buyer).buy(mhtToBuy.div(3));

    expect(
      (await whitelistSale.addressToUserInfo(buyer.address)).map((x: any) => x.toString())
    ).to.deep.equal([mhtToBuy.mul(2).div(3).toString(), mhtToBuy.mul(2).div(3).toString(), "-1"]);

    const nowTimestamp = await now(ethers);
    const tomorrow = nowTimestamp + 60 * 60 * 24;

    const tx = whitelistSale.connect(whitelistSaleWallet).setIgoTimestamp(tomorrow);
    await expect(tx).to.emit(whitelistSale, "IGO").withArgs(tomorrow);
    await network.provider.send("evm_mine", [tomorrow]);

    const month1 = tomorrow + 60 * 60 * 24 * 30;
    await network.provider.send("evm_mine", [month1]);
    await whitelistSale.connect(buyer).claim();
    expect(await mht.balanceOf(buyer.address)).to.equal(mhtToBuy.mul(2).div(9).toString());

    await expect(whitelistSale.connect(buyer).buy(mhtToBuy.div(3))).to.be.revertedWith(
      "Unavailable after IGO"
    );
  });
});

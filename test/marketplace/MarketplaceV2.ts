Error.stackTraceLimit = 45;

import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, BigNumber, ContractFactory } from "ethers";

const toWei = ethers.utils.parseEther;
const zeroAddress = ethers.constants.AddressZero;

// Should we log absolutely everything? Use this for debugging only;
const FULL_LOG = false;

describe("Marketplace Exploits", async function () {
  let owner: SignerWithAddress;
  let vault: SignerWithAddress;
  let operator: SignerWithAddress;
  let signers: SignerWithAddress[];
  /* eslint-disable no-unused-vars */

  /* eslint-disable no-unused-vars */

  let Marketplace: ContractFactory;
  let BMHTL: ContractFactory;
  let BMHTE: ContractFactory;
  let MHT: ContractFactory;
  let MouseHero: ContractFactory;

  let marketplace: Contract;
  let bmhtl: Contract;
  let bmhte: Contract;
  let mht: Contract;
  let nft: Contract;

  const publicationFeeInWei = toWei("10");
  const ownerCutPerMillion = 10000;

  let ordersCount: number;

  enum AssetType {
    NIL,
    ERC20,
    ERC721,
  }
  interface Order {
    orderId: Number;
    buyer: string;
    seller: string;
    assetId: Number;
    price: Number;
    amount: Number;
    assetType: AssetType;
    tokenAddress: string;
  }

  let orders: Order[] = [];

  /* eslint-disable no-unused-vars */
  before(async function () {
    [owner, vault, operator] = await ethers.getSigners();
    signers = await ethers.getSigners();
  });

  beforeEach(async function () {
    // CONTRACT FACTORIES
    BMHTL = await ethers.getContractFactory("BMHTL");
    bmhtl = await BMHTL.deploy(owner.address);
    await bmhtl.deployed();

    BMHTE = await ethers.getContractFactory("BMHTE");
    bmhte = await BMHTE.deploy(owner.address);
    await bmhte.deployed();

    MHT = await ethers.getContractFactory("MouseHauntToken");
    mht = await MHT.deploy(owner.address);
    await mht.deployed();

    MouseHero = await ethers.getContractFactory("MouseHero");
    nft = await MouseHero.connect(owner).deploy(
      "MouseHero",
      "MHN",
      "https://nft.mousehaunt.com/hero/"
    );
    await nft.deployed();

    Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await upgrades.deployProxy(Marketplace, [
      mht.address,
      ownerCutPerMillion,
      publicationFeeInWei,
      owner.address,
    ]);
    await marketplace.deployed();

    const MouseHauntTokens = [
      { addr: nft.address, assetType: AssetType.ERC721 },
      { addr: bmhtl.address, assetType: AssetType.ERC20 },
      { addr: bmhte.address, assetType: AssetType.ERC20 },
    ];
    // ASSET OPERATIONS
    await marketplace.connect(owner).setNFTs(MouseHauntTokens);
  });
  async function getRandomSigner(): Promise<SignerWithAddress> {
    const randomIndex = Math.floor(Math.random() * signers.length);
    return signers[randomIndex];
  }
  async function getRandomOrderDetails(): Promise<{
    amount: string;
    itemPrice: Number;
    assetType: Number;
  }> {
    const randAmount = (Math.floor(Math.random() * 10) + 1).toString() + "000000000000000000";
    const randItemPrice = Math.floor(Math.random() * 1000) + 1;
    const randAssetType = Math.floor(Math.random() * 2) + 1;

    if (FULL_LOG) console.info("randAssetType: ", randAssetType);
    if (FULL_LOG) console.log("randAmount: ", randAmount);
    if (FULL_LOG) console.log("randItemPrice: ", randItemPrice);

    return {
      amount: randAmount,
      itemPrice: randItemPrice,
      assetType: randAssetType,
    };
  }
  async function getRandomOrder(): Promise<{
    order: Order;
    orderIndex: number;
  }> {
    const randOrderIndex = Math.floor(Math.random() * orders.length);
    const randOrderId = orders[randOrderIndex].orderId;

    if (FULL_LOG) console.log(`\nid: ${randOrderId}`);

    let orderIndex = -1;

    const ordersFromContract = await marketplace.getOrders();
    ordersFromContract.forEach((orderFromContract: any) => {
      if (orderFromContract.id.toNumber() === randOrderId) {
        orderIndex = ordersFromContract.indexOf(orderFromContract);
      }
    });
    const order = orders[orderIndex];

    return { order, orderIndex };
  }

  async function setBMHTLForSigner(to: SignerWithAddress, amount: string) {
    if (FULL_LOG) console.log("\nAsset is ERC20, approving amount to sell...");
    await bmhtl.connect(owner).transfer(to.address, amount);
    if (FULL_LOG) console.log("\nseller approving amount to sell for marketplace...");
    await bmhtl.connect(to).approve(marketplace.address, amount);
  }
  async function setMouseHeroForSigner(to: SignerWithAddress): Promise<Number> {
    if (FULL_LOG) console.log("\n minting for seller...");
    const transaction = await nft
      .connect(owner)
      .mintSpecialMouseHero(to.address, "Special Mouse Hero");
    if (FULL_LOG) console.log("\n getting assetId from transaction");
    const tx = await transaction.wait();
    const event = tx.events![0];
    const value = event.args![2];
    const assetId = value.toNumber();
    if (FULL_LOG) console.log("assetId: ", assetId);

    // approve marketplace to sell
    if (FULL_LOG) console.log("\nseller approving marketplace to sell asset...");
    await nft.connect(to).approve(marketplace.address, assetId);

    return assetId;
  }
  async function createOrder(
    buyer: SignerWithAddress,
    seller: SignerWithAddress,
    amount: Number | string,
    itemPrice: Number,
    assetType: Number,
    assetId: Number
  ): Promise<Order> {
    const sellerBalanceBefore = await bmhtl.balanceOf(seller.address);
    const marketplaceBalanceBefore = await bmhtl.balanceOf(marketplace.address);

    if (assetType === AssetType.ERC20) {
      if (FULL_LOG) {
        console.log(
          "sellerBalanceBefore: ",
          ethers.utils.formatEther(sellerBalanceBefore).toString()
        );
        console.log(
          "marketplaceBalanceBefore: ",
          ethers.utils.formatEther(marketplaceBalanceBefore).toString()
        );
      }
    } else {
      if (FULL_LOG) {
        const ownerBefore = await nft.ownerOf(assetId);
        console.log("ownerBefore: ", ownerBefore);
      }
    }

    const tx = await (
      await marketplace
        .connect(seller)
        .createOrder(
          assetType === AssetType.ERC20 ? bmhtl.address : nft.address,
          assetId,
          assetType === AssetType.ERC20 ? amount : 1,
          itemPrice
        )
    ).wait();
    const events = tx.events;
    const event = events.find((e: any) => e.event === "OrderCreated");
    const value = event.args![0];
    const orderId = Number(value.toString());
    if (assetType === AssetType.ERC20) {
      const sellerBalanceAfter = await bmhtl.balanceOf(seller.address);
      const marketplaceBalanceAfter = await bmhtl.balanceOf(marketplace.address);
      if (FULL_LOG) {
        console.log(
          "sellerBalanceAfter: ",
          ethers.utils.formatEther(sellerBalanceAfter).toString()
        );
        console.log(
          "marketplaceBalanceAfter: ",
          ethers.utils.formatEther(marketplaceBalanceAfter).toString()
        );
      }
    } else {
      const ownerAfter = await nft.ownerOf(assetId);
      if (FULL_LOG) console.log("ownerAfter: ", ownerAfter);
    }
    const order = {
      orderId: orderId,
      buyer: buyer.address,
      seller: seller.address,
      assetId: assetId,
      price: itemPrice,
      amount: assetType === AssetType.ERC20 ? amount : 1,
      assetType: Number(assetType),
      tokenAddress: assetType === AssetType.ERC20 ? bmhtl.address : nft.address,
    } as Order;

    if (FULL_LOG) console.log("order: ", order);
    ordersCount = orderId;
    return order;
  }
  async function deleteOrder(order: Order, orderIndex: number) {
    if (FULL_LOG) console.log("\ndeleting order from test array...");
    const rowToDelete = orderIndex;
    const keyToMove = orders[orders.length - 1];
    orders[rowToDelete] = keyToMove;
    orders.pop();
  }
  async function transferMHTAndApproveMarketplace(
    to: SignerWithAddress,
    value: BigNumber | Number
  ) {
    if (FULL_LOG) console.log(`\n transferring ${value} to ${to.address} ...`);
    await mht.connect(owner).transfer(to.address, value);
    if (FULL_LOG) console.log("approving value for marketplace...");
    await mht.connect(to).approve(marketplace.address, value);
  }
  async function assertTestOrderWithContractOrder(order: Order) {
    if (FULL_LOG) console.log("\nasserting test order with contract order...");
    const contractOrder = await marketplace.getOrder(order.orderId);
    if (!contractOrder) return;

    expect(contractOrder.id.toNumber()).to.be.equal(order.orderId);
    expect(contractOrder.seller).to.be.equal(order.seller);
    expect(contractOrder.assetId.toNumber()).to.be.equal(order.assetId);
    expect(contractOrder.price.toNumber()).to.be.equal(order.price);
    expect(contractOrder.amount).to.be.equal(order.amount.toString());
  }
  async function assertTestOrdersWithContractOrders() {
    const ordersFromContract = await marketplace.getOrders();
    if (FULL_LOG) console.log("\nasserting test orders with contract orders...");
    for (let i = 0; i < ordersFromContract.length; i++) {
      expect(ordersFromContract[i].id.toNumber()).to.be.equal(orders[i].orderId);
      expect(ordersFromContract[i].seller).to.be.equal(orders[i].seller);
      expect(ordersFromContract[i].assetId.toNumber()).to.be.equal(orders[i].assetId);
      expect(ordersFromContract[i].price.toNumber()).to.be.equal(orders[i].price);
      expect(ordersFromContract[i].amount).to.be.equal(orders[i].amount.toString());
    }
  }
  async function assertIndexMapping() {
    if (FULL_LOG) console.log("\n#### GETTING VALUES ON INDEX MAPPING FROM CONTRACT ###");

    // await marketplace.setOrdersCount();
    const ordersCount = orders.length;
    const ordersFromContract = await marketplace.getOrders();

    for (let id = 0; id <= ordersCount; id++) {
      let index = -1;

      ordersFromContract.forEach((orderFromContract: any) => {
        if (orderFromContract.id.toNumber() === id) {
          index = ordersFromContract.indexOf(orderFromContract);
        }
      });

      const isActive = orders.find((order) => Number(order.orderId) === id);
      if (!ordersFromContract[index]) {
        if (FULL_LOG) console.log(`OrderId: ${id} | Index: ${index} | out of bounds`);
        expect(ordersFromContract[index]).to.be.equal(orders[index]);
        continue;
      }
      if (id === 0) {
        if (FULL_LOG) console.log(`OrderId: ${id} | Index: ${index} | dummy order `);
        expect(ordersFromContract[index].id.toNumber()).to.be.equal(id);
      } else if (!isActive) {
        if (FULL_LOG) console.log(`OrderId: ${id} | Index: ${index} | is not active`);
        expect(index).to.be.equal(0);
      } else {
        if (FULL_LOG) console.log(`OrderId: ${id} | Index: ${index} | active`);
        expect(ordersFromContract[index].id.toNumber()).to.be.equal(id);
      }
    }
    if (FULL_LOG) console.log("orders.length: ", orders.length);
    if (FULL_LOG) console.log("ordersFromContract.length: ", ordersFromContract.length);
  }
  async function generateRandomOrders(ordersQuantity: number) {
    // await marketplace.setOrdersCount();
    const ordersCount = orders.length;
    const generatedOrders = [];

    if (FULL_LOG) console.log(`\n########## GENERATING ${ordersQuantity} ORDERS ###########`);
    if (FULL_LOG) console.log("ordersCount: ", ordersCount);

    for (let i = ordersCount; i < ordersCount + ordersQuantity; i++) {
      if (FULL_LOG) console.log(`******************  Order  ${i} ***************************`);

      // random buyer

      const buyer = await getRandomSigner();
      const seller = await getRandomSigner();

      if (FULL_LOG) console.log("randBuyer", buyer.address);
      if (FULL_LOG) console.log("randSeller", seller.address);

      if (seller.address === buyer.address) {
        if (FULL_LOG) console.log("SELLER AND BUYER ARE THE SAME");
        i--;
        continue;
      }

      // random order details
      if (FULL_LOG) console.log("\nsetting random order details");
      const { amount, itemPrice, assetType } = await getRandomOrderDetails();

      // money to seller
      await transferMHTAndApproveMarketplace(seller, publicationFeeInWei);

      // random asset
      let assetId = 0;

      if (assetType === AssetType.ERC20) {
        // approve amount to sell
        await setBMHTLForSigner(seller, amount);
      } else {
        assetId = Number(await setMouseHeroForSigner(seller));
      }

      // create order transaction and get order id
      if (FULL_LOG) console.log("creating order transaction");
      const order = await createOrder(buyer, seller, amount, itemPrice, assetType, assetId);

      generatedOrders.push(order);

      if (FULL_LOG) console.log("====================================================");
    }

    // if(FULL_LOG) console.log("orders", generatedOrders);
    if (FULL_LOG) console.log("orders.length", generatedOrders.length);
    return generatedOrders;
  }
  async function cancelRandomOrders(ordersQuantity: number) {
    if (FULL_LOG) console.log(`\n######### CANCELINGS ${ordersQuantity} ORDERS ############`);
    if (ordersQuantity > orders.length) {
      ordersQuantity = orders.length;
    }
    for (let i = 0; i < ordersQuantity; i++) {
      const { order, orderIndex } = await getRandomOrder();

      if (FULL_LOG) console.log(`\n** CANCELING ORDER ${i + 1} id: ${order.orderId}*****`);

      if (orderIndex === 0) {
        if (FULL_LOG) console.log("skipping unactive order");
        continue;
      }

      if (order.orderId === 0) {
        if (FULL_LOG) console.log("skipping dummy order");
        continue;
      }

      const seller = await ethers.getSigner(order.seller);

      await assertTestOrderWithContractOrder(order);

      if (FULL_LOG) console.log("assert before deleting");
      await assertIndexMapping();

      if (order.tokenAddress === bmhtl.address) {
        const sellerBalanceBefore = await bmhtl.balanceOf(seller.address);
        if (FULL_LOG)
          console.log(
            "sellerBalanceBefore",
            ethers.utils.formatEther(sellerBalanceBefore).toString()
          );
      } else {
        const ownerBefore = await nft.ownerOf(order.assetId);
        if (FULL_LOG) {
          console.log("\n marketplace.address", marketplace.address);
          console.log("seller.address", seller.address);
          console.log("ownerBefore", ownerBefore.toString());
          console.log("\n");
        }
      }

      const cancelOrder = await marketplace.connect(seller).cancelOrder(order.orderId);
      await expect(cancelOrder)
        .to.emit(marketplace, "OrderCancelled")
        .withArgs(order.orderId, order.assetId, order.seller, order.amount, order.tokenAddress);

      if (order.tokenAddress === bmhtl.address) {
        const sellerBalanceAfter = await bmhtl.balanceOf(seller.address);
        if (FULL_LOG)
          console.log(
            "sellerBalanceAfter",
            ethers.utils.formatEther(sellerBalanceAfter).toString()
          );
      } else {
        const ownerAfter = await nft.ownerOf(order.assetId);
        if (FULL_LOG) {
          console.log("\n marketplace.address", marketplace.address);
          console.log("seller.address", seller.address);
          console.log("ownerAfter", ownerAfter.toString());
          console.log("\n");
        }
      }
      // simulating deleting for comparing

      await deleteOrder(order, orderIndex);
      if (FULL_LOG) console.log("assert  all orders after deleting");
      await assertTestOrdersWithContractOrders();
      if (FULL_LOG) console.log("assert after deleting");
      await assertIndexMapping();

      if (FULL_LOG)
        console.log(
          `\n ---------- ORDER nro: ${i + 1} id: ${order.orderId} (orderId) CANCELED -------------`
        );
    }
  }
  async function executeRandomOrders(ordersQuantity: number) {
    if (FULL_LOG) console.log(`\n######## EXECUTING ${ordersQuantity} ORDERS ###########`);
    if (ordersQuantity > orders.length) {
      ordersQuantity = orders.length;
    }
    for (let i = 0; i < ordersQuantity; i++) {
      const { order, orderIndex } = await getRandomOrder();

      if (FULL_LOG) console.log(`\n** EXECUTING ORDER ${i + 1} id:${order.orderId} *****`);

      if (orderIndex === 0) {
        if (FULL_LOG) console.log("skipping unactive order");
        continue;
      }

      if (order.orderId === 0) {
        if (FULL_LOG) console.log("skipping dummy order");
        continue;
      }

      const buyer = await ethers.getSigner(order.buyer);
      const seller = await ethers.getSigner(order.seller);

      if (order.assetType === AssetType.ERC20) {
        await bmhtl.connect(seller).approve(marketplace.address, order.amount);
      }

      await transferMHTAndApproveMarketplace(buyer, order.price);
      await setBMHTLForSigner(seller, order.amount.toString());

      await assertTestOrderWithContractOrder(order);

      if (order.tokenAddress === bmhtl.address) {
        const sellerBalanceBefore = await bmhtl.balanceOf(seller.address);
        const buyerBalanceBefore = await bmhtl.balanceOf(buyer.address);
        const marketplaceBalanceBefore = await bmhtl.balanceOf(marketplace.address);
        if (FULL_LOG)
          console.log(
            "sellerBalanceBefore",
            ethers.utils.formatEther(sellerBalanceBefore).toString()
          );
        if (FULL_LOG)
          console.log(
            "buyerBalanceBefore",
            ethers.utils.formatEther(buyerBalanceBefore).toString()
          );
        if (FULL_LOG)
          console.log(
            "marketplaceBalanceBefore",
            ethers.utils.formatEther(marketplaceBalanceBefore).toString()
          );
      } else {
        const ownerBefore = await nft.ownerOf(order.assetId);

        if (FULL_LOG) {
          console.log("marketplace.address", marketplace.address);
          console.log("buyer.address", buyer.address);
          console.log("ownerBefore", ownerBefore.toString());
        }
      }

      const executeOrder = await marketplace.connect(buyer).executeOrder(order.orderId);
      await expect(executeOrder)
        .to.emit(marketplace, "OrderExecuted")
        .withArgs(
          order.orderId,
          order.assetId,
          order.seller,
          order.amount,
          order.tokenAddress,
          order.price,
          buyer.address
        );

      if (FULL_LOG)
        console.log(
          "order amount",
          ethers.utils.formatEther(BigNumber.from(order.amount)).toString()
        );
      if (order.tokenAddress === bmhtl.address) {
        const sellerBalanceAfter = await bmhtl.balanceOf(seller.address);
        const buyerBalanceAfter = await bmhtl.balanceOf(buyer.address);
        const marketplaceBalanceAfter = await bmhtl.balanceOf(marketplace.address);
        if (FULL_LOG) {
          console.log("buyerBalanceAfter", ethers.utils.formatEther(buyerBalanceAfter).toString());
          console.log(
            "sellerBalanceAfter",
            ethers.utils.formatEther(sellerBalanceAfter).toString()
          );
          console.log(
            "marketplaceBalanceAfter",
            ethers.utils.formatEther(marketplaceBalanceAfter).toString()
          );
        }
      } else {
        const ownerAfter = await nft.ownerOf(order.assetId);
        if (FULL_LOG) {
          console.log("marketplace.address", marketplace.address);
          console.log("buyer.address", buyer.address);
          console.log("ownerAfter", ownerAfter.toString());
        }
      }
      // simulating deleting for comparing
      await deleteOrder(order, orderIndex);
      // await assertTestOrdersWithContractOrders();
      // await assertIndexMapping();

      if (FULL_LOG)
        console.log(
          `\n ---------- ORDER nro: ${i + 1} id: ${order.orderId} (orderId) EXECUTED -------------`
        );
    }
  }

  async function fruitSalad(times = 20) {
    if (FULL_LOG) console.log("\n((((((((((( FRUIT SALADING ORDERS ))))))))))))\n");
    for (let i = 0; i < times; i++) {
      const op = Math.floor(Math.random() * 3);
      const quantity = Math.floor(Math.random() * 5);
      switch (op) {
        case 0:
          orders = orders.concat(await generateRandomOrders(quantity));
          break;
        case 1:
          await cancelRandomOrders(quantity);
          break;
        case 2:
          await executeRandomOrders(quantity);
          break;
        default:
          if (FULL_LOG) console.log(`not supported operation ${op}`);
          break;
      }
    }
  }
});
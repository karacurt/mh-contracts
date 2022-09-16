// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./interfaces/IERC20Dec.sol";
import "./interfaces/IRouter.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @title Marketplace
 * @dev  A marketplace for Mouse Haunt token holders to buy and sell other Mouse Haunt token holders.
 */
contract MarketplaceV3 is Initializable, AccessControlUpgradeable, PausableUpgradeable {
  using SafeERC20Upgradeable for IERC20;
  using AddressUpgradeable for address;
  using CountersUpgradeable for CountersUpgradeable.Counter;

  //Private Variables
  CountersUpgradeable.Counter internal _orderIdCounter;

  mapping(uint256 => uint256) internal orderIdToOrderIndex; // mapping of order ID to order index

  bytes32 internal constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

  uint256 internal constant MILLION = 1000000;

  //Public Variables
  address public treasury;

  mapping(address => AssetType) public acceptedNFTs; //Accepted Mouse Haunt NFT's

  uint256 public ownerCutPerMillion; //Owner Cut Per Million

  uint256 public publicationFeeInWei; // Publication fee cost in wei

  Order[] public orders; // list of orders

  IERC20 public acceptedToken; // MHT token contract accepted by the marketplace

  //Enums
  enum AssetType {
    NIL,
    ERC20,
    ERC721
  }
  //Structs
  struct NFT {
    address addr; //ERC721 or ERC20 token address
    AssetType assetType; //ERC721 or ERC20
  }

  struct Order {
    uint256 id; // Order ID (starts at 1)
    address seller; // Owner of the NFT
    address nftAddress; // NFT address
    uint256 assetId; // NFT asset ID (ERC721)
    uint256 amount; // NFT amount (ERC20)
    uint256 price; // Price (in wei) for the published item
  }
  // EVENTS
  event OrderCreated(
    uint256 indexed id,
    uint256 assetId,
    address indexed seller,
    uint256 amount,
    address indexed nftAddress,
    uint256 priceInWei
  );
  event OrderExecuted(
    uint256 indexed id,
    uint256 assetId,
    address seller,
    uint256 amount,
    address indexed nftAddress,
    uint256 totalPrice,
    address indexed buyer
  );
  event OrderCancelled(
    uint256 indexed id,
    uint256 assetId,
    address indexed seller,
    uint256 amount,
    address indexed nftAddress
  );

  event ChangedPublicationFee(uint256 publicationFee);
  event ChangedOwnerCutPerMillion(uint256 ownerCutPerMillion);
  event FeeBurned(uint256 amount, uint256 orderId);
  event Swap(address buyer, uint256 mhtAmount, uint256 busdAmount);

  address public vault;
  IRouter public router;
  uint256 public swapFeePercentage;
  IERC20 public busd;

  /**
   * @notice Initialize this contract. Acts as a initializer
   * @param _acceptedToken - Address of the ERC20 accepted for this marketplace
   * @param _ownerCutPerMillion - owner cut per million
   * @param _publicationFeeInWei - publication fee in wei
   * @param _treasury - marketplace treasury address
   */

  function initialize(
    IERC20 _acceptedToken,
    uint256 _ownerCutPerMillion,
    uint256 _publicationFeeInWei,
    address _treasury,
    IERC20 _busd,
    IRouter _router,
    uint256 _swapFeePercentage,
    address _vault
  ) public initializer {
    __AccessControl_init();
    __Pausable_init();

    require(_acceptedToken != IERC20(address(0)), "Invalid accepted token");
    require(_treasury != address(0), "Invalid treasury");
    require(_busd != IERC20(address(0)), "Invalid busd");
    require(_router != IRouter(address(0)), "Invalid router");
    require(_swapFeePercentage <= 100 ether, "Invalid swap fee percentage");

    acceptedToken = _acceptedToken;
    treasury = _treasury;
    busd = _busd;
    router = _router;
    swapFeePercentage = _swapFeePercentage;
    vault = _vault;

    _setOwnerCutPerMillion(_ownerCutPerMillion);
    _setPublicationFee(_publicationFeeInWei);

    Order memory dummyOrder = Order({
      id: 0,
      seller: address(0),
      nftAddress: address(0),
      assetId: 0,
      amount: 0,
      price: 0
    });

    _addOrder(dummyOrder); // Add a dummy order to the first index of the orders array

    _orderIdCounter.increment(); // order IDs start at 1 so that the null value is considered an invalid order ID

    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(OPERATOR_ROLE, msg.sender);
  }

  //Setters

  /**
   * @notice Sets the publication fee that's charged to users to publish items
   * @param _publicationFeeInWei - Fee amount in wei this contract charges to publish an item
   */
  function setPublicationFee(uint256 _publicationFeeInWei) external onlyRole(OPERATOR_ROLE) {
    _setPublicationFee(_publicationFeeInWei);
  }

  /**
   * @dev See above
   */
  function _setPublicationFee(uint256 _publicationFeeInWei) private {
    publicationFeeInWei = _publicationFeeInWei;
    emit ChangedPublicationFee(publicationFeeInWei);
  }

  /**
   * @notice Sets the share cut for the owner of the contract that's
   *  charged to the seller on a successful sale
   * @param _ownerCutPerMillion - Share amount from 0 to MILLION
   */
  function setOwnerCutPerMillion(uint256 _ownerCutPerMillion) external onlyRole(OPERATOR_ROLE) {
    _setOwnerCutPerMillion(_ownerCutPerMillion);
  }

  /**
   * @dev See above
   */
  function _setOwnerCutPerMillion(uint256 _ownerCutPerMillion) private {
    require(_ownerCutPerMillion < MILLION, "Invalid owner cut");
    ownerCutPerMillion = _ownerCutPerMillion;
    emit ChangedOwnerCutPerMillion(ownerCutPerMillion);
  }

  /**
   * @dev Adds a new Order to the marketplace
   * @param order - Order to be added
   */
  function _addOrder(Order memory order) internal {
    orders.push(order);
    orderIdToOrderIndex[order.id] = orders.length - 1;
  }

  /**
   * @dev Set accepted NFT's addresses and types for this marketplace
   * @param _nfts - NFT's addresses and types
   */
  function setNFTs(NFT[] calldata _nfts) public onlyRole(OPERATOR_ROLE) {
    for (uint256 i = 0; i < _nfts.length; i++) {
      acceptedNFTs[_nfts[i].addr] = _nfts[i].assetType;
    }
  }

  //Getters
  /**
   * @dev Returns a especific order with a given id
   * @param orderId - Order ID
   */
  function getOrder(uint256 orderId) public view returns (Order memory) {
    uint256 orderIndex = orderIdToOrderIndex[orderId];
    require(orderIndex < orders.length && orderIndex != 0, "Invalid order index");

    Order memory order = orders[orderIndex];
    require(order.id == orderId, "Invalid order ID");
    return order;
  }

  /**
   * @dev Returns the total number of orders
   */
  function getOrders() public view returns (Order[] memory) {
    return orders;
  }

  //Deleters
  /**
   * @dev Deletes an order from the marketplace
   * @param orderId - Order ID
   */
  function _deleteOrder(uint256 orderId) internal {
    uint256 orderIndex = orderIdToOrderIndex[orderId];
    require(orderIndex < orders.length && orderIndex != 0, "Invalid order index");

    Order memory order = orders[orderIndex];
    require(order.id == orderId, "Invalid order ID");

    Order memory lastOrder = orders[orders.length - 1];

    if (lastOrder.id != orderId) {
      orders[orderIndex] = lastOrder;
      orderIdToOrderIndex[lastOrder.id] = orderIndex;
    }

    orders.pop();
    delete orderIdToOrderIndex[orderId];
  }

  //Logic

  /**
   * @notice Creates a new order for an ERC20 or ERC721 token,
   *  passing the appropriate parameters depending on the token being sold. See below.
   * @param nftAddress - Non fungible registry address
   * @param assetId - ID of the ERC721 published NFT. Must be 0 if ERC20.
   * @param amount - amount of the ERC20 token. Must be 1 if ERC721.
   * @param priceInWei - Price in Wei for the supported coin
   */
  function createOrder(
    address nftAddress,
    uint256 assetId,
    uint256 amount,
    uint256 priceInWei
  ) external whenNotPaused {
    require(priceInWei > 0, "Price should be greater than 0");
    AssetType assetType = acceptedNFTs[nftAddress];
    require(assetType != AssetType.NIL, "Invalid NFT address");

    if (assetType == AssetType.ERC20) {
      require(assetId == 0, "Invalid asset ID");
      IERC20 nft = IERC20(nftAddress);

      // Make sure we are treating amount/decimals correctly
      uint8 decimals = nft.decimals();
      if (decimals > 0) {
        require(amount % (10**decimals) == 0, "INV_AMOUNT");
      }

      uint256 balance = nft.balanceOf(msg.sender);
      require(balance >= amount, "Insufficient balance");
      require(nft.allowance(msg.sender, address(this)) >= amount, "Marketplace unauthorized");
    }
    // is AssetType.ERC721
    else {
      require(amount == 1, "Invalid amount");
      IERC721 nft = IERC721(nftAddress);
      address assetOwner = nft.ownerOf(assetId);

      require(assetOwner != address(this), "Asset already on the marketplace");
      require(msg.sender == assetOwner, "Only the owner can create orders");
      require(
        nft.getApproved(assetId) == address(this) ||
          nft.isApprovedForAll(assetOwner, address(this)),
        "Marketplace unauthorized"
      );
    }

    uint256 orderId = _orderIdCounter.current();
    _orderIdCounter.increment();

    _addOrder(
      Order({
        id: orderId,
        seller: msg.sender,
        nftAddress: nftAddress,
        assetId: assetId,
        amount: amount,
        price: priceInWei
      })
    );

    // Check if there's a publication fee and
    // transfer the amount to marketplace owner
    if (publicationFeeInWei > 0) {
      if (vault == address(0)) {
        acceptedToken.burnFrom(msg.sender, publicationFeeInWei);
        emit FeeBurned(amount, orderId);
      } else {
        acceptedToken.transferFrom(msg.sender, vault, publicationFeeInWei);
      }
    }

    emit OrderCreated(orderId, assetId, msg.sender, amount, nftAddress, priceInWei);

    if (assetType == AssetType.ERC20) {
      IERC20(nftAddress).transferFrom(msg.sender, address(this), amount);
    } else {
      IERC721(nftAddress).safeTransferFrom(msg.sender, address(this), assetId);
    }
  }

  /**
   * @notice Cancel an already published order
   *  can only be canceled by seller or the contract owner
   * @param orderId - Order ID
   */
  function cancelOrder(uint256 orderId) external whenNotPaused {
    Order memory order = getOrder(orderId);

    require(order.seller == msg.sender || hasRole(OPERATOR_ROLE, msg.sender), "Unauthorized user");

    uint256 orderAssetId = order.assetId;
    address orderSeller = order.seller;
    address orderNftAddress = order.nftAddress;
    uint256 orderAmount = order.amount;

    _deleteOrder(orderId);

    emit OrderCancelled(orderId, orderAssetId, orderSeller, orderAmount, orderNftAddress);

    AssetType assetType = acceptedNFTs[orderNftAddress];

    if (assetType == AssetType.ERC20) {
      IERC20(orderNftAddress).transfer(orderSeller, orderAmount);
    } else if (assetType == AssetType.ERC721) {
      IERC721(orderNftAddress).safeTransferFrom(address(this), orderSeller, orderAssetId);
    }
  }

  /**
   * @notice Executes the sale for a published asset
   * @param orderId - Order ID
   */
  function _executeOrder(uint256 orderId, bool payWithBusd) internal whenNotPaused {
    Order memory order = getOrder(orderId);

    address seller = order.seller;
    require(seller != msg.sender, "Cannot sell to yourself");

    uint256 amount = order.amount;
    uint256 assetId = order.assetId;
    uint256 price = order.price;
    address nftAddress = order.nftAddress;
    AssetType assetType = acceptedNFTs[order.nftAddress];

    if (assetType == AssetType.ERC20) {
      IERC20 nft = IERC20(nftAddress);
      uint256 balance = nft.balanceOf(seller);
      require(balance >= amount, "Seller does not have balance");
    }
    // is AssetType.ERC721
    else {
      IERC721 nft = IERC721(nftAddress);
      require(nft.ownerOf(assetId) == address(this), "Asset not on the marketplace");
    }

    _deleteOrder(orderId);

    if (payWithBusd) {
      _buyMHT(order.price);
    }

    uint256 saleShareAmount = 0;
    if (ownerCutPerMillion > 0) {
      // Calculate sale share
      saleShareAmount = (price * ownerCutPerMillion) / MILLION;

      // Transfer share amount for marketplace Owner
      if (vault == address(0)) {
        if (payWithBusd) {
          acceptedToken.burn(saleShareAmount);
        } else {
          acceptedToken.burnFrom(msg.sender, saleShareAmount);
        }
        emit FeeBurned(saleShareAmount, orderId);
      } else {
        if (payWithBusd) {
          acceptedToken.transfer(vault, saleShareAmount);
        } else {
          acceptedToken.transferFrom(msg.sender, vault, saleShareAmount);
        }
      }
    }

    // Transfer sale amount to seller
    if (payWithBusd) {
      acceptedToken.transfer(seller, price - saleShareAmount);
    } else {
      acceptedToken.transferFrom(msg.sender, seller, price - saleShareAmount);
    }

    emit OrderExecuted(orderId, assetId, seller, amount, nftAddress, price, msg.sender);

    // Transfer asset
    if (assetType == AssetType.ERC20) {
      IERC20 nft = IERC20(nftAddress);
      nft.transfer(msg.sender, amount);
    } else {
      IERC721 nft = IERC721(nftAddress);
      nft.safeTransferFrom(address(this), msg.sender, assetId);
    }
  }

  function executeOrderWithBusd(uint256 orderId) external whenNotPaused {
    _executeOrder(orderId, true);
  }

  function executeOrder(uint256 orderId) external whenNotPaused {
    _executeOrder(orderId, false);
  }

  function _buyMHT(uint256 _mhtAmountOut)
    internal
    whenNotPaused
    returns (uint256[] memory amounts)
  {
    require(_mhtAmountOut > 0, "mht amount out must be greater than 0");

    address[] memory path;
    path = new address[](2);
    path[0] = address(busd); //_tokenIn
    path[1] = address(acceptedToken); //_tokenOut

    uint256 _amountInCalculated = router.getAmountsIn(_mhtAmountOut, path)[0];

    uint256 swapFee = swapFeeOf(_amountInCalculated);

    uint256 totalCharge = _amountInCalculated + swapFee;

    uint256 balance = busd.balanceOf(msg.sender);
    require(balance >= totalCharge, "Not enough balance to SWAP BUSD for MHT");

    busd.transferFrom(msg.sender, address(this), totalCharge);
    busd.transfer(treasury, swapFee);
    busd.approve(address(router), _amountInCalculated);

    emit Swap(msg.sender, _mhtAmountOut, _amountInCalculated);

    uint256[] memory amounts = router.swapExactTokensForTokens(
      _amountInCalculated,
      _mhtAmountOut,
      path,
      address(this),
      block.timestamp * 10 minutes
    );

    return amounts;
  }

  function swapFeeOf(uint256 _amountIn) public view returns (uint256) {
    return (_amountIn * swapFeePercentage) / 100 ether;
  }

  function previewSwapValue(uint256 _mhtAmountOut) external view returns (uint256) {
    address[] memory path;
    path = new address[](2);
    path[0] = address(busd); //_tokenIn
    path[1] = address(acceptedToken); //_tokenOut

    uint256 _busdAmountIn = router.getAmountsIn(_mhtAmountOut, path)[0];
    uint256 _swapFee = swapFeeOf(_busdAmountIn);
    uint256 totalValue = _busdAmountIn + _swapFee;
    return totalValue;
  }

  /**
   * @notice Sets address where fee's goes to. In case of address(0), the fee will be burned.
   * @param _vault - Address where the fee goes to
   */
  function setVault(address _vault) external onlyRole(OPERATOR_ROLE) {
    vault = _vault;
  }

  function setRouter(address _router) external onlyRole(OPERATOR_ROLE) {
    require(_router != address(0), "OnRamp address cannot be 0");
    router = IRouter(_router);
  }

  function setBusd(address _busd) external onlyRole(OPERATOR_ROLE) {
    require(_busd != address(0), "Busd address cannot be 0");
    busd = IERC20(_busd);
  }

  function setSwapFeePercentage(uint256 _swapFeePercentage) external onlyRole(OPERATOR_ROLE) {
    require(_swapFeePercentage <= 100 ether, "Swap fee percentage cannot be greater than 100%");
    swapFeePercentage = _swapFeePercentage;
  }

  function setTreasury(address _treasury) external onlyRole(OPERATOR_ROLE) {
    require(_treasury != address(0), "treasury cannot be the zero address");
    _setupRole(OPERATOR_ROLE, _treasury);
    treasury = _treasury;
  }

  function pause() external onlyRole(OPERATOR_ROLE) {
    _pause();
  }

  function unpause() external onlyRole(OPERATOR_ROLE) {
    _unpause();
  }

  function recoverERC20(
    address _tokenAddress,
    uint256 _amount,
    address _recipient
  ) external onlyRole(OPERATOR_ROLE) {
    IERC20(_tokenAddress).transfer(_recipient, _amount);
  }

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external returns (bytes4) {
    return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
  }
}

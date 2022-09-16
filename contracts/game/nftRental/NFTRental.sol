// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../sigGuardian/SigGuardian.sol";

/**
 *@title NFTRental contract
 *@dev This contract is used to rent Mouse Haunt Game items.
 */
contract NFTRental is Initializable, PausableUpgradeable, AccessControlUpgradeable, SigGuardian {
  using Counters for Counters.Counter;
  Counters.Counter internal _rentOrderIdCounter;
  uint32 internal constant SECONDS_IN_DAY = 86400; //1 day

  //Internal variables
  bytes32 internal constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
  bytes32 internal constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

  mapping(address => RentingInfo) internal _playerRentingInfo;
  mapping(uint256 => uint256) internal orderIdToOrderIndex;

  //Public variables

  mapping(address => TokenType) public trustedTokens;
  mapping(address => TokenType) public paymentTokens;

  IERC20 public paymentToken;
  address public treasury;

  uint256 public rentFee;

  RentOrder[] public rentOrders;

  //Individual storage
  mapping(address => mapping(uint256 => address)) public tokenToIdToOwner;

  //Enums
  enum TokenType {
    NIL,
    ERC20,
    ERC721
  }

  //Structs
  struct TrustedToken {
    address addr; //ERC721 or ERC20 token address
    TokenType tokenType; //ERC721 or ERC20 token type
  }

  struct RentOrder {
    uint256 id;
    address renterAddress;
    address tokenAddress;
    uint256 tokenId;
    uint256 valuePerDay;
    uint256 endTime;
    uint256 maxDays;
    bool isAvailable;
  }

  struct RentingInfo {
    uint256[] forRentIds;
    mapping(uint256 => uint256) forRentIdToIndex;
  }

  //EVENTS
  event RentOrderCreated(
    uint256 rentOrderId,
    address renterAddress,
    address tokenAddress,
    uint256 tokenId,
    uint256 valuePerDay,
    int64 playerNonce
  );
  event RentOrderExecuted(
    uint256 rentOrderId,
    address renterAddress,
    address tokenAddress,
    uint256 tokenId,
    address tenantAddress,
    uint256 daysForRent,
    int64 playerNonce
  );
  event RentOrderCancelled(
    uint256 rentOrderId,
    address renterAddress,
    address tokenAddress,
    uint256 tokenId,
    int64 playerNonce
  );

  event RentOrderAvailability(
    address renterAddress,
    uint256 rentOrderId,
    bool isAvailable,
    int64 playerNonce
  );

  /**
	@dev initialize the NFTRental contract 
	@param _operator for Access Control and Pausable functions
  @param _treasury account that will receive the rent payments  
  @param _paymentToken coin address that will be used to pay the rent
  @param _rentFee rent fee per RentOrder
	*/
  function initialize(
    int64 networkDescriptor,
    address[] calldata initialValidators,
    address _operator,
    address _treasury,
    address _paymentToken,
    uint256 _rentFee
  ) public initializer {
    require(_operator != address(0), "INV_ADDRESS");
    require(_treasury != address(0), "INV_ADDRESS");
    require(_paymentToken != address(0), "INV_ADDRESS");

    initSigGuardian(networkDescriptor, initialValidators);
    __AccessControl_init();
    __Pausable_init();

    RentOrder memory dummyOrder = RentOrder(0, address(0), address(0), 0, 0, 0, 0, false);
    rentOrders.push(dummyOrder);

    treasury = _treasury;
    paymentToken = IERC20(_paymentToken);
    rentFee = _rentFee;

    _rentOrderIdCounter.increment();

    _setupRole(DEFAULT_ADMIN_ROLE, _operator);
    _setupRole(OPERATOR_ROLE, _operator);
    _setupRole(PAUSER_ROLE, _operator);
  }

  function pause() public onlyRole(PAUSER_ROLE) {
    _pause();
  }

  function unpause() public onlyRole(PAUSER_ROLE) {
    _unpause();
  }

  function setTreasury(address _treasury) public onlyRole(OPERATOR_ROLE) {
    require(_treasury != address(0), "INV_ADDRESS");
    treasury = _treasury;
  }

  function setRentFee(uint256 _rentFee) public onlyRole(OPERATOR_ROLE) {
    rentFee = _rentFee;
  }

  function setTrustedTokens(TrustedToken[] calldata _trustedTokens) public onlyRole(OPERATOR_ROLE) {
    for (uint256 i = 0; i < _trustedTokens.length; i++) {
      trustedTokens[_trustedTokens[i].addr] = _trustedTokens[i].tokenType;
    }
  }

  function setPaymentTokens(TrustedToken[] calldata _paymentTokens) public onlyRole(OPERATOR_ROLE) {
    for (uint256 i = 0; i < _paymentTokens.length; i++) {
      paymentTokens[_paymentTokens[i].addr] = _paymentTokens[i].tokenType;
    }
  }

  function isTrustedERC721(address tokenAddress) public view returns (bool) {
    TokenType tokenType = trustedTokens[tokenAddress];
    return tokenType == TokenType.ERC721;
  }

  function isPaymentToken(address tokenAddress) public returns (bool) {
    return paymentTokens[tokenAddress] == TokenType.ERC20;
  }

  function _addRentOrder(RentOrder memory _rentOrder) internal {
    uint256 rentOrderId = _rentOrder.id;

    rentOrders.push(_rentOrder);
    orderIdToOrderIndex[rentOrderId] = rentOrders.length - 1;

    address playerAddress = _rentOrder.renterAddress;

    uint256[] storage forRentIds = _playerRentingInfo[playerAddress].forRentIds;
    mapping(uint256 => uint256) storage forRentIdToIndex = _playerRentingInfo[playerAddress]
      .forRentIdToIndex;

    forRentIds.push(rentOrderId);
    forRentIdToIndex[rentOrderId] = forRentIds.length - 1;
  }

  function _deleteRentOrder(uint256 _rentOrderId) internal {
    uint256 rentOrderIndex = orderIdToOrderIndex[_rentOrderId];
    require(rentOrderIndex < rentOrders.length && rentOrderIndex != 0, "Invalid order index");

    RentOrder memory rentOrder = rentOrders[rentOrderIndex];
    require(rentOrder.id == _rentOrderId, "Invalid order ID");

    RentOrder memory lastRentOrder = rentOrders[rentOrders.length - 1];

    if (lastRentOrder.id != _rentOrderId) {
      rentOrders[rentOrderIndex] = lastRentOrder;
      orderIdToOrderIndex[lastRentOrder.id] = rentOrderIndex;
    }

    rentOrders.pop();
    delete orderIdToOrderIndex[_rentOrderId];

    uint256 userRentOrderIndex = _playerRentingInfo[rentOrder.renterAddress].forRentIdToIndex[
      _rentOrderId
    ];
    uint256 lastUserRentOrderIndex = _playerRentingInfo[rentOrder.renterAddress].forRentIds.length -
      1;

    if (userRentOrderIndex != lastUserRentOrderIndex) {
      _playerRentingInfo[rentOrder.renterAddress].forRentIds[
        userRentOrderIndex
      ] = _playerRentingInfo[rentOrder.renterAddress].forRentIds[lastUserRentOrderIndex];

      _playerRentingInfo[rentOrder.renterAddress].forRentIdToIndex[
        _playerRentingInfo[rentOrder.renterAddress].forRentIds[userRentOrderIndex]
      ] = userRentOrderIndex;
    }

    _playerRentingInfo[rentOrder.renterAddress].forRentIds.pop();
    delete _playerRentingInfo[rentOrder.renterAddress].forRentIdToIndex[_rentOrderId];
  }

  /**
   * @dev getters section  for the public variables
   * all getters are public and can be called by the user
   */
  function getRentOrders() public view returns (RentOrder[] memory) {
    return rentOrders;
  }

  function getPlayerRentOrders(address _playerAddress) public view returns (RentOrder[] memory) {
    uint256[] storage forRentIds = _playerRentingInfo[_playerAddress].forRentIds;

    RentOrder[] memory _rentOrders = new RentOrder[](forRentIds.length);

    for (uint256 i = 0; i < forRentIds.length; i++) {
      uint256 rentOrderId = forRentIds[i];
      uint256 rentOrderIndex = orderIdToOrderIndex[rentOrderId];
      require(rentOrderIndex < rentOrders.length, "Invalid order index");

      _rentOrders[i] = rentOrders[rentOrderIndex];
    }

    return _rentOrders;
  }

  function getRentOrder(uint256 rentOrderId) public view returns (RentOrder memory) {
    uint256 rentOrderIndex = orderIdToOrderIndex[rentOrderId];
    require(rentOrderIndex < rentOrders.length && rentOrderIndex != 0, "Invalid order index");

    return rentOrders[rentOrderIndex];
  }

  function getRentOrderIndex(uint256 rentOrderId) public view returns (uint256) {
    return orderIdToOrderIndex[rentOrderId];
  }

  function getRentOrdersCount() public view returns (uint256) {
    return rentOrders.length;
  }

  /**
   * @dev This function make sure that the rent order are available for a new rent period, or it's not
   * @param _playerAddress of the rent order owner
   * @param _rentOrderId of the rent order to be
   * @param _isAvailable true if the rent order is available for a new renting period, or false if it's not
   */
  function _setRentOrderAvailability(
    address _playerAddress,
    uint256 _rentOrderId,
    bool _isAvailable
  ) internal whenNotPaused {
    uint256 rentOrderIndex = orderIdToOrderIndex[_rentOrderId];
    require(rentOrderIndex < rentOrders.length && rentOrderIndex != 0, "INV_INDEX");

    RentOrder memory rentOrder = rentOrders[rentOrderIndex];
    require(rentOrder.id == _rentOrderId, "INV_ID");

    require(rentOrder.renterAddress == _playerAddress, "NOT_RENTER");

    rentOrders[rentOrderIndex].isAvailable = _isAvailable;

    _incrementPlayerNonce(_playerAddress);

    emit RentOrderAvailability(
      _playerAddress,
      _rentOrderId,
      _isAvailable,
      playerNonces[_playerAddress]
    );
  }

  /**
   * @dev create a new rent order
   * @param _playerAddress  rent order owner
   * @param _tokenAddress deposited token to be rented
   * @param _tokenId  deposited token id to be rented
   * @param _valuePerDay value per day to rent the token
   * @param _maxDays maximum days the owner wants that someone stay with the token during the renting
   */
  function _createRentOrder(
    address _playerAddress,
    address _tokenAddress,
    uint256 _tokenId,
    uint256 _valuePerDay,
    uint256 _maxDays
  ) internal whenNotPaused {
    require(_playerAddress != address(0), "INV_ADDRESS");
    require(isTrustedERC721(_tokenAddress), "UNTRUSTED_TOKEN");
    IERC721 trustedToken = IERC721(_tokenAddress);
    require(trustedToken.ownerOf(_tokenId) != address(this), "ALREADY_RENTED");
    require(trustedToken.ownerOf(_tokenId) == _playerAddress, "INV_OWNER");
    tokenToIdToOwner[_tokenAddress][_tokenId] = _playerAddress;

    uint256 rentOrderId = _rentOrderIdCounter.current();

    RentOrder memory rentOrder = RentOrder({
      id: rentOrderId,
      renterAddress: _playerAddress,
      tokenAddress: _tokenAddress,
      tokenId: _tokenId,
      valuePerDay: _valuePerDay,
      endTime: block.timestamp + 1 days,
      maxDays: _maxDays,
      isAvailable: true
    });

    _addRentOrder(rentOrder);

    _rentOrderIdCounter.increment();
    _incrementPlayerNonce(_playerAddress);

    emit RentOrderCreated(
      rentOrderId,
      _playerAddress,
      _tokenAddress,
      _tokenId,
      _valuePerDay,
      playerNonces[_playerAddress]
    );

    trustedToken.transferFrom(_playerAddress, address(this), _tokenId);
  }

  /**
   *@dev execute a rent order, changing the endTime of the rent order
   * making the order unavailable to be cancelled or executed again
   * @param _rentOrderId id of the rent order to be executed
   * @param _tenantAddress player who will rent the token
   * @param _daysForRent days of renting (limited by rent order max days)
   * @param _paymentTokenAddress token to be used for the payment
   */
  function _executeRentOrder(
    uint256 _rentOrderId,
    address _tenantAddress,
    uint256 _daysForRent,
    address _paymentTokenAddress
  ) internal whenNotPaused {
    require(_tenantAddress != address(0), "INV_ADDRESS");
    require(isPaymentToken(_paymentTokenAddress), "INV_PAYMENT_TOKEN");

    uint256 index = orderIdToOrderIndex[_rentOrderId];
    RentOrder memory rentOrder = rentOrders[index];

    require(rentOrder.endTime < block.timestamp, "TOKEN_IS_RENTED");
    require(_daysForRent < rentOrder.maxDays, "MAX_DAYS_EXCEEDED");
    require(rentOrder.isAvailable, "UNAVAILABLE");
    require(rentOrder.renterAddress != _tenantAddress, "CANNOT_RENT_OWN_TOKEN");

    rentOrders[index].endTime = block.timestamp + (_daysForRent * SECONDS_IN_DAY);

    _incrementPlayerNonce(_tenantAddress);

    emit RentOrderExecuted(
      rentOrder.id,
      rentOrder.renterAddress,
      rentOrder.tokenAddress,
      rentOrder.tokenId,
      _tenantAddress,
      _daysForRent,
      playerNonces[_tenantAddress]
    );

    IERC20(_paymentTokenAddress).transferFrom(_tenantAddress, treasury, rentFee);
    IERC20(_paymentTokenAddress).transferFrom(
      _tenantAddress,
      rentOrder.renterAddress,
      rentOrder.valuePerDay * _daysForRent
    );
  }

  /**
   * @dev cancel a rent order
   * @param _playerAddress token owner
   * @param _rentOrderId rent order id to be cancelled
   */
  function _cancelRentOrder(address _playerAddress, uint256 _rentOrderId) internal whenNotPaused {
    require(_playerAddress != address(0), "INV_ADDRESS");

    uint256 index = orderIdToOrderIndex[_rentOrderId];
    RentOrder memory rentOrder = rentOrders[index];

    require(rentOrder.endTime < block.timestamp, "TOKEN_IS_RENTED");
    require(rentOrder.renterAddress == _playerAddress, "INV_OWNER");

    delete tokenToIdToOwner[rentOrder.tokenAddress][rentOrder.tokenId];
    _deleteRentOrder(_rentOrderId);

    _incrementPlayerNonce(_playerAddress);

    emit RentOrderCancelled(
      rentOrder.id,
      _playerAddress,
      rentOrder.tokenAddress,
      rentOrder.tokenId,
      playerNonces[_playerAddress]
    );

    IERC721(rentOrder.tokenAddress).transferFrom(address(this), _playerAddress, rentOrder.tokenId);
  }

  //=========================================== SIGGUARDIAN VERIFICATION FUNCTIONS ===================================================//
  /**
   *@dev Rent functions.
   * They all are validated by SigGuardian, and then call the logic functions.
   * It's important to verify signature before calling any of these functions.
   */

  function setRentOrderAvailability(
    bytes32 hashDigest,
    Data[] calldata data,
    SignatureData calldata signatureData
  ) public whenNotPaused {
    validateReq(hashDigest, data, signatureData);

    address _playerAddress;
    uint256 _rentOrderId;
    bool _isAvailable;

    for (uint256 i = 0; i < data.length; i++) {
      string memory key = data[i].key;
      if (keccak256(bytes(key)) == keccak256(bytes("playerAddress"))) {
        _playerAddress = abi.decode(data[i].data, (address));
      } else if (keccak256(bytes(key)) == keccak256(bytes("rentOrderId"))) {
        _rentOrderId = abi.decode(data[i].data, (uint256));
      } else if (keccak256(bytes(key)) == keccak256(bytes("isAvailable"))) {
        _isAvailable = abi.decode(data[i].data, (bool));
      }
    }

    _setRentOrderAvailability(_playerAddress, _rentOrderId, _isAvailable);
  }

  function createRentOrder(
    bytes32 hashDigest,
    Data[] calldata data,
    SignatureData calldata signatureData
  ) public whenNotPaused {
    validateReq(hashDigest, data, signatureData);

    address _playerAddress;
    address _tokenAddress;
    uint256 _tokenId;
    uint256 _valuePerDay;
    uint256 _maxDays;

    for (uint256 i = 0; i < data.length; i++) {
      string memory key = data[i].key;
      if (keccak256(bytes(key)) == keccak256(bytes("playerAddress"))) {
        _playerAddress = abi.decode(data[i].data, (address));
      } else if (keccak256(bytes(key)) == keccak256(bytes("tokenAddress"))) {
        _tokenAddress = abi.decode(data[i].data, (address));
      } else if (keccak256(bytes(key)) == keccak256(bytes("tokenId"))) {
        _tokenId = abi.decode(data[i].data, (uint256));
      } else if (keccak256(bytes(key)) == keccak256(bytes("valuePerDay"))) {
        _valuePerDay = abi.decode(data[i].data, (uint256));
      } else if (keccak256(bytes(key)) == keccak256(bytes("maxDays"))) {
        _maxDays = abi.decode(data[i].data, (uint256));
      }
    }

    _createRentOrder(_playerAddress, _tokenAddress, _tokenId, _valuePerDay, _maxDays);
  }

  function executeRentOrder(
    bytes32 hashDigest,
    Data[] calldata data,
    SignatureData calldata signatureData
  ) public whenNotPaused {
    validateReq(hashDigest, data, signatureData);

    uint256 _rentOrderId;
    address _playerAddress;
    uint256 _daysForRent;
    address _paymentTokenAddress;

    for (uint256 i = 0; i < data.length; i++) {
      string memory key = data[i].key;
      if (keccak256(bytes(key)) == keccak256(bytes("rentOrderId"))) {
        _rentOrderId = abi.decode(data[i].data, (uint256));
      } else if (keccak256(bytes(key)) == keccak256(bytes("playerAddress"))) {
        _playerAddress = abi.decode(data[i].data, (address));
      } else if (keccak256(bytes(key)) == keccak256(bytes("daysForRent"))) {
        _daysForRent = abi.decode(data[i].data, (uint256));
      } else if (keccak256(bytes(key)) == keccak256(bytes("paymentTokenAddress"))) {
        _paymentTokenAddress = abi.decode(data[i].data, (address));
      }
    }

    _executeRentOrder(_rentOrderId, _playerAddress, _daysForRent, _paymentTokenAddress);
  }

  function cancelRentOrder(
    bytes32 hashDigest,
    Data[] calldata data,
    SignatureData calldata signatureData
  ) public whenNotPaused {
    validateReq(hashDigest, data, signatureData);

    uint256 _rentOrderId;
    address _playerAddress;

    for (uint256 i = 0; i < data.length; i++) {
      string memory key = data[i].key;
      if (keccak256(bytes(key)) == keccak256(bytes("rentOrderId"))) {
        _rentOrderId = abi.decode(data[i].data, (uint256));
      } else if (keccak256(bytes(key)) == keccak256(bytes("playerAddress"))) {
        _playerAddress = abi.decode(data[i].data, (address));
      }
    }

    _cancelRentOrder(_playerAddress, _rentOrderId);
  }
}

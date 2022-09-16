// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./interfaces/IERC20Dec.sol";
import "./interfaces/IMouseHauntStashing.sol";

contract Swap is Initializable, AccessControlUpgradeable, PausableUpgradeable {
  using Counters for Counters.Counter;

  bytes32 internal constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

  IERC20 public paymentToken;
  address public owner;
  address public treasury;

  uint256 public totalFeePaid;
  uint256 public totalFeeBurned;

  uint256 public burnFeePercentage;

  IERC721 public trustedToken;
  IMouseHauntStashing public stasher;

  Counters.Counter internal _offerIdCounter;

  mapping(uint256 => uint256) public offerIdToOfferIndex;
  mapping(uint256 => uint256) public tokenIdToOfferId;

  mapping(uint256 => Status) public tradeToStatus;
  mapping(IMouseHauntStashing.Tier => uint256) public tierToFee;

  TradeOffer[] public offers;

  enum Status {
    NIL,
    PENDING,
    EXECUTED,
    CANCELLED
  }
  struct Token {
    address addr;
    uint256 value;
  }
  struct TradeOffer {
    uint256 id;
    uint256 friendTokenId;
    uint256 traderTokenId;
    address trader;
    address friend;
    uint256 fee;
  }

  event TradeOfferCreated(
    uint256 indexed id,
    uint256 friendTokenId,
    uint256 traderTokenId,
    address indexed trader,
    address indexed friend
  );
  event TradeOfferCancelled(
    uint256 indexed id,
    uint256 friendTokenId,
    uint256 traderTokenId,
    address indexed trader,
    address indexed friend
  );
  event TradeOfferExecuted(
    uint256 indexed id,
    uint256 friendTokenId,
    uint256 traderTokenId,
    address indexed trader,
    address indexed friend
  );

  struct FeeTier {
    IMouseHauntStashing.Tier tier;
    uint256 fee;
  }
  event FeeBurned(uint256 indexed id, uint256 fee);

  function initialize(
    address _owner,
    address _treasury,
    IERC20 _paymentToken,
    IERC721 _trustedToken,
    uint256 _burnFeePercentage,
    IMouseHauntStashing _stasher
  ) public initializer {
    __AccessControl_init();
    __Pausable_init();

    require(_owner != address(0), "INV_OWNER");
    require(_treasury != address(0), "INV_TREASURY");
    require(_paymentToken != IERC20(address(0)), "INV_ACCEPTED_TOKEN");
    require(_trustedToken != IERC721(address(0)), "INV_TRUSTED_TOKEN");
    require(_stasher != IMouseHauntStashing(address(0)), "INV_STASHER");
    require(_burnFeePercentage <= 100 ether, "INV_BURN_FEE_PERCENTAGE");

    owner = _owner;
    paymentToken = _paymentToken;
    trustedToken = _trustedToken;
    burnFeePercentage = _burnFeePercentage;
    treasury = _treasury;
    stasher = _stasher;

    TradeOffer memory tradeOffer = TradeOffer(0, 0, 0, address(0), address(0), 0);
    offers.push(tradeOffer);
    _offerIdCounter.increment();

    _setupRole(DEFAULT_ADMIN_ROLE, _owner);
    _setupRole(OPERATOR_ROLE, _owner);
  }

  function OfferStatusError(Status status) private returns (string memory) {
    if (status == Status.NIL) return "NIL";
    if (status == Status.PENDING) return "PENDING";
    if (status == Status.EXECUTED) return "EXECUTED";
    if (status == Status.CANCELLED) return "CANCELLED";
  }

  function getOffer(uint256 _offerId) external view returns (TradeOffer memory) {
    require(_offerId > 0, "IID");
    require(offerIdToOfferIndex[_offerId] < offers.length, "IID");
    TradeOffer memory tradeOffer = offers[offerIdToOfferIndex[_offerId]];
    return tradeOffer;
  }

  function getOffers() external view returns (TradeOffer[] memory) {
    return offers;
  }

  function getOfferStatus(uint256 _offerId) external view returns (Status) {
    return tradeToStatus[_offerId];
  }

  function getOfferIdCounter() external view returns (uint256) {
    return _offerIdCounter.current();
  }

  function getOfferId(uint256 _offerIndex) external view returns (uint256) {
    require(_offerIndex < offers.length, "IID");
    return offers[_offerIndex].id;
  }

  function feeValueFor(address _player) public view returns (uint256) {
    return tierToFee[stasher.tierOf(_player)];
  }

  function setPaymentToken(IERC20 _paymentToken) external onlyRole(OPERATOR_ROLE) {
    require(_paymentToken != IERC20(address(0)), "INV_PAYMENT_TOKEN");
    paymentToken = _paymentToken;
  }

  function setStasher(IMouseHauntStashing _stasher) external onlyRole(OPERATOR_ROLE) {
    require(_stasher != IMouseHauntStashing(address(0)), "INV_STASHER");
    stasher = _stasher;
  }

  function setBurnFeePercentage(uint256 _burnFeePercentage) external onlyRole(OPERATOR_ROLE) {
    require(_burnFeePercentage <= 100 ether, "INV_BURN_FEE_PERCENTAGE");
    burnFeePercentage = _burnFeePercentage;
  }

  function setTrustedToken(IERC721 _trustedToken) external onlyRole(OPERATOR_ROLE) {
    require(_trustedToken != IERC721(address(0)), "INV_TRUSTED_TOKEN");
    trustedToken = _trustedToken;
  }

  function setTreasury(address _treasury) external onlyRole(OPERATOR_ROLE) {
    require(_treasury != address(0), "INV_TREASURY");
    treasury = _treasury;
  }

  function setFeePerTier(FeeTier[] calldata data) external onlyRole(OPERATOR_ROLE) {
    for (uint256 i = 0; i < data.length; i++) {
      FeeTier memory feeTier = data[i];
      tierToFee[feeTier.tier] = feeTier.fee;
    }
  }

  function pause() external onlyRole(OPERATOR_ROLE) {
    _pause();
  }

  function unpause() external onlyRole(OPERATOR_ROLE) {
    _unpause();
  }

  function _addOffer(TradeOffer memory offer) internal {
    offers.push(offer);
    offerIdToOfferIndex[offer.id] = offers.length - 1;
  }

  function _deleteOffer(uint256 offerId) internal {
    uint256 offerIndex = offerIdToOfferIndex[offerId];
    require(offerIndex < offers.length && offerIndex != 0, "Invalid offer index");

    TradeOffer memory offer = offers[offerIndex];
    require(offer.id == offerId, "Invalid offer ID");

    TradeOffer memory lastOffer = offers[offers.length - 1];

    if (lastOffer.id != offerId) {
      offers[offerIndex] = lastOffer;
      offerIdToOfferIndex[lastOffer.id] = offerIndex;
    }

    offers.pop();
    delete offerIdToOfferIndex[offerId];
    delete tokenIdToOfferId[offer.traderTokenId];
  }

  function createTradeOffer(
    uint256 _traderTokenId,
    uint256 _friendTokenId,
    address _friend
  ) external whenNotPaused returns (uint256) {
    require(msg.sender != address(0), "INV_ADDRESS");
    require(_friend != address(0), "INV_ADDRESS");

    require(msg.sender != _friend, "CANNOT_TRADE_WITH_SELF");
    require(_traderTokenId != _friendTokenId, "INV_TOKEN_ID");

    require(msg.sender == trustedToken.ownerOf(_traderTokenId), "NOT_OWNER");
    require(_friend == trustedToken.ownerOf(_friendTokenId), "FRIEND_NOT_OWNER");

    if (tokenIdToOfferId[_traderTokenId] != 0) {
      uint256 offerId = tokenIdToOfferId[_traderTokenId];
      tradeToStatus[offerId] = Status.CANCELLED;

      TradeOffer memory _offer = offers[offerIdToOfferIndex[offerId]];

      _deleteOffer(tokenIdToOfferId[_traderTokenId]);

      emit TradeOfferCancelled(
        _offer.id,
        _offer.friendTokenId,
        _offer.traderTokenId,
        _offer.trader,
        _offer.friend
      );
    }

    uint256 _offerId = _offerIdCounter.current();

    uint256 feeValue = feeValueFor(msg.sender);

    TradeOffer memory offer = TradeOffer({
      id: _offerId,
      friendTokenId: _friendTokenId,
      traderTokenId: _traderTokenId,
      trader: address(msg.sender),
      friend: address(_friend),
      fee: feeValue
    });

    tokenIdToOfferId[_traderTokenId] = _offerId;
    tradeToStatus[_offerId] = Status.PENDING;

    _addOffer(offer);
    _offerIdCounter.increment();

    emit TradeOfferCreated(
      offer.id,
      offer.friendTokenId,
      offer.traderTokenId,
      offer.trader,
      offer.friend
    );

    if (feeValue > 0) {
      paymentToken.transferFrom(msg.sender, address(this), feeValue);
    }

    return offer.id;
  }

  function executeTradeOffer(uint256 offerId) external whenNotPaused {
    if (tradeToStatus[offerId] != Status.PENDING) {
      revert(OfferStatusError(tradeToStatus[offerId]));
    }

    uint256 offerIndex = offerIdToOfferIndex[offerId];
    TradeOffer memory offer = offers[offerIndex];

    require(msg.sender == offer.friend, "ACCESS_DENIED");
    _deleteOffer(offerId);

    if (
      offer.trader != trustedToken.ownerOf(offer.traderTokenId) ||
      offer.friend != trustedToken.ownerOf(offer.friendTokenId)
    ) {
      tradeToStatus[offer.id] = Status.CANCELLED;

      emit TradeOfferCancelled(
        offer.id,
        offer.friendTokenId,
        offer.traderTokenId,
        offer.trader,
        offer.friend
      );

      return;
    }

    tradeToStatus[offer.id] = Status.EXECUTED;

    emit TradeOfferExecuted(
      offer.id,
      offer.friendTokenId,
      offer.traderTokenId,
      offer.trader,
      offer.friend
    );

    uint256 feeValue = feeValueFor(msg.sender);

    if (feeValue > 0) {
      paymentToken.transferFrom(msg.sender, address(this), feeValue);
    }

    uint256 totalFee = feeValue + offer.fee;

    if (totalFee > 0) {
      if (burnFeePercentage > 0) {
        uint256 burnFeeValue = (totalFee * burnFeePercentage) / 100 ether;

        emit FeeBurned(offerId, burnFeeValue);

        totalFeeBurned += burnFeeValue;
        totalFee -= burnFeeValue;

        paymentToken.burn(burnFeeValue);
      }

      if (totalFee > 0) {
        totalFeePaid += totalFee;
        paymentToken.transfer(treasury, totalFee);
      }
    }

    trustedToken.transferFrom(offer.trader, offer.friend, offer.traderTokenId);
    trustedToken.transferFrom(offer.friend, offer.trader, offer.friendTokenId);
  }

  function cancelTradeOffer(uint256 offerId) external whenNotPaused {
    if (tradeToStatus[offerId] != Status.PENDING) {
      revert(OfferStatusError(tradeToStatus[offerId]));
    }

    uint256 offerIndex = offerIdToOfferIndex[offerId];
    TradeOffer memory offer = offers[offerIndex];

    require(msg.sender == offer.trader || msg.sender == offer.friend, "ACCESS_DENIED");

    _deleteOffer(offerId);

    tradeToStatus[offer.id] = Status.CANCELLED;

    emit TradeOfferCancelled(
      offer.id,
      offer.friendTokenId,
      offer.traderTokenId,
      offer.trader,
      offer.friend
    );

    if (offer.fee > 0) {
      paymentToken.transfer(offer.trader, offer.fee);
    }
  }

  function recoverERC20(
    address _tokenAddress,
    uint256 _amount,
    address _recipient
  ) external onlyRole(OPERATOR_ROLE) {
    IERC20(_tokenAddress).transfer(_recipient, _amount);
  }
}

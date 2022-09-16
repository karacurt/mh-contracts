// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IERC20Dec.sol";

/**
 *@title Mouse Haunt Stashing Contract
 *@notice This contract is used to stash Mouse Haunt Token.
 */
contract MouseHauntStashing is Initializable, PausableUpgradeable, AccessControlUpgradeable {
  using Counters for Counters.Counter;
  Counters.Counter internal _stashIdCounter;

  bytes32 internal constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
  uint32 internal constant SECONDS_IN_DAY = 86400; //1 day

  //Governance
  IERC20 public paymentToken;
  address public vault;

  //Individual stashes
  mapping(address => uint256) public playerBalance;
  mapping(address => StashInfo) internal playerStashes;
  mapping(address => mapping(uint256 => uint256)) public playerToPeriodToBalance;

  //Global stashes
  Stash[] public stashes;
  mapping(uint256 => uint256) public stashIdToStashIndex;
  uint256 public totalStashed;

  //Tiers vars
  mapping(uint256 => bool) public allowedPeriods;
  uint256[] public periods;

  mapping(uint256 => bool) public allowedRanges;
  uint256[] public ranges;

  mapping(uint256 => mapping(uint256 => Tier)) public periodToRangeToTier;

  //ENUM
  enum Tier {
    NIL,
    F,
    E,
    D,
    C,
    B,
    A,
    S,
    SS
  }

  //Structs
  struct Stash {
    uint256 id;
    address ownerAddress;
    uint256 amount;
    uint256 timestamp;
    uint256 period;
  }
  struct StashInfo {
    uint256[] ids;
    mapping(uint256 => uint256) idToIndex;
  }
  struct TierSet {
    uint256 period;
    uint256 range;
    Tier tier;
  }
  struct PeriodSet {
    uint256 period;
    bool isActive;
  }
  struct RangeSet {
    uint256 range;
    bool isActive;
  }

  // EVENTS
  event Stashed(
    uint256 indexed stashId,
    address indexed playerAddress,
    uint256 amount,
    uint256 indexed period
  );
  event Unstashed(
    uint256 indexed stashId,
    address indexed playerAddress,
    uint256 amount,
    uint256 cycles
  );
  event FeeBurned(uint256 indexed stashId, address indexed playerAddress, uint256 amount);

  /**
   @dev initialize the Mouse Haunt Stashing
   @param _operator for Access Control and Pausable functions
   @param _paymentToken for the token used to pay for the stashes
   */
  function initialize(address _operator, address _paymentToken) public initializer {
    require(_operator != address(0), "INV_ADDRESS");
    require(_paymentToken != address(0), "INV_ADDRESS");

    __AccessControl_init();
    __Pausable_init();

    paymentToken = IERC20(_paymentToken);

    Stash memory dummyStash = Stash(0, address(0), 0, 0, 0);
    _addStash(dummyStash);
    _stashIdCounter.increment();

    _setupRole(DEFAULT_ADMIN_ROLE, _operator);
    _setupRole(OPERATOR_ROLE, _operator);
  }

  /**
   * @dev stash token in the Mouse Haunt Stashing
   * @param _amount of tokens to deposit.
   * @param _period of the stash.
   */
  function stash(uint256 _amount, uint256 _period) external whenNotPaused {
    require(_amount > 0, "INV_AMOUNT");
    require(_period > 0, "INV_DURATION");
    require(allowedPeriods[_period], "INV_DURATION");

    uint256 balance = paymentToken.balanceOf(msg.sender);
    require(balance >= _amount, "NO_BALANCE");

    require(paymentToken.allowance(msg.sender, address(this)) >= _amount, "NOT_ENOUGH_ALLOWANCE");

    uint256 stashId = _stashIdCounter.current();

    Stash memory _stash = Stash(stashId, msg.sender, _amount, block.timestamp, _period);

    _addStash(_stash);

    uint256 playerBalanceBefore = playerBalance[msg.sender];
    playerBalance[msg.sender] = playerBalanceBefore + _amount;
    totalStashed = totalStashed + _amount;

    require(playerBalance[msg.sender] - playerBalanceBefore == _amount, "INV_BALANCE");

    playerToPeriodToBalance[msg.sender][_period] =
      playerToPeriodToBalance[msg.sender][_period] +
      _amount;

    _stashIdCounter.increment();

    emit Stashed(stashId, msg.sender, _amount, _period);

    paymentToken.transferFrom(msg.sender, address(this), _amount);
  }

  /**
   * @dev Unstash tokens from the Mouse Haunt Stashing.
   * @param _stashId of the stash to withdraw.
   */

  function unstash(uint256 _stashId) external whenNotPaused {
    uint256 stashIndex = stashIdToStashIndex[_stashId];
    require(stashIndex < stashes.length && stashIndex != 0, "INV_ID");

    Stash memory _stash = stashes[stashIndex];

    uint256 cycles = cyclesOfStash(_stash.id);

    require(isUnstashable(_stash.id), "STASHED");

    require(msg.sender == _stash.ownerAddress, "INV_OWNER");
    uint256 amount = _stash.amount;

    require(playerBalance[msg.sender] >= amount, "NO_BALANCE");
    playerBalance[msg.sender] = playerBalance[msg.sender] - amount;

    require(playerToPeriodToBalance[msg.sender][_stash.period] >= amount, "NO_BALANCE");
    playerToPeriodToBalance[msg.sender][_stash.period] =
      playerToPeriodToBalance[msg.sender][_stash.period] -
      amount;

    require(totalStashed >= amount, "INV_BALANCE");
    totalStashed = totalStashed - amount;

    _deleteStash(_stashId);

    emit Unstashed(_stashId, msg.sender, amount, cycles);

    uint256 totalStashedBefore = paymentToken.balanceOf(address(this));
    paymentToken.transfer(msg.sender, amount);
    uint256 totalStashedAfter = paymentToken.balanceOf(address(this));
    require(totalStashedBefore - totalStashedAfter == amount, "INV_BALANCE");
  }

  /**
   * @dev Getters
   */

  function isUnstashable(uint256 _stashId) public view returns (bool) {
    uint256 stashIndex = stashIdToStashIndex[_stashId];
    require(stashIndex < stashes.length && stashIndex != 0, "INV_ID");

    Stash memory _stash = stashes[stashIndex];

    uint256 timeDifferenceInSeconds = block.timestamp - _stash.timestamp;
    uint256 timeDifferenceInDays = timeDifferenceInSeconds / SECONDS_IN_DAY;
    uint256 cycles = timeDifferenceInDays / _stash.period;
    uint256 cycleDaysInSeconds = (_stash.period * cycles * SECONDS_IN_DAY);
    uint256 daysPassedInSeconds = timeDifferenceInSeconds - cycleDaysInSeconds;

    uint256 minimumDaysToUnstash = _stash.timestamp + (_stash.period * SECONDS_IN_DAY);

    return daysPassedInSeconds <= SECONDS_IN_DAY && block.timestamp >= minimumDaysToUnstash;
  }

  function cyclesOfStash(uint256 _stashId) public view returns (uint256) {
    uint256 stashIndex = stashIdToStashIndex[_stashId];
    require(stashIndex < stashes.length && stashIndex != 0, "INV_ID");

    Stash memory _stash = stashes[stashIndex];

    uint256 timeDifferenceInSeconds = block.timestamp - _stash.timestamp;
    uint256 timeDifferenceInDays = timeDifferenceInSeconds / SECONDS_IN_DAY;
    uint256 cycles = timeDifferenceInDays / _stash.period;

    return cycles;
  }

  function tierOf(address _playerAddress) public view returns (Tier) {
    uint256 balanceStashedAtPeriod = playerBalance[_playerAddress];

    Tier highestTier = Tier.NIL;
    uint256 previousBalance = 0;

    for (uint256 i = 0; i < periods.length; i++) {
      uint256 period = periods[i];

      balanceStashedAtPeriod = balanceStashedAtPeriod - previousBalance;
      Tier actualTier = getTier(balanceStashedAtPeriod, period);

      if (actualTier > highestTier) {
        highestTier = actualTier;
      }
      previousBalance = playerToPeriodToBalance[_playerAddress][period];
    }

    return highestTier;
  }

  function previewTierOf(
    address _playerAddress,
    uint256 _amount,
    uint256 _period
  ) public view returns (Tier) {
    uint256 balanceStashedAtPeriod = playerBalance[_playerAddress];

    Tier highestTier = Tier.NIL;
    uint256 previousBalance = 0;

    for (uint256 i = 0; i < periods.length; i++) {
      uint256 periodStashed = periods[i];

      if (periodStashed == _period) {
        balanceStashedAtPeriod = balanceStashedAtPeriod + _amount;
      }

      balanceStashedAtPeriod = balanceStashedAtPeriod - previousBalance;
      Tier actualTier = getTier(balanceStashedAtPeriod, periodStashed);

      if (actualTier > highestTier) {
        highestTier = actualTier;
      }

      previousBalance = playerToPeriodToBalance[_playerAddress][periodStashed];

      if (periodStashed == _period) {
        previousBalance = previousBalance + _amount;
      }
    }

    return highestTier;
  }

  function getPeriods() external view returns (uint256[] memory) {
    return periods;
  }

  function getRanges() external view returns (uint256[] memory) {
    return ranges;
  }

  function getTier(uint256 _amount, uint256 _period) public view returns (Tier) {
    Tier tier = Tier.NIL;

    for (uint256 i = ranges.length - 1; i >= 0; i--) {
      if (_amount >= ranges[i]) {
        tier = periodToRangeToTier[_period][ranges[i]];
        break;
      }

      if (i == 0) break;
    }

    return tier;
  }

  function stashesOf(address _playerAddress) external view returns (Stash[] memory) {
    uint256[] memory ids = playerStashes[_playerAddress].ids;
    Stash[] memory _stashes = new Stash[](ids.length);

    for (uint256 i = 0; i < ids.length; i++) {
      uint256 index = stashIdToStashIndex[ids[i]];
      _stashes[i] = stashes[index];
    }
    return _stashes;
  }

  function getStashes() external view returns (Stash[] memory) {
    return stashes;
  }

  function balanceOf(address _playerAddress) external view returns (uint256) {
    return playerBalance[_playerAddress];
  }

  /**
   * @dev Setters
   */
  function pause() public onlyRole(OPERATOR_ROLE) {
    _pause();
  }

  function unpause() public onlyRole(OPERATOR_ROLE) {
    _unpause();
  }

  /**
   * @dev set payment token. Needs to be an operator.
   * @param _paymentToken ERC20 token
   */
  function setPaymentToken(address _paymentToken) public onlyRole(OPERATOR_ROLE) {
    require(_paymentToken != address(0), "INV_ADDR");
    paymentToken = IERC20(_paymentToken);
  }

  /**
   * @dev must set this for the Tier matrix. Needs to be an operator.
   * @param _data array of allowed periods in days
   */
  function setPeriods(PeriodSet[] calldata _data) external onlyRole(OPERATOR_ROLE) {
    delete periods;

    for (uint256 i = 0; i < _data.length; i++) {
      allowedPeriods[_data[i].period] = _data[i].isActive;
      periods.push(_data[i].period);
    }
  }

  /**
   * @dev must set this for the Tier matrix. Needs to be an operator.
   * @param _data array of allowed ranges in wei
   */
  function setRanges(RangeSet[] calldata _data) external onlyRole(OPERATOR_ROLE) {
    delete ranges;

    for (uint256 i = 0; i < _data.length; i++) {
      allowedRanges[_data[i].range] = _data[i].isActive;
      ranges.push(_data[i].range);
    }
  }

  /**
   * @notice needs to set the ranges and periods first.
   * @dev must set this for the Tier matrix. Needs to be an operator.
   * @param _tierSet array of allowed tiers
   */

  function setTiers(TierSet[] calldata _tierSet) external onlyRole(OPERATOR_ROLE) {
    for (uint256 i = 0; i < _tierSet.length; i++) {
      require(allowedRanges[_tierSet[i].range], "INV_RANGE");
      require(allowedPeriods[_tierSet[i].period], "INV_DURATION");

      periodToRangeToTier[_tierSet[i].period][_tierSet[i].range] = _tierSet[i].tier;
    }
  }

  /**
   *@notice in case of address(0) the fee will be burned.
   *@dev must set this for godMode fees. Needs to be an operator.
   *@param _vault the vault address
   */
  function setVault(address _vault) public onlyRole(OPERATOR_ROLE) {
    vault = _vault;
  }

  function _addStash(Stash memory _stash) internal {
    uint256 stashId = _stash.id;

    stashes.push(_stash);
    stashIdToStashIndex[stashId] = stashes.length - 1;

    _addStashInfo(stashId, _stash.ownerAddress);
  }

  function _addStashInfo(uint256 _stashId, address ownerAddress) internal {
    uint256[] storage ids = playerStashes[ownerAddress].ids;

    if (ids.length == 0) {
      ids.push(0);
    }

    ids.push(_stashId);
    playerStashes[ownerAddress].idToIndex[_stashId] = ids.length - 1;
  }

  function _deleteStash(uint256 _stashId) internal {
    uint256 stashIndex = stashIdToStashIndex[_stashId];
    require(stashIndex < stashes.length && stashIndex != 0, "INV_ID");

    Stash memory _stash = stashes[stashIndex];
    Stash memory lastStash = stashes[stashes.length - 1];

    if (lastStash.id != _stashId) {
      stashes[stashIndex] = lastStash;
      stashIdToStashIndex[lastStash.id] = stashIndex;
    }

    stashes.pop();
    delete stashIdToStashIndex[_stashId];
    _deleteStashInfo(_stashId, _stash.ownerAddress);
  }

  function _deleteStashInfo(uint256 _stashId, address _ownerAddress) internal {
    uint256[] storage ids = playerStashes[_ownerAddress].ids;
    uint256 index = playerStashes[_ownerAddress].idToIndex[_stashId];
    require(index < ids.length && index != 0, "Invalid stash index");

    uint256 lastId = ids[ids.length - 1];

    if (lastId != _stashId) {
      ids[index] = lastId;
      playerStashes[_ownerAddress].idToIndex[lastId] = index;
    }

    ids.pop();
    delete playerStashes[_ownerAddress].idToIndex[_stashId];
  }

  /**
   * @notice Function to be used by Governance in exceptional cases. The stashes goes directly to the player.
   * @dev unstash the stashes of a player. Needs to be an operator.
   * @param _stashId the id of the stash to unstash
   * @param _fee the fee to be paid
   */
  function __godMode__unstash(uint256 _stashId, uint256 _fee) external onlyRole(OPERATOR_ROLE) {
    uint256 stashIndex = stashIdToStashIndex[_stashId];
    require(stashIndex < stashes.length && stashIndex != 0, "INV_ID");

    Stash memory _stash = stashes[stashIndex];
    address owner = _stash.ownerAddress;
    uint256 amount = _stash.amount;

    require(playerBalance[owner] >= amount, "NO_BALANCE");
    playerBalance[owner] = playerBalance[owner] - amount;

    require(playerToPeriodToBalance[owner][_stash.period] >= amount, "NO_BALANCE");
    playerToPeriodToBalance[owner][_stash.period] =
      playerToPeriodToBalance[owner][_stash.period] -
      amount;

    require(totalStashed >= amount, "INV_BALANCE");
    totalStashed = totalStashed - amount;

    uint256 cycles = cyclesOfStash(_stash.id);

    _deleteStash(_stashId);

    emit Unstashed(_stashId, owner, amount, cycles);

    if (_fee > 0) {
      require(_fee <= amount, "INV_FEE");
      uint256 liquidAmount = amount - _fee;

      paymentToken.transfer(owner, liquidAmount);

      if (vault != address(0)) {
        paymentToken.transfer(vault, _fee);
      } else {
        paymentToken.burn(_fee);
        emit FeeBurned(_stashId, owner, _fee);
      }
    } else {
      paymentToken.transfer(owner, amount);
    }
  }

  /**
   * @dev recover any ERC20 deposit by mistake.
   * @param _tokenAddress the address of the token
   * @param _amount the amount of the token
   * @param _recipient the address of the recepient
   */
  function recoverERC20(
    address _tokenAddress,
    uint256 _amount,
    address _recipient
  ) external onlyRole(OPERATOR_ROLE) {
    IERC20(_tokenAddress).transfer(_recipient, _amount);
  }
}

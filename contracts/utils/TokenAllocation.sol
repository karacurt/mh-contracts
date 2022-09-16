// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @custom:security-contact security@mousehaunt.com
contract TokenAllocation {
  using SafeERC20 for IERC20;

  uint256 public constant THIRTY_DAYS_IN_SECONDS = 2592000;

  address public immutable mhtOwner;
  IERC20 public immutable mht;
  uint256 public immutable unlockAtIGOPercent;
  uint256 public immutable cliffMonths;
  uint256 public immutable vestingPeriodMonths;

  uint256 public igoTimestamp;

  event Claimed(address indexed wallet, uint256 indexed monthIndex, uint256 indexed value);

  struct UserInfo {
    uint256 totalTokens;
    uint256 remainingTokens;
    int256 lastClaimMonthIndex;
  }

  mapping(address => UserInfo) public addressToUserInfo;

  constructor(
    address _mhtOwner,
    IERC20 _mht,
    uint256 _unlockAtIGOPercent,
    uint256 _cliffMonths,
    uint256 _vestingPeriodMonths
  ) {
    require(_mhtOwner != address(0), "zero mhtOwner");
    require(_mht != IERC20(address(0)), "zero mht");
    require(_unlockAtIGOPercent <= 100, "unlockAtIGOPercent must lte 100");

    mhtOwner = _mhtOwner;
    mht = _mht;
    unlockAtIGOPercent = _unlockAtIGOPercent;
    cliffMonths = _cliffMonths;
    vestingPeriodMonths = _vestingPeriodMonths;
  }

  function _setIgoTimestamp(uint256 _igoTimestamp) internal {
    igoTimestamp = _igoTimestamp;
  }

  function _getUserTotalTokens(address wallet) internal view returns (uint256) {
    return addressToUserInfo[wallet].totalTokens;
  }

  function _updateUserTokenAllocation(address wallet, uint256 totalTokens) internal beforeIGO {
    UserInfo storage userInfo = addressToUserInfo[wallet];
    userInfo.totalTokens += totalTokens;
    userInfo.remainingTokens += totalTokens;
    userInfo.lastClaimMonthIndex = -1;
  }

  modifier beforeIGO() {
    require(
      // solhint-disable-next-line not-rely-on-time
      igoTimestamp == 0 || block.timestamp < igoTimestamp,
      "Unavailable after IGO"
    );
    _;
  }

  modifier afterIGO() {
    require(
      // solhint-disable-next-line not-rely-on-time
      igoTimestamp > 0 && block.timestamp >= igoTimestamp,
      "Unavailable before IGO"
    );
    _;
  }

  function _unlockedAtIgoAmount(UserInfo memory userInfo) private view returns (uint256) {
    return (userInfo.totalTokens * unlockAtIGOPercent) / 100;
  }

  function _releaseAmount(UserInfo memory userInfo, uint256 monthIndex)
    private
    view
    returns (uint256)
  {
    if (cliffMonths > 0 && monthIndex <= cliffMonths) {
      return 0;
    } else if (monthIndex > (cliffMonths + vestingPeriodMonths)) {
      return 0;
    } else if (monthIndex == 0) {
      return _unlockedAtIgoAmount(userInfo);
    } else {
      // e.g. 100 distributed in 1+3 months with 20 at IDO should be 20, 26, 26, 28

      // starts at 1
      uint256 _vestingIndex = monthIndex - cliffMonths;

      // e.g. 20
      uint256 _unlockedAtIgo = _unlockedAtIgoAmount(userInfo);

      // e.g. 26
      uint256 _amount = (userInfo.totalTokens - _unlockedAtIgo) / vestingPeriodMonths;

      // e.g. 20, 46, 72
      uint256 _distributedTokens = _unlockedAtIgo + _amount * (_vestingIndex - 1);

      // e.g. 80, 54, 28
      uint256 _remainingTokens = userInfo.totalTokens - _distributedTokens;

      // e.g. false, false, true
      if (_remainingTokens < 2 * _amount) {
        _amount = _remainingTokens;
      }

      // e.g. 26, 26, 28
      return _amount;
    }
  }

  /**
   * @dev Since this function has the afterIGO modifier, timestamp >= igoTimestamp.
   *      Because of that, the while loop ALWAYS enters, so the uint256
   *      cast does not underflow and the return value is at least 0
   */
  function _getMonthIndexFromTimestamp(uint256 timestamp) private view afterIGO returns (uint256) {
    int256 index = -1;

    uint256 t = igoTimestamp;
    while (t <= timestamp) {
      index++;
      t += THIRTY_DAYS_IN_SECONDS;
    }

    return uint256(index);
  }

  function claim() public afterIGO {
    UserInfo storage userInfo = addressToUserInfo[msg.sender];
    require(userInfo.remainingTokens > 0, "Not enough tokens");

    // solhint-disable-next-line not-rely-on-time
    uint256 nowTimestamp = block.timestamp;

    uint256 startMonthIndex = uint256(userInfo.lastClaimMonthIndex + 1);
    uint256 endMonthIndex = _getMonthIndexFromTimestamp(nowTimestamp);

    for (uint256 i = startMonthIndex; i <= endMonthIndex; i++) {
      uint256 amount = _releaseAmount(userInfo, i);
      if (amount > 0 && userInfo.remainingTokens > 0) {
        userInfo.remainingTokens -= amount;
        userInfo.lastClaimMonthIndex = int256(i);
        mht.safeTransferFrom(mhtOwner, msg.sender, amount);
        emit Claimed(msg.sender, i, amount);
      }
    }
  }
}

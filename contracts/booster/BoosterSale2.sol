// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Booster Sale
 * @dev This contract sells tokens to a specific user base, limiting
 *      how many tokens each user may buy
 * @dev We'll reuse the sale contract employed in the first sale,
 *      making minimal changes only
 */
/// @custom:security-contact security@mousehaunt.com
contract BoosterSale2 is Pausable, AccessControl {
  using SafeERC20 for IERC20;

  bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

  address public immutable boosterOwner;
  IERC20 public immutable busd;
  IERC20 public immutable epicBooster;
  IERC20 public immutable legendaryBooster;

  /**
   * Each type of booster has a price
   */
  mapping(IERC20 => uint256) public prices;

  /**
   * @notice User => Booster => Buy Limit
   */
  mapping(address => mapping(IERC20 => uint256)) public whitelist;

  constructor(
    address _boosterOwner,
    IERC20 _busd,
    IERC20 _legendaryBooster,
    IERC20 _epicBooster,
    uint256 legendaryBoosterPrice,
    uint256 epicBoosterPrice
  ) {
    _setupRole(DEFAULT_ADMIN_ROLE, _boosterOwner);
    _setupRole(OPERATOR_ROLE, _boosterOwner);

    boosterOwner = _boosterOwner;
    busd = _busd;
    legendaryBooster = _legendaryBooster;
    epicBooster = _epicBooster;

    prices[_legendaryBooster] = legendaryBoosterPrice;
    prices[_epicBooster] = epicBoosterPrice;
  }

  function pause() public onlyRole(OPERATOR_ROLE) {
    _pause();
  }

  function unpause() public onlyRole(OPERATOR_ROLE) {
    _unpause();
  }

  function buy(IERC20 booster, uint256 _numberOfBoostersInWei) public whenNotPaused {
    uint256 _numberOfBoosters = _numberOfBoostersInWei / 1e18;
    require(whitelist[msg.sender][booster] >= _numberOfBoosters, "BoosterSale: above cap");
    require(
      _numberOfBoostersInWei >= 1e18 && _numberOfBoostersInWei % 1e18 == 0,
      "BoosterSale: invalid amount"
    );

    whitelist[msg.sender][booster] -= _numberOfBoosters;

    busd.safeTransferFrom(msg.sender, boosterOwner, _numberOfBoosters * prices[booster]);

    booster.safeTransferFrom(boosterOwner, msg.sender, _numberOfBoostersInWei);
  }

  function setWhitelist(
    address[] calldata _buyers,
    uint256[] calldata legendaryAllowances,
    uint256[] calldata epicAllowances
  ) public onlyRole(OPERATOR_ROLE) whenNotPaused {
    for (uint256 i = 0; i < _buyers.length; i++) {
      whitelist[_buyers[i]][legendaryBooster] = legendaryAllowances[i];
      whitelist[_buyers[i]][epicBooster] = epicAllowances[i];
    }
  }
}

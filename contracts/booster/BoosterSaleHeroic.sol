// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../utils/Whitelist.sol";

/**
 * @title Booster Sale Heroic
 * @dev This contract sells tokens to a specific user base, limiting
 *      how many tokens each user may buy
 */
/// @custom:security-contact security@mousehaunt.com
contract BoosterSaleHeroic is Pausable, AccessControl {
  using SafeERC20 for ERC20;

  bytes32 private constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

  address public immutable boosterOwner;
  ERC20 public immutable mht;
  ERC20 public immutable booster;
  uint256 public immutable price;

  /**
   * @notice User => Buy Limit
   */
  mapping(address => uint256) public whitelist;

  constructor(
    address _boosterOwner,
    ERC20 _mht,
    ERC20 _booster,
    uint256 _price
  ) {
    _setupRole(DEFAULT_ADMIN_ROLE, _boosterOwner);
    _setupRole(OPERATOR_ROLE, _boosterOwner);
    _setupRole(OPERATOR_ROLE, msg.sender);

    boosterOwner = _boosterOwner;
    mht = _mht;
    booster = _booster;
    price = _price;
  }

  function pause() public onlyRole(OPERATOR_ROLE) {
    _pause();
  }

  function unpause() public onlyRole(OPERATOR_ROLE) {
    _unpause();
  }

  function buy(uint256 _numberOfBoosters) public whenNotPaused {
    require(whitelist[msg.sender] >= _numberOfBoosters, "BoosterSale: above cap");
    require(_numberOfBoosters != 0, "BoosterSale: invalid amount");

    whitelist[msg.sender] -= _numberOfBoosters;

    mht.safeTransferFrom(msg.sender, boosterOwner, _numberOfBoosters * price);

    booster.safeTransferFrom(boosterOwner, msg.sender, _numberOfBoosters);
  }

  function setWhitelist(address[] calldata _buyers, uint256 allowance)
    public
    onlyRole(OPERATOR_ROLE)
  {
    for (uint256 i = 0; i < _buyers.length; i++) {
      whitelist[_buyers[i]] = allowance;
    }
  }
}

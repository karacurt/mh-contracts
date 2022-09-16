// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Booster Sale
 * @dev This contract sells tokens to a specific user base, limiting
 *      how many tokens each user may buy
 * @dev We'll reuse the sale contract employed in the first sale,
 *      making minimal changes only
 */
/// @custom:security-contact security@mousehaunt.com
contract BoosterSale3 is Pausable, AccessControl {
  using SafeERC20 for ERC20;

  bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

  address public immutable boosterOwner;
  ERC20 public immutable busd;
  ERC20 public immutable epicBooster;
  ERC20 public immutable rareBooster;

  /**
   * Each type of booster has a price
   */
  mapping(ERC20 => uint256) public prices;

  /**
   * @notice User => Booster => Buy Limit
   */
  mapping(address => mapping(ERC20 => uint256)) public whitelist;

  constructor(
    address _boosterOwner,
    ERC20 _busd,
    ERC20 _epicBooster,
    ERC20 _rareBooster,
    uint256 epicBoosterPrice,
    uint256 rareBoosterPrice
  ) {
    _setupRole(DEFAULT_ADMIN_ROLE, _boosterOwner);
    _setupRole(OPERATOR_ROLE, _boosterOwner);

    boosterOwner = _boosterOwner;
    busd = _busd;
    epicBooster = _epicBooster;
    rareBooster = _rareBooster;

    prices[_epicBooster] = epicBoosterPrice;
    prices[_rareBooster] = rareBoosterPrice;
  }

  function pause() public onlyRole(OPERATOR_ROLE) {
    _pause();
  }

  function unpause() public onlyRole(OPERATOR_ROLE) {
    _unpause();
  }

  function buy(ERC20 booster, uint256 _numberOfBoosters) public whenNotPaused {
    require(whitelist[msg.sender][booster] >= _numberOfBoosters, "BoosterSale: above cap");
    require(_numberOfBoosters != 0, "BoosterSale: invalid amount");

    whitelist[msg.sender][booster] -= _numberOfBoosters;

    busd.safeTransferFrom(msg.sender, boosterOwner, _numberOfBoosters * prices[booster]);

    booster.safeTransferFrom(boosterOwner, msg.sender, _numberOfBoosters * 10**booster.decimals());
  }

  function setWhitelist(
    address[] calldata _buyers,
    uint256[] calldata epicAllowances,
    uint256[] calldata rareAllowances
  ) public onlyRole(OPERATOR_ROLE) {
    for (uint256 i = 0; i < _buyers.length; i++) {
      whitelist[_buyers[i]][epicBooster] = epicAllowances[i];
      whitelist[_buyers[i]][rareBooster] = rareAllowances[i];
    }
  }
}

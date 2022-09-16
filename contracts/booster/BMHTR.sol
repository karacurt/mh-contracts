// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @custom:security-contact security@mousehaunt.com
contract BMHTR is ERC20, ERC20Burnable, Pausable, AccessControl {
  bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

  constructor(address owner) ERC20("Mouse Haunt Booster RARE", "BMHTR") {
    _setupRole(DEFAULT_ADMIN_ROLE, owner);
    _setupRole(PAUSER_ROLE, owner);
    _mint(owner, 187500 * 10**decimals());
  }

  function decimals() public view virtual override returns (uint8) {
    return 0;
  }

  function pause() public onlyRole(PAUSER_ROLE) {
    _pause();
  }

  function unpause() public onlyRole(PAUSER_ROLE) {
    _unpause();
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override whenNotPaused {
    super._beforeTokenTransfer(from, to, amount);
  }
}

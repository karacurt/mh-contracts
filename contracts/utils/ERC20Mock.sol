// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @custom:security-contact security@mousehaunt.com
contract ERC20Mock is ERC20 {
  constructor() ERC20("Any ERC20 Token", "MOCK") {
    _mint(msg.sender, 200000 * 10**decimals());
  }

  function decimals() public view virtual override returns (uint8) {
    return 18;
  }
}

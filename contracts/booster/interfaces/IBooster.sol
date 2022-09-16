// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @custom:security-contact security@mousehaunt.com
interface IBooster is IERC20 {
  function burn(uint256 amount) external;

  function burnFrom(address account, uint256 amount) external;

  function decimals() external view returns (uint8);

  function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

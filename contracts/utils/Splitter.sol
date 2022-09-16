// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/**
 * Send money to N recipients
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Splitter is AccessControl {
  using SafeERC20 for IERC20;

  bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

  constructor() {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(OPERATOR_ROLE, msg.sender);
  }

  /**
   * @notice Transfers pre-approved tokens to a list of recipients
   * @dev Can only be called by the operator
   * @param tokenAddress Address of the token that will be transferred
   * @param to List of recipient addresses
   * @param amount List of amounts to be transferred to each receipient
   */
  function send(
    address tokenAddress,
    address[] memory to,
    uint256[] memory amount
  ) public onlyRole(OPERATOR_ROLE) {
    require(to.length == amount.length, "List size mismatch");

    IERC20 trustedAsset = IERC20(tokenAddress);

    for (uint256 i = 0; i < to.length; i++) {
      require(to[i] != address(0), "Transfer to zero address");
      trustedAsset.safeTransferFrom(msg.sender, to[i], amount[i]);
    }
  }
}

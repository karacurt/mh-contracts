// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

/**
 * Send sequential NFTs to another address
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../nft/MouseHero.sol";

contract NftBatchTransfer is AccessControl {
  bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

  constructor() {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(OPERATOR_ROLE, msg.sender);
  }

  /**
   * @notice Transfers ID-sequential pre-approved NFTs to a single recipient
   * @dev Can only be called by the operator
   * @param tokenAddress Address of the NFT that will be transferred
   * @param to The recipient
   * @param amount number of sequential NFTs to transfer
   * @param firstId The NFT_ID of the first NFT to be transferred
   */
  function sendSequentialIds(
    address tokenAddress,
    address to,
    uint256 amount,
    uint256 firstId
  ) public onlyRole(OPERATOR_ROLE) {
    require(to != address(0), "Transfer to zero address");

    MouseHero trustedAsset = MouseHero(tokenAddress);

    for (uint256 i = firstId; i < amount; i++) {
      trustedAsset.transferFrom(msg.sender, to, i);
    }
  }

  /**
   * @notice Transfers ID-sequential pre-approved NFTs to a single recipient
   * @dev Can only be called by the operator
   * @param tokenAddress Address of the NFT that will be transferred
   * @param to The recipient
   * @param amount number of sequential NFTs to transfer
   */
  function sendScatteredIds(
    address tokenAddress,
    address to,
    uint256 amount
  ) public onlyRole(OPERATOR_ROLE) {
    require(to != address(0), "Transfer to zero address");

    MouseHero trustedAsset = MouseHero(tokenAddress);

    uint256[] memory ids = trustedAsset.tokensOfOwner(msg.sender);

    for (uint256 i = 0; i < amount; i++) {
      trustedAsset.transferFrom(msg.sender, to, ids[i]);
    }
  }
}

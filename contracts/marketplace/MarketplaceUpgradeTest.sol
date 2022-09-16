// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "./Marketplace.sol";

//FOR DEBUG ONLY WILL BE REMOVED FOR MERGE
contract MarketplaceUpgradeTest is Marketplace {
  function newPublicationFeeInWei(uint256 newFee) external {
    publicationFeeInWei = newFee;
  }
}

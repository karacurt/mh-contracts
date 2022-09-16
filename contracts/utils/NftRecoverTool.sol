// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";

// TODO only one transaction has to go through: infinite allowance from the hacked wallet to the new user wallet;

contract NftRecoverTool is AccessControl {
  bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

  mapping(address => bool) public acceptedNfts;

  constructor() {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    _setupRole(OPERATOR_ROLE, msg.sender);
  }

  function setAcceptedNft(address tokenAddress, bool isAccepted) public onlyRole(OPERATOR_ROLE) {
    acceptedNfts[tokenAddress] = isAccepted;
  }

  function recoverNfts(address tokenAddress, uint256[] calldata idList) public payable {
    // send BNB to the owner of the token
    require(msg.value > 0);
  }
}

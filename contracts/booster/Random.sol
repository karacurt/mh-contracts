// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

contract Random {
  uint256 public constant PERCENTAGE_THOUSAND = 100000;

  uint256 private _nonce = 0;

  function getRandom() internal returns (uint256 _value) {
    _nonce += 1;
    _value =
      uint256(keccak256(abi.encodePacked(_nonce, msg.sender, blockhash(block.number - 1)))) %
      PERCENTAGE_THOUSAND;
  }
}

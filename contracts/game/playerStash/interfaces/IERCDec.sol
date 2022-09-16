// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC {
  function approve(address to, uint256 tokenId) external;

  function transferFrom(
    address from,
    address to,
    uint256 value
  ) external;

  function transfer(address recipient, uint256 amount) external returns (bool);

  function balanceOf(address owner) external view returns (uint256 balance);

  function allowance(address owner, address spender) external view returns (uint256);

  function ownerOf(uint256 tokenId) external view returns (address owner);

  function getApproved(uint256 tokenId) external view returns (address operator);

  function isApprovedForAll(address owner, address operator) external view returns (bool);
}

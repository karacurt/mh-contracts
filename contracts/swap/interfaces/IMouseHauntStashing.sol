// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface IMouseHauntStashing {
  enum Tier {
    NIL,
    F,
    E,
    D,
    C,
    B,
    A,
    S,
    SS
  }

  function tierOf(address _playerAddress) external view returns (Tier);
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @custom:security-contact security@mousehaunt.com
contract BMHTH is ERC20, ERC20Burnable, Pausable, AccessControl {
  bytes32 private constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
  bytes32 private constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

  address public mouseHeroAddress;

  modifier onlyMouseHero() {
    require(msg.sender == mouseHeroAddress, "Only Mouse Hero");
    _;
  }

  constructor(address operator, address _mouseHeroAddress)
    ERC20("Mouse Haunt Booster HEROIC", "BMHTH")
  {
    _setupRole(DEFAULT_ADMIN_ROLE, operator);
    _setupRole(PAUSER_ROLE, operator);
    _setupRole(OPERATOR_ROLE, operator);

    _mint(operator, 200000);

    mouseHeroAddress = _mouseHeroAddress;
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

  /**
   * @notice Allows the operator to mint new boosters
   * @param amount Number of boosters to mint
   * @param to Recipient
   */
  function mint(uint256 amount, address to) public onlyRole(OPERATOR_ROLE) {
    _mint(to, amount);
  }

  /**
   * @notice Allows any user to burn booster boxes they have
   * @dev Can be used by the operator to burn boosters that haven't been bought
   * @param amount Number of boosters to burn
   */
  function burn(uint256 amount) public override {
    require(balanceOf(_msgSender()) >= amount, "Insufficient funds");

    _burn(_msgSender(), amount);
  }

  /**
   * @notice Allows the mouse hero NFT to burn a booster to mint an NFT
   * @param account Address of the user who is cracking this booster open
   * @param amount Number of boosters to burn
   */
  function burnFrom(address account, uint256 amount) public override {
    if (_msgSender() == mouseHeroAddress) {
      // This is the NFT itself telling us that it wants to mint
      require(balanceOf(account) >= amount, "Insufficient funds");
    } else {
      // this is the normal brunFrom flow
      uint256 currentAllowance = allowance(account, _msgSender());
      // solhint-disable-next-line
      require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
      unchecked {
        _approve(account, _msgSender(), currentAllowance - amount);
      }
    }

    _burn(account, amount);
  }
}

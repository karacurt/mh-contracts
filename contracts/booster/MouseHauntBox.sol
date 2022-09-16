// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

/// @custom:security-contact security@mousehaunt.com
contract MouseHauntBox is ERC20, ERC20Burnable, Pausable, AccessControlEnumerable {
  bytes32 private constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
  bytes32 private constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
  bytes32 private constant BURNER_ROLE = keccak256("BURNER_ROLE");
  bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");

  address public nftAddress;

  constructor(
    string memory name,
    string memory symbol,
    address operator,
    address _nftAddress,
    uint256 maxSupply
  ) ERC20(name, symbol) {
    _setupRole(DEFAULT_ADMIN_ROLE, operator);
    _setupRole(PAUSER_ROLE, operator);
    _setupRole(OPERATOR_ROLE, operator);
    _setupRole(MINTER_ROLE, operator);
    _setupRole(BURNER_ROLE, _nftAddress);

    _mint(operator, maxSupply);

    nftAddress = _nftAddress;
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
  function mint(uint256 amount, address to) public onlyRole(MINTER_ROLE) {
    _mint(to, amount);
  }

  /**
   * @notice Mints `amount` NFTs to `to`
   * @param to recipient addresses
   * @param amount The number of NFTs to be minted
   */
  function bulkMint(address[] memory to, uint256[] memory amount) public onlyRole(MINTER_ROLE) {
    require(to.length == amount.length, "To and amount arrays must be the same length");
    for (uint256 i = 0; i < amount.length; i++) {
      _mint(to[i], amount[i]);
    }
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
  function burnFrom(address account, uint256 amount) public override onlyRole(BURNER_ROLE) {
    // This is the NFT itself telling us that it wants to mint
    require(balanceOf(account) >= amount, "Insufficient funds");

    _burn(account, amount);
  }

  /**
   * @notice Changes the address of the NFT contract
   * @param _nftAddress The address of the Nft contract
   */
  function setNft(address _nftAddress) public onlyRole(OPERATOR_ROLE) {
    nftAddress = _nftAddress;
  }
}

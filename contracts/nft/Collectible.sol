// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title Collectible
 * @dev This is a normal ERC721 token that emits a special event when an NFT is minted.
 */
contract Collectible is
  Context,
  AccessControlEnumerable,
  ERC721Enumerable,
  ERC721Burnable,
  ERC721Pausable
{
  using Counters for Counters.Counter;

  bytes32 private constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
  bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 private constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

  Counters.Counter private _tokenIdTracker;

  string public baseTokenURI;

  /// @notice Event emitted when an NFT is minted
  event CollectibleMinted(string data, address owner, uint256 nftId);

  constructor(
    string memory name,
    string memory symbol,
    string memory _baseTokenURI
  ) ERC721(name, symbol) {
    baseTokenURI = _baseTokenURI;

    address msgSender = _msgSender();
    _setupRole(DEFAULT_ADMIN_ROLE, msgSender);
    _setupRole(MINTER_ROLE, msgSender);
    _setupRole(OPERATOR_ROLE, msgSender);
    _setupRole(PAUSER_ROLE, msgSender);
  }

  /**
   * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
   * token will be the concatenation of the `baseURI` and the `tokenId`.
   */
  function _baseURI() internal view override returns (string memory) {
    return baseTokenURI;
  }

  /**
   * @notice Set the BaseURI to `uri`
   * @param uri The new BaseURI
   */
  function setBaseURI(string calldata uri) public onlyRole(OPERATOR_ROLE) {
    baseTokenURI = uri;
  }

  /**
   * @notice Allow a pauser to pause the contract
   */
  function pause() external onlyRole(PAUSER_ROLE) {
    _pause();
  }

  /**
   * @notice Allow a pauser to unpause the contract
   */
  function unpause() external onlyRole(PAUSER_ROLE) {
    _unpause();
  }

  /**
   * @dev Mandatory override
   */
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal override(ERC721, ERC721Enumerable, ERC721Pausable) {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  /**
   * @dev Mandatory override
   */
  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(AccessControlEnumerable, ERC721, ERC721Enumerable)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  /**
   * @notice Mints a very specific NFT defined by the data param
   * @param to The recipient's address
   * @param data Arbitrary data that defines the collectible
   */
  function mint(address to, string calldata data) public onlyRole(MINTER_ROLE) {
    uint256 id = _tokenIdTracker.current();

    _safeMint(to, id);
    _tokenIdTracker.increment();

    emit CollectibleMinted(data, to, id);
  }

  /**
   * @notice Lists all the NFTs owned by `_owner`
   * @param _owner The address to consult
   * @return A list of NFT IDs belonging to `_owner`
   */
  function tokensOfOwner(address _owner) external view returns (uint256[] memory) {
    uint256 tokenCount = balanceOf(_owner);
    uint256[] memory tokensId = new uint256[](tokenCount);
    for (uint256 i = 0; i < tokenCount; i++) {
      tokensId[i] = tokenOfOwnerByIndex(_owner, i);
    }

    return tokensId;
  }
}

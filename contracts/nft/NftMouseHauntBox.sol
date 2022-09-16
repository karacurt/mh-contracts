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
 * @title Nft Box
 * @dev This is a normal ERC721 token that integrates with our Nft contract for minting NFTs.
 *      It also integrates with Galler's Launchpad (https://github.com/galler-dev/launchpad) for special sales
 */
contract NftMouseHauntBox is
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
  bytes32 private constant BURNER_ROLE = keccak256("BURNER_ROLE");

  Counters.Counter private _tokenIdTracker;

  string public baseTokenURI;

  address public nftAddress;

  /**
   * @notice Galler's max launch supply
   */
  uint256 public LAUNCH_MAX_SUPPLY;

  /**
   * @notice Galler's current launch supply
   */
  uint256 public LAUNCH_SUPPLY;

  /**
   * @notice Galler's lauchpad address
   */
  address public LAUNCHPAD;

  /**
   * @notice Modifier to limit interactions to Galler's lauchpad
   */
  modifier onlyLaunchpad() {
    require(LAUNCHPAD != address(0), "launchpad address must set");
    require(_msgSender() == LAUNCHPAD, "must call by launchpad");
    _;
  }

  /**
   * @notice Returns Galler's max launch supply
   */
  function getMaxLaunchpadSupply() public view returns (uint256) {
    return LAUNCH_MAX_SUPPLY;
  }

  /**
   * @notice Returns Galler's current launch supply
   */
  function getLaunchpadSupply() public view returns (uint256) {
    return LAUNCH_SUPPLY;
  }

  constructor(
    string memory name,
    string memory symbol,
    string memory _baseTokenURI,
    address _nftAddress,
    address launchpad,
    uint256 maxSupply
  ) ERC721(name, symbol) {
    baseTokenURI = _baseTokenURI;

    address msgSender = _msgSender();
    _setupRole(DEFAULT_ADMIN_ROLE, msgSender);
    _setupRole(MINTER_ROLE, msgSender);
    _setupRole(OPERATOR_ROLE, msgSender);
    _setupRole(PAUSER_ROLE, msgSender);
    _setupRole(BURNER_ROLE, msgSender);

    nftAddress = _nftAddress;
    LAUNCHPAD = launchpad;
    LAUNCH_MAX_SUPPLY = maxSupply;
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
   * @notice Set the Launchpad address to `launchpadAddress`
   * @param launchpadAddress The new BaseURI
   */
  function setLaunchpadAddress(address launchpadAddress) public onlyRole(OPERATOR_ROLE) {
    LAUNCHPAD = launchpadAddress;
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
   * @notice Mints an NFT to `to`
   * @param to The recipient's address
   */
  function mint(address to) public onlyRole(MINTER_ROLE) {
    _doMint(to);
  }

  function _doMint(address to) private {
    uint256 id = _tokenIdTracker.current();
    _tokenIdTracker.increment();
    _safeMint(to, id);
  }

  /**
   * @notice Mints `amount` NFTs to `to`
   * @param to The recipient's address
   * @param amount The number of NFTs to be minted
   */
  function bulkMint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
    for (uint256 i = 0; i < amount; i++) {
      _doMint(to);
    }
  }

  /**
   * @notice This is Galler's function for their sale. It mints `size` NFTs to `to`
   * @param to The recipient's address
   * @param size The number of NFTs to be minted
   */
  function mintTo(address to, uint256 size) external onlyLaunchpad {
    require(to != address(0), "can't mint to empty address");
    require(size > 0, "size must greater than zero");
    require(LAUNCH_SUPPLY + size <= LAUNCH_MAX_SUPPLY, "max supply reached");

    for (uint256 i = 1; i <= size; i++) {
      LAUNCH_SUPPLY++;
      _doMint(to);
    }
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

  /**
   * @notice Burns an NFT if called by its owner or an approved spender
   * @param tokenId The NFT id
   */
  function burn(uint256 tokenId) public override {
    require(
      _isApprovedOrOwner(_msgSender(), tokenId),
      "ERC721Burnable: caller is not owner nor approved"
    );
    _burn(tokenId);
  }

  /**
   * @notice Burns an NFT if, and only if, called by Nft. This is 'minting' a nft.
   * @dev This function only runs in the minting flow. See the Nft contract.
   * @param account The owner of the NFT
   * @param tokenId The NFT id
   */
  function burnFrom(address account, uint256 tokenId) public onlyRole(BURNER_ROLE) {
    require(_exists(tokenId), "ERC721: operator query for nonexistent token");
    require(ERC721.ownerOf(tokenId) == account, "Account does not own the token");

    _burn(tokenId);
  }

  /**
   * @notice Changes the address of the NFT contract
   * @param _nftAddress The address of the Nft contract
   */
  function setNft(address _nftAddress) public onlyRole(OPERATOR_ROLE) {
    nftAddress = _nftAddress;
  }

  /**
   * @notice Returns 0
   * @dev It's here to integrate nicely with the minting process
   */
  function decimals() public pure returns (uint8) {
    return 0;
  }
}

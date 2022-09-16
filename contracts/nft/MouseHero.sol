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
import "../booster/interfaces/IBooster.sol";

/**
 * @title Mouse Hero
 * @dev This is an ERC721 that knows how to crack boosters open
 * in order to mint new tokens. We call that "unboxing". Boosters
 * are trusted ERC20 contracts.
 */
contract MouseHero is
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

  /// @notice Users may unbox one of these booster boxes
  mapping(address => bool) public acceptedBoosterBoxes;

  /// @notice Event emitted when a booster box is unboxed and an NFT is minted
  event BoosterUnboxed(address booster, address boosterOwner, uint256 nftId);

  /// @notice Event emitted when an NFT of a specific rarity is minted
  event HeroMinted(address booster, address heroOwner, uint256 nftId);

  /// @notice Event emitted when a special NFT is minted
  event SpecialHeroMinted(string data, address heroOwner, uint256 nftId);

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
   * @notice Define the accepted booster boxes
   * @param boosterAddresses List of booster addresses
   */
  function setAcceptedBoosters(address[] calldata boosterAddresses, bool[] calldata isAccepted)
    external
    onlyRole(OPERATOR_ROLE)
  {
    require(boosterAddresses.length == isAccepted.length, "INV_LEN");

    for (uint256 i = 0; i < boosterAddresses.length; i++) {
      acceptedBoosterBoxes[boosterAddresses[i]] = isAccepted[i];
    }
  }

  /**
   * @notice Burns `amount` boosters `boosterAddress` in exchange for NFTs
   * @param boosterAddress The address of the booster
   * @param amount The number of boosters to be burned
   */
  function unboxBooster(address boosterAddress, uint256 amount) public {
    // Make sure we accept the booster
    require(acceptedBoosterBoxes[boosterAddress], "INV_BOOSTER");

    IBooster trustedBooster = IBooster(boosterAddress);
    if (!trustedBooster.supportsInterface(0x80ac58cd)) {
      require(amount == 1 || amount == 1 ether, "INV_AMOUNT"); // TODO: permitir UNOBX do booster 0
    }

    // Make sure the amount is correct for that specific booster
    // When using our UI, this require should never fail
    uint8 boosterDecimals = trustedBooster.decimals();
    if (boosterDecimals > 0) {
      require(amount % (10**boosterDecimals) == 0, "DECIMAL_AMOUNT");
    }

    // BurnFrom the booster, fail hard if it can't
    // If we're burning from an NFT, the `amount` field is the NFT id
    trustedBooster.burnFrom(_msgSender(), amount);

    // We'll always mint ONE NFT at a time.
    _createNFT(_msgSender(), boosterAddress);
  }

  /**
   * @dev Mint a booster and emit a custom event
   * @param to The recipient's address
   * @param crackedBooster The address of the booster that was burned
   */
  function _createNFT(address to, address crackedBooster) private {
    uint256 id = _tokenIdTracker.current();
    _doMint(to);

    emit BoosterUnboxed(crackedBooster, to, id);
  }

  /**
   * @notice Mints an NFT of a specific rarity
   * @param to The recipient's address
   * @param rarity Address of a known booster
   */
  function mintMouseHeroByRarity(address to, address rarity) public onlyRole(MINTER_ROLE) {
    uint256 id = _tokenIdTracker.current();
    _doMint(to);

    emit HeroMinted(rarity, to, id);
  }

  /**
   * @notice Mints a very specific NFT defined by the data param
   * @param to The recipient's address
   * @param data Arbitrary data that defines the hero
   */
  function mintSpecialMouseHero(address to, string calldata data) public onlyRole(MINTER_ROLE) {
    uint256 id = _tokenIdTracker.current();
    _doMint(to);

    emit SpecialHeroMinted(data, to, id);
  }

  /**
   * @dev Executes _safeMint and increments the NFT counter
   * @param to The recipient's address
   */
  function _doMint(address to) private {
    _safeMint(to, _tokenIdTracker.current());
    _tokenIdTracker.increment();
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

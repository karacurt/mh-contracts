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
 * @title Soulbound
 * @dev
 *
 */
contract SoulBound is
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
  event BoosterUnboxed(address booster, address owner, uint256 id);

  /// @notice Event emitted when an NFT is minted
  event SoulBoundMinted(uint256 transferLimit, address owner, uint256 id);

  /// @notice Event emitted when a special NFT is minted
  event SpecialSoulBoundMinted(string data, address owner, uint256 id, uint256 transferLimit);

  /// @notice Event emitted when an NFT is soulbounded
  event SoulBounded(address owner, uint256 id);

  mapping(uint256 => bool) soulbound;
  mapping(uint256 => uint256) transferLimit;
  mapping(uint256 => uint256) transferredTimes;

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
   * @notice Mints an NFT of
   * @param to The recipient's address
   * @param _transferLimit The limit of times the NFT can be transferred
   */
  function mintSoulBound(address to, uint256 _transferLimit) public onlyRole(MINTER_ROLE) {
    uint256 id = _tokenIdTracker.current();
    if (_transferLimit == 0) {
      _bound(id, to);
    } else {
      transferLimit[id] = _transferLimit;
    }
    _doMint(to);

    emit SoulBoundMinted(_transferLimit, to, id);
  }

  /**
   * @notice Mints a very specific NFT defined by the data param
   * @param to The recipient's address
   * @param data Arbitrary data that defines the hero
   */
  function mintSpecialSoulBound(
    address to,
    string calldata data,
    uint256 _transferLimit
  ) public onlyRole(MINTER_ROLE) {
    uint256 id = _tokenIdTracker.current();
    if (_transferLimit == 0) {
      _bound(id, to);
    } else {
      transferLimit[id] = _transferLimit;
    }
    _doMint(to);

    emit SpecialSoulBoundMinted(data, to, id, _transferLimit);
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

  /**
 @dev soulbound logic 
  */
  function _transfer(
    address from,
    address to,
    uint256 tokenId
  ) internal override(ERC721) whenTransferable(tokenId) {
    transferredTimes[tokenId]++;

    if (transferredTimes[tokenId] >= transferLimit[tokenId]) {
      _bound(tokenId, to);
    }

    super._transfer(from, to, tokenId);
  }

  modifier whenTransferable(uint256 _tokenId) {
    require(!soulbound[_tokenId], "SOUL_BOUNDED");
    _;
  }

  function _bound(uint256 id, address to) internal {
    soulbound[id] = true;
    emit SoulBounded(to, id);
  }
}

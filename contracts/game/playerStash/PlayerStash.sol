// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../sigGuardian/SigGuardian.sol";
import "./interfaces/IERCDec.sol";

/**
 *@title Mouse Haunt Player Stash Contract
 *@dev This contract is used to store the player's stash of Mouse Haunt Game items.
 */
contract PlayerStash is Initializable, PausableUpgradeable, AccessControlUpgradeable, SigGuardian {
  bytes32 internal constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

  mapping(address => TokenType) public trustedTokens;

  //Individual stashes
  mapping(address => mapping(address => uint256)) public playerToTokenToBalance;
  mapping(address => mapping(uint256 => uint256)) public playerToIndexToBalance;
  mapping(address => mapping(uint256 => address)) public tokenToIdToOwner;

  //Deposit identifiers
  mapping(address => mapping(uint256 => uint256)) public tokenToIdToIdentifier;

  //Total stashes
  mapping(address => uint256) public tokenToBalance;
  mapping(uint256 => uint256) public indexToBalance;

  //Enums
  enum TokenType {
    NIL,
    ERC20,
    ERC721
  }

  //Structs
  struct TrustedToken {
    address addr; //ERC721 or ERC20 token address
    TokenType tokenType; //ERC721 or ERC20 token type
  }

  // EVENTS
  event DepositNFT(
    address indexed playerAddress,
    address indexed tokenAddress,
    uint256 value,
    uint256 identifier,
    int64 playerNonce
  );
  event DepositCoin(
    address indexed playerAddress,
    address indexed tokenAddress,
    uint256 value,
    int64 playerNonce
  );
  event WithdrawNFT(
    address indexed playerAddress,
    address indexed tokenAddress,
    uint256 value,
    int64 playerNonce
  );
  event WithdrawCoin(
    address indexed playerAddress,
    address indexed tokenAddress,
    uint256 gross,
    uint256 net,
    int64 playerNonce
  );
  event DepositGeneric(
    address indexed playerAddress,
    uint256 indexed index,
    uint256 value,
    int64 playerNonce
  );
  event WithdrawGeneric(
    address indexed playerAddress,
    uint256 indexed index,
    uint256 value,
    int64 playerNonce
  );

  /**
  @dev initialize the player stash
  @param networkDescriptor for sigGuardian
  @param initialValidators for sigGuardian
  @param _operator for Access Control and Pausable functions
  */
  function initialize(
    int64 networkDescriptor,
    address[] calldata initialValidators,
    address _operator
  ) public initializer {
    require(_operator != address(0), "INV_ADDR");

    initSigGuardian(networkDescriptor, initialValidators);
    __AccessControl_init();
    __Pausable_init();

    _setupRole(DEFAULT_ADMIN_ROLE, _operator);
    _setupRole(OPERATOR_ROLE, _operator);
  }

  function isTrustedERC20(address tokenAddress) public view returns (bool) {
    TokenType tokenType = trustedTokens[tokenAddress];
    return tokenType == TokenType.ERC20;
  }

  function isTrustedERC721(address tokenAddress) public view returns (bool) {
    TokenType tokenType = trustedTokens[tokenAddress];
    return tokenType == TokenType.ERC721;
  }

  /**
   * @dev Wrapper to check signature before deposit tokens.
   * @param hashDigest The hash digest of the claim.
   * @param data The claim data.
   * @param signatureData The signature data.
   */
  function depositCoin(
    bytes32 hashDigest,
    Data[] calldata data,
    SignatureData calldata signatureData
  ) public whenNotPaused {
    validateReq(hashDigest, data, signatureData);

    address tokenAddress;
    uint256 amount;
    address playerAddress;

    for (uint256 i = 0; i < data.length; i++) {
      string memory key = data[i].key;
      if (keccak256(bytes(key)) == keccak256(bytes("tokenAddress"))) {
        tokenAddress = abi.decode(data[i].data, (address));
      } else if (keccak256(bytes(key)) == keccak256(bytes("amount"))) {
        amount = abi.decode(data[i].data, (uint256));
      } else if (keccak256(bytes(key)) == keccak256(bytes("playerAddress"))) {
        playerAddress = abi.decode(data[i].data, (address));
      }
    }

    _depositCoin(tokenAddress, amount, playerAddress);
  }

  /**
   * @dev Deposit tokens to the player stash.
   * @param tokenAddress The address of the token to deposit.
   * @param amount The amount of tokens to deposit.
   * @param playerAddress The address of the player to deposit to.
   */
  function _depositCoin(
    address tokenAddress,
    uint256 amount,
    address playerAddress
  ) internal whenNotPaused {
    require(isTrustedERC20(tokenAddress), "INV_TOKEN");

    IERC trustedToken = IERC(tokenAddress);

    require(amount > 0, "INV_AMOUNT");

    uint256 balance = trustedToken.balanceOf(playerAddress);
    require(balance >= amount, "NO_BALANCE");

    require(trustedToken.allowance(playerAddress, address(this)) >= amount, "NOT_ENOUGH_ALLOWANCE");

    uint256 playerBalanceBefore = playerToTokenToBalance[playerAddress][tokenAddress];
    playerToTokenToBalance[playerAddress][tokenAddress] = playerBalanceBefore + amount;
    tokenToBalance[tokenAddress] = tokenToBalance[tokenAddress] + amount;

    _incrementPlayerNonce(playerAddress);

    emit DepositCoin(playerAddress, tokenAddress, amount, playerNonces[playerAddress]);

    trustedToken.transferFrom(playerAddress, address(this), amount);
  }

  /**
   * @dev Wrapper to check signature before deposit NFT'S.
   * @param hashDigest The hash digest of the claim.
   * @param data The claim data.
   * @param signatureData The signature data.
   */
  function depositNFT(
    bytes32 hashDigest,
    Data[] calldata data,
    SignatureData calldata signatureData
  ) public whenNotPaused {
    validateReq(hashDigest, data, signatureData);

    address tokenAddress;
    uint256 tokenId;
    address playerAddress;
    uint256 identifier;

    for (uint256 i = 0; i < data.length; i++) {
      string memory key = data[i].key;
      if (keccak256(bytes(key)) == keccak256(bytes("tokenAddress"))) {
        tokenAddress = abi.decode(data[i].data, (address));
      } else if (keccak256(bytes(key)) == keccak256(bytes("tokenId"))) {
        tokenId = abi.decode(data[i].data, (uint256));
      } else if (keccak256(bytes(key)) == keccak256(bytes("playerAddress"))) {
        playerAddress = abi.decode(data[i].data, (address));
      } else if (keccak256(bytes(key)) == keccak256(bytes("identifier"))) {
        identifier = abi.decode(data[i].data, (uint256));
      }
    }

    _depositNFT(tokenAddress, tokenId, playerAddress, identifier);
  }

  /**
   * @dev Deposit NFT' into the player stash.
   * @param tokenAddress The address of the token to deposit.
   * @param tokenId The amount of tokens to deposit.
   * @param playerAddress The address of the player to deposit to.
   * @param identifier The identifier of the token.
   */
  function _depositNFT(
    address tokenAddress,
    uint256 tokenId,
    address playerAddress,
    uint256 identifier
  ) internal whenNotPaused {
    require(isTrustedERC721(tokenAddress), "INV_TOKEN");

    IERC trustedToken = IERC(tokenAddress);

    address tokenOwner = trustedToken.ownerOf(tokenId);

    require(tokenOwner != address(this), "ALREADY_DEPOSITED");
    require(playerAddress == tokenOwner, "INV_OWNER");
    require(
      trustedToken.getApproved(tokenId) == address(this) ||
        trustedToken.isApprovedForAll(tokenOwner, address(this)),
      "NOT_ENOUGH_ALLOWANCE"
    );

    tokenToIdToOwner[tokenAddress][tokenId] = playerAddress;
    tokenToBalance[tokenAddress] = tokenToBalance[tokenAddress] + 1;
    tokenToIdToIdentifier[tokenAddress][tokenId] = identifier;

    _incrementPlayerNonce(playerAddress);

    emit DepositNFT(playerAddress, tokenAddress, tokenId, identifier, playerNonces[playerAddress]);

    trustedToken.transferFrom(playerAddress, address(this), tokenId);
  }

  /**
   * @dev Wrapper to check signature before deposit tokens. To know more about the parameters, see SigGuardian comments.
   * @param hashDigest - The hash digest of the claim.
   * @param data - The claim data.
   * @param signatureData - The signature data.
   */
  function withdrawNFT(
    bytes32 hashDigest,
    Data[] calldata data,
    SignatureData calldata signatureData
  ) public whenNotPaused {
    validateReq(hashDigest, data, signatureData);

    address tokenAddress;
    uint256 tokenId;
    address playerAddress;

    for (uint256 i = 0; i < data.length; i++) {
      string memory key = data[i].key;
      if (keccak256(bytes(key)) == keccak256(bytes("tokenAddress"))) {
        tokenAddress = abi.decode(data[i].data, (address));
      } else if (keccak256(bytes(key)) == keccak256(bytes("tokenId"))) {
        tokenId = abi.decode(data[i].data, (uint256));
      } else if (keccak256(bytes(key)) == keccak256(bytes("playerAddress"))) {
        playerAddress = abi.decode(data[i].data, (address));
      }
    }

    _withdrawNFT(tokenAddress, tokenId, playerAddress);
  }

  /**
   * @dev Withdraws tokens from the player's stash.
   * @param tokenAddress The address of the token to withdraw.
   * @param tokenId The amount of tokens to withdraw.
   * @param playerAddress The address of the player to withdraw from.
   */
  function _withdrawNFT(
    address tokenAddress,
    uint256 tokenId,
    address playerAddress
  ) internal whenNotPaused {
    require(isTrustedERC721(tokenAddress), "INV_TOKEN");

    IERC trustedToken = IERC(tokenAddress);

    address tokenOwner = tokenToIdToOwner[tokenAddress][tokenId];
    require(tokenOwner == playerAddress, "INV_OWNER");

    tokenToIdToOwner[tokenAddress][tokenId] = address(0);
    tokenToBalance[tokenAddress] = tokenToBalance[tokenAddress] - 1;

    _incrementPlayerNonce(playerAddress);

    emit WithdrawNFT(playerAddress, tokenAddress, tokenId, playerNonces[playerAddress]);

    trustedToken.transferFrom(address(this), playerAddress, tokenId);
  }

  /**
   * @dev Wrapper to check signature before deposit tokens. To know more about the parameters, see SigGuardian comments.
   * @param hashDigest - The hash digest of the claim.
   * @param data - The claim data.
   * @param signatureData - The signature data.
   */
  function withdrawCoin(
    bytes32 hashDigest,
    Data[] calldata data,
    SignatureData calldata signatureData
  ) public whenNotPaused {
    validateReq(hashDigest, data, signatureData);

    address tokenAddress;
    uint256 gross;
    address playerAddress;
    uint256 net;

    for (uint256 i = 0; i < data.length; i++) {
      string memory key = data[i].key;
      if (keccak256(bytes(key)) == keccak256(bytes("tokenAddress"))) {
        tokenAddress = abi.decode(data[i].data, (address));
      } else if (keccak256(bytes(key)) == keccak256(bytes("gross"))) {
        gross = abi.decode(data[i].data, (uint256));
      } else if (keccak256(bytes(key)) == keccak256(bytes("playerAddress"))) {
        playerAddress = abi.decode(data[i].data, (address));
      } else if (keccak256(bytes(key)) == keccak256(bytes("net"))) {
        net = abi.decode(data[i].data, (uint256));
      }
    }

    _withdrawCoin(tokenAddress, gross, playerAddress, net);
  }

  /**
   * @dev Withdraws tokens from the player's stash.
   * @param tokenAddress The address of the token to withdraw.
   * @param gross gross amount of tokens that the player wants to withdraw.
   * @param playerAddress The address of the player to withdraw from.
   * @param net amount of tokens that the player will receive.
   */
  function _withdrawCoin(
    address tokenAddress,
    uint256 gross,
    address playerAddress,
    uint256 net
  ) internal whenNotPaused {
    TokenType tokenType = trustedTokens[tokenAddress];
    require(tokenType != TokenType.NIL, "INV_ADDRESS");

    IERC trustedToken = IERC(tokenAddress);

    require(gross > 0, "INV_AMOUNT");
    require(gross > net, "INV_NET");
    uint256 balance = playerToTokenToBalance[playerAddress][tokenAddress];
    require(balance >= gross, "NO_BALANCE");

    playerToTokenToBalance[playerAddress][tokenAddress] = balance - gross;
    tokenToBalance[tokenAddress] = tokenToBalance[tokenAddress] - gross;

    _incrementPlayerNonce(playerAddress);

    emit WithdrawCoin(playerAddress, tokenAddress, gross, net, playerNonces[playerAddress]);

    trustedToken.transfer(playerAddress, net);
  }

  /**
   * @dev Wrapper to check signature before deposit generic assets. To know more about the parameters, see SigGuardian comments.
   * @param hashDigest - The hash digest of the claim.
   * @param data - The claim data.
   * @param signatureData - The signature data.
   */
  function depositGeneric(
    bytes32 hashDigest,
    Data[] calldata data,
    SignatureData calldata signatureData
  ) public whenNotPaused {
    validateReq(hashDigest, data, signatureData);

    uint256 index;
    uint256 value;
    address playerAddress;

    for (uint256 i = 0; i < data.length; i++) {
      string memory key = data[i].key;
      if (keccak256(bytes(key)) == keccak256(bytes("index"))) {
        index = abi.decode(data[i].data, (uint256));
      } else if (keccak256(bytes(key)) == keccak256(bytes("value"))) {
        value = abi.decode(data[i].data, (uint256));
      } else if (keccak256(bytes(key)) == keccak256(bytes("playerAddress"))) {
        playerAddress = abi.decode(data[i].data, (address));
      }
    }

    _depositGeneric(index, value, playerAddress);
  }

  /**
   * @dev deposit function for generic values by index
   * @param index - index of the value to deposit
   * @param value - value to deposit
   * @param playerAddress - address of the player to deposit to
   */
  function _depositGeneric(
    uint256 index,
    uint256 value,
    address playerAddress
  ) internal whenNotPaused {
    require(value > 0, "INV_AMOUNT");

    playerToIndexToBalance[playerAddress][index] =
      playerToIndexToBalance[playerAddress][index] +
      value;

    indexToBalance[index] = indexToBalance[index] + value;

    _incrementPlayerNonce(playerAddress);

    emit DepositGeneric(playerAddress, index, value, playerNonces[playerAddress]);
  }

  /**
   * @dev Wrapper to check signature before withdraw generic assets. To know more about the parameters, see SigGuardian comments.
   * @param hashDigest - The hash digest of the claim.
   * @param data - The claim data.
   * @param signatureData - The signature data.
   */
  function withdrawGeneric(
    bytes32 hashDigest,
    Data[] calldata data,
    SignatureData calldata signatureData
  ) public whenNotPaused {
    validateReq(hashDigest, data, signatureData);
    uint256 index;
    uint256 value;
    address playerAddress;

    for (uint256 i = 0; i < data.length; i++) {
      string memory key = data[i].key;
      if (keccak256(bytes(key)) == keccak256(bytes("index"))) {
        index = abi.decode(data[i].data, (uint256));
      } else if (keccak256(bytes(key)) == keccak256(bytes("value"))) {
        value = abi.decode(data[i].data, (uint256));
      } else if (keccak256(bytes(key)) == keccak256(bytes("playerAddress"))) {
        playerAddress = abi.decode(data[i].data, (address));
      }
    }

    _withdrawGeneric(index, value, playerAddress);
  }

  /**
   * @dev withdraw function for generic values by index
   * @param index - index of the value to withdraw
   * @param value - value to withdraw
   * @param playerAddress - address of the player to withdraw from
   */
  function _withdrawGeneric(
    uint256 index,
    uint256 value,
    address playerAddress
  ) internal whenNotPaused {
    require(value > 0, "INV_AMOUNT");

    uint256 balance = playerToIndexToBalance[playerAddress][index];
    require(balance >= value, "NO_BALANCE");

    playerToIndexToBalance[playerAddress][index] =
      playerToIndexToBalance[playerAddress][index] -
      value;

    indexToBalance[index] = indexToBalance[index] - value;

    _incrementPlayerNonce(playerAddress);

    emit WithdrawGeneric(playerAddress, index, value, playerNonces[playerAddress]);
  }

  /**
   * @dev set trusted tokens. Needs to be an operator.
   * @param _trustedTokens array of ERC721 or ERC20 tokens
   */
  function setTrustedTokens(TrustedToken[] calldata _trustedTokens) public onlyRole(OPERATOR_ROLE) {
    for (uint256 i = 0; i < _trustedTokens.length; i++) {
      trustedTokens[_trustedTokens[i].addr] = _trustedTokens[i].tokenType;
    }
  }
}

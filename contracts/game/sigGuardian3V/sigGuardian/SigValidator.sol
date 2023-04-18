// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract SigValidator {
  mapping(address => bool) public validators;
  mapping(address => int64) public playerNonces;
  int64 private NETWORK_DESCRIPTOR;

  /**
   * @dev Information on a signature: address, r, s, and v
   */
  struct SignatureData {
    address signer;
    uint8 _v;
    bytes32 _r;
    bytes32 _s;
  }

  /**
   * @dev Data structure of a claim
   * playerAddress: address involved in this operation
   * tokenAddress: token involved in this operation
   * value: token amount or ID
   * networkDescriptor: which network are we on?
   * playerNonce: sequential number of reqs for that player
   */

  struct ClaimData {
    mapping(string => address) addresses;
    mapping(string => uint256) uints;
    mapping(string => int64) ints;
    mapping(string => bool) bools;
    mapping(string => bytes32) bytes32s;
    mapping(string => bytes) bytess;
    mapping(string => string) strings;
  }

  enum DataType {
    NIL,
    ADDRESS,
    UINT256,
    INT64,
    BOOL,
    BYTES32,
    BYTES,
    STRING
  }

  struct Data {
    DataType dataType;
    bytes data;
    string key;
  }

  ClaimData claimData;

  function _validateSignatureData(
    bytes32 hashDigest,
    Data[] calldata data,
    SignatureData calldata signatureData
  ) internal {
    for (uint256 i = 0; i < data.length; i++) {
      if (data[i].dataType == DataType.ADDRESS) {
        claimData.addresses[data[i].key] = abi.decode(data[i].data, (address));
      } else if (data[i].dataType == DataType.UINT256) {
        claimData.uints[data[i].key] = abi.decode(data[i].data, (uint256));
      } else if (data[i].dataType == DataType.INT64) {
        claimData.ints[data[i].key] = abi.decode(data[i].data, (int64));
      } else if (data[i].dataType == DataType.BOOL) {
        claimData.bools[data[i].key] = abi.decode(data[i].data, (bool));
      } else if (data[i].dataType == DataType.BYTES32) {
        claimData.bytes32s[data[i].key] = abi.decode(data[i].data, (bytes32));
      } else if (data[i].dataType == DataType.BYTES) {
        claimData.bytess[data[i].key] = abi.decode(data[i].data, (bytes));
      } else if (data[i].dataType == DataType.STRING) {
        claimData.strings[data[i].key] = abi.decode(data[i].data, (string));
      }
    }

    require(_verifyNetworkDescriptor(claimData.ints["networkDescriptor"]), "INV_NETWORK");
    require(
      playerNonces[claimData.addresses["playerAddress"]] == claimData.ints["playerNonce"] - 1,
      "INV_NONCE"
    );
    require(claimData.addresses["guardianAddress"] == address(this), "INV_GUARDIAN");

    uint256 claimID = _getClaimID(data);

    require(uint256(hashDigest) == claimID, "INV_DATA");

    require(
      _isAcceptedSigner(
        signatureData.signer,
        hashDigest,
        signatureData._v,
        signatureData._r,
        signatureData._s
      ),
      "INV_SIGNER"
    );
  }

  function _getClaimID(Data[] memory data) internal pure returns (uint256) {
    return uint256(keccak256(abi.encode(data)));
  }

  /**
   * @dev Guarantees that the signature is correct
   * @param signer Address that supposedly signed the message
   * @param hashDigest Hash of the message
   * @param _v The signature's recovery identifier
   * @param _r The signature's random value
   * @param _s The signature's proof
   * @return Boolean: has the message been signed by `signer`?
   */
  function _isAcceptedSigner(
    address signer,
    bytes32 hashDigest,
    uint8 _v,
    bytes32 _r,
    bytes32 _s
  ) internal view returns (bool) {
    bytes32 messageDigest = keccak256(
      abi.encodePacked("\x19Ethereum Signed Message:\n32", hashDigest)
    );

    address actualSigner = ecrecover(messageDigest, _v, _r, _s);
    require(validators[actualSigner], "INV_VALIDATOR");

    return signer == actualSigner;
  }

  function _verifyNetworkDescriptor(int64 _networkDescriptor) internal view returns (bool) {
    return _networkDescriptor == NETWORK_DESCRIPTOR;
  }

  function _setNetworkDescriptor(int64 _networkDescriptor) internal {
    require(NETWORK_DESCRIPTOR == 0, "Already set");

    NETWORK_DESCRIPTOR = _networkDescriptor;
  }

  function _incrementPlayerNonce(address playerAddress) internal {
    playerNonces[playerAddress]++;
  }

  function _setValidator(address validatorAddress, bool isActive) internal {
    validators[validatorAddress] = isActive;
  }
}

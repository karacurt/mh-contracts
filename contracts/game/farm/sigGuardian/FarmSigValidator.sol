// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract FarmSigValidator {
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
   * @param playerAddress address involved in this operation
   * @param net how much the users actually withdraws
   * @param tax how much is going back to the farming pool
   * @param burn how much is burned
   * @param networkDescriptor which network are we on?
   * @param playerNonce sequential number of reqs for that player
   */

  struct ClaimTokenData {
    address guardianAddress;
    address payable playerAddress;
    uint256 net;
    uint256 tax;
    uint256 burn;
    int64 networkDescriptor;
    int64 playerNonce;
    int64 withdrawId;
  }

  function _validateWithdrawClaim(
    bytes32 hashDigest,
    ClaimTokenData calldata claimData,
    SignatureData calldata signatureData
  ) internal view {
    require(_verifyNetworkDescriptor(claimData.networkDescriptor), "INV_NETWORK");
    require(playerNonces[claimData.playerAddress] == claimData.playerNonce - 1, "INV_NONCE");
    require(claimData.guardianAddress == address(this), "INV_GUARDIAN");

    uint256 claimID = _getWithdrawClaimID(
      claimData.guardianAddress,
      claimData.playerAddress,
      claimData.net,
      claimData.tax,
      claimData.burn,
      claimData.networkDescriptor,
      claimData.playerNonce,
      claimData.withdrawId
    );

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

  function _getWithdrawClaimID(
    address guardianAddress,
    address payable playerAddress,
    uint256 net,
    uint256 tax,
    uint256 burn,
    int64 networkDescriptor,
    int64 _playerNonce,
    int64 withdrawId
  ) internal pure returns (uint256) {
    return
      uint256(
        keccak256(
          abi.encode(
            guardianAddress,
            playerAddress,
            net,
            tax,
            burn,
            networkDescriptor,
            _playerNonce,
            withdrawId
          )
        )
      );
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

  function _verifyNetworkDescriptor(int64 networkDescriptor) internal view returns (bool) {
    return networkDescriptor == NETWORK_DESCRIPTOR;
  }

  function _setNetworkDescriptor(int64 networkDescriptor) internal {
    require(NETWORK_DESCRIPTOR == 0, "Already set");

    NETWORK_DESCRIPTOR = networkDescriptor;
  }

  function _incrementPlayerNonce(address playerAddress) internal {
    playerNonces[playerAddress]++;
  }

  function _setValidator(address validatorAddress, bool isActive) internal {
    validators[validatorAddress] = isActive;
  }
}

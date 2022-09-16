// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./FarmSigValidator.sol";

contract FarmSigGuardian is FarmSigValidator {
  function initSigGuardian(int64 _networkDescriptor, address[] calldata initialValidators) public {
    _setNetworkDescriptor(_networkDescriptor);

    for (uint256 i = 0; i < initialValidators.length; i++) {
      _setValidator(initialValidators[i], true);
    }
  }

  /**
   * @dev This function reverts if the signature is invalid for any reason
   *      Possible reasons are: INV_NETWORK, INV_NONCE, INV_DATA, INV_SIGNER, INV_VALIDATOR
          Important: parent contract is responsible for calling
          _incrementPlayerNonce(address playerAddress) at the end of the flow
   */
  function validateWithdrawReq(
    bytes32 hashDigest,
    ClaimTokenData calldata claimData,
    SignatureData calldata signatureData
  ) public view {
    _validateWithdrawClaim(hashDigest, claimData, signatureData);
  }
}

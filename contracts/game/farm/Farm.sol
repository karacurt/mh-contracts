// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./sigGuardian/FarmSigGuardian.sol";
import "../../interfaces/IERC20.sol";

/**
 *@title Mouse Haunt Farm Contract
 *@dev This contract is used to pay users what they have farmed in-game
 */
contract Farm is Initializable, PausableUpgradeable, AccessControlUpgradeable, FarmSigGuardian {
  bytes32 private constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

  IERC20 public token;

  event Withdraw(
    address indexed playerAddress,
    uint256 net,
    uint256 tax,
    uint256 burn,
    int64 playerNonce,
    int64 withdrawId
  );

  /**
   @dev initialize the Farm
   @param _networkDescriptor for sigGuardian
   @param _initialValidators for sigGuardian
   @param _operator for Access Control and Pausable functions
   */
  function initialize(
    int64 _networkDescriptor,
    address[] calldata _initialValidators,
    address _operator,
    address _token
  ) public initializer {
    require(_operator != address(0), "INV_ADDR");

    initSigGuardian(_networkDescriptor, _initialValidators);
    __AccessControl_init();
    __Pausable_init();

    _setupRole(DEFAULT_ADMIN_ROLE, _operator);
    _setupRole(OPERATOR_ROLE, _operator);

    token = IERC20(_token);
  }

  /**
   * @notice Wrapper to check signature before deposit tokens. To know more about the parameters, see SigGuardian comments.
   * @param hashDigest - The hash digest of the claim.
   * @param claimData - The claim data.
   * @param signatureData - The signature data.
   */
  function withdraw(
    bytes32 hashDigest,
    ClaimTokenData calldata claimData,
    SignatureData calldata signatureData
  ) public whenNotPaused {
    validateWithdrawReq(hashDigest, claimData, signatureData);

    _withdrawToken(claimData);
  }

  /**
   * @dev Withdraws tokens from the player's stash.
   * @param claimData The claim data
   */
  function _withdrawToken(ClaimTokenData calldata claimData) internal {
    _incrementPlayerNonce(claimData.playerAddress);

    emit Withdraw(
      claimData.playerAddress,
      claimData.net,
      claimData.tax,
      claimData.burn,
      playerNonces[claimData.playerAddress],
      claimData.withdrawId
    );

    token.burn(claimData.burn);
    token.transfer(claimData.playerAddress, claimData.net);
  }

  function setToken(address _token) public onlyRole(OPERATOR_ROLE) {
    token = IERC20(_token);
  }

  function pause() public onlyRole(OPERATOR_ROLE) {
    _pause();
  }

  function unpause() public onlyRole(OPERATOR_ROLE) {
    _unpause();
  }

  fallback() external payable {
    revert();
  }

  receive() external payable {
    revert();
  }
}

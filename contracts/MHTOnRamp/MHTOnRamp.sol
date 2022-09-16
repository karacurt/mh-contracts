// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IERC20Dec.sol";
import "./interfaces/IRouter.sol";

/**
 *@title Mouse Haunt Token On Ramp
 *@notice This contract is used to deposit tokens on game
 */
contract MhtOnRamp is Initializable, PausableUpgradeable, AccessControlUpgradeable {
  bytes32 internal constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
  uint32 internal constant SECONDS_IN_DAY = 86400; //1 day

  //Governance
  IERC20 public paymentToken;
  address public farmingContract;
  using Counters for Counters.Counter;
  Counters.Counter internal _idCounter;
  uint256[] public allowedAmounts;

  IRouter public router;
  IERC20 public busd;
  uint256 public swapFeePercentage;
  address public treasury;

  //STRUCTS
  struct Pack {
    uint256 amount;
    uint256 quantity;
  }
  // EVENTS
  event Deposited_v1(
    uint256 indexed id,
    uint256 pack1,
    uint256 pack2,
    uint256 pack3,
    address indexed playerAddress
  );
  event Swap(address buyer, uint256 mhtAmount, uint256 busdAmount);

  /**
   @dev initialize the MHT On Ramp
   @param _operator for Access Control and Pausable functions
   @param _paymentToken for the token used to pay for the stashes
    @param _farmingContract for the contract used to deposit tokens in    
   */
  function initialize(
    address _operator,
    address _paymentToken,
    address _farmingContract,
    address _router,
    address _busd,
    uint256 _swapFeePercentage,
    address _treasury
  ) public initializer {
    require(_operator != address(0), "INV_ADDRESS");
    require(_paymentToken != address(0), "INV_ADDRESS");
    require(_farmingContract != address(0), "INV_ADDRESS");
    require(_router != address(0), "INV_ADDRESS");
    require(_busd != address(0), "INV_ADDRESS");
    require(_treasury != address(0), "INV_ADDRESS");
    require(_swapFeePercentage <= 100 ether, "Invalid swap fee percentage");

    __AccessControl_init();
    __Pausable_init();

    paymentToken = IERC20(_paymentToken);
    farmingContract = _farmingContract;
    router = IRouter(_router);
    busd = IERC20(_busd);
    swapFeePercentage = _swapFeePercentage;
    treasury = _treasury;
    _idCounter.increment();

    _setupRole(DEFAULT_ADMIN_ROLE, _operator);
    _setupRole(OPERATOR_ROLE, _operator);
  }

  /**
   * @dev depoist MHT in game
   */
  function deposit(uint256[3] calldata _quantities) public whenNotPaused {
    _deposit(_quantities, false);
  }

  function depositWithBusd(uint256[3] calldata _quantities) public whenNotPaused {
    _deposit(_quantities, true);
  }

  function _deposit(uint256[3] calldata _quantities, bool buyWithBusd) internal whenNotPaused {
    uint256 _pack1Quantity = _quantities[0];
    uint256 _pack2Quantity = _quantities[1];
    uint256 _pack3Quantity = _quantities[2];

    require(allowedAmounts.length > 2, "No allowed amounts enougth");

    uint256 _totalAmount = (_pack1Quantity * allowedAmounts[0]) +
      (_pack2Quantity * allowedAmounts[1]) +
      (_pack3Quantity * allowedAmounts[2]);

    uint256 _balance = paymentToken.balanceOf(msg.sender);

    if (buyWithBusd) {
      _buyMHT(_totalAmount);
    } else {
      require(_balance >= _totalAmount, "NO_BALANCE");
      require(
        paymentToken.allowance(msg.sender, address(this)) >= _totalAmount,
        "NOT_ENOUGH_ALLOWANCE"
      );
    }

    emit Deposited_v1(
      _idCounter.current(),
      _pack1Quantity,
      _pack2Quantity,
      _pack3Quantity,
      msg.sender
    );
    _idCounter.increment();

    if (buyWithBusd) {
      paymentToken.transfer(farmingContract, _totalAmount);
    } else {
      paymentToken.transferFrom(msg.sender, farmingContract, _totalAmount);
    }
  }

  function _buyMHT(uint256 _mhtAmountOut)
    internal
    whenNotPaused
    returns (uint256[] memory amounts)
  {
    require(_mhtAmountOut > 0, "mht amount out must be greater than 0");

    address[] memory path;
    path = new address[](2);
    path[0] = address(busd); //_tokenIn
    path[1] = address(paymentToken); //_tokenOut

    uint256 _amountInCalculated = router.getAmountsIn(_mhtAmountOut, path)[0];

    uint256 swapFee = swapFeeOf(_amountInCalculated);

    uint256 totalCharge = _amountInCalculated + swapFee;

    uint256 balance = busd.balanceOf(msg.sender);
    require(balance >= totalCharge, "Not enough balance to SWAP BUSD for MHT");

    busd.transferFrom(msg.sender, address(this), totalCharge);
    busd.transfer(treasury, swapFee);
    busd.approve(address(router), _amountInCalculated);

    emit Swap(msg.sender, _mhtAmountOut, _amountInCalculated);

    uint256[] memory amounts = router.swapExactTokensForTokens(
      _amountInCalculated,
      _mhtAmountOut,
      path,
      address(this),
      block.timestamp * 10 minutes
    );

    return amounts;
  }

  function swapFeeOf(uint256 _amountIn) public view returns (uint256) {
    return (_amountIn * swapFeePercentage) / 100 ether;
  }

  function previewSwapValue(uint256 _mhtAmountOut) external view returns (uint256) {
    address[] memory path;
    path = new address[](2);
    path[0] = address(busd); //_tokenIn
    path[1] = address(paymentToken); //_tokenOut

    uint256 _busdAmountIn = router.getAmountsIn(_mhtAmountOut, path)[0];
    uint256 _swapFee = swapFeeOf(_busdAmountIn);
    uint256 totalValue = _busdAmountIn + _swapFee;
    return totalValue;
  }

  /**
   * @dev Setters
   */

  function setRouter(address _router) external onlyRole(OPERATOR_ROLE) {
    require(_router != address(0), "OnRamp address cannot be 0");
    router = IRouter(_router);
  }

  function setBusd(address _busd) external onlyRole(OPERATOR_ROLE) {
    require(_busd != address(0), "Busd address cannot be 0");
    busd = IERC20(_busd);
  }

  function setSwapFeePercentage(uint256 _swapFeePercentage) external onlyRole(OPERATOR_ROLE) {
    require(_swapFeePercentage <= 100 ether, "Swap fee percentage cannot be greater than 100%");
    swapFeePercentage = _swapFeePercentage;
  }

  function setTreasury(address _treasury) external onlyRole(OPERATOR_ROLE) {
    require(_treasury != address(0), "Treasury address cannot be 0");
    treasury = _treasury;
  }

  function setAllowedAmounts(uint256[] memory _allowedAmounts) external onlyRole(OPERATOR_ROLE) {
    require(_allowedAmounts.length > 2, "No allowed amounts enougth");
    allowedAmounts = _allowedAmounts;
  }

  function pause() public onlyRole(OPERATOR_ROLE) {
    _pause();
  }

  function unpause() public onlyRole(OPERATOR_ROLE) {
    _unpause();
  }

  /**
   * @dev set payment token. Needs to be an operator.
   * @param _paymentToken ERC20 token
   */
  function setPaymentToken(address _paymentToken) public onlyRole(OPERATOR_ROLE) {
    require(_paymentToken != address(0), "INV_ADDR");
    paymentToken = IERC20(_paymentToken);
  }

  /**
   *@param _farmingContract the vault address
   */
  function setFarmingContract(address _farmingContract) public onlyRole(OPERATOR_ROLE) {
    farmingContract = _farmingContract;
  }

  /**
   * @param _operator the operator address
   */
  function setOperator(address _operator) public onlyRole(OPERATOR_ROLE) {
    _setupRole(OPERATOR_ROLE, _operator);
  }

  /**
   * @dev recover any ERC20 deposit by mistake.
   * @param _tokenAddress the address of the token
   * @param _amount the amount of the token
   * @param _recipient the address of the recepient
   */
  function recoverERC20(
    address _tokenAddress,
    uint256 _amount,
    address _recipient
  ) external onlyRole(OPERATOR_ROLE) {
    IERC20(_tokenAddress).transfer(_recipient, _amount);
  }
}

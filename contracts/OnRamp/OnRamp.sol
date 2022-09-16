// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./interfaces/IRouter.sol";
import "./interfaces/IERC20.sol";

contract OnRamp is Initializable, AccessControlUpgradeable, PausableUpgradeable {
  IRouter public router;

  bytes32 internal constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

  IERC20 public busd;
  IERC20 public mht;

  uint256 public swapFeePercentage;
  uint256 public busdBalance;

  event Swap(address buyer, uint256 mhtAmount, uint256 busdAmount);

  function initialize(
    address _router,
    address _busd,
    address _mht,
    uint256 _swapFeePercentage
  ) public initializer {
    __AccessControl_init();
    __Pausable_init();

    require(_router != address(0), "IRouter address cannot be 0");
    require(_busd != address(0), "Busd address cannot be 0");
    require(_mht != address(0), "Mht address cannot be 0");
    require(_swapFeePercentage <= 100 ether, "Swap fee percentage cannot be greater than 100%");

    router = IRouter(_router);
    busd = IERC20(_busd);
    mht = IERC20(_mht);
    swapFeePercentage = _swapFeePercentage;

    _setupRole(OPERATOR_ROLE, msg.sender);
  }

  function buyMHT(uint256 _mhtAmountOut) external whenNotPaused returns (uint256[] memory amounts) {
    require(_mhtAmountOut > 0, "mht amount out must be greater than 0");

    address[] memory path;
    path = new address[](2);
    path[0] = address(busd); //_tokenIn
    path[1] = address(mht); //_tokenOut

    uint256 _amountInCalculated = router.getAmountsIn(_mhtAmountOut, path)[0];

    uint256 swapFee = swapFeeOf(_amountInCalculated);

    busdBalance += swapFee;
    uint256 totalCharge = _amountInCalculated + swapFee;

    uint256 balance = busd.balanceOf(msg.sender);
    require(balance >= totalCharge, "Not enough balance to SWAP BUSD for MHT");

    busd.transferFrom(msg.sender, address(this), totalCharge);
    busd.approve(address(router), _amountInCalculated);

    uint256[] memory amounts = router.swapExactTokensForTokens(
      _amountInCalculated,
      _mhtAmountOut,
      path,
      msg.sender,
      block.timestamp * 10 minutes
    );

    emit Swap(msg.sender, _mhtAmountOut, totalCharge);

    return amounts;
  }

  function swapFeeOf(uint256 _amountIn) public view returns (uint256) {
    return (_amountIn * swapFeePercentage) / 100 ether;
  }

  function mhtAmountOut(uint256 _busdAmountIn) external view returns (uint256) {
    address[] memory path;
    path = new address[](2);
    path[0] = address(busd); //_tokenIn
    path[1] = address(mht); //_tokenOut

    uint256 _mhtAmountOut = router.getAmountsOut(_busdAmountIn, path)[1];

    return _mhtAmountOut;
  }

  function busdAmountIn(uint256 _mhtAmountOut) external view returns (uint256) {
    address[] memory path;
    path = new address[](2);
    path[0] = address(busd); //_tokenIn
    path[1] = address(mht); //_tokenOut

    uint256 _busdAmountIn = router.getAmountsIn(_mhtAmountOut, path)[0];

    return _busdAmountIn;
  }

  function previewSwapValue(uint256 _mhtAmountOut) external view returns (uint256) {
    address[] memory path;
    path = new address[](2);
    path[0] = address(busd); //_tokenIn
    path[1] = address(mht); //_tokenOut

    uint256 _busdAmountIn = router.getAmountsIn(_mhtAmountOut, path)[0];
    uint256 _swapFee = swapFeeOf(_busdAmountIn);
    uint256 totalValue = _busdAmountIn + _swapFee;
    return totalValue;
  }

  function setMHTAddress(address _mht) external onlyRole(OPERATOR_ROLE) {
    mht = IERC20(_mht);
  }

  function setBUSDAddress(address _busd) external onlyRole(OPERATOR_ROLE) {
    busd = IERC20(_busd);
  }

  function setSwapFeePercentage(uint256 _swapFeePercentage) external onlyRole(OPERATOR_ROLE) {
    require(_swapFeePercentage <= 100 ether, "Swap fee percentage cannot be greater than 100%");
    swapFeePercentage = _swapFeePercentage;
  }

  function pause() external onlyRole(OPERATOR_ROLE) {
    _pause();
  }

  function unpause() external onlyRole(OPERATOR_ROLE) {
    _unpause();
  }

  function recoverERC20(
    address _tokenAddress,
    uint256 _amount,
    address _recipient
  ) external onlyRole(OPERATOR_ROLE) {
    IERC20(_tokenAddress).transfer(_recipient, _amount);
  }
}

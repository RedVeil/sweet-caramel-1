// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../../utils/ACLAuth.sol";
import "../../utils/ContractRegistryAccess.sol";
import "../../interfaces/IVaultFeeController.sol";
import "../../interfaces/IVaultsV1.sol";
import "../../interfaces/IZapIn.sol";
import "../../interfaces/IZapOut.sol";
import "../../interfaces/IWETH.sol";

abstract contract AbstractZeroXSwapZap {
  using SafeERC20 for IERC20;

  address constant ZEROX_ROUTER = 0xDef1C0ded9bec7F1a1670819833240f027b25EfF;
  address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
  address constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  receive() external payable {}

  function _fillQuote(
    address fromTokenAddress,
    address toTokenAddress,
    uint256 amount,
    address swapTarget,
    bytes memory swapData
  ) internal returns (uint256 amountBought) {
    if (fromTokenAddress == toTokenAddress) {
      return amount;
    }

    if (swapTarget == WETH) {
      toTokenAddress == WETH ? IWETH(WETH).deposit{ value: amount }() : IWETH(WETH).withdraw(amount);
      return amount;
    }

    uint256 valueToSend;
    if (fromTokenAddress == ETH) {
      valueToSend = amount;
    } else {
      _approveToken(fromTokenAddress, swapTarget, amount);
    }

    uint256 initialBalance = _getBalance(toTokenAddress);

    require(swapTarget == ZEROX_ROUTER, "Target not Authorized");
    (bool success, ) = swapTarget.call{ value: valueToSend }(swapData);
    require(success, "Error Swapping Tokens");

    amountBought = _getBalance(toTokenAddress) - initialBalance;

    require(amountBought > 0, "Swapped To Invalid Intermediate");
  }

  function _approveToken(
    address token,
    address spender,
    uint256 amount
  ) internal {
    IERC20(token).safeApprove(spender, 0);
    IERC20(token).safeApprove(spender, amount);
  }

  function _getBalance(address token) internal view returns (uint256 balance) {
    if (token == ETH) {
      balance = address(this).balance;
    } else {
      balance = IERC20(token).balanceOf(address(this));
    }
  }

  function _pullTokens(address token, uint256 amount) internal returns (uint256) {
    if (token == ETH) {
      require(msg.value > 0, "No eth sent");
      return msg.value;
    }

    require(amount > 0, "Invalid token amount");
    require(msg.value == 0, "Eth sent with token");

    IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

    return amount;
  }
}

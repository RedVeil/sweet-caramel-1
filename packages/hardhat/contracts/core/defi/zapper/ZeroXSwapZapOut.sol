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
import "./AbstractZeroXSwapZap.sol";

contract ZeroXSwapZapOut is IZapOut, AbstractZeroXSwapZap {
  using SafeERC20 for IERC20;

  event zapOut(address sender, address pool, address token, uint256 tokensRec);

  function ZapOut(
    address,
    uint256 incomingTokenQty,
    address fromTokenAddress,
    address toToken,
    uint256 minToTokens,
    address swapTarget,
    bytes calldata swapCallData,
    address,
    bool
  ) external payable returns (uint256 toTokensBought) {
    incomingTokenQty = _pullTokens(fromTokenAddress, incomingTokenQty);
    if (fromTokenAddress == address(0)) {
      fromTokenAddress = ETH;
    }

    toTokensBought = _fillQuote(fromTokenAddress, toToken, incomingTokenQty, swapTarget, swapCallData);
    require(toTokensBought >= minToTokens, "High Slippage");

    emit zapOut(msg.sender, fromTokenAddress, toToken, toTokensBought);

    IERC20(toToken).safeTransfer(msg.sender, toTokensBought);
  }
}

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

contract ZeroXSwapZapIn is IZapIn, AbstractZeroXSwapZap {
  using SafeERC20 for IERC20;

  event zapIn(address sender, address toToken, uint256 tokensBought, address affiliate);

  function ZapIn(
    address fromTokenAddress,
    address toTokenAddress,
    address,
    uint256 incomingTokenQty,
    uint256 minTokensOut,
    address swapTarget,
    bytes calldata swapData,
    address affiliate
  ) external payable returns (uint256 tokensBought) {
    uint256 amount = _pullTokens(fromTokenAddress, incomingTokenQty);
    if (fromTokenAddress == address(0)) {
      fromTokenAddress = ETH;
    }
    tokensBought = _fillQuote(fromTokenAddress, toTokenAddress, amount, swapTarget, swapData);
    require(tokensBought >= minTokensOut, "Received less than minTokensOut");

    emit zapIn(msg.sender, toTokenAddress, tokensBought, affiliate);

    IERC20(toTokenAddress).safeTransfer(msg.sender, tokensBought);
  }
}

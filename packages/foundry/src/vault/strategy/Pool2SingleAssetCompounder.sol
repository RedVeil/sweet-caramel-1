// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import { ERC4626Upgradeable as ERC4626, ERC20Upgradeable as ERC20 } from "openzeppelin-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import { IUniswapRouterV2 } from "../../interfaces/external/uni/IUniswapRouterV2.sol";
import { IPopClaimerERC4626 } from "../../interfaces/IPopClaimerERC4626.sol";
import { StrategyBase } from "./StrategyBase.sol";

contract Pool2SingleAssetCompounder is StrategyBase {
  error NoValidTradePath();

  function _verifyAdapterCompatibility(bytes memory data) internal override {
    address router = abi.decode(data, (address));
    address asset = IPopClaimerERC4626(address(this)).asset();
    bytes4 sig = bytes4(keccak256("claim()"));
    if (!IPopClaimerERC4626(address(this)).isFunctionImplemented(sig)) revert FunctionNotImplemented(sig);
    sig = bytes4(keccak256("rewardTokens()"));
    if (!IPopClaimerERC4626(address(this)).isFunctionImplemented(sig)) revert FunctionNotImplemented(sig);

    address[] memory tradePath = new address[](2);
    tradePath[1] = asset;

    address[] memory rewardTokens = IPopClaimerERC4626(address(this)).rewardTokens();
    uint256 len = rewardTokens.length;
    // Approve all rewardsToken for trading
    for (uint256 i = 0; i < len; i++) {
      tradePath[0] = rewardTokens[i];

      uint256[] memory amountsOut = IUniswapRouterV2(router).getAmountsOut(ERC20(asset).decimals()**10, tradePath);
      if (amountsOut[amountsOut.length] == 0) revert NoValidTradePath();
    }
  }

  function _setUpStrategy(bytes memory data) internal override {
    address router = abi.decode(data, (address));

    address[] memory rewardTokens = IPopClaimerERC4626(address(this)).rewardTokens();
    uint256 len = rewardTokens.length;
    for (uint256 i = 0; i < len; i++) {
      ERC20(rewardTokens[i]).approve(router, type(uint256).max);
    }
  }

  /// @notice claim all token rewards and trade them for the underlying asset
  function harvest() public override {
    address router = abi.decode(IPopClaimerERC4626(address(this)).getStrategyData(), (address));
    address asset = IPopClaimerERC4626(address(this)).asset();
    address[] memory rewardTokens = IPopClaimerERC4626(address(this)).rewardTokens();

    IPopClaimerERC4626(address(this)).claim(); // hook to accrue/pull in rewards, if needed

    address[] memory tradePath = new address[](2);
    tradePath[1] = asset;

    uint256 len = rewardTokens.length;
    // send all tokens to destination
    for (uint256 i = 0; i < len; i++) {
      uint256 amount = ERC20(rewardTokens[i]).balanceOf(address(this));

      if (amount > 0) {
        tradePath[0] = rewardTokens[i];

        IUniswapRouterV2(router).swapExactTokensForTokens(amount, 0, tradePath, address(this), block.timestamp);
      }
    }
    IPopClaimerERC4626(address(this)).strategyDeposit(ERC20(asset).balanceOf(address(this)), 0);
  }
}

// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import { ERC4626Upgradeable as ERC4626, ERC20Upgradeable as ERC20 } from "openzeppelin-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import { IUniswapRouterV2 } from "../../interfaces/external/uni/IUniswapRouterV2.sol";
import { IPopERC4626WithRewards } from "../../interfaces/IPopERC4626WithRewards.sol";
import { StrategyBase } from "./StrategyBase.sol";

contract Pool2SingleAssetCompounder is StrategyBase {
  error NoValidTradePath();

  function _verifyAdapterCompatibility(bytes memory data) internal override {
    address router = abi.decode(data, (address));
    address asset = IPopERC4626WithRewards(address(this)).asset();

    // Verify needed functions exist
    bytes4 sig = bytes4(keccak256("claim()"));
    if (!IPopERC4626WithRewards(address(this)).supportsInterface(sig)) revert FunctionNotImplemented(sig);
    sig = bytes4(keccak256("rewardTokens()"));
    if (!IPopERC4626WithRewards(address(this)).supportsInterface(sig)) revert FunctionNotImplemented(sig);

    // Verify Trade Path exists
    address[] memory tradePath = new address[](2);
    tradePath[1] = asset;

    address[] memory rewardTokens = IPopERC4626WithRewards(address(this)).rewardTokens();
    uint256 len = rewardTokens.length;
    for (uint256 i = 0; i < len; i++) {
      tradePath[0] = rewardTokens[i];

      uint256[] memory amountsOut = IUniswapRouterV2(router).getAmountsOut(ERC20(asset).decimals()**10, tradePath);
      if (amountsOut[amountsOut.length] == 0) revert NoValidTradePath();
    }
  }

  function _setUpStrategy(bytes memory data) internal override {
    address router = abi.decode(data, (address));

    // Approve all rewardsToken for trading
    address[] memory rewardTokens = IPopERC4626WithRewards(address(this)).rewardTokens();
    uint256 len = rewardTokens.length;
    for (uint256 i = 0; i < len; i++) {
      ERC20(rewardTokens[i]).approve(router, type(uint256).max);
    }
  }

  /// @notice claim all token rewards and trade them for the underlying asset
  function harvest() public override {
    address router = abi.decode(IPopERC4626WithRewards(address(this)).strategyConfig(), (address));
    address asset = IPopERC4626WithRewards(address(this)).asset();
    address[] memory rewardTokens = IPopERC4626WithRewards(address(this)).rewardTokens();

    IPopERC4626WithRewards(address(this)).claim(); // hook to accrue/pull in rewards, if needed

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
    IPopERC4626WithRewards(address(this)).strategyDeposit(ERC20(asset).balanceOf(address(this)), 0);
  }
}

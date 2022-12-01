// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import { ERC4626Upgradeable as ERC4626, ERC20Upgradeable as ERC20, Initializable } from "openzeppelin-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import { IUniswapRouterV2 } from "../../interfaces/external/uni/IUniswapRouterV2.sol";
import { IPopERC4626 } from "../../interfaces/IPopERC4626.sol";

contract Pool2SingleAssetCompounder is Initializable {
  function __Pool2SingleAssetCompounder_init(bytes memory data) public initializer {
    (address router, address[] memory rewardsToken) = abi.decode(data, (address, address[]));

    uint256 len = rewardsToken.length;
    // Approve all rewardsToken for trading
    for (uint256 i = 0; i < len; i++) {
      ERC20(rewardsToken[i]).approve(router, type(uint256).max);
    }
  }

  /// @notice claim all token rewards and trade them for the underlying asset
  function harvest() public {
    (address router, address[] memory rewardsToken) = abi.decode(
      IPopERC4626(address(this)).getStrategyData(),
      (address, address[])
    );
    address asset = IPopERC4626(address(this)).asset();

    IPopERC4626(address(this)).claim(); // hook to accrue/pull in rewards, if needed

    address[] memory tradePath = new address[](2);
    tradePath[1] = asset;

    uint256 len = rewardsToken.length;
    // send all tokens to destination
    for (uint256 i = 0; i < len; i++) {
      uint256 amount = ERC20(rewardsToken[i]).balanceOf(address(this));

      if (amount > 0) {
        tradePath[0] = rewardsToken[i];

        IUniswapRouterV2(router).swapExactTokensForTokens(amount, 0, tradePath, address(this), block.timestamp);
      }
    }
    IPopERC4626(address(this)).strategyDeposit(ERC20(asset).balanceOf(address(this)), 0);
  }
}

// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import { ERC4626Upgradeable as ERC4626, ERC20Upgradeable as ERC20 } from "openzeppelin-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import { IUniswapRouterV2 } from "../../interfaces/external/uni/IUniswapRouterV2.sol";

contract Pool2SingleAssetCompounder {
  address router;
  address[] rewardsToken;

  function __Pool2SingleAssetCompounder_init(address _router, address[] memory _rewardsToken) public {
    router = _router;
    rewardsToken = _rewardsToken;

    uint256 len = rewardsToken.length;
    // Approve all rewardsToken for trading
    for (uint256 i = 0; i < len; i++) {
      ERC20(rewardsToken[i]).approve(router, type(uint256).max);
    }
  }

  /// @notice claim all token rewards and trade them for the underlying asset
  function trade() internal {
    _getRewards(); // hook to accrue/pull in rewards, if needed

    address[] memory tradePath = new address[](2);
    tradePath[1] = ERC4626(address(this)).asset();

    uint256 len = rewardsToken.length;
    // send all tokens to destination
    for (uint256 i = 0; i < len; i++) {
      uint256 amount = ERC20(rewardsToken[i]).balanceOf(address(this));

      if (amount > 0) {
        tradePath[0] = rewardsToken[i];

        IUniswapRouterV2(router).swapExactTokensForTokens(amount, 0, tradePath, address(this), block.timestamp);
      }
    }
  }

  /// @notice hook to accrue/pull in rewards, if needed
  function _getRewards() internal virtual {}
}

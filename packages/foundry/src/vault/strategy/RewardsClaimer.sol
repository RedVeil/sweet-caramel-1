// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import { SafeERC20Upgradeable as SafeERC20 } from "openzeppelin-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { ERC20Upgradeable as ERC20 } from "openzeppelin-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { IPopERC4626 } from "../../interfaces/IPopERC4626.sol";

contract RewardsClaimer {
  using SafeERC20 for ERC20;

  event ClaimRewards(address indexed rewardToken, uint256 amount);

  /// @notice claim all token rewards
  function harvest() public {
    (address rewardDestination, ERC20[] memory rewardTokens) = abi.decode(
      IPopERC4626(address(this)).getStrategyData(),
      (address, ERC20[])
    );

    IPopERC4626(address(this)).claim(); // hook to accrue/pull in rewards, if needed

    uint256 len = rewardTokens.length;
    // send all tokens to destination
    for (uint256 i = 0; i < len; i++) {
      ERC20 token = rewardTokens[i];
      uint256 amount = token.balanceOf(address(this));

      token.safeTransfer(rewardDestination, amount);

      emit ClaimRewards(address(token), amount);
    }
  }
}

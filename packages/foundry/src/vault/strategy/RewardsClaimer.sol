// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import { SafeERC20Upgradeable as SafeERC20 } from "openzeppelin-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { ERC20Upgradeable as ERC20 } from "openzeppelin-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { IPopClaimerERC4626 } from "../../interfaces/IPopClaimerERC4626.sol";
import { StrategyBase } from "./StrategyBase.sol";

contract RewardsClaimer is StrategyBase {
  using SafeERC20 for ERC20;

  event ClaimRewards(address indexed rewardToken, uint256 amount);

  function _verifyAdapterCompatibility(bytes memory data) internal override {
    // Verify needed functions exist
    bytes4 sig = bytes4(keccak256("claim()"));
    if (!IPopClaimerERC4626(address(this)).isFunctionImplemented(sig)) revert FunctionNotImplemented(sig);
    sig = bytes4(keccak256("rewardTokens()"));
    if (!IPopClaimerERC4626(address(this)).isFunctionImplemented(sig)) revert FunctionNotImplemented(sig);
  }

  /// @notice claim all token rewards
  function harvest() public override {
    address rewardDestination = abi.decode(IPopClaimerERC4626(address(this)).getStrategyData(), (address));

    IPopClaimerERC4626(address(this)).claim(); // hook to accrue/pull in rewards, if needed

    address[] memory rewardTokens = IPopClaimerERC4626(address(this)).rewardTokens();
    uint256 len = rewardTokens.length;
    // send all tokens to destination
    for (uint256 i = 0; i < len; i++) {
      ERC20 token = ERC20(rewardTokens[i]);
      uint256 amount = token.balanceOf(address(this));

      token.safeTransfer(rewardDestination, amount);

      emit ClaimRewards(address(token), amount);
    }
  }
}

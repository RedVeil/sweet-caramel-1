// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import { SafeERC20Upgradeable as SafeERC20 } from "openzeppelin-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { ERC20Upgradeable as ERC20 } from "openzeppelin-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract RewardsForwarder {
  using SafeERC20 for ERC20;

  event RewardDestinationUpdate(address indexed newDestination);

  event ClaimRewards(address indexed rewardToken, uint256 amount);

  /// @notice the address to send rewards
  address public rewardDestination;

  /// @notice the array of reward tokens to send to
  ERC20[] public rewardTokens;

  function __RewardsForwarder_init(address _rewardDestination, ERC20[] memory _rewardTokens) public {
    rewardDestination = _rewardDestination;
    rewardTokens = _rewardTokens;
  }

  /// @notice claim all token rewards
  function claimRewards() internal {
    beforeClaim(); // hook to accrue/pull in rewards, if needed

    uint256 len = rewardTokens.length;
    // send all tokens to destination
    for (uint256 i = 0; i < len; i++) {
      ERC20 token = rewardTokens[i];
      uint256 amount = token.balanceOf(address(this));

      token.safeTransfer(rewardDestination, amount);

      emit ClaimRewards(address(token), amount);
    }
  }

  /// @notice set the address of the new reward destination
  /// @param newDestination the new reward destination
  function setRewardDestination(address newDestination) external {
    require(msg.sender == rewardDestination, "UNAUTHORIZED");
    rewardDestination = newDestination;
    emit RewardDestinationUpdate(newDestination);
  }

  /// @notice hook to accrue/pull in rewards, if needed
  function beforeClaim() internal virtual {}
}

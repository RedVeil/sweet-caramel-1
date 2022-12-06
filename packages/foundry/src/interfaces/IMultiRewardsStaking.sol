// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15
pragma solidity ^0.8.15;

import { IERC20 } from "openzeppelin-contracts/token/ERC20/IERC20.sol";

interface IMultiRewardsStaking {
  function addRewardsToken(
    IERC20 rewardsToken,
    uint160 rewardsPerSecond,
    uint256 amount,
    address submitter,
    bool useEscrow,
    uint224 escrowDuration,
    uint24 escrowPercentage,
    uint256 offset
  ) external;

  function changeRewardSpeed(
    IERC20 rewardsToken,
    uint160 rewardsPerSecond,
    address submitter
  ) external;

  function fundReward(IERC20 rewardsToken, uint256 amount) external;
}

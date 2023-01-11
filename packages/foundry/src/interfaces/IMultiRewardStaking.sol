// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15
pragma solidity ^0.8.15;

import { IERC4626, IERC20 } from "./vault/IERC4626.sol";
import { IOwned } from "./IOwned.sol";
import { IPermit } from "./IPermit.sol";
import { IPausable } from "./IPausable.sol";
import { IMultiRewardEscrow } from "./IMultiRewardEscrow.sol";

interface IMultiRewardStaking is IERC4626, IOwned, IPermit, IPausable {
  function addRewardToken(
    IERC20 rewardToken,
    uint160 rewardsPerSecond,
    uint256 amount,
    bool useEscrow,
    uint192 escrowPercentage,
    uint32 escrowDuration,
    uint32 offset
  ) external;

  function changeRewardSpeed(IERC20 rewardToken, uint160 rewardsPerSecond) external;

  function fundReward(IERC20 rewardToken, uint256 amount) external;

  function initialize(
    IERC20 _stakingToken,
    IMultiRewardEscrow _escrow,
    address _owner
  ) external;
}

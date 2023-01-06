// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0

pragma solidity ^0.8.0;

import { IContractRegistry } from "../../../src/interfaces/IContractRegistry.sol";
import { KeeperIncentivized, IKeeperIncentiveV2 } from "../../../src/utils/KeeperIncentivized.sol";
import { IERC20 } from "openzeppelin-contracts/token/ERC20/IERC20.sol";

contract KeeperIncentivizedHelper is KeeperIncentivized {
  bytes32 public immutable contractName = keccak256("KeeperIncentivizedHelper");

  constructor(IKeeperIncentiveV2 keeperIncentive_) KeeperIncentivized(keeperIncentive_) {}

  function handleKeeperIncentiveModifierCall() public keeperIncentive(0) {}

  function handleKeeperIncentiveDirectCall() public {
    _handleKeeperIncentive(0, msg.sender);
  }

  function tipIncentiveDirectCall(
    address _rewardToken,
    address _keeper,
    uint256 _i,
    uint256 _amount
  ) public {
    IERC20(_rewardToken).approve(address(keeperIncentiveV2), _amount);
    IERC20(_rewardToken).transferFrom(msg.sender, address(this), _amount);
    _tip(_rewardToken, _keeper, _i, _amount);
  }
}

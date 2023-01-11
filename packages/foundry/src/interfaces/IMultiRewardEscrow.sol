// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15
pragma solidity ^0.8.15;

import { IERC20Upgradeable as IERC20 } from "openzeppelin-contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface IMultiRewardEscrow {
  function lock(
    IERC20 token,
    address account,
    uint256 amount,
    uint32 duration,
    uint32 offset
  ) external;

  function setFees(IERC20[] memory tokens, uint256[] memory tokenFees) external;
}

// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15
pragma solidity ^0.8.15;

import { IERC20 } from "openzeppelin-contracts/token/ERC20/IERC20.sol";

interface IMultiRewardsEscrow {
  function setFees(IERC20[] memory tokens, uint256[] memory fees) external;

  function setKeeperPerc(uint256 perc) external;
}

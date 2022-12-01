// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;

import { IPopERC4626 } from "./IPopERC4626.sol";

interface IPopClaimerERC4626 is IPopERC4626 {
  function claim() external;

  function rewardTokens() external view returns (address[] memory);
}

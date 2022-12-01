// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import { EIP165 } from "./EIP165.sol";
import { OnlyStrategy } from "./OnlyStrategy.sol";

contract WithRewards is EIP165, OnlyStrategy {
  function _addFunctionSignatures() internal override {
    hasFunc[bytes4(keccak256("claim()"))] = true;
    hasFunc[bytes4(keccak256("rewardTokens()"))] = true;
  }

  function rewardTokens() external view virtual returns (address[] memory) {}

  function claim() public virtual onlyStrategy {}
}

// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import { IWithRewards } from "../../interfaces/vault/IWithRewards.sol";

contract StrategyBase {
  error FunctionNotImplemented(bytes4 sig);

  function verifyAdapterSelectorCompatibility(bytes4[8] memory sigs) public {
    uint8 len = sigs.length;
    for (uint8 i; i < len; i++) {
      if (sigs[i].length == 0) return;
      if (!IWithRewards(address(this)).supportsInterface(sigs[i])) revert FunctionNotImplemented(sig);
    }
  }

  function verifyAdapterCompatibility(bytes memory data) public virtual {}

  function setUp(bytes memory data) public virtual {}

  function harvest() public virtual {}
}

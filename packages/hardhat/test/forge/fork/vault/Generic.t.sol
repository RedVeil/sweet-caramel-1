// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";

contract GenericTest is Test {
  function setUp() public {}

  function testDecimals() public {
    uint256 balance = 1e6;
    uint256 totalSupply = 1e6;
    emit log_named_uint("pps", (balance * 1e18) / totalSupply);
  }
}

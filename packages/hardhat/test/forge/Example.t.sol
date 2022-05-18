// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@ecmendenhall/ds-test/src/test.sol";
import "@ecmendenhall/forge-std/src/Vm.sol";
import { stdCheats } from "@ecmendenhall/forge-std/src/stdlib.sol";

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

address constant POP = 0xD0Cd466b34A24fcB2f87676278AF2005Ca8A78c4;

contract ExampleTest is DSTest, stdCheats {
  Vm public constant vm = Vm(HEVM_ADDRESS);

  IERC20Metadata internal pop;

  function setUp() public {
    pop = IERC20Metadata(POP);
  }

  function test_example_fuzz_test(uint256 n) public {
    vm.assume(n > 10);
    assertGt(n, 10);
  }

  function test_example_fork_test() public {
    assertEq(pop.name(), "Popcorn");
  }
}

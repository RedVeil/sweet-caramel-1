// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;
import { Test } from "forge-std/Test.sol";
import { EndorsementRegistry } from "../../src/vault/EndorsementRegistry.sol";

contract EndorsementRegistryTest is Test {
  EndorsementRegistry registry;

  address nonOwner = address(0x666);
  address target1 = address(0x1111);
  address target2 = address(0x2222);

  address[] addressArray;

  event EndorsementToggled(address target, bool oldEndorsement, bool newEndorsement);

  function setUp() public {
    registry = new EndorsementRegistry(address(this));
  }

  function test__toggleEndorsement() public {
    addressArray.push(target1);
    vm.expectEmit(true, true, true, false, address(registry));
    emit EndorsementToggled(target1, false, true);
    registry.toggleEndorsement(addressArray);

    assertTrue(registry.endorsed(target1));

    addressArray.push(target2);
    vm.expectEmit(true, true, true, false, address(registry));
    emit EndorsementToggled(target1, false, true);
    registry.toggleEndorsement(addressArray);

    assertFalse(registry.endorsed(target1));
    assertTrue(registry.endorsed(target2));
  }

  function testFail__toggleEndorsement_nonOwner() public {
    addressArray.push(target1);

    vm.prank(nonOwner);
    registry.toggleEndorsement(addressArray);
  }
}

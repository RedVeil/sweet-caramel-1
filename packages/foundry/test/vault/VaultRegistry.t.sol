// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.15;

import { Test } from "forge-std/Test.sol";
import { EndorsementRegistry } from "../../src/vault/EndorsementRegistry.sol";
import { WithContractRegistry, IContractRegistry } from "../utils/WithContractRegistry.sol";

// TODO import MockERC4626

contract VaultsFactoryTest is Test, WithContractRegistry {
  address nonOwner = address(0x666);

  function setUp() public {
    _adminPrepare();
  }

  /*//////////////////////////////////////////////////////////////
                          REGISTER_VAULT
    //////////////////////////////////////////////////////////////*/
  function test__registerVault() public {}

  function testFail__registerVault_nonOwner() public {}

  function testFail__registerVault_vault_already_registered() public {}

  // NOTE we dont test the view functions
}

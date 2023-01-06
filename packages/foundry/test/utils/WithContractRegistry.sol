// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.15;

import { Test } from "forge-std/Test.sol";
import { ACLRegistry, IACLRegistry } from "../../src/utils/ACLRegistry.sol";
import { ContractRegistry, IContractRegistry } from "../../src/utils/ContractRegistry.sol";

contract WithContractRegistry {
  ACLRegistry aclRegistry;
  ContractRegistry contractRegistry;

  function _adminPrepare() internal {
    aclRegistry = new ACLRegistry();
    contractRegistry = new ContractRegistry(IACLRegistry(address(aclRegistry)));

    aclRegistry.grantRole(aclRegistry.DAO_ROLE(), address(this));
  }
}

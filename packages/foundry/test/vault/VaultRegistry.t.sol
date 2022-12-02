// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.15;

import { Test } from "forge-std/Test.sol";
import { EndorsementRegistry } from "../../src/vault/EndorsementRegistry.sol";
import { WithContractRegistry, IContractRegistry } from "../utils/WithContractRegistry.sol";

// TODO import MockERC4626

contract VaultsFactoryTest is Test, WithContractRegistry {
  EndorsementRegistry registry;

  bytes32 public constant ENDORSEMENT_REGISTRY = keccak256("EndorsementRegistry");

  address nonOwner = address(0x666);
  bytes32 templateType = "templateType";

  address[] addressArray;

  event TemplateTypeAdded(bytes32 templateType);
  event TemplateAdded(bytes32 templateType, bytes32 templateKey, address implementation);
  event TemplateUpdated(bytes32 templateType, bytes32 templateKey);

  function setUp() public {
    _adminPrepare();

    registry = new EndorsementRegistry(address(this));
    factory = new VaultsFactory(address(this), IContractRegistry(contractRegistry));

    contractRegistry.addContract(ENDORSEMENT_REGISTRY, address(registry), "1");
  }

  /*//////////////////////////////////////////////////////////////
                          REGISTER_VAULT
    //////////////////////////////////////////////////////////////*/
  function test__registerVault() public {}

  function testFail__registerVault_nonOwner() public {}

  function testFail__registerVault_vault_already_registered() public {}

  // NOTE we dont test the view functions
}

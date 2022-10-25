// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import { YearnWrapperFactory } from "../../../../contracts/core/defi/vault/wrapper/yearn/YearnWrapperFactory.sol";
import { YearnWrapper } from "../../../../contracts/core/defi/vault/wrapper/yearn/YearnWrapper.sol";
import { VaultAPI } from "../../../../contracts/externals/interfaces/yearn/IVaultAPI.sol";

address constant YEARN_VAULT = 0xE537B5cc158EB71037D4125BDD7538421981E6AA;
address constant YEARN_VAULT2 = 0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE;
address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;

contract YearnWrapperFactoryTest is Test {
  event YearnWrapperDeployment(address vault);
  event ImplementationUpdated(address oldImplementation, address newImplementation);

  YearnWrapperFactory internal factory;

  address internal implementation;
  address internal notOwner = makeAddr("notOwner");
  address internal STRATEGY = makeAddr("strategy");
  address NEW_IMPLEMENTATION = makeAddr("implementation");

  function setUp() public {
    factory = new YearnWrapperFactory(address(this));
    implementation = address(new YearnWrapper());

    factory.setImplementation(implementation);

    vm.label(address(this), "VaultsV1ControllerOwner");
    vm.label(notOwner, "notOwner");
    vm.label(address(factory), "factory");
  }

  /* ========== FUNCTIONS TESTS ========== */

  function test__deployNotOwnerReverts() public {
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");

    factory.deploy(YEARN_VAULT);
  }

  function test__deploy() public {
    vm.expectEmit(false, false, false, true, address(factory));
    emit YearnWrapperDeployment(0x037FC82298142374d974839236D2e2dF6B5BdD8F);

    address yearnWrapper = factory.deploy(YEARN_VAULT);

    // Check that the yearnWrapper got deployed
    assertEq(yearnWrapper, address(0x037FC82298142374d974839236D2e2dF6B5BdD8F));
  }

  function test__deployMultipleVaults() public {
    address yearnWrapper1 = factory.deploy(YEARN_VAULT);
    address yearnWrapper2 = factory.deploy(YEARN_VAULT2);

    // Check that the yearnWrapper got deployed
    assertTrue(yearnWrapper1 != yearnWrapper2);
  }

  /* Setting Factory YearnWrapper Implementation */

  function test__setImplementationNotOwnerReverts() public {
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    factory.setImplementation(NEW_IMPLEMENTATION);
  }

  function test__setImplementation() public {
    factory.setImplementation(NEW_IMPLEMENTATION);
    assertEq(factory.implementation(), NEW_IMPLEMENTATION);
  }

  function test__setImplementationEvent() public {
    vm.expectEmit(false, false, false, true, address(factory));
    emit VaultImplementationUpdated(implementation, NEW_IMPLEMENTATION);
    factory.setImplementation(NEW_IMPLEMENTATION);
  }
}

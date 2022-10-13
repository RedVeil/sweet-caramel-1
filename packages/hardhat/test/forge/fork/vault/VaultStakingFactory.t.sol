// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "../../../../contracts/core/defi/vault/VaultStakingFactory.sol";
import "../../../../contracts/core/defi/vault/VaultStaking.sol";
import "../../../../contracts/core/interfaces/IContractRegistry.sol";

address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;

contract VaultStakingFactoryTest is Test {
  event VaultStakingDeployment(address staking);
  event StakingImplementationUpdated(address oldVaultStakingImplementation, address newVaultStakingImplementation);

  VaultStakingFactory internal vaultStakingFactory;

  address internal stakingImplementation;
  address internal notOwner = address(0x1234);
  address internal vault = address(0x6666);

  function setUp() public {
    vaultStakingFactory = new VaultStakingFactory(address(this), IContractRegistry(CONTRACT_REGISTRY));
    stakingImplementation = address(new VaultStaking());

    vaultStakingFactory.setStakingImplementation(stakingImplementation);

    vm.label(address(this), "VaultsV1ControllerOwner");
    vm.label(notOwner, "notOwner");
    vm.label(address(vaultStakingFactory), "VaultsV1Factory");
  }

  /* ========== FUNCTIONS TESTS ========== */

  function test__deployVaultStakingNotOwnerReverts() public {
    vm.stopPrank();
    vm.expectRevert("Only the contract owner may perform this action");

    address staking = vaultStakingFactory.deployVaultStaking(vault);
    assertEq(staking, address(0), "staking deployment failed");
  }

  function test__deployVaultStaking() public {
    vm.expectEmit(false, false, false, true, address(vaultStakingFactory));
    emit VaultStakingDeployment(0x037FC82298142374d974839236D2e2dF6B5BdD8F);

    address staking = vaultStakingFactory.deployVaultStaking(vault);

    // Check that the staking got deployed
    assertEq(staking, address(0x037FC82298142374d974839236D2e2dF6B5BdD8F));
  }

  function test__deployMultipleVaultStakingContracts() public {
    address staking1 = vaultStakingFactory.deployVaultStaking(vault);
    address staking2 = vaultStakingFactory.deployVaultStaking(vault);

    // Check that the staking got deployed
    assertTrue(staking1 != staking2);
  }

  /* Setting Factory Staking Implementation */

  function test__setStakingImplementationNotOwnerReverts() public {
    vm.stopPrank();
    vm.expectRevert("Only the contract owner may perform this action");
    vaultStakingFactory.setStakingImplementation(address(0x4444));
  }

  function test__setStakingImplementation() public {
    vaultStakingFactory.setStakingImplementation(address(0x4444));
    assertEq(vaultStakingFactory.stakingImplementation(), address(0x4444));
  }

  function test__setStakingImplementationEvent() public {
    vm.expectEmit(false, false, false, true, address(vaultStakingFactory));
    emit StakingImplementationUpdated(stakingImplementation, address(0x4444));
    vaultStakingFactory.setStakingImplementation(address(0x4444));
  }
}

// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "../../../../contracts/core/defi/vault/VaultStakingFactory.sol";
import "../../../../contracts/core/defi/vault/VaultStaking.sol";
import "../../../../contracts/core/interfaces/IContractRegistry.sol";

address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;
address constant CRV_3CRYPTO = 0xc4AD29ba4B3c580e6D59105FFf484999997675Ff;
address constant CRV_ECRV = 0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c;

contract VaultStakingFactoryTest is Test {
  event VaultStakingDeployment(address staking);
  event ImplementationUpdated(address oldVaultStakingImplementation, address newVaultStakingImplementation);

  VaultStakingFactory internal vaultStakingFactory;

  address internal stakingImplementation;
  address internal notOwner = makeAddr("notOwner");
  address internal VAULT;
  address NEW_IMPLEMENTATION = makeAddr("implementation");

  function setUp() public {
    vaultStakingFactory = new VaultStakingFactory(address(this), IContractRegistry(CONTRACT_REGISTRY));
    stakingImplementation = address(new VaultStaking());

    VAULT = helper__deployVault(CRV_3CRYPTO);

    vaultStakingFactory.setImplementation(stakingImplementation);

    vm.label(address(this), "VaultsV1ControllerOwner");
    vm.label(notOwner, "notOwner");
    vm.label(address(vaultStakingFactory), "VaultsV1Factory");
  }

  /* ========== FUNCTIONS TESTS ========== */

  function helper__deployVault(address asset) public returns (address vault) {
    vault = address(new Vault());
    Vault(vault).initialize(
      ERC20(asset),
      IERC4626(address(0x4444)),
      IContractRegistry(CONTRACT_REGISTRY),
      Vault.FeeStructure({ deposit: 1, withdrawal: 1, management: 1, performance: 1 }),
      KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1, keeperPayout: 9 })
    );
  }

  function test__deployNotOwnerReverts() public {
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");

    address staking = vaultStakingFactory.deploy(VAULT);
    assertEq(staking, address(0), "staking deployment failed");
  }

  function test__deploy() public {
    vm.expectEmit(false, false, false, true, address(vaultStakingFactory));
    emit VaultStakingDeployment(0x037FC82298142374d974839236D2e2dF6B5BdD8F);

    address staking = vaultStakingFactory.deploy(VAULT);

    // Check that the staking got deployed
    assertEq(staking, address(0x037FC82298142374d974839236D2e2dF6B5BdD8F));
  }

  function test__deployMultipleVaultStakingContracts() public {
    address staking1 = vaultStakingFactory.deploy(VAULT);
    address staking2 = vaultStakingFactory.deploy(helper__deployVault(CRV_ECRV));

    // Check that the staking got deployed
    assertTrue(staking1 != staking2);
  }

  /* Setting Factory Staking Implementation */

  function test__setImplementationNotOwnerReverts() public {
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultStakingFactory.setImplementation(NEW_IMPLEMENTATION);
  }

  function test__setImplementation() public {
    vaultStakingFactory.setImplementation(NEW_IMPLEMENTATION);
    assertEq(vaultStakingFactory.implementation(), NEW_IMPLEMENTATION);
  }

  function test__setImplementationEvent() public {
    vm.expectEmit(false, false, false, true, address(vaultStakingFactory));
    emit ImplementationUpdated(stakingImplementation, NEW_IMPLEMENTATION);
    vaultStakingFactory.setImplementation(NEW_IMPLEMENTATION);
  }
}

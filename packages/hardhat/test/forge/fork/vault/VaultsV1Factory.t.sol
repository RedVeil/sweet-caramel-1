// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "../../../../contracts/core/defi/vault/VaultsV1Factory.sol";
import "../../../../contracts/core/defi/vault/Vault.sol";
import { VaultParams } from "../../../../contracts/core/defi/vault/VaultsV1Factory.sol";
import { VaultMetadata } from "../../../../contracts/core/defi/vault/VaultsV1Registry.sol";
import { KeeperConfig } from "../../../../contracts/core/utils/KeeperIncentivized.sol";

address constant CRV_3CRYPTO = 0xc4AD29ba4B3c580e6D59105FFf484999997675Ff;
address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;

contract VaultsV1FactoryTest is Test {
  event VaultV1Deployment(address vault);
  event VaultImplementationUpdated(address oldVaultImplementation, address newVaultImplementation);

  VaultsV1Factory internal vaultsV1Factory;

  address internal vaultImplementation;
  address internal notOwner = address(0x1234);

  VaultParams public vaultParams =
    VaultParams({
      asset: CRV_3CRYPTO,
      strategy: address(0x4444),
      contractRegistry: IContractRegistry(CONTRACT_REGISTRY),
      feeStructure: Vault.FeeStructure({
        deposit: 50 * 1e14,
        withdrawal: 50 * 1e14,
        management: 200 * 1e14,
        performance: 2000 * 1e14
      }),
      keeperConfig: KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1, keeperPayout: 9 })
    });

  function setUp() public {
    vaultsV1Factory = new VaultsV1Factory(address(this));
    vaultImplementation = address(new Vault());

    vaultsV1Factory.setVaultImplementation(vaultImplementation);

    vm.label(address(this), "VaultsV1ControllerOwner");
    vm.label(notOwner, "notOwner");
    vm.label(address(vaultsV1Factory), "VaultsV1Factory");
  }

  /* ========== FUNCTIONS TESTS ========== */

  function test__deployVaultV1NotOwnerReverts() public {
    vm.stopPrank();
    vm.expectRevert("Only the contract owner may perform this action");

    address vault = vaultsV1Factory.deployVaultV1(vaultParams);
    assertEq(vault, address(0), "vault deployment failed");
  }

  function test__deployVaultV1() public {
    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    emit VaultV1Deployment(0x037FC82298142374d974839236D2e2dF6B5BdD8F);

    address vault = vaultsV1Factory.deployVaultV1(vaultParams);

    // Check that the vault got deployed
    assertEq(vault, address(0x037FC82298142374d974839236D2e2dF6B5BdD8F));
  }

  function test__deployMultipleVaults() public {
    address vault1 = vaultsV1Factory.deployVaultV1(vaultParams);
    address vault2 = vaultsV1Factory.deployVaultV1(vaultParams);

    // Check that the vault got deployed
    assertTrue(vault1 != vault2);
  }

  /* Setting Factory Vault Implementation */

  function test__setVaultImplementationNotOwnerReverts() public {
    vm.stopPrank();
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Factory.setVaultImplementation(address(0x4444));
  }

  function test__setVaultImplementation() public {
    vaultsV1Factory.setVaultImplementation(address(0x4444));
    assertEq(vaultsV1Factory.vaultImplementation(), address(0x4444));
  }

  function test__setVaultImplementationEvent() public {
    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    emit VaultImplementationUpdated(vaultImplementation, address(0x4444));
    vaultsV1Factory.setVaultImplementation(address(0x4444));
  }
}

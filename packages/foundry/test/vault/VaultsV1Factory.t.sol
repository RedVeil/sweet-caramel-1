// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "../../../../contracts/core/defi/vault/VaultsV1Factory.sol";
import "../../../../contracts/core/defi/vault/Vault.sol";
import { VaultParams } from "../../../../contracts/core/defi/vault/VaultsV1Factory.sol";
import { VaultMetadata } from "../../../../contracts/core/defi/vault/VaultsV1Registry.sol";
import { KeeperConfig } from "../../../../contracts/core/utils/KeeperIncentivized.sol";
import { MockERC4626 } from "../../mocks/MockERC4626.sol";

address constant CRV_3CRYPTO = 0xc4AD29ba4B3c580e6D59105FFf484999997675Ff;
address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;

contract VaultsV1FactoryTest is Test {
  event VaultV1Deployment(address vault);
  event ImplementationUpdated(address oldImplementation, address newImplementation);

  VaultsV1Factory internal vaultsV1Factory;

  address internal vaultImplementation;
  address internal notOwner = makeAddr("notOwner");
  address internal STRATEGY;
  address NEW_IMPLEMENTATION = makeAddr("implementation");

  VaultParams public vaultParams;

  function setUp() public {
    uint256 forkId = vm.createSelectFork(vm.rpcUrl("FORKING_RPC_URL"), 15008113);
    vm.selectFork(forkId);

    STRATEGY = address(new MockERC4626(ERC20(CRV_3CRYPTO), "Mock Token Vault", "vwTKN"));
    vaultsV1Factory = new VaultsV1Factory(address(this));
    vaultImplementation = address(new Vault());

    vaultsV1Factory.setImplementation(vaultImplementation);

    vaultParams = VaultParams({
      asset: ERC20(CRV_3CRYPTO),
      strategy: IERC4626(STRATEGY),
      contractRegistry: IContractRegistry(CONTRACT_REGISTRY),
      feeStructure: Vault.FeeStructure({
        deposit: 50 * 1e14,
        withdrawal: 50 * 1e14,
        management: 200 * 1e14,
        performance: 2000 * 1e14
      }),
      keeperConfig: KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1, keeperPayout: 9 })
    });

    vm.label(address(this), "VaultsV1ControllerOwner");
    vm.label(notOwner, "notOwner");
    vm.label(address(vaultsV1Factory), "VaultsV1Factory");
  }

  /* ========== FUNCTIONS TESTS ========== */

  function test__deployNotOwnerReverts() public {
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");

    address vault = vaultsV1Factory.deploy(vaultParams);
    assertEq(vault, address(0), "vault deployment failed");
  }

  function test__deploy() public {
    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    emit VaultV1Deployment(0x9cC6334F1A7Bc20c9Dde91Db536E194865Af0067);

    address vault = vaultsV1Factory.deploy(vaultParams);

    // Check that the vault got deployed
    assertEq(vault, address(0x9cC6334F1A7Bc20c9Dde91Db536E194865Af0067));
  }

  function test__deployMultipleVaults() public {
    address vault1 = vaultsV1Factory.deploy(vaultParams);
    address vault2 = vaultsV1Factory.deploy(vaultParams);

    // Check that the vault got deployed
    assertTrue(vault1 != vault2);
  }

  /* Setting Factory Vault Implementation */

  function test__setImplementationNotOwnerReverts() public {
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Factory.setImplementation(NEW_IMPLEMENTATION);
  }

  function test__setImplementation() public {
    vaultsV1Factory.setImplementation(NEW_IMPLEMENTATION);
    assertEq(vaultsV1Factory.implementation(), NEW_IMPLEMENTATION);
  }

  function test__setImplementationEvent() public {
    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    emit ImplementationUpdated(vaultImplementation, NEW_IMPLEMENTATION);
    vaultsV1Factory.setImplementation(NEW_IMPLEMENTATION);
  }
}
// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "../../src/vault/VaultsFactory.sol";
import "../../src/vault/Vault.sol";
import { VaultParams } from "../../src/vault/VaultsController.sol";
import { VaultMetadata } from "../../src/vault/VaultsRegistry.sol";
import { KeeperConfig } from "../../src/utils/KeeperIncentivized.sol";
import { MockERC4626 } from "../utils/mocks/MockERC4626.sol";

address constant CRV_3CRYPTO = 0xc4AD29ba4B3c580e6D59105FFf484999997675Ff;
address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;

contract VaultsFactoryTest is Test {
  event VaultV1Deployment(address vault);
  event ImplementationUpdated(address oldImplementation, address newImplementation);

  VaultsFactory internal vaultsFactory;

  address internal vaultImplementation;
  address internal notOwner = makeAddr("notOwner");
  address internal STRATEGY;
  address NEW_IMPLEMENTATION = makeAddr("implementation");

  VaultParams public vaultParams;

  function setUp() public {
    uint256 forkId = vm.createSelectFork(vm.rpcUrl("FORKING_RPC_URL"), 15008113);
    vm.selectFork(forkId);

    STRATEGY = address(new MockERC4626(ERC20(CRV_3CRYPTO), "Mock Token Vault", "vwTKN"));

    vaultsFactory = new VaultsFactory{ salt: keccak256("vaultFactory") }(address(this));
    vaultImplementation = address(new Vault{ salt: keccak256("vaultImplementation") }());

    vaultsFactory.setImplementation(vaultImplementation);

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

    vm.label(address(this), "VaultsControllerOwner");
    vm.label(notOwner, "notOwner");
    vm.label(address(vaultsFactory), "VaultsFactory");
  }

  /* ========== FUNCTIONS TESTS ========== */

  function test__deployNotOwnerReverts() public {
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");

    address vault = vaultsFactory.deploy(vaultParams, 0);
    assertEq(vault, address(0), "vault deployment failed");
  }

  function test__deploy() public {
    vm.expectEmit(false, false, false, true, address(vaultsFactory));
    emit VaultV1Deployment(0x18b791a1B770264684c487b33A7494BA17Fd018f);

    address vault = vaultsFactory.deploy(vaultParams);

    // Check that the vault got deployed
    assertEq(vault, address(0x18b791a1B770264684c487b33A7494BA17Fd018f));
  }

  function test__deployMultipleVaults() public {
    address vault1 = vaultsFactory.deploy(vaultParams);
    address vault2 = vaultsFactory.deploy(vaultParams);

    // Check that the vault got deployed
    assertTrue(vault1 != vault2);
  }

  /* Setting Factory Vault Implementation */

  function test__setImplementationNotOwnerReverts() public {
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsFactory.setImplementation(NEW_IMPLEMENTATION);
  }

  function test__setImplementation() public {
    vaultsFactory.setImplementation(NEW_IMPLEMENTATION);
    assertEq(vaultsFactory.implementation(), NEW_IMPLEMENTATION);
  }

  function test__setImplementationEvent() public {
    vm.expectEmit(false, false, false, true, address(vaultsFactory));
    emit ImplementationUpdated(vaultImplementation, NEW_IMPLEMENTATION);
    vaultsFactory.setImplementation(NEW_IMPLEMENTATION);
  }
}

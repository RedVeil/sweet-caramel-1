// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "../../../contracts/core/defi/vault/VaultsV1Factory.sol";
import "../../../contracts/core/defi/vault/VaultsV1Registry.sol";
import "../../../contracts/core/defi/vault/Vault.sol";
import "../../../contracts/core/defi/vault/VaultStaking.sol";
import "../../../contracts/core/utils/ContractRegistryAccess.sol";
import "../../../contracts/core/interfaces/IStaking.sol";
import { VaultParams } from "../../../contracts/core/defi/vault/VaultsV1Factory.sol";
import { VaultMetadata } from "../../../contracts/core/defi/vault/VaultsV1Registry.sol";
import { KeeperConfig } from "../../../contracts/core/utils/KeeperIncentivized.sol";
import "../../../contracts/core/defi/vault/VaultsV1Controller.sol";
import "../../../contracts/core/interfaces/IContractRegistry.sol";
import "../../../contracts/core/interfaces/IACLRegistry.sol";

address constant CRV_3CRYPTO = 0xc4AD29ba4B3c580e6D59105FFf484999997675Ff;
address constant YEARN_REGISTRY = 0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804;
address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;
address constant ACL_REGISTRY = 0x8A41aAa4B467ea545DDDc5759cE3D35984F093f4;
address constant ACL_ADMIN = 0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f;
address constant CURVE_ZAP_IN = 0x5Ce9b49B7A1bE9f2c3DC2B2A5BaCEA56fa21FBeE;
address constant CURVE_ZAP_OUT = 0xE03A338d5c305613AfC3877389DD3B0617233387;
address constant POP = 0xD0Cd466b34A24fcB2f87676278AF2005Ca8A78c4;

contract VaultsV1FactoryTest is Test {
  event VaultV1Deployment(address vault, address vaultStaking);
  event VaultImplementationUpdated(address oldVaultImplementation, address newVaultImplementation);
  event StakingImplementationUpdated(address oldStakingImplementation, address newStakingImplementation);

  VaultsV1Controller public vaultsV1Controller;
  VaultsV1Factory public vaultsV1Factory;
  VaultsV1Registry public vaultsV1Registry;
  address public vaultImplementation;
  address public stakingImplementation;
  address public vaultsV1ControllerOwner = address(this);
  address public notOwner = address(0x1234);

  uint256 constant DEPOSIT_FEE = 50 * 1e14;
  uint256 constant WITHDRAWAL_FEE = 50 * 1e14;
  uint256 constant MANAGEMENT_FEE = 200 * 1e14;
  uint256 constant PERFORMANCE_FEE = 2000 * 1e14;

  VaultParams public vaultParams =
    VaultParams({
      token: CRV_3CRYPTO,
      yearnRegistry: YEARN_REGISTRY,
      contractRegistry: IContractRegistry(CONTRACT_REGISTRY),
      staking: address(0),
      zapper: address(0x7777),
      feeStructure: Vault.FeeStructure({
        deposit: DEPOSIT_FEE,
        withdrawal: WITHDRAWAL_FEE,
        management: MANAGEMENT_FEE,
        performance: PERFORMANCE_FEE
      }),
      keeperConfig: KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1, keeperPayout: 9 })
    });

  address[8] public swapTokenAddresses;

  function setUp() public {
    vaultsV1Factory = new VaultsV1Factory(address(this));
    vaultsV1Registry = new VaultsV1Registry(address(this));
    vaultsV1Controller = new VaultsV1Controller(address(this), IContractRegistry(CONTRACT_REGISTRY));
    vaultImplementation = address(new Vault());
    stakingImplementation = address(new VaultStaking());

    vaultsV1Factory.setVaultImplementation(vaultImplementation);
    vaultsV1Factory.setStakingImplementation(stakingImplementation);

    vm.startPrank(ACL_ADMIN);
    IContractRegistry(CONTRACT_REGISTRY).addContract(
      vaultsV1Registry.contractName(),
      address(vaultsV1Registry),
      keccak256("1")
    );
    IContractRegistry(CONTRACT_REGISTRY).addContract(
      vaultsV1Factory.contractName(),
      address(vaultsV1Factory),
      keccak256("1")
    );
    IContractRegistry(CONTRACT_REGISTRY).addContract(
      vaultsV1Controller.contractName(),
      address(vaultsV1Controller),
      keccak256("1")
    );
    vm.stopPrank();

    vaultsV1Factory.nominateNewOwner(address(vaultsV1Controller));
    vaultsV1Registry.nominateNewOwner(address(vaultsV1Controller));
    vaultsV1Controller.acceptRegistryFactoryOwnership();

    assertEq(vaultsV1Registry.owner(), address(vaultsV1Controller));
    assertEq(vaultsV1Factory.owner(), address(vaultsV1Controller));

    // start ongoing prank as VaultsV1Controller
    vm.startPrank(address(vaultsV1Controller));

    vm.label(address(this), "VaultsV1ControllerOwner");
    vm.label(notOwner, "notOwner");
    vm.label(address(vaultsV1Controller), "VaultsV1Controller");
    vm.label(address(vaultsV1Factory), "VaultsV1Factory");
    vm.label(address(vaultsV1Registry), "VaultsV1Registry");

    for (uint256 i = 0; i < 8; i++) {
      swapTokenAddresses[i] = address(uint160(i));
    }
  }

  /* ========== FUNCTIONS TESTS ========== */

  function test__deployVaultV1NotOwnerReverts() public {
    vm.stopPrank();
    vm.expectRevert("Only the contract owner may perform this action");
    address[2] memory contractAddresses = vaultsV1Factory.deployVaultV1(vaultParams);
    assertEq(contractAddresses[0], address(0), "vault deployment failed");

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    address[2] memory _contractAddresses = vaultsV1Factory.deployVaultV1(vaultParams);
    assertEq(_contractAddresses[0], address(0));
  }

  function test__deployVaultV1WithStaking() public {
    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    emit VaultV1Deployment(
      0x037FC82298142374d974839236D2e2dF6B5BdD8F,
      address(0x566B72091192CCd7013AdF77E2a1b349564acC21)
    );
    address[2] memory contractAddresses = vaultsV1Factory.deployVaultV1(vaultParams);

    // Check that the vault got deployed
    assertTrue(contractAddresses[0] != address(0));
    assertEq(contractAddresses[1], address(0x566B72091192CCd7013AdF77E2a1b349564acC21));

    emit log_named_address("VaultV1Deployment", contractAddresses[0]);

    // Test Staking Properties
    Vault vault = Vault(contractAddresses[0]);
    assertTrue(vault.staking() == address(0));
  }

  function test__deployMultipleVaults() public {
    address[2] memory contractAddresses1 = vaultsV1Factory.deployVaultV1(vaultParams);
    address[2] memory contractAddresses2 = vaultsV1Factory.deployVaultV1(vaultParams);

    // Check that the vault got deployed
    assertTrue(contractAddresses1[0] != contractAddresses2[0]);
    assertTrue(contractAddresses1[1] != contractAddresses2[1]);
  }

  function test__deployVaultV1WithoutStaking() public {
    vaultParams.staking = address(0x4444);

    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    emit VaultV1Deployment(0x037FC82298142374d974839236D2e2dF6B5BdD8F, address(0x4444));
    address[2] memory contractAddresses = vaultsV1Factory.deployVaultV1(vaultParams);

    // Check that the vault got deployed
    assertTrue(contractAddresses[0] != address(0));
    assertEq(contractAddresses[1], address(0x4444));

    emit log_named_address("VaultV1Deployment", contractAddresses[0]);

    // Test Staking Properties
    Vault vault = Vault(contractAddresses[0]);
    assertTrue(vault.staking() == address(0x4444));
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

  /* Setting Factory Staking Implementation */

  function test__setStakingImplementationNotOwnerReverts() public {
    vm.stopPrank();
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Factory.setStakingImplementation(address(0x4444));
  }

  function test__setStakingImplementation() public {
    vaultsV1Factory.setStakingImplementation(address(0x4444));
    assertEq(vaultsV1Factory.stakingImplementation(), address(0x4444));
  }

  function test__setStakingImplementationEvent() public {
    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    emit StakingImplementationUpdated(stakingImplementation, address(0x4444));
    vaultsV1Factory.setStakingImplementation(address(0x4444));
  }
}

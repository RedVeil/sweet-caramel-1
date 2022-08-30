// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@ecmendenhall/forge-std/src/Test.sol";

import "../../../contracts/core/defi/vault/VaultsV1Factory.sol";
import "../../../contracts/core/defi/vault/VaultsV1Registry.sol";
import "../../../contracts/core/defi/vault/Vault.sol";
import "../../../contracts/core/utils/ContractRegistryAccess.sol";
import { VaultParams } from "../../../contracts/core/defi/vault/VaultsV1Factory.sol";
import { VaultMetadata } from "../../../contracts/core/defi/vault/VaultsV1Registry.sol";
import "../../../contracts/core/defi/vault/VaultsV1Controller.sol";
import "../../../contracts/core/interfaces/IContractRegistry.sol";
import "../../../contracts/core/interfaces/IACLRegistry.sol";

address constant CRV_3CRYPTO = 0xc4AD29ba4B3c580e6D59105FFf484999997675Ff;
address constant YEARN_REGISTRY = 0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804;
address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;
address constant ACL_REGISTRY = 0x8A41aAa4B467ea545DDDc5759cE3D35984F093f4;
address constant ACL_ADMIN = 0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f;

contract VaultsV1FactoryTest is Test {
  event VaultV1Deployment(address vaultAddress);

  VaultsV1Controller public vaultsV1Controller;
  VaultsV1Factory public vaultsV1Factory;
  VaultsV1Registry public vaultsV1Registry;
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
      feeStructure: Vault.FeeStructure({
        deposit: DEPOSIT_FEE,
        withdrawal: WITHDRAWAL_FEE,
        management: MANAGEMENT_FEE,
        performance: PERFORMANCE_FEE
      }),
      keeperConfig: Vault.KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1, keeperPayout: 9 })
    });

  address[8] public swapTokenAddresses;

  function setUp() public {
    vaultsV1Factory = new VaultsV1Factory(address(this));
    vaultsV1Registry = new VaultsV1Registry(address(this));
    vaultsV1Controller = new VaultsV1Controller(address(this), IContractRegistry(CONTRACT_REGISTRY));
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
    (VaultMetadata memory metadata, address vault) = vaultsV1Factory.deployVaultV1(
      vaultParams,
      true,
      address(0x1111),
      vaultsV1ControllerOwner,
      "someCID",
      swapTokenAddresses,
      address(0x2222),
      1
    );
    assertEq(vault, address(0), "vault deployment failed");
    assertEq(metadata.vaultAddress, address(0), "metadata not constructed");
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    (VaultMetadata memory _metadata, address _vault) = vaultsV1Factory.deployVaultV1(
      vaultParams,
      true,
      address(0x1111),
      vaultsV1ControllerOwner,
      "someCID",
      swapTokenAddresses,
      address(0x2222),
      1
    );
    assertEq(_vault, address(0));
    assertEq(_metadata.vaultAddress, address(0));
  }

  function test__deployVaultV1() public {
    (VaultMetadata memory metadata, address vault) = vaultsV1Factory.deployVaultV1({
      _vaultParams: vaultParams,
      _enabled: true,
      _stakingAddress: address(0x1111),
      _submitter: vaultsV1ControllerOwner,
      _metadataCID: "someCID",
      _swapTokenAddresses: swapTokenAddresses,
      _swapAddress: address(0x2222),
      _exchange: 1
    });
    assertTrue(vault != address(0));
    emit log_named_address("VaultV1Deployment", vault);
    assertEq(metadata.vaultAddress, vault);
    assertEq(metadata.vaultType, 1);
    assertEq(metadata.enabled, true);
    assertEq(metadata.stakingAddress, address(0x1111));
    assertEq(metadata.submitter, vaultsV1ControllerOwner);
    assertEq(metadata.metadataCID, "someCID");
    for (uint256 i = 0; i < 8; i++) {
      assertEq(metadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(metadata.swapAddress, address(0x2222));
    assertEq(metadata.exchange, 1);
  }

  function test__deployVaultV1Event() public {
    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    emit VaultV1Deployment(0x037FC82298142374d974839236D2e2dF6B5BdD8F);
    vaultsV1Factory.deployVaultV1(
      vaultParams,
      true,
      address(0x1111),
      vaultsV1ControllerOwner,
      "someCID",
      swapTokenAddresses,
      address(0x2222),
      1
    );
  }
}

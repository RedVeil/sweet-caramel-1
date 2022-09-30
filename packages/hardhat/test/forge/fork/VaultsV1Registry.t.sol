// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "../../../contracts/core/defi/vault/VaultsV1Factory.sol";
import { VaultParams } from "../../../contracts/core/defi/vault/VaultsV1Factory.sol";
import "../../../contracts/core/defi/vault/VaultsV1Registry.sol";
import { VaultMetadata } from "../../../contracts/core/defi/vault/VaultsV1Registry.sol";
import { KeeperConfig } from "../../../contracts/core/utils/KeeperIncentivized.sol";
import "../../../contracts/core/defi/vault/Vault.sol";
import "../../../contracts/core/defi/vault/VaultsV1Controller.sol";
import "../../../contracts/core/interfaces/IContractRegistry.sol";
import "../../../contracts/core/interfaces/IEIP4626.sol";
import "../../../contracts/core/utils/KeeperIncentiveV2.sol";
import "../../../contracts/core/dao/RewardsEscrow.sol";
import "../../../contracts/core/interfaces/IRewardsEscrow.sol";

address constant CRV_3CRYPTO = 0xc4AD29ba4B3c580e6D59105FFf484999997675Ff;
address constant CRV_3CRV = 0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490;
address constant YEARN_REGISTRY = 0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804;
address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;
address constant ACL_REGISTRY = 0x8A41aAa4B467ea545DDDc5759cE3D35984F093f4;
address constant ACL_ADMIN = 0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f;
address constant CURVE_ZAP_IN = 0x5Ce9b49B7A1bE9f2c3DC2B2A5BaCEA56fa21FBeE;
address constant CURVE_ZAP_OUT = 0xE03A338d5c305613AfC3877389DD3B0617233387;
address constant POP = 0xD0Cd466b34A24fcB2f87676278AF2005Ca8A78c4;

contract VaultsV1RegistryTest is Test {
  event VaultAdded(address vaultAddress, uint256 vaultType, bool enabled, string metadataCID);
  event VaultUpdated(address vaultAddress, uint256 vaultType, bool enabled, string metadataCID);
  event VaultTypeAdded(uint256 vaultTypes);
  event VaultStatusChanged(address vaultAddress, bool endorsed, bool enabled);

  VaultsV1Registry public vaultsV1Registry;
  VaultsV1Factory public vaultsV1Factory;
  VaultsV1Controller public vaultsV1Controller;
  KeeperIncentiveV2 public keeperIncentive;
  RewardsEscrow public rewardsEscrow;

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
      staking: address(0x1111),
      zapper: address(0),
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
    keeperIncentive = new KeeperIncentiveV2(IContractRegistry(CONTRACT_REGISTRY), 25e16, 2000 ether);
    rewardsEscrow = new RewardsEscrow(IERC20(POP));
    rewardsEscrow.transferOwnership(address(vaultsV1Controller));

    vm.startPrank(ACL_ADMIN);
    IContractRegistry(CONTRACT_REGISTRY).addContract(
      vaultsV1Registry.contractName(),
      address(vaultsV1Registry),
      keccak256("1")
    );
    IContractRegistry(CONTRACT_REGISTRY).addContract(
      keccak256("VaultRewardsEscrow"),
      address(rewardsEscrow),
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
    IContractRegistry(CONTRACT_REGISTRY).updateContract(
      keccak256("KeeperIncentive"),
      address(keeperIncentive),
      keccak256("2")
    );
    IACLRegistry(ACL_REGISTRY).grantRole(keccak256("VaultsController"), address(vaultsV1Controller));
    IACLRegistry(ACL_REGISTRY).grantRole(keccak256("INCENTIVE_MANAGER_ROLE"), address(vaultsV1Controller));
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
    vm.label(address(keeperIncentive), "KeeperIncentive");

    for (uint256 i = 0; i < 8; i++) {
      swapTokenAddresses[i] = address(uint160(i));
    }
  }

  /* ========== HELPER FUNCTIONS ========== */
  function helper__addVaultTypesToRegistry(uint256 _vaultTypes) public {
    for (uint256 i = 2; i <= _vaultTypes; i++) {
      vaultsV1Registry.addVaultType(i);
    }
    assertEq(vaultsV1Registry.vaultTypes(), _vaultTypes);
  }

  function helper__deployThroughFactory(bool _endorsed) public returns (address) {
    vm.stopPrank();
    vm.startPrank(vaultsV1ControllerOwner);
    address deployedVault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      _endorsed,
      "someCID",
      swapTokenAddresses,
      address(0x7777),
      1,
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );
    VaultMetadata memory metadata = vaultsV1Registry.getVault(deployedVault);
    assertEq(metadata.vaultAddress, deployedVault);
    assertEq(metadata.submitter, address(this));
    assertEq(vaultsV1Registry.endorsed(deployedVault), _endorsed);
    vm.stopPrank();
    vm.startPrank(address(vaultsV1Controller));
    return deployedVault;
  }

  function helper__deployVault(uint256 _vaultType) public returns (Vault, VaultMetadata memory) {
    Vault vault = new Vault(
      CRV_3CRYPTO,
      YEARN_REGISTRY,
      IContractRegistry(CONTRACT_REGISTRY),
      address(0),
      address(0),
      Vault.FeeStructure({
        deposit: DEPOSIT_FEE,
        withdrawal: WITHDRAWAL_FEE,
        management: MANAGEMENT_FEE,
        performance: PERFORMANCE_FEE
      }),
      KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1, keeperPayout: 9 })
    );
    VaultMetadata memory metadata = VaultMetadata({
      vaultAddress: address(vault),
      vaultType: _vaultType,
      enabled: true,
      staking: address(0x1111),
      vaultZapper: address(0x9999),
      submitter: address(this),
      metadataCID: "someCID",
      swapTokenAddresses: swapTokenAddresses,
      swapAddress: address(0x2222),
      exchange: 1,
      zapIn: CURVE_ZAP_IN,
      zapOut: CURVE_ZAP_OUT
    });
    assertEq(metadata.vaultAddress, address(vault));
    return (vault, metadata);
  }

  function helper__deployMultipleVaultsAndRegister(
    address _asset,
    uint256 _amount,
    bool _endorsed
  ) public returns (address[] memory) {
    vm.stopPrank();
    vm.startPrank(address(vaultsV1ControllerOwner));
    uint256 prevAmount = vaultsV1Registry.getTotalVaults();
    vaultParams.token = _asset;
    address[] memory deployedVaults = new address[](_amount);
    for (uint256 i = 0; i < _amount; i++) {
      address deployedVault = vaultsV1Controller.deployVaultFromV1Factory(
        vaultParams,
        _endorsed,
        "someCID",
        swapTokenAddresses,
        address(0x7777),
        1,
        CURVE_ZAP_IN,
        CURVE_ZAP_OUT
      );
      deployedVaults[i] = deployedVault;
    }
    assertEq(vaultsV1Registry.getTotalVaults(), prevAmount + _amount);
    vm.stopPrank();
    vm.startPrank(address(vaultsV1Controller));
    return deployedVaults;
  }

  /* ========== MUTATIVE FUNCTIONS TESTS ========== */

  /* Adding vault type */
  function test__addVaultTypeNotOwnerReverts() public {
    vm.stopPrank();
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Registry.addVaultType(2);
    assertEq(vaultsV1Registry.vaultTypes(), 1);
    vm.stopPrank();
  }

  function test__addVaultTypeIncorrectTypeReverts() public {
    vm.expectRevert("incorrect vault type");
    vaultsV1Registry.addVaultType(0);
    vm.expectRevert("incorrect vault type");
    vaultsV1Registry.addVaultType(1);
    vm.expectRevert("incorrect vault type");
    vaultsV1Registry.addVaultType(3);
    assertEq(vaultsV1Registry.vaultTypes(), 1);
  }

  function test__addVaultType() public {
    vaultsV1Registry.addVaultType(2);
    assertEq(vaultsV1Registry.vaultTypes(), 2);
    vaultsV1Registry.addVaultType(3);
    assertEq(vaultsV1Registry.vaultTypes(), 3);
  }

  function test__addVaultTypeEvent() public {
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultTypeAdded(2);
    vaultsV1Registry.addVaultType(2);
  }

  /* Registering vault */
  function test__registerVaultNotOwnerReverts() public {
    (
      ,
      /*Vault vault*/
      VaultMetadata memory metadata
    ) = helper__deployVault(1);
    vm.stopPrank();
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Registry.registerVault(metadata);
    assertEq(vaultsV1Registry.getTotalVaults(), 0);
    vm.stopPrank();
  }

  function test__registerVaultInvalidVaultTypeReverts() public {
    (
      ,
      /*Vault vault*/
      VaultMetadata memory metadata
    ) = helper__deployVault(1);
    metadata.vaultType = 2;
    vm.expectRevert("invalid vault type");
    vaultsV1Registry.registerVault(metadata);
    assertEq(vaultsV1Registry.getTotalVaults(), 0);
    vm.expectRevert("invalid vault type");
    vaultsV1Registry.getVaultsByType(2);
  }

  function test__registerVaultTypeZeroReverts() public {
    (
      ,
      /*Vault vault*/
      VaultMetadata memory metadata
    ) = helper__deployVault(1);
    metadata.vaultType = 0;
    vm.expectRevert("invalid vault type");
    vaultsV1Registry.registerVault(metadata);
    assertEq(vaultsV1Registry.getTotalVaults(), 0);
    vm.expectRevert("invalid vault type");
    vaultsV1Registry.getVaultsByType(0);
  }

  function test__registerVaultFromController() public {
    (Vault vault, VaultMetadata memory metadata) = helper__deployVault(1);
    assertEq(metadata.vaultAddress, address(vault));
    vaultsV1Registry.registerVault(metadata);
    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(address(vault));
    assertEq(vaultsV1RegistryMetadata.vaultAddress, address(vault));
    assertEq(vaultsV1RegistryMetadata.vaultType, 1);
    assertEq(vaultsV1RegistryMetadata.enabled, true);
    assertEq(vaultsV1RegistryMetadata.staking, address(0x1111));
    assertEq(vaultsV1RegistryMetadata.submitter, address(this));
    assertEq(vaultsV1RegistryMetadata.metadataCID, "someCID");
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsV1RegistryMetadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(vaultsV1RegistryMetadata.swapAddress, address(0x2222));
    assertEq(vaultsV1RegistryMetadata.exchange, 1);
    assertEq(vaultsV1Registry.getTotalVaults(), 1);
    assertEq(vaultsV1Registry.vaultAddresses(0), address(vault));
    assertEq(vaultsV1Registry.getRegisteredAddresses()[0], metadata.vaultAddress);
    assertEq(vaultsV1Registry.assetVaults(vaultParams.token, 0), address(vault));
    assertEq(vaultsV1Registry.getVaultsByAsset(vaultParams.token)[0], metadata.vaultAddress);
    assertEq(vaultsV1Registry.typeVaults(1, 0), address(vault));
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], metadata.vaultAddress);
    assertFalse(vaultsV1Registry.endorsed(address(vault)));
  }

  function test__registerVaultAlreadyRegisteredReverts() public {
    (Vault vault, VaultMetadata memory metadata) = helper__deployVault(1);
    vaultsV1Registry.registerVault(metadata);
    assertEq(metadata.vaultAddress, address(vault));
    vm.expectRevert("vault already registered");
    vaultsV1Registry.registerVault(metadata);
    assertEq(vaultsV1Registry.getTotalVaults(), 1);
  }

  function test__registerVaultEvent() public {
    (Vault vault, VaultMetadata memory metadata) = helper__deployVault(1);
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultAdded(address(vault), 1, true, "someCID");
    vaultsV1Registry.registerVault(metadata);
  }

  /* Updating vault */
  function test__updateVaultNotOwnerReverts() public {
    helper__addVaultTypesToRegistry(3);
    address vault = helper__deployThroughFactory(true);
    address[8] memory newSwapTokenAddresses;
    for (uint256 i = 0; i < 8; i++) {
      newSwapTokenAddresses[i] = address(uint160(i * 2));
    }
    VaultMetadata memory newMetadata = VaultMetadata({
      vaultAddress: vault,
      vaultType: 2,
      enabled: false,
      staking: address(0x4444),
      vaultZapper: address(0x6666),
      submitter: address(this),
      metadataCID: "differentCID",
      swapTokenAddresses: newSwapTokenAddresses,
      swapAddress: address(0x8888),
      exchange: 2,
      zapIn: CURVE_ZAP_IN,
      zapOut: CURVE_ZAP_OUT
    });
    vm.stopPrank();
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Registry.updateVault(newMetadata);
    // check no changes
    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(vault);
    assertEq(vaultsV1RegistryMetadata.vaultAddress, vault);
    assertEq(vaultsV1RegistryMetadata.vaultType, 1);
    assertEq(vaultsV1Registry.typeVaults(1, 0), vault);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], vault);
    assertEq(vaultsV1Registry.getVaultsByType(1).length, 1);
    vm.expectRevert("no vaults of this type");
    vaultsV1Registry.getVaultsByType(2);
    assertEq(vaultsV1RegistryMetadata.enabled, true);
    assertEq(vaultsV1RegistryMetadata.staking, address(0x1111));
    assertEq(vaultsV1RegistryMetadata.submitter, address(this));
    assertEq(vaultsV1RegistryMetadata.metadataCID, "someCID");
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsV1RegistryMetadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(vaultsV1RegistryMetadata.swapAddress, address(0x7777));
    assertEq(vaultsV1RegistryMetadata.exchange, 1);
    vm.stopPrank();
  }

  function test__updateVaultAddressNotRegisteredReverts() public {
    helper__addVaultTypesToRegistry(3);

    address vault = helper__deployThroughFactory(true);

    address[8] memory newSwapTokenAddresses;
    for (uint256 i = 0; i < 8; i++) {
      newSwapTokenAddresses[i] = address(uint160(i * 2));
    }

    address notVault = address(0x7777);

    VaultMetadata memory newMetadata = VaultMetadata({
      vaultAddress: notVault,
      vaultType: 2,
      enabled: false,
      staking: address(0x4444),
      vaultZapper: address(0x6666),
      submitter: address(this),
      metadataCID: "differentCID",
      swapTokenAddresses: newSwapTokenAddresses,
      swapAddress: address(0x8888),
      exchange: 2,
      zapIn: CURVE_ZAP_IN,
      zapOut: CURVE_ZAP_OUT
    });
    assertTrue(vault != notVault);
    assertEq(vaultsV1Registry.getTotalVaults(), 1);
    vm.expectRevert("vault address not registered");
    vaultsV1Registry.updateVault(newMetadata);
    // check no changes
    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(vault);
    assertEq(vaultsV1RegistryMetadata.vaultAddress, vault);
    assertEq(vaultsV1RegistryMetadata.vaultType, 1);
    assertEq(vaultsV1Registry.typeVaults(1, 0), vault);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], vault);
    assertEq(vaultsV1Registry.getVaultsByType(1).length, 1);
    vm.expectRevert("no vaults of this type");
    vaultsV1Registry.getVaultsByType(2);
    assertEq(vaultsV1RegistryMetadata.enabled, true);
    assertEq(vaultsV1RegistryMetadata.staking, address(0x1111));
    assertEq(vaultsV1RegistryMetadata.submitter, address(this));
    assertEq(vaultsV1RegistryMetadata.metadataCID, "someCID");
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsV1RegistryMetadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(vaultsV1RegistryMetadata.swapAddress, address(0x7777), "SwapAddress");
    assertEq(vaultsV1RegistryMetadata.exchange, 1);
  }

  function test__updateVault() public {
    helper__addVaultTypesToRegistry(3);
    address vault = helper__deployThroughFactory(true);
    address[8] memory newSwapTokenAddresses;
    for (uint256 i = 0; i < 8; i++) {
      newSwapTokenAddresses[i] = address(uint160(i * 2));
    }
    VaultMetadata memory newMetadata = VaultMetadata({
      vaultAddress: vault,
      vaultType: 1,
      enabled: false,
      staking: address(0x4444),
      vaultZapper: address(0x6666),
      submitter: address(this),
      metadataCID: "differentCID",
      swapTokenAddresses: newSwapTokenAddresses,
      swapAddress: address(0x8888),
      exchange: 2,
      zapIn: CURVE_ZAP_IN,
      zapOut: CURVE_ZAP_OUT
    });
    vaultsV1Registry.updateVault(newMetadata);
    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(vault);
    assertEq(vaultsV1RegistryMetadata.vaultAddress, vault);
    assertEq(vaultsV1RegistryMetadata.vaultType, 1);
    assertEq(vaultsV1Registry.typeVaults(1, 0), vault);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], vault);
    assertEq(vaultsV1Registry.getVaultsByType(1).length, 1);
    assertEq(vaultsV1RegistryMetadata.enabled, false);
    assertEq(vaultsV1RegistryMetadata.staking, address(0x4444));
    assertEq(vaultsV1RegistryMetadata.submitter, address(this));
    assertEq(vaultsV1RegistryMetadata.metadataCID, "differentCID");
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsV1RegistryMetadata.swapTokenAddresses[i], newSwapTokenAddresses[i]);
    }
    assertEq(vaultsV1RegistryMetadata.swapAddress, address(0x8888));
    assertEq(vaultsV1RegistryMetadata.exchange, 2);
  }

  function test__updateVaultCannotChangeVaultTypeReverts() public {
    helper__addVaultTypesToRegistry(3);
    address vault = helper__deployThroughFactory(true);
    address[8] memory newSwapTokenAddresses;
    for (uint256 i = 0; i < 8; i++) {
      newSwapTokenAddresses[i] = address(uint160(i * 2));
    }
    VaultMetadata memory newMetadata = VaultMetadata({
      vaultAddress: vault,
      vaultType: 2, // attempt to change vault type
      enabled: false,
      staking: address(0x4444),
      vaultZapper: address(0x6666),
      submitter: address(this),
      metadataCID: "differentCID",
      swapTokenAddresses: newSwapTokenAddresses,
      swapAddress: address(0x8888),
      exchange: 2,
      zapIn: CURVE_ZAP_IN,
      zapOut: CURVE_ZAP_OUT
    });
    assertEq(vaultsV1Registry.getVault(vault).vaultType, 1);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], vault);
    assertEq(vaultsV1Registry.getVaultsByType(1).length, 1);
    vm.expectRevert("no vaults of this type");
    vaultsV1Registry.getVaultsByType(2);
    vm.expectRevert("cannot change vault type");
    vaultsV1Registry.updateVault(newMetadata);
    // check no changes
    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(vault);
    assertEq(vaultsV1RegistryMetadata.vaultAddress, vault);
    assertEq(vaultsV1RegistryMetadata.vaultType, 1);
    assertEq(vaultsV1Registry.typeVaults(1, 0), vault);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], vault);
    assertEq(vaultsV1Registry.getVaultsByType(1).length, 1);
    vm.expectRevert("no vaults of this type");
    vaultsV1Registry.getVaultsByType(2);
    assertEq(vaultsV1RegistryMetadata.enabled, true);
    assertEq(vaultsV1RegistryMetadata.staking, address(0x1111));
    assertEq(vaultsV1RegistryMetadata.submitter, address(this));
    assertEq(vaultsV1RegistryMetadata.metadataCID, "someCID");
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsV1RegistryMetadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(vaultsV1RegistryMetadata.swapAddress, address(0x7777));
    assertEq(vaultsV1RegistryMetadata.exchange, 1);
  }

  function test__updateVaultCannotChangeSubmitterReverts() public {
    helper__addVaultTypesToRegistry(3);
    address vault = helper__deployThroughFactory(true);
    address[8] memory newSwapTokenAddresses;
    for (uint256 i = 0; i < 8; i++) {
      newSwapTokenAddresses[i] = address(uint160(i * 2));
    }
    address notSubmitter = address(0x7777);
    VaultMetadata memory newMetadata = VaultMetadata({
      vaultAddress: address(vault),
      vaultType: 1,
      enabled: false,
      staking: address(0x4444),
      vaultZapper: address(0x6666),
      submitter: notSubmitter, // attempt to change submitter
      metadataCID: "differentCID",
      swapTokenAddresses: newSwapTokenAddresses,
      swapAddress: address(0x8888),
      exchange: 2,
      zapIn: CURVE_ZAP_IN,
      zapOut: CURVE_ZAP_OUT
    });
    assertEq((vaultsV1Registry.getVault(vault)).submitter, address(this));
    vm.expectRevert("cannot change submitter");
    vaultsV1Registry.updateVault(newMetadata);
    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(vault);
    // check no changes
    assertEq(vaultsV1RegistryMetadata.vaultAddress, vault);
    assertTrue(vaultsV1RegistryMetadata.submitter != notSubmitter);
    assertEq(vaultsV1RegistryMetadata.submitter, address(this));
    assertEq(vaultsV1RegistryMetadata.vaultType, 1);
    assertEq(vaultsV1RegistryMetadata.enabled, true);
    assertEq(vaultsV1RegistryMetadata.staking, address(0x1111));
    assertEq(vaultsV1RegistryMetadata.metadataCID, "someCID");
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsV1RegistryMetadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(vaultsV1RegistryMetadata.swapAddress, address(0x7777));
    assertEq(vaultsV1RegistryMetadata.exchange, 1);
  }

  function test__updateVaultEvent() public {
    helper__addVaultTypesToRegistry(3);
    address vault = helper__deployThroughFactory(true);
    address[8] memory newSwapTokenAddresses;
    for (uint256 i = 0; i < 8; i++) {
      newSwapTokenAddresses[i] = address(uint160(i * 2));
    }
    VaultMetadata memory newMetadata = VaultMetadata({
      vaultAddress: address(vault),
      vaultType: 1,
      enabled: true,
      staking: address(0x4444),
      vaultZapper: address(0x6666),
      submitter: address(this),
      metadataCID: "differentCID",
      swapTokenAddresses: newSwapTokenAddresses,
      swapAddress: address(0x8888),
      exchange: 2,
      zapIn: CURVE_ZAP_IN,
      zapOut: CURVE_ZAP_OUT
    });
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultUpdated(vault, 1, true, "differentCID");
    vaultsV1Registry.updateVault(newMetadata);
    assertEq(vaultsV1Registry.getVault(vault).metadataCID, "differentCID");
  }

  /* Toggling endorse vault */
  function test__toggleEndorseVaultNotOwnerReverts() public {
    (Vault vault, VaultMetadata memory metadata) = helper__deployVault(1);
    vaultsV1Registry.registerVault(metadata);
    assertFalse(vaultsV1Registry.endorsed(address(vault)));
    vm.stopPrank();
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Registry.toggleEndorseVault(address(vault));
    assertFalse(vaultsV1Registry.endorsed(address(vault)));
    vm.stopPrank();
  }

  function test__toggleEndorseVaultAddressNotRegisteredReverts() public {
    (Vault vault, VaultMetadata memory metadata) = helper__deployVault(1);
    vaultsV1Registry.registerVault(metadata);
    assertFalse(vaultsV1Registry.endorsed(address(vault)));
    address nonRegistered = address(0x7777);
    assertTrue(metadata.vaultAddress != nonRegistered);
    assertEq(vaultsV1Registry.getTotalVaults(), 1);
    vm.expectRevert("vault address not registered");
    vaultsV1Registry.toggleEndorseVault(nonRegistered);
    assertFalse(vaultsV1Registry.endorsed(address(vault)));
  }

  function test__toggleEndorseVault() public {
    (Vault vault, VaultMetadata memory metadata) = helper__deployVault(1);
    vaultsV1Registry.registerVault(metadata);
    assertFalse(vaultsV1Registry.endorsed(address(vault)));
    vaultsV1Registry.toggleEndorseVault(address(vault));
    assertTrue(vaultsV1Registry.endorsed(address(vault)));
    vaultsV1Registry.toggleEndorseVault(address(vault));
    assertFalse(vaultsV1Registry.endorsed(address(vault)));
    vaultsV1Registry.toggleEndorseVault(address(vault));
    assertTrue(vaultsV1Registry.endorsed(address(vault)));
  }

  function test__toggleEndorseVaultEvent() public {
    (Vault vault, VaultMetadata memory metadata) = helper__deployVault(1);
    vaultsV1Registry.registerVault(metadata);
    assertTrue(vaultsV1Registry.getVault(address(vault)).enabled);
    assertFalse(vaultsV1Registry.endorsed(address(vault)));
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultStatusChanged(address(vault), true, true);
    vaultsV1Registry.toggleEndorseVault(address(vault));
    assertTrue(vaultsV1Registry.endorsed(address(vault)));
    assertTrue(vaultsV1Registry.getVault(address(vault)).enabled);
  }

  /* Toggling enable vault */
  function test__toggleEnableVaultNotOwnerReverts() public {
    address vault = helper__deployThroughFactory(true);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
    vm.stopPrank();
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Registry.toggleEnableVault(vault);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
    vm.stopPrank();
  }

  function test__toggleEnableVaultAddressNotRegisteredReverts() public {
    address vault = helper__deployThroughFactory(true);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
    address nonRegistered = address(0x7777);
    assertTrue(vault != nonRegistered);
    assertEq(vaultsV1Registry.getTotalVaults(), 1);
    vm.expectRevert("vault address not registered");
    vaultsV1Registry.toggleEnableVault(nonRegistered);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
  }

  function test__toggleEnableVault() public {
    address vault = helper__deployThroughFactory(true);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
    vaultsV1Registry.toggleEnableVault(vault);
    assertFalse(vaultsV1Registry.getVault(vault).enabled);
    vaultsV1Registry.toggleEnableVault(vault);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
    vaultsV1Registry.toggleEnableVault(vault);
    assertFalse(vaultsV1Registry.getVault(vault).enabled);
  }

  function test__toggleEnableVaultEvent() public {
    address vault = helper__deployThroughFactory(true);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultStatusChanged(vault, true, false);
    vaultsV1Registry.toggleEnableVault(vault);
    assertTrue(vaultsV1Registry.endorsed(vault));
    assertFalse(vaultsV1Registry.getVault(vault).enabled);
  }

  /* ========== VIEW FUNCTIONS TESTS ========== */

  // vm.expectRevert is broken, this test reverts as expected but the test fails anyways.
  // function test__view__getVaultAddressNotRegisteredReverts() public {
  //   address deployedVault = helper__deployThroughFactory(true);
  //   address notVault = address(0x7777);
  //   assertTrue(notVault != deployedVault);
  //   vm.expectRevert("vault address not registered");
  //   vaultsV1Registry.getVault(notVault);
  // }

  function test__view__getVaultsByAssetNoAssetVaultsReverts() public {
    helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, 1, true);
    assertEq(vaultsV1Registry.getTotalVaults(), 1);
    address[] memory _3CRYPTORegistryVaults = vaultsV1Registry.getVaultsByAsset(CRV_3CRYPTO);
    assertEq(_3CRYPTORegistryVaults.length, 1);
    vm.expectRevert("no vaults for this asset");
    vaultsV1Registry.getVaultsByAsset(CRV_3CRV);
  }

  function test__view__getVaultsByAsset() public {
    uint256 _3CRYPTOVaults = 2;
    uint256 _3CRVVaults = 3;
    address[] memory _3CRYPTOVaultAddresses = helper__deployMultipleVaultsAndRegister(
      CRV_3CRYPTO,
      _3CRYPTOVaults,
      true
    );
    address[] memory _3CRVVaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRV, _3CRVVaults, true);
    assertEq(vaultsV1Registry.getTotalVaults(), _3CRYPTOVaults + _3CRVVaults);
    address[] memory _3CRYPTORegistryVaults = vaultsV1Registry.getVaultsByAsset(CRV_3CRYPTO);
    address[] memory _3CRVRegistryVaults = vaultsV1Registry.getVaultsByAsset(CRV_3CRV);
    assertEq(_3CRYPTORegistryVaults.length, _3CRYPTOVaults);
    assertEq(_3CRVRegistryVaults.length, _3CRVVaults);
    for (uint256 i = 0; i < _3CRYPTOVaults; i++) {
      assertEq(_3CRYPTORegistryVaults[i], _3CRYPTOVaultAddresses[i]);
      assertEq(IEIP4626(_3CRYPTORegistryVaults[i]).asset(), CRV_3CRYPTO);
    }
    for (uint256 i = 0; i < _3CRVVaults; i++) {
      assertEq(_3CRVRegistryVaults[i], _3CRVVaultAddresses[i]);
      assertEq(IEIP4626(_3CRVRegistryVaults[i]).asset(), CRV_3CRV);
    }
  }

  function test__view__getVaultsByTypeInvalidTypeReverts() public {
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsV1Registry.vaultTypes(), 2);
    vm.expectRevert("invalid vault type");
    vaultsV1Registry.getVaultsByType(3);
    vm.expectRevert("invalid vault type");
    vaultsV1Registry.getVaultsByType(0);
  }

  function test__view__getVaultsByTypeNoVaultsReverts() public {
    helper__addVaultTypesToRegistry(2);
    helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, 1, true);
    assertEq(vaultsV1Registry.getVaultsByType(1).length, 1);
    assertEq(vaultsV1Registry.vaultTypes(), 2);
    vm.expectRevert("no vaults of this type");
    vaultsV1Registry.getVaultsByType(2);
  }

  function test__view__getVaultsByType() public {
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsV1Registry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vaultsV1Registry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsV1Registry.getTotalVaults(), type1Vaults + type2Vaults);
    address[] memory type1RegistryVaults = vaultsV1Registry.getVaultsByType(1);
    address[] memory type2RegistryVaults = vaultsV1Registry.getVaultsByType(2);
    assertEq(type1RegistryVaults.length, type1Vaults);
    assertEq(type2RegistryVaults.length, type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertEq(type1RegistryVaults[i], type1VaultAddresses[i]);
      assertEq(vaultsV1Registry.getVault(type1RegistryVaults[i]).vaultType, 1);
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertEq(type2RegistryVaults[i], type2VaultAddresses[i]);
      assertEq(vaultsV1Registry.getVault(type2RegistryVaults[i]).vaultType, 2);
    }
  }

  function test__view__getRegisteredAddresses() public {
    uint256 registeredVaults = 3;
    address[] memory vaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, registeredVaults, true);
    assertEq(vaultsV1Registry.getTotalVaults(), registeredVaults);
    assertEq(vaultAddresses.length, registeredVaults);
    address[] memory vaultAddressesFromRegistry = vaultsV1Registry.getRegisteredAddresses();
    assertEq(vaultAddressesFromRegistry.length, registeredVaults);
    for (uint256 i = 0; i < registeredVaults; i++) {
      assertEq(vaultAddressesFromRegistry[i], vaultAddresses[i]);
      assertEq(vaultsV1Registry.getVault(vaultAddressesFromRegistry[i]).vaultAddress, vaultAddressesFromRegistry[i]);
    }
  }

  /* ========== FUZZ TESTS ========== */

  function test__fuzz__addVaultType(uint256 vaultType) public {
    vm.assume(vaultType != vaultsV1Registry.vaultTypes() + 1);
    vm.assume(vaultType > 1);
    vm.expectRevert("incorrect vault type");
    vaultsV1Registry.addVaultType(vaultType);
    assertEq(vaultsV1Registry.vaultTypes(), 1);
  }

  function test__fuzz__view__getVaultsByType(uint256 vaultType) public {
    vm.assume(vaultType != vaultsV1Registry.vaultTypes() + 1);
    vm.assume(vaultType > 1);
    vm.expectRevert("invalid vault type");
    vaultsV1Registry.getVaultsByType(vaultType);
  }
}

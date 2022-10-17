// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "../../../../contracts/core/defi/vault/VaultsV1Factory.sol";
import { VaultParams } from "../../../../contracts/core/defi/vault/VaultsV1Factory.sol";
import "../../../../contracts/core/defi/vault/VaultsV1Registry.sol";
import { VaultMetadata } from "../../../../contracts/core/defi/vault/VaultsV1Registry.sol";
import { KeeperConfig } from "../../../../contracts/core/utils/KeeperIncentivized.sol";
import "../../../../contracts/core/defi/vault/Vault.sol";
import "../../../../contracts/core/defi/vault/VaultsV1Controller.sol";
import "../../../../contracts/core/interfaces/IContractRegistry.sol";
import "../../../../contracts/core/interfaces/IERC4626.sol";
import "../../../../contracts/core/utils/KeeperIncentiveV2.sol";
import "../../../../contracts/core/dao/RewardsEscrow.sol";
import "../../../../contracts/core/interfaces/IRewardsEscrow.sol";
import "../../../../contracts/core/defi/vault/strategies/yearn/YearnWrapper.sol";
import "../../../../contracts/core/interfaces/IERC4626.sol";

address constant CRV_3CRYPTO = 0xc4AD29ba4B3c580e6D59105FFf484999997675Ff;
address constant CRV_3CRV = 0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490;
address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;
address constant YEARN_VAULT = 0xE537B5cc158EB71037D4125BDD7538421981E6AA;

contract VaultsV1RegistryTest is Test {
  event VaultAdded(address vaultAddress, uint256 vaultType, bool enabled, string metadataCID);
  event VaultUpdated(address vaultAddress, uint256 vaultType, bool enabled, string metadataCID);
  event VaultTypeAdded(uint256 vaultTypes);
  event VaultStatusChanged(address vaultAddress, bool endorsed, bool enabled);

  VaultsV1Registry internal vaultsV1Registry;
  VaultsV1Factory internal vaultsV1Factory;
  VaultsV1Controller internal vaultsV1Controller;
  KeeperIncentiveV2 internal keeperIncentive;
  RewardsEscrow internal rewardsEscrow;

  address internal vaultsV1ControllerOwner = address(this);
  address internal notOwner = makeAddr("notOwner");

  address internal YEARN_WRAPPER = makeAddr("yearnWrapper");
  Vault internal DEFAULT_VAULT;
  address internal DEFAULT_VAULT_ADDRESS;
  string internal CID = "SomeCID";
  address internal STAKING = makeAddr("staking");
  address internal SWAP_ADDRESS = makeAddr("swap");
  uint256 internal EXCHANGE = 1;
  address internal ZAPPER = makeAddr("zapper");
  address internal ZAP_IN = makeAddr("zapIn");
  address internal ZAP_OUT = makeAddr("zapOut");

  address[8] internal swapTokenAddresses;

  function setUp() public {
    vaultsV1Registry = new VaultsV1Registry(address(this));

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

  function helper__deployVault(address asset) public returns (address vault) {
    vault = address(new Vault());
    Vault(vault).initialize(
      ERC20(asset),
      IERC4626(YEARN_WRAPPER),
      IContractRegistry(CONTRACT_REGISTRY),
      Vault.FeeStructure({ deposit: 1, withdrawal: 1, management: 1, performance: 1 }),
      KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1, keeperPayout: 9 })
    );
  }

  function helper__deployVaultAndRegister(uint256 _type, bool _enabled) public returns (address vault) {
    vault = helper__deployVault(CRV_3CRYPTO);

    vaultsV1Registry.registerVault(
      VaultMetadata({
        vaultAddress: vault,
        vaultType: _type,
        enabled: _enabled,
        staking: STAKING,
        vaultZapper: ZAPPER,
        submitter: msg.sender,
        metadataCID: CID,
        swapTokenAddresses: swapTokenAddresses,
        swapAddress: SWAP_ADDRESS,
        exchange: EXCHANGE,
        zapIn: ZAP_IN,
        zapOut: ZAP_OUT
      })
    );
  }

  function helper__deployVaultsAndRegister(
    address asset,
    uint256 _amount,
    uint256 _type,
    bool _enabled
  ) public returns (address[] memory vaultAddresses) {
    vaultAddresses = new address[](_amount);
    for (uint256 i = 0; i < _amount; i++) {
      address vault = helper__deployVault(asset);
      vaultAddresses[i] = vault;

      vaultsV1Registry.registerVault(
        VaultMetadata({
          vaultAddress: vault,
          vaultType: _type,
          enabled: _enabled,
          staking: STAKING,
          vaultZapper: ZAPPER,
          submitter: msg.sender,
          metadataCID: CID,
          swapTokenAddresses: swapTokenAddresses,
          swapAddress: SWAP_ADDRESS,
          exchange: EXCHANGE,
          zapIn: ZAP_IN,
          zapOut: ZAP_OUT
        })
      );
    }
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
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Registry.registerVault(
      VaultMetadata({
        vaultAddress: DEFAULT_VAULT_ADDRESS,
        vaultType: 1,
        enabled: true,
        staking: STAKING,
        vaultZapper: ZAPPER,
        submitter: msg.sender,
        metadataCID: CID,
        swapTokenAddresses: swapTokenAddresses,
        swapAddress: SWAP_ADDRESS,
        exchange: EXCHANGE,
        zapIn: ZAP_IN,
        zapOut: ZAP_OUT
      })
    );
  }

  function test__registerVaultInvalidVaultTypeReverts() public {
    vm.expectRevert("invalid vault type");
    vaultsV1Registry.registerVault(
      VaultMetadata({
        vaultAddress: DEFAULT_VAULT_ADDRESS,
        vaultType: 2,
        enabled: true,
        staking: STAKING,
        vaultZapper: ZAPPER,
        submitter: msg.sender,
        metadataCID: CID,
        swapTokenAddresses: swapTokenAddresses,
        swapAddress: SWAP_ADDRESS,
        exchange: EXCHANGE,
        zapIn: ZAP_IN,
        zapOut: ZAP_OUT
      })
    );

    vm.expectRevert("invalid vault type");
    vaultsV1Registry.getVaultsByType(2);
  }

  function test__registerVaultTypeZeroReverts() public {
    vm.expectRevert("invalid vault type");
    vaultsV1Registry.registerVault(
      VaultMetadata({
        vaultAddress: DEFAULT_VAULT_ADDRESS,
        vaultType: 0,
        enabled: true,
        staking: STAKING,
        vaultZapper: ZAPPER,
        submitter: msg.sender,
        metadataCID: CID,
        swapTokenAddresses: swapTokenAddresses,
        swapAddress: SWAP_ADDRESS,
        exchange: EXCHANGE,
        zapIn: ZAP_IN,
        zapOut: ZAP_OUT
      })
    );

    vm.expectRevert("invalid vault type");
    vaultsV1Registry.getVaultsByType(0);
  }

  function test__registerVault() public {
    helper__addVaultTypesToRegistry(3);
    vaultsV1Registry.registerVault(
      VaultMetadata({
        vaultAddress: DEFAULT_VAULT_ADDRESS,
        vaultType: 1,
        enabled: true,
        staking: STAKING,
        vaultZapper: ZAPPER,
        submitter: msg.sender,
        metadataCID: CID,
        swapTokenAddresses: swapTokenAddresses,
        swapAddress: SWAP_ADDRESS,
        exchange: EXCHANGE,
        zapIn: ZAP_IN,
        zapOut: ZAP_OUT
      })
    );
    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(DEFAULT_VAULT_ADDRESS);
    assertEq(vaultsV1RegistryMetadata.vaultAddress, DEFAULT_VAULT_ADDRESS);
    assertEq(vaultsV1RegistryMetadata.vaultType, 1);
    assertEq(vaultsV1RegistryMetadata.enabled, true);
    assertEq(vaultsV1RegistryMetadata.staking, STAKING);
    assertEq(vaultsV1RegistryMetadata.submitter, address(this));
    assertEq(vaultsV1RegistryMetadata.metadataCID, CID);
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsV1RegistryMetadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(vaultsV1RegistryMetadata.swapAddress, SWAP_ADDRESS);
    assertEq(vaultsV1RegistryMetadata.exchange, EXCHANGE);

    assertEq(vaultsV1Registry.getTotalVaults(), 1);
    assertEq(vaultsV1Registry.vaultAddresses(0), DEFAULT_VAULT_ADDRESS);
    assertEq(vaultsV1Registry.getRegisteredAddresses()[0], DEFAULT_VAULT_ADDRESS);
    assertEq(vaultsV1Registry.assetVaults(CRV_3CRYPTO, 0), DEFAULT_VAULT_ADDRESS);
    assertEq(vaultsV1Registry.getVaultsByAsset(CRV_3CRYPTO)[0], DEFAULT_VAULT_ADDRESS);
    assertEq(vaultsV1Registry.typeVaults(1, 0), DEFAULT_VAULT_ADDRESS);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], DEFAULT_VAULT_ADDRESS);
    assertFalse(vaultsV1Registry.endorsed(DEFAULT_VAULT_ADDRESS));
  }

  function test__registerVaultAlreadyRegisteredReverts() public {
    helper__addVaultTypesToRegistry(3);
    address vault = helper__deployVaultAndRegister(1, true);

    vm.expectRevert("vault already registered");
    vaultsV1Registry.registerVault(
      VaultMetadata({
        vaultAddress: vault,
        vaultType: 1,
        enabled: true,
        staking: STAKING,
        vaultZapper: ZAPPER,
        submitter: msg.sender,
        metadataCID: CID,
        swapTokenAddresses: swapTokenAddresses,
        swapAddress: SWAP_ADDRESS,
        exchange: EXCHANGE,
        zapIn: ZAP_IN,
        zapOut: ZAP_OUT
      })
    );
  }

  function test__registerVaultEvent() public {
    helper__addVaultTypesToRegistry(3);

    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultAdded(DEFAULT_VAULT_ADDRESS, 1, true, CID);

    vaultsV1Registry.registerVault(
      VaultMetadata({
        vaultAddress: DEFAULT_VAULT_ADDRESS,
        vaultType: 1,
        enabled: true,
        staking: STAKING,
        vaultZapper: ZAPPER,
        submitter: msg.sender,
        metadataCID: CID,
        swapTokenAddresses: swapTokenAddresses,
        swapAddress: SWAP_ADDRESS,
        exchange: EXCHANGE,
        zapIn: ZAP_IN,
        zapOut: ZAP_OUT
      })
    );
  }

  /* Updating vault */
  function test__updateVaultNotOwnerReverts() public {
    helper__addVaultTypesToRegistry(3);
    helper__deployVaultAndRegister(1, true);

    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Registry.updateVault(
      VaultMetadata({
        vaultAddress: DEFAULT_VAULT_ADDRESS,
        vaultType: 1,
        enabled: true,
        staking: STAKING,
        vaultZapper: ZAPPER,
        submitter: msg.sender,
        metadataCID: CID,
        swapTokenAddresses: swapTokenAddresses,
        swapAddress: SWAP_ADDRESS,
        exchange: EXCHANGE,
        zapIn: ZAP_IN,
        zapOut: ZAP_OUT
      })
    );
  }

  function test__updateVaultAddressNotRegisteredReverts() public {
    helper__addVaultTypesToRegistry(3);
    helper__deployVaultAndRegister(1, true);

    vm.expectRevert("vault address not registered");
    vaultsV1Registry.updateVault(
      VaultMetadata({
        vaultAddress: DEFAULT_VAULT_ADDRESS,
        vaultType: 1,
        enabled: true,
        staking: STAKING,
        vaultZapper: ZAPPER,
        submitter: msg.sender,
        metadataCID: CID,
        swapTokenAddresses: swapTokenAddresses,
        swapAddress: SWAP_ADDRESS,
        exchange: EXCHANGE,
        zapIn: ZAP_IN,
        zapOut: ZAP_OUT
      })
    );
  }

  function test__updateVaultCannotChangeVaultTypeReverts() public {
    helper__addVaultTypesToRegistry(3);
    address vault = helper__deployVaultAndRegister(1, true);

    vm.expectRevert("cannot change vault type");
    vaultsV1Registry.updateVault(
      VaultMetadata({
        vaultAddress: vault,
        vaultType: 2,
        enabled: true,
        staking: STAKING,
        vaultZapper: ZAPPER,
        submitter: msg.sender,
        metadataCID: CID,
        swapTokenAddresses: swapTokenAddresses,
        swapAddress: SWAP_ADDRESS,
        exchange: EXCHANGE,
        zapIn: ZAP_IN,
        zapOut: ZAP_OUT
      })
    );
  }

  function test__updateVaultCannotChangeSubmitterReverts() public {
    helper__addVaultTypesToRegistry(3);
    address vault = helper__deployVaultAndRegister(1, true);

    vm.expectRevert("cannot change submitter");
    vaultsV1Registry.updateVault(
      VaultMetadata({
        vaultAddress: vault,
        vaultType: 1,
        enabled: true,
        staking: STAKING,
        vaultZapper: ZAPPER,
        submitter: address(0x4444),
        metadataCID: CID,
        swapTokenAddresses: swapTokenAddresses,
        swapAddress: SWAP_ADDRESS,
        exchange: EXCHANGE,
        zapIn: ZAP_IN,
        zapOut: ZAP_OUT
      })
    );
  }

  function test__updateVault() public {
    helper__addVaultTypesToRegistry(3);
    address vault = helper__deployVaultAndRegister(1, true);

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
      zapIn: ZAP_IN,
      zapOut: ZAP_OUT
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

  function test__updateVaultEvent() public {
    helper__addVaultTypesToRegistry(3);
    address vault = helper__deployVaultAndRegister(1, true);

    address[8] memory newSwapTokenAddresses;
    for (uint256 i = 0; i < 8; i++) {
      newSwapTokenAddresses[i] = address(uint160(i * 2));
    }
    VaultMetadata memory newMetadata = VaultMetadata({
      vaultAddress: vault,
      vaultType: 1,
      enabled: true,
      staking: address(0x4444),
      vaultZapper: address(0x6666),
      submitter: address(this),
      metadataCID: "differentCID",
      swapTokenAddresses: newSwapTokenAddresses,
      swapAddress: address(0x8888),
      exchange: 2,
      zapIn: ZAP_IN,
      zapOut: ZAP_OUT
    });

    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultUpdated(vault, 1, true, "differentCID");
    vaultsV1Registry.updateVault(newMetadata);
  }

  /* Toggling endorse vault */
  function test__toggleEndorseVaultNotOwnerReverts() public {
    address vault = helper__deployVaultAndRegister(1, true);

    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Registry.toggleEndorseVault(vault);
    assertFalse(vaultsV1Registry.endorsed(vault));
    vm.stopPrank();
  }

  function test__toggleEndorseVaultAddressNotRegisteredReverts() public {
    address vault = helper__deployVaultAndRegister(1, true);

    address nonRegistered = address(0x7777);

    vm.expectRevert("vault address not registered");
    vaultsV1Registry.toggleEndorseVault(nonRegistered);
  }

  function test__toggleEndorseVault() public {
    address vault = helper__deployVaultAndRegister(1, true);

    vaultsV1Registry.toggleEndorseVault(vault);
    assertTrue(vaultsV1Registry.endorsed(vault));

    vaultsV1Registry.toggleEndorseVault(vault);
    assertFalse(vaultsV1Registry.endorsed(vault));

    vaultsV1Registry.toggleEndorseVault(vault);
    assertTrue(vaultsV1Registry.endorsed(vault));
  }

  function test__toggleEndorseVaultEvent() public {
    address vault = helper__deployVaultAndRegister(1, true);

    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultStatusChanged(vault, true, true);
    vaultsV1Registry.toggleEndorseVault(vault);
  }

  /* Toggling enable vault */
  function test__toggleEnableVaultNotOwnerReverts() public {
    address vault = helper__deployVaultAndRegister(1, true);

    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Registry.toggleEnableVault(vault);
  }

  function test__toggleEnableVaultAddressNotRegisteredReverts() public {
    address vault = helper__deployVaultAndRegister(1, true);
    address nonRegistered = address(0x7777);

    vm.expectRevert("vault address not registered");
    vaultsV1Registry.toggleEnableVault(nonRegistered);
  }

  function test__toggleEnableVault() public {
    address vault = helper__deployVaultAndRegister(1, true);

    vaultsV1Registry.toggleEnableVault(vault);
    assertFalse(vaultsV1Registry.getVault(vault).enabled);

    vaultsV1Registry.toggleEnableVault(vault);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);

    vaultsV1Registry.toggleEnableVault(vault);
    assertFalse(vaultsV1Registry.getVault(vault).enabled);
  }

  function test__toggleEnableVaultEvent() public {
    address vault = helper__deployVaultAndRegister(1, true);

    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultStatusChanged(vault, true, false);
    vaultsV1Registry.toggleEnableVault(vault);
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
    address vault = helper__deployVaultAndRegister(1, true);

    address[] memory _3CRYPTORegistryVaults = vaultsV1Registry.getVaultsByAsset(CRV_3CRYPTO);
    assertEq(_3CRYPTORegistryVaults.length, 1);

    vm.expectRevert("no vaults for this asset");
    vaultsV1Registry.getVaultsByAsset(CRV_3CRV);
  }

  function test__view__getVaultsByAsset() public {
    uint256 _3CRYPTOVaults = 2;
    address[] memory _3CRYPTOVaultAddresses = helper__deployVaultsAndRegister(CRV_3CRYPTO, _3CRYPTOVaults, 1, true);
    uint256 _3CRVVaults = 3;
    address[] memory _3CRVVaultAddresses = helper__deployVaultsAndRegister(CRV_3CRV, _3CRVVaults, 1, true);

    assertEq(vaultsV1Registry.getTotalVaults(), _3CRYPTOVaults + _3CRVVaults);

    address[] memory _3CRYPTORegistryVaults = vaultsV1Registry.getVaultsByAsset(CRV_3CRYPTO);
    assertEq(_3CRYPTORegistryVaults.length, _3CRYPTOVaults);

    address[] memory _3CRVRegistryVaults = vaultsV1Registry.getVaultsByAsset(CRV_3CRV);
    assertEq(_3CRVRegistryVaults.length, _3CRVVaults);
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
    helper__deployVaultAndRegister(1, true);

    assertEq(vaultsV1Registry.getVaultsByType(1).length, 1);
    assertEq(vaultsV1Registry.vaultTypes(), 2);

    vm.expectRevert("no vaults of this type");
    vaultsV1Registry.getVaultsByType(2);
  }

  function test__view__getVaultsByType() public {
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);

    address[] memory type1VaultAddresses = helper__deployVaultsAndRegister(CRV_3CRYPTO, type1Vaults, 1, true);
    address[] memory type2VaultAddresses = helper__deployVaultsAndRegister(CRV_3CRYPTO, type2Vaults, 2, true);

    assertEq(vaultsV1Registry.getTotalVaults(), type1Vaults + type2Vaults);

    address[] memory type1RegistryVaults = vaultsV1Registry.getVaultsByType(1);
    assertEq(type1RegistryVaults.length, type1Vaults);

    address[] memory type2RegistryVaults = vaultsV1Registry.getVaultsByType(2);
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
    address[] memory vaultAddresses = helper__deployVaultsAndRegister(CRV_3CRYPTO, registeredVaults, 1, true);

    assertEq(vaultsV1Registry.getTotalVaults(), registeredVaults);

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
  }

  function test__fuzz__view__getVaultsByType(uint256 vaultType) public {
    vm.assume(vaultType != vaultsV1Registry.vaultTypes() + 1);
    vm.assume(vaultType > 1);

    vm.expectRevert("invalid vault type");
    vaultsV1Registry.getVaultsByType(vaultType);
  }
}

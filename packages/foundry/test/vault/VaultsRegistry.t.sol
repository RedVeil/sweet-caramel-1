// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import "../../src/vault/VaultsFactory.sol";
import { VaultParams } from "../../src/vault/VaultsController.sol";
import "../../src/vault/VaultsRegistry.sol";
import { VaultMetadata } from "../../src/vault/VaultsRegistry.sol";
import { KeeperConfig } from "../../src/utils/KeeperIncentivized.sol";
import "../../src/vault/VaultsController.sol";
import "../../src/interfaces/IContractRegistry.sol";
import "../../src/interfaces/IERC4626.sol";
import "../../src/utils/KeeperIncentiveV2.sol";
import "../../src/interfaces/IERC4626.sol";

address constant CRV_3CRYPTO = 0xc4AD29ba4B3c580e6D59105FFf484999997675Ff;
address constant CRV_3CRV = 0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490;
address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;
address constant YEARN_VAULT = 0xE537B5cc158EB71037D4125BDD7538421981E6AA;

contract VaultsRegistryTest is Test {
  event VaultAdded(address vaultAddress, uint256 vaultType, bool enabled, string metadataCID);
  event VaultUpdated(address vaultAddress, uint256 vaultType, bool enabled, string metadataCID);
  event VaultTypeAdded(uint256 vaultTypes);
  event VaultStatusChanged(address vaultAddress, bool endorsed, bool enabled);

  VaultsRegistry internal vaultsRegistry;
  VaultsFactory internal vaultsFactory;
  VaultsController internal vaultsController;
  KeeperIncentiveV2 internal keeperIncentive;
  YearnWrapper internal yearnWrapper;

  address internal vaultsControllerOwner = address(this);
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
  address internal asset;
  address internal yearnWrapperAddress;

  function setUp() public {
    uint256 forkId = vm.createSelectFork(vm.rpcUrl("FORKING_RPC_URL"), 15008113);
    vm.selectFork(forkId);

    asset = address(ERC20(CRV_3CRYPTO));
    vaultsRegistry = new VaultsRegistry(address(this));

    yearnWrapperAddress = address(new YearnWrapper());
    yearnWrapper = YearnWrapper(yearnWrapperAddress);
    yearnWrapper.initialize(VaultAPI(YEARN_VAULT));

    for (uint256 i = 0; i < 8; i++) {
      swapTokenAddresses[i] = address(uint160(i));
    }
  }

  /* ========== HELPER FUNCTIONS ========== */
  function helper__addVaultTypesToRegistry(uint256 _vaultTypes) public {
    for (uint256 i = 2; i <= _vaultTypes; i++) {
      vaultsRegistry.addVaultType(i);
    }
    assertEq(vaultsRegistry.vaultTypes(), _vaultTypes);
  }

  function helper__deployVault(address _asset) public returns (address vault) {
    vault = address(new Vault());
    Vault(vault).initialize(
      ERC20(_asset),
      IERC4626(yearnWrapperAddress),
      IContractRegistry(CONTRACT_REGISTRY),
      Vault.FeeStructure({ deposit: 1, withdrawal: 1, management: 1, performance: 1 }),
      KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1, keeperPayout: 9 })
    );
  }

  function helper__deployVaultAndRegister(uint256 _type, bool _enabled) public returns (address vault) {
    vault = helper__deployVault(CRV_3CRYPTO);

    vaultsRegistry.registerVault(
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
    address _asset,
    uint256 _amount,
    uint256 _type,
    bool _enabled
  ) public returns (address[] memory vaultAddresses) {
    vaultAddresses = new address[](_amount);
    for (uint256 i = 0; i < _amount; i++) {
      address vault = helper__deployVault(_asset);
      vaultAddresses[i] = vault;

      vaultsRegistry.registerVault(
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
    vaultsRegistry.addVaultType(2);
    assertEq(vaultsRegistry.vaultTypes(), 1);
    vm.stopPrank();
  }

  function test__addVaultTypeIncorrectTypeReverts() public {
    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsRegistry.addVaultType(0);
    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsRegistry.addVaultType(1);
    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsRegistry.addVaultType(3);
    assertEq(vaultsRegistry.vaultTypes(), 1);
  }

  function test__addVaultType() public {
    vaultsRegistry.addVaultType(2);
    assertEq(vaultsRegistry.vaultTypes(), 2);
    vaultsRegistry.addVaultType(3);
    assertEq(vaultsRegistry.vaultTypes(), 3);
  }

  function test__addVaultTypeEvent() public {
    vm.expectEmit(false, false, false, true, address(vaultsRegistry));
    emit VaultTypeAdded(2);
    vaultsRegistry.addVaultType(2);
  }

  /* Registering vault */
  function test__registerVaultNotOwnerReverts() public {
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsRegistry.registerVault(
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
    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsRegistry.registerVault(
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

    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsRegistry.getVaultsByType(2);
  }

  function test__registerVaultTypeZeroReverts() public {
    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsRegistry.registerVault(
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

    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsRegistry.getVaultsByType(0);
  }

  function test__registerVault() public {
    helper__addVaultTypesToRegistry(3);
    address vault = helper__deployVault(asset);
    DEFAULT_VAULT_ADDRESS = vault;
    vaultsRegistry.registerVault(
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
    VaultMetadata memory vaultsRegistryMetadata = vaultsRegistry.getVault(DEFAULT_VAULT_ADDRESS);
    assertEq(vaultsRegistryMetadata.vaultAddress, DEFAULT_VAULT_ADDRESS);
    assertEq(vaultsRegistryMetadata.vaultType, 1);
    assertEq(vaultsRegistryMetadata.enabled, true);
    assertEq(vaultsRegistryMetadata.staking, STAKING);
    assertEq(vaultsRegistryMetadata.submitter, msg.sender);
    assertEq(vaultsRegistryMetadata.metadataCID, CID);
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsRegistryMetadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(vaultsRegistryMetadata.swapAddress, SWAP_ADDRESS);
    assertEq(vaultsRegistryMetadata.exchange, EXCHANGE);

    assertEq(vaultsRegistry.getTotalVaults(), 1);
    assertEq(vaultsRegistry.vaultAddresses(0), DEFAULT_VAULT_ADDRESS);
    assertEq(vaultsRegistry.getRegisteredAddresses()[0], DEFAULT_VAULT_ADDRESS);
    assertEq(vaultsRegistry.assetVaults(CRV_3CRYPTO, 0), DEFAULT_VAULT_ADDRESS);
    assertEq(vaultsRegistry.getVaultsByAsset(CRV_3CRYPTO)[0], DEFAULT_VAULT_ADDRESS);
    assertEq(vaultsRegistry.typeVaults(1, 0), DEFAULT_VAULT_ADDRESS);
    assertEq(vaultsRegistry.getVaultsByType(1)[0], DEFAULT_VAULT_ADDRESS);
    assertFalse(vaultsRegistry.endorsed(DEFAULT_VAULT_ADDRESS));
  }

  function test__registerVaultAlreadyRegisteredReverts() public {
    helper__addVaultTypesToRegistry(3);
    address vault = helper__deployVaultAndRegister(1, true);

    vm.expectRevert(VaultsRegistry.VaultAlreadyRegistered.selector);
    vaultsRegistry.registerVault(
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

    address vault = helper__deployVault(asset);
    DEFAULT_VAULT_ADDRESS = vault;

    vm.expectEmit(false, false, false, true, address(vaultsRegistry));
    emit VaultAdded(DEFAULT_VAULT_ADDRESS, 1, true, CID);

    vaultsRegistry.registerVault(
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
    vaultsRegistry.updateVault(
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

    vm.expectRevert(VaultsRegistry.VaultNotRegistered.selector);
    vaultsRegistry.updateVault(
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

    vm.expectRevert(VaultsRegistry.VaultTypeImmutable.selector);
    vaultsRegistry.updateVault(
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

    vm.expectRevert(VaultsRegistry.SubmitterImmutable.selector);
    vaultsRegistry.updateVault(
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
      submitter: msg.sender,
      metadataCID: "differentCID",
      swapTokenAddresses: newSwapTokenAddresses,
      swapAddress: address(0x8888),
      exchange: 2,
      zapIn: ZAP_IN,
      zapOut: ZAP_OUT
    });

    vaultsRegistry.updateVault(newMetadata);
    VaultMetadata memory vaultsRegistryMetadata = vaultsRegistry.getVault(vault);
    assertEq(vaultsRegistryMetadata.vaultAddress, vault);
    assertEq(vaultsRegistryMetadata.vaultType, 1);
    assertEq(vaultsRegistry.typeVaults(1, 0), vault);
    assertEq(vaultsRegistry.getVaultsByType(1)[0], vault);
    assertEq(vaultsRegistry.getVaultsByType(1).length, 1);
    assertEq(vaultsRegistryMetadata.enabled, false);
    assertEq(vaultsRegistryMetadata.staking, address(0x4444));
    assertEq(vaultsRegistryMetadata.submitter, msg.sender);
    assertEq(vaultsRegistryMetadata.metadataCID, "differentCID");
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsRegistryMetadata.swapTokenAddresses[i], newSwapTokenAddresses[i]);
    }
    assertEq(vaultsRegistryMetadata.swapAddress, address(0x8888));
    assertEq(vaultsRegistryMetadata.exchange, 2);
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
      submitter: msg.sender,
      metadataCID: "differentCID",
      swapTokenAddresses: newSwapTokenAddresses,
      swapAddress: address(0x8888),
      exchange: 2,
      zapIn: ZAP_IN,
      zapOut: ZAP_OUT
    });

    vm.expectEmit(false, false, false, true, address(vaultsRegistry));
    emit VaultUpdated(vault, 1, true, "differentCID");
    vaultsRegistry.updateVault(newMetadata);
  }

  /* Toggling endorse vault */
  function test__toggleEndorseVaultNotOwnerReverts() public {
    address vault = helper__deployVaultAndRegister(1, true);

    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsRegistry.toggleEndorseVault(vault);
    assertFalse(vaultsRegistry.endorsed(vault));
    vm.stopPrank();
  }

  function test__toggleEndorseVaultAddressNotRegisteredReverts() public {
    helper__deployVaultAndRegister(1, true);

    address nonRegistered = address(0x7777);

    vm.expectRevert(VaultsRegistry.VaultNotRegistered.selector);
    vaultsRegistry.toggleEndorseVault(nonRegistered);
  }

  function test__toggleEndorseVault() public {
    address vault = helper__deployVaultAndRegister(1, true);

    vaultsRegistry.toggleEndorseVault(vault);
    assertTrue(vaultsRegistry.endorsed(vault));

    vaultsRegistry.toggleEndorseVault(vault);
    assertFalse(vaultsRegistry.endorsed(vault));

    vaultsRegistry.toggleEndorseVault(vault);
    assertTrue(vaultsRegistry.endorsed(vault));
  }

  function test__toggleEndorseVaultEvent() public {
    address vault = helper__deployVaultAndRegister(1, true);

    vm.expectEmit(false, false, false, true, address(vaultsRegistry));
    emit VaultStatusChanged(vault, true, true);
    vaultsRegistry.toggleEndorseVault(vault);
  }

  /* Toggling enable vault */
  function test__toggleEnableVaultNotOwnerReverts() public {
    address vault = helper__deployVaultAndRegister(1, true);

    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsRegistry.toggleEnableVault(vault);
  }

  function test__toggleEnableVaultAddressNotRegisteredReverts() public {
    helper__deployVaultAndRegister(1, true);
    address nonRegistered = address(0x7777);

    vm.expectRevert(VaultsRegistry.VaultNotRegistered.selector);
    vaultsRegistry.toggleEnableVault(nonRegistered);
  }

  function test__toggleEnableVault() public {
    address vault = helper__deployVaultAndRegister(1, true);

    vaultsRegistry.toggleEnableVault(vault);
    assertFalse(vaultsRegistry.getVault(vault).enabled);

    vaultsRegistry.toggleEnableVault(vault);
    assertTrue(vaultsRegistry.getVault(vault).enabled);

    vaultsRegistry.toggleEnableVault(vault);
    assertFalse(vaultsRegistry.getVault(vault).enabled);
  }

  function test__toggleEnableVaultEvent() public {
    address vault = helper__deployVaultAndRegister(1, true);

    vm.expectEmit(false, false, false, true, address(vaultsRegistry));
    emit VaultStatusChanged(vault, false, false);
    vaultsRegistry.toggleEnableVault(vault);
  }

  /* ========== VIEW FUNCTIONS TESTS ========== */

  // vm.expectRevert is broken, this test reverts as expected but the test fails anyways.
  // function test__view__getVaultAddressNotRegisteredReverts() public {
  //   address deployedVault = helper__deployThroughFactory(true);
  //   address notVault = address(0x7777);
  //   assertTrue(notVault != deployedVault);
  //   vm.expectRevert("vault address not registered");
  //   vaultsRegistry.getVault(notVault);
  // }

  function test__view__getVaultsByAssetNoAssetVaultsReverts() public {
    helper__deployVaultAndRegister(1, true);

    address[] memory _3CRYPTORegistryVaults = vaultsRegistry.getVaultsByAsset(CRV_3CRYPTO);
    assertEq(_3CRYPTORegistryVaults.length, 1);

    vm.expectRevert(VaultsRegistry.NoAssetVaults.selector);
    vaultsRegistry.getVaultsByAsset(CRV_3CRV);
  }

  function test__view__getVaultsByAsset() public {
    uint256 _3CRYPTOVaults = 2;
    helper__deployVaultsAndRegister(CRV_3CRYPTO, _3CRYPTOVaults, 1, true);
    uint256 _3CRVVaults = 3;
    helper__deployVaultsAndRegister(CRV_3CRV, _3CRVVaults, 1, true);

    assertEq(vaultsRegistry.getTotalVaults(), _3CRYPTOVaults + _3CRVVaults);

    address[] memory _3CRYPTORegistryVaults = vaultsRegistry.getVaultsByAsset(CRV_3CRYPTO);
    assertEq(_3CRYPTORegistryVaults.length, _3CRYPTOVaults);

    address[] memory _3CRVRegistryVaults = vaultsRegistry.getVaultsByAsset(CRV_3CRV);
    assertEq(_3CRVRegistryVaults.length, _3CRVVaults);
  }

  function test__view__getVaultsByTypeInvalidTypeReverts() public {
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsRegistry.vaultTypes(), 2);
    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsRegistry.getVaultsByType(3);
    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsRegistry.getVaultsByType(0);
  }

  function test__view__getVaultsByTypeNoVaultsReverts() public {
    helper__addVaultTypesToRegistry(2);
    helper__deployVaultAndRegister(1, true);

    assertEq(vaultsRegistry.getVaultsByType(1).length, 1);
    assertEq(vaultsRegistry.vaultTypes(), 2);

    vm.expectRevert(VaultsRegistry.NoTypeVaults.selector);
    vaultsRegistry.getVaultsByType(2);
  }

  function test__view__getVaultsByType() public {
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);

    address[] memory type1VaultAddresses = helper__deployVaultsAndRegister(CRV_3CRYPTO, type1Vaults, 1, true);
    address[] memory type2VaultAddresses = helper__deployVaultsAndRegister(CRV_3CRYPTO, type2Vaults, 2, true);

    assertEq(vaultsRegistry.getTotalVaults(), type1Vaults + type2Vaults);

    address[] memory type1RegistryVaults = vaultsRegistry.getVaultsByType(1);
    assertEq(type1RegistryVaults.length, type1Vaults);

    address[] memory type2RegistryVaults = vaultsRegistry.getVaultsByType(2);
    assertEq(type2RegistryVaults.length, type2Vaults);

    for (uint256 i = 0; i < type1Vaults; i++) {
      assertEq(type1RegistryVaults[i], type1VaultAddresses[i]);
      assertEq(vaultsRegistry.getVault(type1RegistryVaults[i]).vaultType, 1);
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertEq(type2RegistryVaults[i], type2VaultAddresses[i]);
      assertEq(vaultsRegistry.getVault(type2RegistryVaults[i]).vaultType, 2);
    }
  }

  function test__view__getRegisteredAddresses() public {
    uint256 registeredVaults = 3;
    address[] memory vaultAddresses = helper__deployVaultsAndRegister(CRV_3CRYPTO, registeredVaults, 1, true);

    assertEq(vaultsRegistry.getTotalVaults(), registeredVaults);

    address[] memory vaultAddressesFromRegistry = vaultsRegistry.getRegisteredAddresses();
    assertEq(vaultAddressesFromRegistry.length, registeredVaults);

    for (uint256 i = 0; i < registeredVaults; i++) {
      assertEq(vaultAddressesFromRegistry[i], vaultAddresses[i]);
      assertEq(vaultsRegistry.getVault(vaultAddressesFromRegistry[i]).vaultAddress, vaultAddressesFromRegistry[i]);
    }
  }

  /* ========== FUZZ TESTS ========== */

  function test__fuzz__addVaultType(uint256 vaultType) public {
    vm.assume(vaultType != vaultsRegistry.vaultTypes() + 1);
    vm.assume(vaultType > 1);

    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsRegistry.addVaultType(vaultType);
  }

  function test__fuzz__view__getVaultsByType(uint256 vaultType) public {
    vm.assume(vaultType != vaultsRegistry.vaultTypes() + 1);
    vm.assume(vaultType > 1);

    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsRegistry.getVaultsByType(vaultType);
  }
}
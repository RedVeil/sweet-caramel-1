// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../../../../contracts/core/defi/vault/VaultsV1Factory.sol";
import "../../../../contracts/core/defi/vault/VaultStakingFactory.sol";
import { VaultParams } from "../../../../contracts/core/defi/vault/VaultsV1Factory.sol";
import "../../../../contracts/core/defi/vault/VaultsV1Registry.sol";
import { VaultMetadata } from "../../../../contracts/core/defi/vault/VaultsV1Registry.sol";
import { KeeperConfig } from "../../../../contracts/core/utils/KeeperIncentivized.sol";
import "../../../../contracts/core/defi/vault/VaultStaking.sol";
import "../../../../contracts/core/defi/vault/Vault.sol";
import "../../../../contracts/core/dao/RewardsEscrow.sol";
import "../../../../contracts/core/defi/vault/VaultsV1Controller.sol";
import "../../../../contracts/core/defi/zapper/VaultsV1Zapper.sol";
import "../../../../contracts/core/utils/KeeperIncentiveV2.sol";
import "../../../../contracts/core/interfaces/IContractRegistry.sol";
import "../../../../contracts/core/interfaces/IACLRegistry.sol";
import "../../../../contracts/core/interfaces/IVaultsV1.sol";
import "../../../../contracts/core/interfaces/IVaultsV1Zapper.sol";
import "../../../../contracts/core/interfaces/IRewardsEscrow.sol";

address constant CRV_3CRYPTO = 0xc4AD29ba4B3c580e6D59105FFf484999997675Ff;
address constant YEARN_REGISTRY = 0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804;
address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;
address constant ACL_REGISTRY = 0x8A41aAa4B467ea545DDDc5759cE3D35984F093f4;
address constant ACL_ADMIN = 0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f;
address constant CURVE_ZAP_IN = 0x5Ce9b49B7A1bE9f2c3DC2B2A5BaCEA56fa21FBeE;
address constant CURVE_ZAP_OUT = 0xE03A338d5c305613AfC3877389DD3B0617233387;
address constant POP = 0xD0Cd466b34A24fcB2f87676278AF2005Ca8A78c4;
address constant REWARDS_ESCROW = 0xb5cb5710044D1074097c17B7535a1cF99cBfb17F;

contract VaultsV1ControllerTest is Test {
  event VaultV1Deployed(address vaultAddress, bool endorsed);
  /* VaultsV1Registry events */
  event VaultAdded(address vaultAddress, uint256 vaultType, bool enabled, string metadataCID);
  event VaultUpdated(address vaultAddress, uint256 vaultType, bool enabled, string metadataCID);
  event VaultTypeAdded(uint256 vaultTypes);
  event VaultStatusChanged(address vaultAddress, bool endorsed, bool enabled);
  /* VaultsV1Factory events */
  event VaultV1Deployment(address vault, address vaultStaking);
  event VaultImplementationUpdated(address oldVaultImplementation, address newVaultImplementation);
  event StakingImplementationUpdated(address oldStakingImplementation, address newStakingImplementation);
  /* Vault events */
  event Paused(address account);
  event Unpaused(address account);
  /* Owned events */
  event OwnerNominated(address newOwner);
  event OwnerChanged(address owner, address nominatedOwner);
  /* Vault events */
  event FeesUpdated(Vault.FeeStructure previousFees, IVaultsV1.FeeStructure newFees);
  event UseLocalFees(bool useLocalFees);
  event StakingUpdated(address beforeAddress, address afterAddress);
  event ZapperUpdated(address beforeAddress, address afterAddress);
  event RegistryUpdated(address beforeAddress, address afterAddress);
  event KeeperConfigUpdated(KeeperConfig oldConfig, KeeperConfig newConfig);
  event ZapsUpdated(address zapIn, address zapOut);
  /* VaultZapper events */
  event UpdatedVault(address vaultAsset, address vault);
  event RemovedVault(address vaultAsset, address vault);
  event GlobalFeeUpdated(uint256 inBps, uint256 outBps);
  event FeeUpdated(address indexed vaultAsset, bool useAssetFee, uint256 inBps, uint256 outBps);
  /* Staking events */
  event VaultUpdated(address oldVault, address newVault);

  VaultsV1Controller public vaultsV1Controller;
  VaultsV1Registry public vaultsV1Registry;
  VaultsV1Factory public vaultsV1Factory;
  VaultStakingFactory public vaultStakingFactory;
  KeeperIncentiveV2 public keeperIncentive;
  VaultsV1Zapper public vaultZapper;
  RewardsEscrow public rewardsEscrow;
  address public vaultImplementation;
  address public stakingImplementation;

  address public vaultsV1ControllerOwner = address(this);
  address public notOwner = address(0x1234);

  uint256 constant DEPOSIT_FEE = 50 * 1e14;
  uint256 constant WITHDRAWAL_FEE = 50 * 1e14;
  uint256 constant MANAGEMENT_FEE = 200 * 1e14;
  uint256 constant PERFORMANCE_FEE = 2000 * 1e14;

  KeeperConfig public vaultKeeperConfig =
    KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1, keeperPayout: 9 });

  VaultParams public vaultParams =
    VaultParams({
      asset: ERC20(CRV_3CRYPTO),
      strategy: IERC4626(address(0x4444)),
      contractRegistry: IContractRegistry(CONTRACT_REGISTRY),
      feeStructure: Vault.FeeStructure({
        deposit: DEPOSIT_FEE,
        withdrawal: WITHDRAWAL_FEE,
        management: MANAGEMENT_FEE,
        performance: PERFORMANCE_FEE
      }),
      keeperConfig: vaultKeeperConfig
    });

  address[8] public swapTokenAddresses;

  /* ========== MODIFIERS ========== */

  modifier acceptOwnerships() {
    vaultsV1Factory.nominateNewOwner(address(vaultsV1Controller));
    vaultsV1Registry.nominateNewOwner(address(vaultsV1Controller));
    vaultsV1Controller.acceptRegistryFactoryOwnership();
    assertEq(vaultsV1Registry.owner(), address(vaultsV1Controller));
    assertEq(vaultsV1Factory.owner(), address(vaultsV1Controller));
    _;
  }

  function setUp() public {
    vaultImplementation = address(new Vault());
    stakingImplementation = address(new VaultStaking());

    vaultsV1Factory = new VaultsV1Factory(address(this));
    vaultStakingFactory = new VaultStakingFactory(address(this), IContractRegistry(CONTRACT_REGISTRY));

    vaultsV1Registry = new VaultsV1Registry(address(this));
    vaultsV1Controller = new VaultsV1Controller(address(this), IContractRegistry(CONTRACT_REGISTRY));
    keeperIncentive = new KeeperIncentiveV2(IContractRegistry(CONTRACT_REGISTRY), 25e16, 2000 ether);
    vaultZapper = new VaultsV1Zapper(IContractRegistry(CONTRACT_REGISTRY));
    rewardsEscrow = new RewardsEscrow(IERC20(POP));
    rewardsEscrow.transferOwnership(address(vaultsV1Controller));

    vaultsV1Factory.setVaultImplementation(vaultImplementation);
    vaultStakingFactory.setStakingImplementation(stakingImplementation);

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
      vaultsV1Controller.addVaultTypeToRegistry(i);
    }
    assertEq(vaultsV1Registry.vaultTypes(), _vaultTypes);
  }

  function helper__deployThroughFactory(bool _endorsed) public returns (address) {
    address deployedVault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      _endorsed,
      "someCID",
      swapTokenAddresses,
      address(0x2222),
      1,
      address(vaultZapper),
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );
    VaultMetadata memory metadata = vaultsV1Registry.getVault(deployedVault);
    assertEq(metadata.vaultAddress, deployedVault);
    assertEq(metadata.submitter, address(this));
    assertEq(vaultsV1Registry.endorsed(deployedVault), _endorsed);
    return deployedVault;
  }

  function helper__deployThroughFactoryWithParams(VaultParams memory params, bool _endorsed) public returns (address) {
    address deployedVault = vaultsV1Controller.deployVaultFromV1Factory(
      params,
      _endorsed,
      "someCID",
      swapTokenAddresses,
      address(0x2222),
      1,
      address(vaultZapper),
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );
    VaultMetadata memory metadata = vaultsV1Registry.getVault(deployedVault);
    assertEq(metadata.vaultAddress, deployedVault);
    assertEq(metadata.submitter, address(this));
    assertEq(vaultsV1Registry.endorsed(deployedVault), _endorsed);
    return deployedVault;
  }

  function helper__deployVault(uint256 _vaultType) public returns (Vault, VaultMetadata memory) {
    Vault vault = new Vault();
    vault.initialize(
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
      vaultKeeperConfig
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
    uint256 prevAmount = vaultsV1Registry.getTotalVaults();
    vaultParams.asset = ERC20(_asset);
    address[] memory deployedVaults = new address[](_amount);
    for (uint256 i = 0; i < _amount; i++) {
      address deployedVault = vaultsV1Controller.deployVaultFromV1Factory(
        vaultParams,
        _endorsed,
        "someCID",
        swapTokenAddresses,
        address(0x2222),
        1,
        address(vaultZapper),
        CURVE_ZAP_IN,
        CURVE_ZAP_OUT
      );
      deployedVaults[i] = deployedVault;
    }
    assertEq(vaultsV1Registry.getTotalVaults(), prevAmount + _amount);
    return deployedVaults;
  }

  /* ========== MUTATIVE FUNCTIONS TESTS ========== */

  /* Deploying vault from VaultsV1Factory */

  function test__deployVaultFromV1FactoryNotOwnerReverts() public acceptOwnerships {
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      true,
      "someCID",
      swapTokenAddresses,
      address(0x2222),
      1,
      address(vaultZapper),
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );
    assertEq(vaultsV1Registry.getTotalVaults(), 0);
  }

  function test__deployVaultFromV1FactoryNoZapsReverts() public acceptOwnerships {
    vm.expectRevert("set zaps");
    vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      true,
      "someCID",
      swapTokenAddresses,
      address(0x2222),
      1,
      address(vaultZapper),
      address(0),
      address(0)
    );
    assertEq(vaultsV1Registry.getTotalVaults(), 0);
  }

  function test__deployVaultFromV1FactoryEndorsed() public acceptOwnerships {
    address deployedVault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      true,
      "someCID",
      swapTokenAddresses,
      address(0x2222),
      1,
      address(vaultZapper),
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );

    assertTrue(deployedVault != address(0));

    emit log_named_address("VaultV1Deployment", deployedVault);

    assertEq(address(Vault(deployedVault).staking()), address(0x1111));

    VaultMetadata memory metadata = vaultsV1Registry.getVault(deployedVault);
    assertEq(metadata.vaultAddress, deployedVault);
    assertEq(metadata.vaultType, 1);
    assertEq(metadata.enabled, true);
    assertEq(metadata.staking, address(0x1111));
    assertEq(metadata.vaultZapper, address(vaultZapper));
    assertEq(metadata.submitter, address(this));
    assertEq(metadata.metadataCID, "someCID");
    for (uint256 i = 0; i < 8; i++) {
      assertEq(metadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(metadata.swapAddress, address(0x2222));
    assertEq(metadata.exchange, 1);
    assertEq(metadata.zapIn, CURVE_ZAP_IN);
    assertEq(metadata.zapOut, CURVE_ZAP_OUT);

    assertEq(vaultsV1Registry.getRegisteredAddresses()[0], deployedVault);
    assertEq(vaultsV1Registry.getVaultsByAsset(vaultParams.asset)[0], deployedVault);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], deployedVault);
    assertTrue(vaultsV1Registry.endorsed(deployedVault));

    assertEq(vaultZapper.vaults(vaultParams.asset), deployedVault);

    (address zapIn, address zapOut) = vaultZapper.zaps(vaultParams.asset);
    assertEq(zapIn, CURVE_ZAP_IN);
    assertEq(zapOut, CURVE_ZAP_OUT);

    assertTrue(rewardsEscrow.authorized(address(0x1111)));
  }

  function test__deployVaultFromV1FactoryNotEndorsed() public acceptOwnerships {
    address deployedVault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      false,
      "someCID",
      swapTokenAddresses,
      address(0x7777),
      1,
      address(vaultZapper),
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );
    assertTrue(deployedVault != address(0));

    emit log_named_address("VaultV1Deployment", deployedVault);

    assertEq(address(Vault(deployedVault).staking()), address(0x1111));

    VaultMetadata memory metadata = vaultsV1Registry.getVault(deployedVault);
    assertEq(metadata.vaultAddress, deployedVault);
    assertEq(metadata.vaultType, 1);
    assertEq(metadata.enabled, true);
    assertEq(metadata.staking, address(0x1111));
    assertEq(metadata.vaultZapper, address(vaultZapper));
    assertEq(metadata.submitter, address(this));
    assertEq(metadata.metadataCID, "someCID");
    for (uint256 i = 0; i < 8; i++) {
      assertEq(metadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(metadata.swapAddress, address(0x7777));
    assertEq(metadata.exchange, 1);
    assertEq(metadata.zapIn, CURVE_ZAP_IN);
    assertEq(metadata.zapOut, CURVE_ZAP_OUT);

    assertEq(vaultsV1Registry.getRegisteredAddresses()[0], deployedVault);
    assertEq(vaultsV1Registry.getVaultsByAsset(vaultParams.asset)[0], deployedVault);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], deployedVault);
    assertFalse(vaultsV1Registry.endorsed(deployedVault));

    assertEq(vaultZapper.vaults(vaultParams.asset), deployedVault);

    (address zapIn, address zapOut) = vaultZapper.zaps(vaultParams.asset);
    assertEq(zapIn, CURVE_ZAP_IN);
    assertEq(zapOut, CURVE_ZAP_OUT);

    assertTrue(rewardsEscrow.authorized(address(0x1111)));
  }

  /*   Deploy a new Staking contract with the Vault   */
  function test__deployVaultFromV1FactoryWithStaking() public acceptOwnerships {
    vaultParams.staking = address(0);

    address deployedVault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      true,
      "someCID",
      swapTokenAddresses,
      address(0x7777),
      1,
      address(vaultZapper),
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );

    assertTrue(deployedVault != address(0));

    emit log_named_address("VaultV1Deployment", deployedVault);

    assertEq(address(Vault(deployedVault).staking()), address(0xD457ECDAD18BA6917097BcA0c5A1D6A97da8C26a));

    VaultMetadata memory metadata = vaultsV1Registry.getVault(deployedVault);
    assertEq(metadata.vaultAddress, deployedVault);
    assertEq(metadata.vaultType, 1);
    assertEq(metadata.enabled, true);
    assertEq(metadata.staking, address(0xD457ECDAD18BA6917097BcA0c5A1D6A97da8C26a));
    assertEq(metadata.vaultZapper, address(vaultZapper));
    assertEq(metadata.submitter, address(this));
    assertEq(metadata.metadataCID, "someCID");
    for (uint256 i = 0; i < 8; i++) {
      assertEq(metadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(metadata.swapAddress, address(0x7777));
    assertEq(metadata.exchange, 1);
    assertEq(metadata.zapIn, CURVE_ZAP_IN);
    assertEq(metadata.zapOut, CURVE_ZAP_OUT);

    assertEq(vaultsV1Registry.getRegisteredAddresses()[0], deployedVault);
    assertEq(vaultsV1Registry.getVaultsByAsset(vaultParams.asset)[0], deployedVault);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], deployedVault);
    assertTrue(vaultsV1Registry.endorsed(deployedVault));

    IStaking staking = IStaking(0xD457ECDAD18BA6917097BcA0c5A1D6A97da8C26a);
    assertEq(address(staking.rewardsToken()), 0xD0Cd466b34A24fcB2f87676278AF2005Ca8A78c4);
    assertEq(address(staking.stakingToken()), deployedVault);
    assertEq(address(staking.vault()), deployedVault);

    assertEq(vaultZapper.vaults(vaultParams.asset), deployedVault);

    (address zapIn, address zapOut) = vaultZapper.zaps(vaultParams.asset);
    assertEq(zapIn, CURVE_ZAP_IN);
    assertEq(zapOut, CURVE_ZAP_OUT);

    assertTrue(rewardsEscrow.authorized(address(0xD457ECDAD18BA6917097BcA0c5A1D6A97da8C26a)));
  }

  function test__deployVaultFromV1FactoryWithStakingEvents() public acceptOwnerships {
    vaultParams.staking = address(0);

    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    vm.expectEmit(false, false, false, true, address(vaultsV1Controller));

    emit VaultV1Deployment(
      0xdd36aa107BcA36Ba4606767D873B13B4770F3b12,
      address(0xD457ECDAD18BA6917097BcA0c5A1D6A97da8C26a)
    );
    emit VaultAdded(0xdd36aa107BcA36Ba4606767D873B13B4770F3b12, 1, true, "someCID");
    emit VaultStatusChanged(0xdd36aa107BcA36Ba4606767D873B13B4770F3b12, true, true);
    emit VaultV1Deployed(0xdd36aa107BcA36Ba4606767D873B13B4770F3b12, true);

    vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      true,
      "someCID",
      swapTokenAddresses,
      address(0x7777),
      1,
      address(vaultZapper),
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );
  }

  /* Adding vault type to VaultsV1Registry */
  function test__addVaultTypeToRegistryNotOwnerReverts() public acceptOwnerships {
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.addVaultTypeToRegistry(2);

    assertEq(vaultsV1Registry.vaultTypes(), 1);
  }

  function test__addVaultTypeToRegistryIncorrectTypeReverts() public acceptOwnerships {
    vm.expectRevert("incorrect vault type");
    vaultsV1Controller.addVaultTypeToRegistry(0);

    vm.expectRevert("incorrect vault type");
    vaultsV1Controller.addVaultTypeToRegistry(1);

    vm.expectRevert("incorrect vault type");
    vaultsV1Controller.addVaultTypeToRegistry(3);

    assertEq(vaultsV1Registry.vaultTypes(), 1);
  }

  function test__addVaultTypeToRegistry() public acceptOwnerships {
    vaultsV1Controller.addVaultTypeToRegistry(2);
    assertEq(vaultsV1Registry.vaultTypes(), 2);

    vaultsV1Controller.addVaultTypeToRegistry(3);
    assertEq(vaultsV1Registry.vaultTypes(), 3);
  }

  function test__addVaultTypesToRegistryEvent() public acceptOwnerships {
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultTypeAdded(2);

    vaultsV1Controller.addVaultTypeToRegistry(2);
  }

  /* Updating VaultsV1Registry registered vault */

  function test__updateRegistryVaultNotOwnerReverts() public acceptOwnerships {
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

    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.updateRegistryVault(newMetadata);

    // check no changes
    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(vault);
    assertEq(vaultsV1RegistryMetadata.vaultAddress, vault);
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
    assertEq(vaultsV1RegistryMetadata.zapIn, CURVE_ZAP_IN);
    assertEq(vaultsV1RegistryMetadata.zapOut, CURVE_ZAP_OUT);

    assertEq(vaultsV1Registry.typeVaults(1, 0), vault);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], vault);
    assertEq(vaultsV1Registry.getVaultsByType(1).length, 1);
  }

  function test__updateRegistryVaultAddressNotRegisteredReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);

    address[8] memory newSwapTokenAddresses;
    for (uint256 i = 0; i < 8; i++) {
      newSwapTokenAddresses[i] = address(uint160(i * 2));
    }

    address notVault = address(0x7777);
    VaultMetadata memory newMetadata = VaultMetadata({
      vaultAddress: notVault,
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

    assertTrue(vault != notVault);

    assertEq(vaultsV1Registry.getTotalVaults(), 1);

    vm.expectRevert("vault address not registered");
    vaultsV1Controller.updateRegistryVault(newMetadata);

    // check no changes
    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(vault);
    assertEq(vaultsV1RegistryMetadata.vaultAddress, vault);
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
    assertEq(vaultsV1RegistryMetadata.zapIn, CURVE_ZAP_IN);
    assertEq(vaultsV1RegistryMetadata.zapOut, CURVE_ZAP_OUT);

    assertEq(vaultsV1Registry.typeVaults(1, 0), vault);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], vault);
    assertEq(vaultsV1Registry.getVaultsByType(1).length, 1);
  }

  function test__updateRegistryVault() public acceptOwnerships {
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

    vaultsV1Controller.updateRegistryVault(newMetadata);

    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(vault);
    assertEq(vaultsV1RegistryMetadata.vaultAddress, vault);
    assertEq(vaultsV1RegistryMetadata.vaultType, 1);
    assertEq(vaultsV1RegistryMetadata.enabled, false);
    assertEq(vaultsV1RegistryMetadata.staking, address(0x4444));
    assertEq(vaultsV1RegistryMetadata.submitter, address(this));
    assertEq(vaultsV1RegistryMetadata.metadataCID, "differentCID");
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsV1RegistryMetadata.swapTokenAddresses[i], newSwapTokenAddresses[i]);
    }
    assertEq(vaultsV1RegistryMetadata.swapAddress, address(0x8888));
    assertEq(vaultsV1RegistryMetadata.exchange, 2);
    assertEq(vaultsV1RegistryMetadata.zapIn, CURVE_ZAP_IN);
    assertEq(vaultsV1RegistryMetadata.zapOut, CURVE_ZAP_OUT);

    assertEq(vaultsV1Registry.typeVaults(1, 0), vault);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], vault);
    assertEq(vaultsV1Registry.getVaultsByType(1).length, 1);
  }

  function test__updateRegistryVaultCannotChangeVaultTypeReverts() public acceptOwnerships {
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
    vaultsV1Controller.updateRegistryVault(newMetadata);

    // check no changes
    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(vault);
    assertEq(vaultsV1RegistryMetadata.vaultAddress, vault);
    assertEq(vaultsV1RegistryMetadata.vaultType, 1);

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
    assertEq(vaultsV1RegistryMetadata.swapAddress, address(0x2222));
    assertEq(vaultsV1RegistryMetadata.exchange, 1);
    assertEq(vaultsV1RegistryMetadata.zapIn, CURVE_ZAP_IN);
    assertEq(vaultsV1RegistryMetadata.zapOut, CURVE_ZAP_OUT);
  }

  function test__updateRegistryVaultCannotChangeSubmitterReverts() public acceptOwnerships {
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

    vm.expectRevert("cannot change submitter");
    vaultsV1Controller.updateRegistryVault(newMetadata);

    // check no changes
    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(vault);
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
    assertEq(vaultsV1RegistryMetadata.swapAddress, address(0x2222));
    assertEq(vaultsV1RegistryMetadata.exchange, 1);
    assertEq(vaultsV1RegistryMetadata.zapIn, CURVE_ZAP_IN);
    assertEq(vaultsV1RegistryMetadata.zapOut, CURVE_ZAP_OUT);
  }

  function test__updateVaultEvent() public acceptOwnerships {
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
    vaultsV1Controller.updateRegistryVault(newMetadata);
    assertEq(vaultsV1Registry.getVault(vault).metadataCID, "differentCID");
  }

  /* Toggling endorse VaultsV1Registry registered vault */

  function test__toggleEndorseRegistryVaultNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(false);
    assertFalse(vaultsV1Registry.endorsed(vault));
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = vault;
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.toggleEndorseRegistryVault(vaultsToToggle);
    assertFalse(vaultsV1Registry.endorsed(vault));
  }

  function test__toggleEndorseVaultAddressNotRegisteredReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(false);
    assertFalse(vaultsV1Registry.endorsed(vault));
    address nonRegistered = address(0x7777);
    assertTrue(vault != nonRegistered);
    assertEq(vaultsV1Registry.getTotalVaults(), 1);
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = nonRegistered;
    vm.expectRevert("vault address not registered");
    vaultsV1Controller.toggleEndorseRegistryVault(vaultsToToggle);
    assertFalse(vaultsV1Registry.endorsed(vault));
  }

  function test__toggleEndorseVault() public acceptOwnerships {
    address vault = helper__deployThroughFactory(false);
    assertFalse(vaultsV1Registry.endorsed(vault));
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = vault;
    vaultsV1Controller.toggleEndorseRegistryVault(vaultsToToggle);
    assertTrue(vaultsV1Registry.endorsed(vault));
    vaultsV1Controller.toggleEndorseRegistryVault(vaultsToToggle);
    assertFalse(vaultsV1Registry.endorsed(vault));
    vaultsV1Controller.toggleEndorseRegistryVault(vaultsToToggle);
    assertTrue(vaultsV1Registry.endorsed(vault));
  }

  function test__toggleEndorseVaultMultiple() public acceptOwnerships {
    uint256 toggleCount = 3;
    address[] memory vaultsToToggle = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, toggleCount, false);
    assertEq(vaultsV1Registry.getTotalVaults(), toggleCount);
    assertEq(vaultsToToggle.length, toggleCount);
    for (uint256 i = 0; i < toggleCount; i++) {
      assertFalse(vaultsV1Registry.endorsed(vaultsToToggle[i]));
    }
    vaultsV1Controller.toggleEndorseRegistryVault(vaultsToToggle);
    for (uint256 i = 0; i < toggleCount; i++) {
      assertTrue(vaultsV1Registry.endorsed(vaultsToToggle[i]));
    }
    vaultsV1Controller.toggleEndorseRegistryVault(vaultsToToggle);
    for (uint256 i = 0; i < toggleCount; i++) {
      assertFalse(vaultsV1Registry.endorsed(vaultsToToggle[i]));
    }
    vaultsV1Controller.toggleEndorseRegistryVault(vaultsToToggle);
    for (uint256 i = 0; i < toggleCount; i++) {
      assertTrue(vaultsV1Registry.endorsed(vaultsToToggle[i]));
    }
  }

  function test__toggleEndorseVaultEvent() public acceptOwnerships {
    address vault = helper__deployThroughFactory(false);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
    assertFalse(vaultsV1Registry.endorsed(vault));
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = vault;
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultStatusChanged(vault, true, true);
    vaultsV1Controller.toggleEndorseRegistryVault(vaultsToToggle);
    assertTrue(vaultsV1Registry.endorsed(vault));
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
  }

  /* Toggling enable VaultsV1Registry registered vault */

  function test__toggleEnableVaultNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = vault;
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.toggleEnableRegistryVault(vaultsToToggle);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
  }

  function test__toggleEnableVaultAddressNotRegisteredReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
    address nonRegistered = address(0x7777);
    assertTrue(vault != nonRegistered);
    assertEq(vaultsV1Registry.getTotalVaults(), 1);
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = nonRegistered;
    vm.expectRevert("vault address not registered");
    vaultsV1Controller.toggleEnableRegistryVault(vaultsToToggle);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
  }

  function test__toggleEnableVaultOnly() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = vault;
    vaultsV1Controller.toggleEnableRegistryVault(vaultsToToggle);
    assertFalse(vaultsV1Registry.getVault(vault).enabled);
    vaultsV1Controller.toggleEnableRegistryVault(vaultsToToggle);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
    vaultsV1Controller.toggleEnableRegistryVault(vaultsToToggle);
    assertFalse(vaultsV1Registry.getVault(vault).enabled);
  }

  function test__toggleEnableVaultMultiple() public acceptOwnerships {
    uint256 toggleCount = 3;
    address[] memory vaultsToToggle = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, toggleCount, false);
    assertEq(vaultsV1Registry.getTotalVaults(), toggleCount);
    assertEq(vaultsToToggle.length, toggleCount);
    for (uint256 i = 0; i < toggleCount; i++) {
      assertTrue(vaultsV1Registry.getVault(vaultsToToggle[i]).enabled);
    }
    vaultsV1Controller.toggleEnableRegistryVault(vaultsToToggle);
    for (uint256 i = 0; i < toggleCount; i++) {
      assertFalse(vaultsV1Registry.getVault(vaultsToToggle[i]).enabled);
    }
    vaultsV1Controller.toggleEnableRegistryVault(vaultsToToggle);
    for (uint256 i = 0; i < toggleCount; i++) {
      assertTrue(vaultsV1Registry.getVault(vaultsToToggle[i]).enabled);
    }
    vaultsV1Controller.toggleEnableRegistryVault(vaultsToToggle);
    for (uint256 i = 0; i < toggleCount; i++) {
      assertFalse(vaultsV1Registry.getVault(vaultsToToggle[i]).enabled);
    }
  }

  function test__toggleEnableVaultEvent() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = vault;
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultStatusChanged(vault, true, false);
    vaultsV1Controller.toggleEnableRegistryVault(vaultsToToggle);
    assertTrue(vaultsV1Registry.endorsed(vault));
    assertFalse(vaultsV1Registry.getVault(vault).enabled);
  }

  /* Setting vault fees */

  function test__setVaultFeesNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    (uint256 depositBefore, uint256 withdrawalBefore, uint256 managementBefore, uint256 performanceBefore) = Vault(
      vault
    ).feeStructure();
    assertEq(depositBefore, DEPOSIT_FEE);
    assertEq(withdrawalBefore, WITHDRAWAL_FEE);
    assertEq(managementBefore, MANAGEMENT_FEE);
    assertEq(performanceBefore, PERFORMANCE_FEE);
    IVaultsV1.FeeStructure memory newFeeStructure = IVaultsV1.FeeStructure({
      deposit: DEPOSIT_FEE * 2,
      withdrawal: WITHDRAWAL_FEE * 2,
      management: MANAGEMENT_FEE * 2,
      performance: PERFORMANCE_FEE * 2
    });
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setVaultFees(vault, newFeeStructure);
    // check no changes
    (uint256 depositAfter, uint256 withdrawalAfter, uint256 managementAfter, uint256 performanceAfter) = Vault(vault)
      .feeStructure();
    assertEq(depositAfter, depositBefore);
    assertEq(withdrawalAfter, withdrawalBefore);
    assertEq(managementAfter, managementBefore);
    assertEq(performanceAfter, performanceBefore);
  }

  function test__setVaultFeesInvalidFeeStructureReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    (uint256 depositBefore, uint256 withdrawalBefore, uint256 managementBefore, uint256 performanceBefore) = Vault(
      vault
    ).feeStructure();
    assertEq(depositBefore, DEPOSIT_FEE);
    assertEq(withdrawalBefore, WITHDRAWAL_FEE);
    assertEq(managementBefore, MANAGEMENT_FEE);
    assertEq(performanceBefore, PERFORMANCE_FEE);
    IVaultsV1.FeeStructure memory newFeeStructure = IVaultsV1.FeeStructure({
      deposit: 1e18,
      withdrawal: 1e18,
      management: 1e18,
      performance: 1e18
    });
    vm.expectRevert("Invalid FeeStructure");
    vaultsV1Controller.setVaultFees(vault, newFeeStructure);
    // check no changes
    (uint256 depositAfter, uint256 withdrawalAfter, uint256 managementAfter, uint256 performanceAfter) = Vault(vault)
      .feeStructure();
    assertEq(depositAfter, depositBefore);
    assertEq(withdrawalAfter, withdrawalBefore);
    assertEq(managementAfter, managementBefore);
    assertEq(performanceAfter, performanceBefore);
  }

  function test__setVaultFees() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    (uint256 depositBefore, uint256 withdrawalBefore, uint256 managementBefore, uint256 performanceBefore) = Vault(
      vault
    ).feeStructure();
    assertEq(depositBefore, DEPOSIT_FEE);
    assertEq(withdrawalBefore, WITHDRAWAL_FEE);
    assertEq(managementBefore, MANAGEMENT_FEE);
    assertEq(performanceBefore, PERFORMANCE_FEE);
    IVaultsV1.FeeStructure memory newFeeStructure = IVaultsV1.FeeStructure({
      deposit: DEPOSIT_FEE * 2,
      withdrawal: WITHDRAWAL_FEE * 2,
      management: MANAGEMENT_FEE * 2,
      performance: PERFORMANCE_FEE * 2
    });
    vaultsV1Controller.setVaultFees(vault, newFeeStructure);
    (uint256 depositAfter, uint256 withdrawalAfter, uint256 managementAfter, uint256 performanceAfter) = Vault(vault)
      .feeStructure();
    assertEq(depositAfter, newFeeStructure.deposit);
    assertEq(depositAfter, DEPOSIT_FEE * 2);
    assertEq(withdrawalAfter, newFeeStructure.withdrawal);
    assertEq(withdrawalAfter, WITHDRAWAL_FEE * 2);
    assertEq(managementAfter, newFeeStructure.management);
    assertEq(managementAfter, MANAGEMENT_FEE * 2);
    assertEq(performanceAfter, newFeeStructure.performance);
    assertEq(performanceAfter, PERFORMANCE_FEE * 2);
  }

  function test__setVaultFeesEvent() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    (uint256 depositBefore, uint256 withdrawalBefore, uint256 managementBefore, uint256 performanceBefore) = Vault(
      vault
    ).feeStructure();
    assertEq(depositBefore, DEPOSIT_FEE);
    assertEq(withdrawalBefore, WITHDRAWAL_FEE);
    assertEq(managementBefore, MANAGEMENT_FEE);
    assertEq(performanceBefore, PERFORMANCE_FEE);
    IVaultsV1.FeeStructure memory newFeeStructure = IVaultsV1.FeeStructure({
      deposit: DEPOSIT_FEE * 2,
      withdrawal: WITHDRAWAL_FEE * 2,
      management: MANAGEMENT_FEE * 2,
      performance: PERFORMANCE_FEE * 2
    });
    vm.expectEmit(false, false, false, true, vault);
    emit FeesUpdated(vaultParams.feeStructure, newFeeStructure);
    vaultsV1Controller.setVaultFees(vault, newFeeStructure);
    (uint256 depositAfter, uint256 withdrawalAfter, uint256 managementAfter, uint256 performanceAfter) = Vault(vault)
      .feeStructure();
    assertEq(depositAfter, newFeeStructure.deposit);
    assertEq(withdrawalAfter, newFeeStructure.withdrawal);
    assertEq(managementAfter, newFeeStructure.management);
    assertEq(performanceAfter, newFeeStructure.performance);
  }

  /* Setting vault use local fees */

  function test__setVaultUseLocalFeesNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    assertFalse(Vault(vault).useLocalFees());
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setVaultUseLocalFees(vault, true);
    assertFalse(Vault(vault).useLocalFees());
  }

  function test__setVaultUseLocalFees() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    assertFalse(Vault(vault).useLocalFees());
    vaultsV1Controller.setVaultUseLocalFees(vault, true);
    assertTrue(Vault(vault).useLocalFees());
  }

  function test__setVaultUseLocalFeesEvent() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    assertFalse(Vault(vault).useLocalFees());
    vm.expectEmit(false, false, false, true, vault);
    emit UseLocalFees(true);
    vaultsV1Controller.setVaultUseLocalFees(vault, true);
    assertTrue(Vault(vault).useLocalFees());
  }

  /* Setting vault staking */
  function test__setVaultStakingNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    assertEq(Vault(vault).staking(), address(0x1111));
    address newStaking = address(0x8888);
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setVaultStaking(vault, newStaking);
    assertTrue(Vault(vault).staking() != newStaking);
    assertEq(Vault(vault).staking(), address(0x1111));
  }

  function test__setVaultStaking() public acceptOwnerships {
    // Test needs a proper staking contract to interact with
    vaultParams.staking = address(0);
    address vault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      true,
      "someCID",
      swapTokenAddresses,
      address(0x7777),
      1,
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );
    VaultStaking newStaking = new VaultStaking();
    newStaking.initialize(IERC20(address(vault)), IContractRegistry(CONTRACT_REGISTRY));

    // Actual test
    VaultMetadata memory oldMetadata = vaultsV1Registry.getVault(vault);

    assertEq(Vault(vault).staking(), address(0xD457ECDAD18BA6917097BcA0c5A1D6A97da8C26a));

    vaultsV1Controller.setVaultStaking(vault, address(newStaking));

    assertEq(Vault(vault).staking(), address(newStaking));

    VaultMetadata memory newMetadata = vaultsV1Registry.getVault(vault);
    assertEq(newMetadata.staking, address(newStaking));

    assertEq(newMetadata.enabled, oldMetadata.enabled);
    assertEq(newMetadata.vaultZapper, oldMetadata.vaultZapper);
    assertEq(newMetadata.metadataCID, oldMetadata.metadataCID);
    assertEq(newMetadata.swapAddress, oldMetadata.swapAddress);
    assertEq(newMetadata.exchange, oldMetadata.exchange);

    assertEq(IStaking(0xD457ECDAD18BA6917097BcA0c5A1D6A97da8C26a).vault(), address(0));
    assertEq(newStaking.vault(), vault);

    assertFalse(rewardsEscrow.authorized(address(0xD457ECDAD18BA6917097BcA0c5A1D6A97da8C26a)));
    assertTrue(rewardsEscrow.authorized(address(newStaking)));
  }

  function test__setVaultStakingEvent() public acceptOwnerships {
    // Test needs a proper staking contract to interact with
    vaultParams.staking = address(0);
    address vault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      true,
      "someCID",
      swapTokenAddresses,
      address(0x7777),
      1,
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );
    VaultStaking newStaking = new VaultStaking();
    newStaking.initialize(IERC20(address(vault)), IContractRegistry(CONTRACT_REGISTRY));

    // Actual test
    assertEq(Vault(vault).staking(), address(0xD457ECDAD18BA6917097BcA0c5A1D6A97da8C26a));

    vm.expectEmit(false, false, false, true, address(0xD457ECDAD18BA6917097BcA0c5A1D6A97da8C26a));
    emit VaultUpdated(vault, address(0));

    vm.expectEmit(false, false, false, true, address(newStaking));
    emit VaultUpdated(address(0), vault);

    vm.expectEmit(false, false, false, true, vault);
    emit StakingUpdated(address(0xD457ECDAD18BA6917097BcA0c5A1D6A97da8C26a), address(newStaking));

    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultUpdated(vault, 1, true, "someCID");

    vaultsV1Controller.setVaultStaking(vault, address(newStaking));
    assertEq(Vault(vault).staking(), address(newStaking));
  }

  /* Setting vault keeperConfig */
  function test__setVaultKeeperConfigNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    KeeperConfig memory newKeeperConfig = KeeperConfig({
      minWithdrawalAmount: 100,
      incentiveVigBps: 10,
      keeperPayout: 9
    });

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setVaultKeeperConfig(vault, newKeeperConfig);
  }

  function test__setVaultKeeperConfig() public acceptOwnerships {
    // Test needs a proper staking contract to interact with
    vaultParams.staking = address(0);
    address vault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      true,
      "someCID",
      swapTokenAddresses,
      address(0x7777),
      1,
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );
    KeeperConfig memory newKeeperConfig = KeeperConfig({
      minWithdrawalAmount: 42,
      incentiveVigBps: 10,
      keeperPayout: 4
    });

    // Actual test
    vaultsV1Controller.setVaultKeeperConfig(vault, newKeeperConfig);

    (uint256 minWithdrawalAmount, uint256 incentiveVigBps, uint256 keeperPayout) = Vault(vault).keeperConfig();

    assertEq(minWithdrawalAmount, newKeeperConfig.minWithdrawalAmount);
    assertEq(incentiveVigBps, newKeeperConfig.incentiveVigBps);
    assertEq(keeperPayout, newKeeperConfig.keeperPayout);
  }

  function test__setVaultKeeperConfigEvent() public acceptOwnerships {
    // Test needs a proper staking contract to interact with
    vaultParams.staking = address(0);
    address vault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      true,
      "someCID",
      swapTokenAddresses,
      address(0x7777),
      1,
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );
    KeeperConfig memory newKeeperConfig = KeeperConfig({
      minWithdrawalAmount: 42,
      incentiveVigBps: 10,
      keeperPayout: 4
    });

    // Actual test
    vm.expectEmit(false, false, false, true, vault);
    emit KeeperConfigUpdated(vaultKeeperConfig, newKeeperConfig);

    vaultsV1Controller.setVaultKeeperConfig(vault, newKeeperConfig);
  }

  /* Setting vault zapper */
  function test__setVaultZapperNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    address newZapper = address(new VaultsV1Zapper(IContractRegistry(CONTRACT_REGISTRY)));

    assertEq(Vault(vault).zapper(), vaultParams.zapper);
    assertEq(Vault(vault).zapper(), address(vaultZapper));

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setVaultZapper(vault, newZapper);

    assertTrue(Vault(vault).zapper() != newZapper);
    assertEq(Vault(vault).zapper(), address(vaultZapper));
  }

  function test__setVaultZapper() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    VaultsV1Zapper newZapper = new VaultsV1Zapper(IContractRegistry(CONTRACT_REGISTRY));
    VaultMetadata memory oldMetadata = vaultsV1Registry.getVault(vault);

    assertEq(Vault(vault).zapper(), vaultParams.zapper);
    assertEq(Vault(vault).zapper(), address(vaultZapper));

    vaultsV1Controller.setVaultZapper(vault, address(newZapper));

    assertEq(Vault(vault).zapper(), address(newZapper));

    VaultMetadata memory newMetadata = vaultsV1Registry.getVault(vault);
    assertEq(newMetadata.vaultZapper, address(newZapper));

    assertEq(newMetadata.enabled, oldMetadata.enabled);
    assertEq(newMetadata.staking, oldMetadata.staking);
    assertEq(newMetadata.metadataCID, oldMetadata.metadataCID);
    assertEq(newMetadata.swapAddress, oldMetadata.swapAddress);
    assertEq(newMetadata.exchange, oldMetadata.exchange);

    assertEq(vaultZapper.vaults(vaultParams.asset), address(0));
    assertEq(newZapper.vaults(vaultParams.asset), vault);
  }

  function test__setVaultZapperEvent() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    address newZapper = address(new VaultsV1Zapper(IContractRegistry(CONTRACT_REGISTRY)));

    assertEq(Vault(vault).zapper(), vaultParams.zapper);
    assertEq(Vault(vault).zapper(), address(vaultZapper));

    vm.expectEmit(false, false, false, true, address(vaultZapper));
    emit RemovedVault(vaultParams.asset, vault);

    vm.expectEmit(false, false, false, true, newZapper);
    emit UpdatedVault(vaultParams.asset, vault);

    vm.expectEmit(false, false, false, true, vault);
    emit ZapperUpdated(address(vaultZapper), newZapper);

    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultUpdated(vault, 1, true, "someCID");

    vaultsV1Controller.setVaultZapper(vault, newZapper);
    assertEq(Vault(vault).zapper(), newZapper);
  }

  /* Setting Factory Vault Implementation */

  function test__setFactoryVaultImplementationNotOwnerReverts() public acceptOwnerships {
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setFactoryVaultImplementation(address(0x4444));
  }

  function test__setFactoryVaultImplementation() public acceptOwnerships {
    vaultsV1Controller.setFactoryVaultImplementation(address(0x4444));
    assertEq(vaultsV1Factory.vaultImplementation(), address(0x4444));
  }

  function test__setFactoryVaultImplementationEvent() public acceptOwnerships {
    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    emit VaultImplementationUpdated(vaultImplementation, address(0x4444));
    vaultsV1Controller.setFactoryVaultImplementation(address(0x4444));
  }

  /* Setting Factory Staking Implementation */

  function test__setFactoryStakingImplementationNotOwnerReverts() public acceptOwnerships {
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setFactoryStakingImplementation(address(0x4444));
  }

  function test__setFactoryStakingImplementation() public acceptOwnerships {
    vaultsV1Controller.setFactoryStakingImplementation(address(0x4444));
    assertEq(vaultsV1Factory.stakingImplementation(), address(0x4444));
  }

  function test__setFactoryStakingImplementationEvent() public acceptOwnerships {
    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    emit StakingImplementationUpdated(stakingImplementation, address(0x4444));
    vaultsV1Controller.setFactoryStakingImplementation(address(0x4444));
  }

  /* Setting vault registry */
  // function test__setVaultRegistryNotOwnerReverts() public acceptOwnerships {
  //   address vault = helper__deployThroughFactory(true);
  //   address registryBefore = address(AffiliateToken(Vault(vault)).registry());
  //   address newRegistry = address(0x8888);
  //   assertTrue(registryBefore != newRegistry);
  //   assertEq(registryBefore, YEARN_REGISTRY);
  //   vm.prank(notOwner);
  //   vm.expectRevert("Only the contract owner may perform this action");
  //   vaultsV1Controller.setVaultRegistry(vault, newRegistry);
  //   // check no changes
  //   address registryAfter = address(AffiliateToken(Vault(vault)).registry());
  //   assertTrue(registryAfter != newRegistry);
  //   assertEq(registryAfter, registryBefore);
  //   assertEq(registryAfter, YEARN_REGISTRY);
  // }

  // function test__setVaultRegistry() public acceptOwnerships {
  //   address vault = helper__deployThroughFactory(true);
  //   address registryBefore = address(AffiliateToken(Vault(vault)).registry());
  //   address newRegistry = address(0x8888);
  //   assertTrue(registryBefore != newRegistry);
  //   assertEq(registryBefore, YEARN_REGISTRY);
  //   vaultsV1Controller.setVaultRegistry(vault, newRegistry);
  //   address registryAfter = address(AffiliateToken(Vault(vault)).registry());
  //   assertEq(registryAfter, newRegistry);
  //   assertEq(registryAfter, address(0x8888));
  // }

  // function test__setVaultRegistryEvent() public acceptOwnerships {
  //   address vault = helper__deployThroughFactory(true);
  //   address registryBefore = address(AffiliateToken(Vault(vault)).registry());
  //   address newRegistry = address(0x8888);
  //   assertEq(registryBefore, YEARN_REGISTRY);
  //   vm.expectEmit(false, false, false, true, vault);
  //   emit RegistryUpdated(registryBefore, newRegistry);
  //   vaultsV1Controller.setVaultRegistry(vault, newRegistry);
  //   address registryAfter = address(AffiliateToken(Vault(vault)).registry());
  //   assertEq(registryAfter, newRegistry);
  // }

  /* Pausing VaultsV1Registry registered vaults */

  function test__pauseVaultsNotOwnerReverts() public acceptOwnerships {
    uint256 totalVaults = 3;
    uint256 pauseCount = 2;
    address[] memory vaults = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, totalVaults, true);
    assertEq(vaultsV1Registry.getTotalVaults(), totalVaults);
    assertEq(vaults.length, totalVaults);
    for (uint256 i = 0; i < totalVaults; i++) {
      assertFalse(Vault(vaults[i]).paused());
    }
    address[] memory vaultsToPause = new address[](pauseCount);
    for (uint256 i = 0; i < pauseCount; i++) {
      vaultsToPause[i] = vaults[i];
    }
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.pauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertFalse(Vault(vaultsToPause[i]).paused());
    }
  }

  function test__pauseVaults() public acceptOwnerships {
    uint256 totalVaults = 3;
    uint256 pauseCount = 2;
    address[] memory vaults = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, totalVaults, true);
    assertEq(vaultsV1Registry.getTotalVaults(), totalVaults);
    assertEq(vaults.length, totalVaults);
    for (uint256 i = 0; i < totalVaults; i++) {
      assertFalse(Vault(vaults[i]).paused());
    }
    address[] memory vaultsToPause = new address[](pauseCount);
    for (uint256 i = 0; i < pauseCount; i++) {
      vaultsToPause[i] = vaults[i];
    }
    vaultsV1Controller.pauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertTrue(Vault(vaultsToPause[i]).paused());
    }
  }

  function test__pauseVaultsEvent() public acceptOwnerships {
    uint256 totalVaults = 3;
    uint256 pauseCount = 2;
    address[] memory vaults = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, totalVaults, true);
    assertEq(vaultsV1Registry.getTotalVaults(), totalVaults);
    assertEq(vaults.length, totalVaults);
    for (uint256 i = 0; i < totalVaults; i++) {
      assertFalse(Vault(vaults[i]).paused());
    }
    address[] memory vaultsToPause = new address[](pauseCount);
    for (uint256 i = 0; i < pauseCount; i++) {
      vaultsToPause[i] = vaults[i];
    }
    for (uint256 i = 0; i < pauseCount; i++) {
      vm.expectEmit(false, false, false, true, address(vaultsToPause[i]));
      emit Paused(address(vaultsV1Controller));
    }
    vaultsV1Controller.pauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertTrue(Vault(vaultsToPause[i]).paused());
    }
  }

  /* Pausing all VaultsV1Registry registered vaults by type */

  function test__pauseAllVaultsByTypeNotOwnerReverts() public acceptOwnerships {
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsV1Registry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsV1Controller));
      vaultsV1Registry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsV1Registry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.pauseAllVaultsByType(2);
    // check vaults still not paused
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
  }

  function test__pauseAllVaultsByTypeInvalidVaultTypeReverts() public acceptOwnerships {
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsV1Registry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsV1Controller));
      vaultsV1Registry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsV1Registry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    vm.expectRevert("invalid vault type");
    vaultsV1Controller.pauseAllVaultsByType(0);
    vm.expectRevert("invalid vault type");
    vaultsV1Controller.pauseAllVaultsByType(3);
    // check vaults still not paused
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
  }

  function test__pauseAllVaultByType() public acceptOwnerships {
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsV1Registry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsV1Controller));
      vaultsV1Registry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsV1Registry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    vaultsV1Controller.pauseAllVaultsByType(2);
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
  }

  function test__pauseAllVaultsByTypeEvent() public acceptOwnerships {
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsV1Registry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsV1Controller));
      vaultsV1Registry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsV1Registry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      vm.expectEmit(false, false, false, true, address(type2VaultAddresses[i]));
      emit Paused(address(vaultsV1Controller));
    }
    vaultsV1Controller.pauseAllVaultsByType(2);
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
  }

  /* Unpausing VaultsV1Registry registered vaults */

  function test__unpauseVaultsNotOwnerReverts() public acceptOwnerships {
    uint256 totalVaults = 3;
    uint256 pauseCount = 2;
    address[] memory vaults = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, totalVaults, true);
    assertEq(vaultsV1Registry.getTotalVaults(), totalVaults);
    assertEq(vaults.length, totalVaults);
    for (uint256 i = 0; i < totalVaults; i++) {
      assertFalse(Vault(vaults[i]).paused());
    }
    address[] memory vaultsToPause = new address[](pauseCount);
    for (uint256 i = 0; i < pauseCount; i++) {
      vaultsToPause[i] = vaults[i];
    }
    vaultsV1Controller.pauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertTrue(Vault(vaultsToPause[i]).paused());
    }
    // switch from paused back to unpaused
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.unpauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertTrue(Vault(vaultsToPause[i]).paused());
    }
  }

  function test__unpauseVaults() public acceptOwnerships {
    uint256 totalVaults = 3;
    uint256 pauseCount = 2;
    address[] memory vaults = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, totalVaults, true);
    assertEq(vaultsV1Registry.getTotalVaults(), totalVaults);
    assertEq(vaults.length, totalVaults);
    for (uint256 i = 0; i < totalVaults; i++) {
      assertFalse(Vault(vaults[i]).paused());
    }
    address[] memory vaultsToPause = new address[](pauseCount);
    for (uint256 i = 0; i < pauseCount; i++) {
      vaultsToPause[i] = vaults[i];
    }
    vaultsV1Controller.pauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertTrue(Vault(vaultsToPause[i]).paused());
    }
    // switch from paused back to unpaused
    vaultsV1Controller.unpauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertFalse(Vault(vaultsToPause[i]).paused());
    }
  }

  function test__unpauseVaultsEvent() public acceptOwnerships {
    uint256 totalVaults = 3;
    uint256 pauseCount = 2;
    address[] memory vaults = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, totalVaults, true);
    assertEq(vaultsV1Registry.getTotalVaults(), totalVaults);
    assertEq(vaults.length, totalVaults);
    for (uint256 i = 0; i < totalVaults; i++) {
      assertFalse(Vault(vaults[i]).paused());
    }
    address[] memory vaultsToPause = new address[](pauseCount);
    for (uint256 i = 0; i < pauseCount; i++) {
      vaultsToPause[i] = vaults[i];
    }
    vaultsV1Controller.pauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertTrue(Vault(vaultsToPause[i]).paused());
    }
    // switch from paused back to unpaused
    for (uint256 i = 0; i < pauseCount; i++) {
      vm.expectEmit(false, false, false, true, address(vaultsToPause[i]));
      emit Unpaused(address(vaultsV1Controller));
    }
    vaultsV1Controller.unpauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertFalse(Vault(vaultsToPause[i]).paused());
    }
  }

  /* Unpausing all VaultsV1Registry registered vaults by type */

  function test__unpauseAllVaultsByTypeNotOwnerReverts() public acceptOwnerships {
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsV1Registry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsV1Controller));
      vaultsV1Registry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsV1Registry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    // pause all type2 vaults first
    vaultsV1Controller.pauseAllVaultsByType(2);
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    // notOwner attempt to unpause all type2 vaults
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.unpauseAllVaultsByType(2);
    // check type2 vaults are still paused
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
  }

  function test__unpauseAllVaultsByTypeInvalidVaultTypeReverts() public acceptOwnerships {
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsV1Registry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsV1Controller));
      vaultsV1Registry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsV1Registry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    // pause all type2 vaults first
    vaultsV1Controller.pauseAllVaultsByType(2);
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    vm.expectRevert("invalid vault type");
    vaultsV1Controller.unpauseAllVaultsByType(0);
    vm.expectRevert("invalid vault type");
    vaultsV1Controller.unpauseAllVaultsByType(3);
    // check vaults are still paused
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
  }

  function test__unpauseAllVaultsByType() public acceptOwnerships {
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsV1Registry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsV1Controller));
      vaultsV1Registry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsV1Registry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    // pause all type2 vaults first
    vaultsV1Controller.pauseAllVaultsByType(2);
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    // unpause all type2 vaults
    vaultsV1Controller.unpauseAllVaultsByType(2);
    // check type2 vaults are unpaused
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
  }

  function test__unpauseAllVaultsByTypeEvent() public acceptOwnerships {
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsV1Registry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsV1Controller));
      vaultsV1Registry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsV1Registry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    // pause all type2 vaults first
    vaultsV1Controller.pauseAllVaultsByType(2);
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    // type2 vaults emit event
    for (uint256 i = 0; i < type2Vaults; i++) {
      vm.expectEmit(false, false, false, true, address(type2VaultAddresses[i]));
      emit Unpaused(address(vaultsV1Controller));
    }
    // unpause all type2 vaults
    vaultsV1Controller.unpauseAllVaultsByType(2);
    // check type2 vaults are unpaused
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
  }

  /* Accepting ownership of VaultsV1Registry and VaultsV1Factory */

  function test__acceptRegistryFactoryOwnershipNotOwnerReverts() public {
    vaultsV1Factory.nominateNewOwner(address(vaultsV1Controller));
    vaultsV1Registry.nominateNewOwner(address(vaultsV1Controller));
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.acceptRegistryFactoryOwnership();
    assertTrue(vaultsV1Registry.owner() != address(vaultsV1Controller));
    assertEq(vaultsV1Registry.owner(), address(this));
    assertEq(vaultsV1Registry.nominatedOwner(), address(vaultsV1Controller));
    assertTrue(vaultsV1Factory.owner() != address(vaultsV1Controller));
    assertEq(vaultsV1Factory.owner(), address(this));
    assertEq(vaultsV1Factory.nominatedOwner(), address(vaultsV1Controller));
  }

  function test__acceptRegistryFactoryOwnership() public {
    vaultsV1Factory.nominateNewOwner(address(vaultsV1Controller));
    vaultsV1Registry.nominateNewOwner(address(vaultsV1Controller));
    vaultsV1Controller.acceptRegistryFactoryOwnership();
    assertEq(vaultsV1Registry.owner(), address(vaultsV1Controller));
    assertEq(vaultsV1Registry.nominatedOwner(), address(0));
    assertEq(vaultsV1Factory.owner(), address(vaultsV1Controller));
    assertEq(vaultsV1Factory.nominatedOwner(), address(0));
  }

  function test__acceptRegistryFactoryOwnershipEvents() public {
    vaultsV1Factory.nominateNewOwner(address(vaultsV1Controller));
    vaultsV1Registry.nominateNewOwner(address(vaultsV1Controller));
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    emit OwnerChanged(address(this), address(vaultsV1Controller));
    emit OwnerChanged(address(this), address(vaultsV1Controller));
    vaultsV1Controller.acceptRegistryFactoryOwnership();
    assertEq(vaultsV1Registry.owner(), address(vaultsV1Controller));
    assertEq(vaultsV1Factory.owner(), address(vaultsV1Controller));
  }

  /* Nominating new ownership of VaultsV1Registry and VaultsV1Factory */

  function test__transferRegistryFactoryOwnershipNotOwnerReverts() public acceptOwnerships {
    address newOwner = address(0x8888);
    assertEq(vaultsV1Registry.nominatedOwner(), address(0));
    assertEq(vaultsV1Factory.nominatedOwner(), address(0));
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.transferRegistryFactoryOwnership(newOwner);
    assertEq(vaultsV1Registry.nominatedOwner(), address(0));
    assertEq(vaultsV1Factory.nominatedOwner(), address(0));
  }

  function test__transferRegistryFactoryOwnership() public acceptOwnerships {
    address newOwner = address(0x8888);
    assertEq(vaultsV1Registry.nominatedOwner(), address(0));
    assertEq(vaultsV1Factory.nominatedOwner(), address(0));
    vaultsV1Controller.transferRegistryFactoryOwnership(newOwner);
    assertEq(vaultsV1Registry.nominatedOwner(), newOwner);
    assertEq(vaultsV1Registry.nominatedOwner(), address(0x8888));
    assertEq(vaultsV1Factory.nominatedOwner(), newOwner);
    assertEq(vaultsV1Factory.nominatedOwner(), address(0x8888));
  }

  function test__transferRegistryFactoryOwnershipEvent() public acceptOwnerships {
    address newOwner = address(0x8888);
    assertEq(vaultsV1Registry.nominatedOwner(), address(0));
    assertEq(vaultsV1Factory.nominatedOwner(), address(0));
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    emit OwnerNominated(newOwner);
    emit OwnerNominated(newOwner);
    vaultsV1Controller.transferRegistryFactoryOwnership(newOwner);
    assertEq(vaultsV1Registry.nominatedOwner(), newOwner);
    assertEq(vaultsV1Factory.nominatedOwner(), newOwner);
  }

  /* Setting Zaps on VaultsV1Zapper */
  function test__setZapperZapsNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    address zapIn = makeAddr("zapIn");
    address zapOut = makeAddr("zapOut");

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setZapperZaps(vault, address(vaultZapper), zapIn, zapOut);
  }

  function test__setZapperZaps() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    address zapIn = makeAddr("zapIn");
    address zapOut = makeAddr("zapOut");

    // Actual test
    vaultsV1Controller.setZapperZaps(vault, address(vaultZapper), zapIn, zapOut);

    VaultMetadata memory newMetadata = vaultsV1Registry.getVault(vault);
    assertEq(newMetadata.zapIn, zapIn);
    assertEq(newMetadata.zapOut, zapOut);

    (address _zapIn, address _zapOut) = vaultZapper.zaps(vaultParams.asset);
    assertEq(_zapIn, zapIn);
    assertEq(_zapOut, zapOut);
  }

  function test__setZapperZapsEvent() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true);
    address zapIn = makeAddr("zapIn");
    address zapOut = makeAddr("zapOut");

    // Actual test
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultUpdated(vault, 1, true, "someCID");

    vaultsV1Controller.setZapperZaps(vault, address(vaultZapper), zapIn, zapOut);
  }

  /* Setting GlobalFee on VaultsV1Zapper */
  function test__setZapperGlobalFeeNotOwnerReverts() public acceptOwnerships {
    uint256 inBps = 10;
    uint256 outBps = 20;

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setZapperGlobalFee(address(vaultZapper), inBps, outBps);
  }

  function test__setZapperGlobalFee() public acceptOwnerships {
    uint256 inBps = 10;
    uint256 outBps = 20;

    // Actual test
    vaultsV1Controller.setZapperGlobalFee(address(vaultZapper), inBps, outBps);

    (uint256 _inBps, uint256 _outBps) = vaultZapper.globalFee();
    assertEq(_inBps, inBps);
    assertEq(_outBps, outBps);
  }

  function test__setZapperGlobalFeeEvent() public acceptOwnerships {
    uint256 inBps = 10;
    uint256 outBps = 20;

    // Actual test
    vm.expectEmit(false, false, false, true, address(vaultZapper));
    emit GlobalFeeUpdated(inBps, outBps);

    vaultsV1Controller.setZapperGlobalFee(address(vaultZapper), inBps, outBps);
  }

  /* Setting fees on VaultsV1Zapper */
  function test__setZapperAssetFeeNotOwnerReverts() public acceptOwnerships {
    uint256 inFee = 10;
    uint256 outFee = 20;

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setZapperAssetFee(address(vaultZapper), vaultParams.asset, true, inFee, outFee);
  }

  function test__setZapperAssetFee() public acceptOwnerships {
    uint256 inFee = 10;
    uint256 outFee = 20;

    // Actual test
    vaultsV1Controller.setZapperAssetFee(address(vaultZapper), vaultParams.asset, true, inFee, outFee);

    (bool _useAssetFee, uint256 _accumulated, uint256 _inFee, uint256 _outFee) = vaultZapper.fees(vaultParams.asset);
    assertEq(_useAssetFee, true);
    assertEq(_accumulated, uint256(0));
    assertEq(_inFee, inFee);
    assertEq(_outFee, outFee);
  }

  function test__setZapperAssetFeeEvent() public acceptOwnerships {
    uint256 inFee = 10;
    uint256 outFee = 20;

    // Actual test
    vm.expectEmit(false, false, false, true, address(vaultZapper));
    emit FeeUpdated(vaultParams.asset, true, inFee, outFee);

    vaultsV1Controller.setZapperAssetFee(address(vaultZapper), vaultParams.asset, true, inFee, outFee);
  }

  /* Setting zapper keeperConfig */
  function test__setZapperKeeperConfigNotOwnerReverts() public acceptOwnerships {
    KeeperConfig memory newKeeperConfig = KeeperConfig({
      minWithdrawalAmount: 100,
      incentiveVigBps: 10,
      keeperPayout: 9
    });

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setZapperKeeperConfig(address(vaultZapper), vaultParams.asset, newKeeperConfig);
  }

  function test__setZapperKeeperConfig() public acceptOwnerships {
    KeeperConfig memory newKeeperConfig = KeeperConfig({
      minWithdrawalAmount: 42,
      incentiveVigBps: 10,
      keeperPayout: 4
    });

    // Actual test
    vaultsV1Controller.setZapperKeeperConfig(address(vaultZapper), vaultParams.asset, newKeeperConfig);

    (uint256 minWithdrawalAmount, uint256 incentiveVigBps, uint256 keeperPayout) = vaultZapper.keeperConfigs(
      vaultParams.asset
    );

    assertEq(minWithdrawalAmount, newKeeperConfig.minWithdrawalAmount);
    assertEq(incentiveVigBps, newKeeperConfig.incentiveVigBps);
    assertEq(keeperPayout, newKeeperConfig.keeperPayout);
  }

  function test__setZapperKeeperConfigEvent() public acceptOwnerships {
    KeeperConfig memory newKeeperConfig = KeeperConfig({
      minWithdrawalAmount: 42,
      incentiveVigBps: 10,
      keeperPayout: 4
    });

    // Actual test
    vm.expectEmit(false, false, false, true, address(vaultZapper));
    emit KeeperConfigUpdated(
      KeeperConfig({ minWithdrawalAmount: 0, incentiveVigBps: 0, keeperPayout: 0 }),
      newKeeperConfig
    );

    vaultsV1Controller.setZapperKeeperConfig(address(vaultZapper), vaultParams.asset, newKeeperConfig);
  }

  function test__setStakingEscrowDurationsNotOwnerReverts() public acceptOwnerships {
    address[] memory stakingAddrs = new address[](2);
    uint256[] memory stakingDurations = new uint256[](2);

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setStakingEscrowDurations(stakingAddrs, stakingDurations);
  }

  function test__setStakingEscrowDurations() public acceptOwnerships {
    vaultParams.staking = address(0); // Set staking to address(0) so staking contract is deployed

    address vault1 = helper__deployThroughFactoryWithParams(vaultParams, true);
    address vault2 = helper__deployThroughFactoryWithParams(vaultParams, true);

    VaultMetadata memory vault1Data = vaultsV1Registry.getVault(vault1);
    VaultMetadata memory vault2Data = vaultsV1Registry.getVault(vault2);

    address staking1 = vault1Data.staking;
    address staking2 = vault2Data.staking;

    address[] memory stakingAddrs = new address[](2);
    stakingAddrs[0] = staking1;
    stakingAddrs[1] = staking2;

    uint256 duration1 = 1 days;
    uint256 duration2 = 2 days;

    uint256[] memory stakingDurations = new uint256[](2);
    stakingDurations[0] = duration1;
    stakingDurations[1] = duration2;

    // Actual test
    vaultsV1Controller.setStakingEscrowDurations(stakingAddrs, stakingDurations);

    assertEq(IStaking(staking1).escrowDuration(), duration1);
    assertEq(IStaking(staking2).escrowDuration(), duration2);
  }

  function test__setStakingRewardsDurationsNotOwnerReverts() public acceptOwnerships {
    address[] memory stakingAddrs = new address[](2);
    uint256[] memory stakingDurations = new uint256[](2);

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setStakingRewardsDurations(stakingAddrs, stakingDurations);
  }

  function test__setStakingRewardsDurations() public acceptOwnerships {
    vaultParams.staking = address(0); // Set staking to address(0) so staking contract is deployed

    address vault1 = helper__deployThroughFactoryWithParams(vaultParams, true);
    address vault2 = helper__deployThroughFactoryWithParams(vaultParams, true);

    VaultMetadata memory vault1Data = vaultsV1Registry.getVault(vault1);
    VaultMetadata memory vault2Data = vaultsV1Registry.getVault(vault2);

    address staking1 = vault1Data.staking;
    address staking2 = vault2Data.staking;

    address[] memory stakingAddrs = new address[](2);
    stakingAddrs[0] = staking1;
    stakingAddrs[1] = staking2;

    uint256 duration1 = 1 days;
    uint256 duration2 = 2 days;

    uint256[] memory stakingDurations = new uint256[](2);
    stakingDurations[0] = duration1;
    stakingDurations[1] = duration2;

    // Actual test
    vaultsV1Controller.setStakingRewardsDurations(stakingAddrs, stakingDurations);

    assertEq(IStaking(staking1).rewardsDuration(), duration1);
    assertEq(IStaking(staking2).rewardsDuration(), duration2);
  }

  function test__pauseStakingContractsNotOwnerReverts() public acceptOwnerships {
    address[] memory stakingAddrs = new address[](2);

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.pauseStakingContracts(stakingAddrs);
  }

  function test__pauseStakingContracts() public acceptOwnerships {
    vaultParams.staking = address(0); // Set staking to address(0) so staking contract is deployed

    address vault1 = helper__deployThroughFactoryWithParams(vaultParams, true);
    address vault2 = helper__deployThroughFactoryWithParams(vaultParams, true);

    VaultMetadata memory vault1Data = vaultsV1Registry.getVault(vault1);
    VaultMetadata memory vault2Data = vaultsV1Registry.getVault(vault2);

    address staking1 = vault1Data.staking;
    address staking2 = vault2Data.staking;

    address[] memory stakingAddrs = new address[](2);
    stakingAddrs[0] = staking1;
    stakingAddrs[1] = staking2;

    // Actual test
    vaultsV1Controller.pauseStakingContracts(stakingAddrs);

    assertTrue(IStaking(staking1).paused());
    assertTrue(IStaking(staking2).paused());
  }

  function test__unpauseStakingContractsNotOwnerReverts() public acceptOwnerships {
    address[] memory stakingAddrs = new address[](2);

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.unpauseStakingContracts(stakingAddrs);
  }

  function test__unpauseStakingContracts() public acceptOwnerships {
    vaultParams.staking = address(0); // Set staking to address(0) so staking contract is deployed

    address vault1 = helper__deployThroughFactoryWithParams(vaultParams, true);
    address vault2 = helper__deployThroughFactoryWithParams(vaultParams, true);

    VaultMetadata memory vault1Data = vaultsV1Registry.getVault(vault1);
    VaultMetadata memory vault2Data = vaultsV1Registry.getVault(vault2);

    address staking1 = vault1Data.staking;
    address staking2 = vault2Data.staking;

    address[] memory stakingAddrs = new address[](2);
    stakingAddrs[0] = staking1;
    stakingAddrs[1] = staking2;

    // Actual test
    vaultsV1Controller.pauseStakingContracts(stakingAddrs);

    assertTrue(IStaking(staking1).paused());
    assertTrue(IStaking(staking2).paused());

    vaultsV1Controller.unpauseStakingContracts(stakingAddrs);

    assertFalse(IStaking(staking1).paused());
    assertFalse(IStaking(staking2).paused());
  }

  /* ========== FUZZ TESTS ========== */

  function test__fuzz__addVaultTypeToRegistry(uint256 vaultType) public acceptOwnerships {
    vm.assume(vaultType != vaultsV1Registry.vaultTypes() + 1);
    vm.assume(vaultType > 1);
    vm.expectRevert("incorrect vault type");
    vaultsV1Controller.addVaultTypeToRegistry(vaultType);
    assertEq(vaultsV1Registry.vaultTypes(), 1);
  }

  function test__fuzz__pauseAllVaultsByType(uint256 vaultType) public acceptOwnerships {
    vm.assume(vaultType != vaultsV1Registry.vaultTypes() + 1);
    vm.assume(vaultType > 1);
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsV1Registry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsV1Controller));
      vaultsV1Registry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsV1Registry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    vm.expectRevert("invalid vault type");
    vaultsV1Controller.pauseAllVaultsByType(vaultType);
    // check vaults still not paused
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
  }

  function test__fuzz__unpauseAllVaultsByType(uint256 vaultType) public acceptOwnerships {
    vm.assume(vaultType != vaultsV1Registry.vaultTypes() + 1);
    vm.assume(vaultType > 1);
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsV1Registry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsV1Controller));
      vaultsV1Registry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsV1Registry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    // pause all type2 vaults first
    vaultsV1Controller.pauseAllVaultsByType(2);
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    vm.expectRevert("invalid vault type");
    vaultsV1Controller.unpauseAllVaultsByType(vaultType);
    // check vaults are still paused
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
  }
}

// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../../src/vault/VaultsV1Factory.sol";
import "../../src/vault/VaultStakingFactory.sol";
import "../../src/vault/adapter/yearn/YearnWrapperFactory.sol";
import { VaultParams } from "../../src/vault/VaultsV1Factory.sol";
import "../../src/vault/VaultsV1Registry.sol";
import { VaultMetadata } from "../../src/vault/VaultsV1Registry.sol";
import { KeeperConfig } from "../../src/utils/KeeperIncentivized.sol";
import "../../src/vault/VaultStaking.sol";
import "../../src/vault/Vault.sol";
import "../../src/vault/VaultsV1Controller.sol";
import "../../src/zapper/VaultsV1Zapper.sol";
import "../../src/utils/KeeperIncentiveV2.sol";
import "../../src/interfaces/IContractRegistry.sol";
import "../../src/interfaces/IACLRegistry.sol";
import "../../src/interfaces/vault/IVaultsV1.sol";
import "../../src/interfaces/vault/IVaultsV1Zapper.sol";
import "../../src/interfaces/IRewardsEscrow.sol";
import "../../src/interfaces/IOwnable.sol";
import "../../src/vault/adapter/yearn/YearnWrapper.sol";
import "../../src/interfaces/vault/IYearnVaultWrapper.sol";
import "../../src/interfaces/vault/IERC4626.sol";

address constant CRV_3CRYPTO = 0xc4AD29ba4B3c580e6D59105FFf484999997675Ff;
address constant YEARN_REGISTRY = 0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804;
address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;
address constant ACL_REGISTRY = 0x8A41aAa4B467ea545DDDc5759cE3D35984F093f4;
address constant ACL_ADMIN = 0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f;
address constant CURVE_ZAP_IN = 0x5Ce9b49B7A1bE9f2c3DC2B2A5BaCEA56fa21FBeE;
address constant CURVE_ZAP_OUT = 0xE03A338d5c305613AfC3877389DD3B0617233387;
address constant POP = 0xD0Cd466b34A24fcB2f87676278AF2005Ca8A78c4;
address constant REWARDS_ESCROW = 0xb5cb5710044D1074097c17B7535a1cF99cBfb17F;
address constant YEARN_VAULT = 0xE537B5cc158EB71037D4125BDD7538421981E6AA;

contract VaultsV1ControllerTest is Test {
  event ImplementationUpdated(address oldImplementation, address newImplementation);
  event VaultV1Deployed(address vaultAddress, bool endorsed);
  /* VaultsV1Registry events */
  event VaultAdded(address vaultAddress, uint256 vaultType, bool enabled, string metadataCID);
  event VaultUpdated(address vaultAddress, uint256 vaultType, bool enabled, string metadataCID);
  event VaultTypeAdded(uint256 vaultTypes);
  event VaultStatusChanged(address vaultAddress, bool endorsed, bool enabled);
  /* VaultsV1Factory events */
  event VaultV1Deployment(address vault);
  /* VaultStakingFactory events */
  event VaultStakingDeployment(address staking);
  /* YearnWrapperFactory events */
  event YearnWrapperDeployment(address yearnWrapper);
  /* Owned events */
  event OwnerNominated(address newOwner);
  event OwnerChanged(address owner, address nominatedOwner);
  /* Vault events */
  event Paused(address account);
  event Unpaused(address account);
  event FeesUpdated(Vault.FeeStructure previousFees, IVaultsV1.FeeStructure newFees);
  event StakingUpdated(address beforeAddress, address afterAddress);
  event ZapperUpdated(address beforeAddress, address afterAddress);
  event RegistryUpdated(address beforeAddress, address afterAddress);
  event KeeperConfigUpdated(KeeperConfig oldConfig, KeeperConfig newConfig);
  event ZapsUpdated(address zapIn, address zapOut);
  event ChangedStrategy(IERC4626 oldStrategy, IERC4626 newStrategy);
  event NewStrategyProposed(IERC4626 newStrategy, uint256 timestamp);
  /* VaultZapper events */
  event UpdatedVault(address vaultAsset, address vault);
  event RemovedVault(address vaultAsset, address vault);
  event GlobalFeeUpdated(uint256 inBps, uint256 outBps);
  event FeeUpdated(address indexed vaultAsset, bool useAssetFee, uint256 inBps, uint256 outBps);
  /* Staking events */
  event VaultUpdated(address oldVault, address newVault);

  ERC20 internal asset;
  VaultsV1Controller internal vaultsV1Controller;
  VaultsV1Registry internal vaultsV1Registry;
  VaultsV1Factory internal vaultsV1Factory;
  VaultStakingFactory internal vaultStakingFactory;
  YearnWrapperFactory internal yearnWrapperFactory;
  KeeperIncentiveV2 internal keeperIncentive;
  VaultsV1Zapper internal vaultZapper;
  IRewardsEscrow internal rewardsEscrow = IRewardsEscrow(address(0xb5cb5710044D1074097c17B7535a1cF99cBfb17F));
  YearnWrapper internal yearnWrapper;

  address internal vaultImplementation;
  address internal stakingImplementation;
  address internal yearnWrapperImplementation;

  address internal vaultsV1ControllerOwner = address(this);
  address internal notOwner = makeAddr("notOwner");

  uint256 constant DEPOSIT_FEE = 50 * 1e14;
  uint256 constant WITHDRAWAL_FEE = 50 * 1e14;
  uint256 constant MANAGEMENT_FEE = 200 * 1e14;
  uint256 constant PERFORMANCE_FEE = 2000 * 1e14;

  KeeperConfig internal KEEPER_CONFIG = KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1, keeperPayout: 9 });
  string internal CID = "SomeCID";
  address DEFAULT_STAKING = makeAddr("staking");
  address SWAP_ADDRESS = makeAddr("swap");
  address NEW_IMPLEMENTATION = makeAddr("implementation");
  bytes32[] internal FACTORY_NAMES;

  VaultParams internal vaultParams;

  address[8] internal swapTokenAddresses;

  /* ========== MODIFIERS ========== */

  modifier acceptOwnerships() {
    vaultsV1Registry.nominateNewOwner(address(vaultsV1Controller));
    vaultsV1Factory.nominateNewOwner(address(vaultsV1Controller));
    vaultStakingFactory.nominateNewOwner(address(vaultsV1Controller));
    yearnWrapperFactory.nominateNewOwner(address(vaultsV1Controller));

    vaultsV1Controller.acceptFactoryAndRegistryOwnership(FACTORY_NAMES);
    _;
  }

  function setUp() public {
    uint256 forkId = vm.createSelectFork(vm.rpcUrl("FORKING_RPC_URL"), 15008113);
    vm.selectFork(forkId);

    asset = ERC20(CRV_3CRYPTO);

    vaultImplementation = address(new Vault{ salt: keccak256("VAULT") }());
    stakingImplementation = address(new VaultStaking{ salt: keccak256("VAULT_STAKING") }());
    yearnWrapperImplementation = address(new YearnWrapper{ salt: keccak256("YEARN_WRAPPER") }());

    yearnWrapper = YearnWrapper(helper__deployYearnWrapper(YEARN_VAULT));

    vaultParams = VaultParams({
      asset: asset,
      strategy: IERC4626(address(yearnWrapper)),
      contractRegistry: IContractRegistry(CONTRACT_REGISTRY),
      feeStructure: Vault.FeeStructure({
        deposit: DEPOSIT_FEE,
        withdrawal: WITHDRAWAL_FEE,
        management: MANAGEMENT_FEE,
        performance: PERFORMANCE_FEE
      }),
      keeperConfig: KEEPER_CONFIG
    });

    vaultsV1Factory = new VaultsV1Factory(address(this));
    vaultStakingFactory = new VaultStakingFactory(address(this), IContractRegistry(CONTRACT_REGISTRY));
    yearnWrapperFactory = new YearnWrapperFactory(address(this));

    vaultsV1Registry = new VaultsV1Registry(address(this));
    vaultsV1Controller = new VaultsV1Controller(address(this), IContractRegistry(CONTRACT_REGISTRY));
    keeperIncentive = new KeeperIncentiveV2(IContractRegistry(CONTRACT_REGISTRY), 25e16, 2000 ether);
    vaultZapper = new VaultsV1Zapper(IContractRegistry(CONTRACT_REGISTRY));

    vaultsV1Factory.setImplementation(vaultImplementation);
    vaultStakingFactory.setImplementation(stakingImplementation);
    yearnWrapperFactory.setImplementation(yearnWrapperImplementation);

    vm.startPrank(ACL_ADMIN);
    IOwnable(address(rewardsEscrow)).transferOwnership(address(vaultsV1Controller));
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
    IContractRegistry(CONTRACT_REGISTRY).addContract(
      vaultStakingFactory.contractName(),
      address(vaultStakingFactory),
      keccak256("1")
    );
    IContractRegistry(CONTRACT_REGISTRY).addContract(
      yearnWrapperFactory.contractName(),
      address(yearnWrapperFactory),
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
    vm.label(address(vaultStakingFactory), "VaultStakingFactory");

    for (uint256 i = 0; i < 8; i++) {
      swapTokenAddresses[i] = address(uint160(i));
    }

    // Add factory names for ownership change
    FACTORY_NAMES.push(vaultsV1Registry.contractName());
    FACTORY_NAMES.push(vaultsV1Factory.contractName());
    FACTORY_NAMES.push(vaultStakingFactory.contractName());
    FACTORY_NAMES.push(yearnWrapperFactory.contractName());
  }

  /* ========== HELPER FUNCTIONS ========== */

  function helper__addVaultTypesToRegistry(uint256 _vaultTypes) public {
    for (uint256 i = 2; i <= _vaultTypes; i++) {
      vaultsV1Controller.addVaultTypeToRegistry(i);
    }
    assertEq(vaultsV1Registry.vaultTypes(), _vaultTypes);
  }

  function helper__deployYearnWrapper(address yearnVault) public returns (address yearnWrapperAddress) {
    yearnWrapperAddress = address(new YearnWrapper());
    YearnWrapper(yearnWrapperAddress).initialize(VaultAPI(yearnVault));
  }

  function helper__deployThroughFactory(bool _endorsed, address _staking) public returns (address) {
    address deployedVault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      _staking,
      _endorsed,
      CID,
      swapTokenAddresses,
      SWAP_ADDRESS,
      1,
      address(vaultZapper),
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );
    vaultsV1Registry.getVault(deployedVault);
    return deployedVault;
  }

  function helper__deployVault(uint256 _vaultType) public returns (Vault, VaultMetadata memory) {
    Vault vault = new Vault();
    vault.initialize(
      asset,
      IERC4626(address(yearnWrapper)),
      IContractRegistry(CONTRACT_REGISTRY),
      Vault.FeeStructure({
        deposit: DEPOSIT_FEE,
        withdrawal: WITHDRAWAL_FEE,
        management: MANAGEMENT_FEE,
        performance: PERFORMANCE_FEE
      }),
      KEEPER_CONFIG
    );
    VaultMetadata memory metadata = VaultMetadata({
      vaultAddress: address(vault),
      vaultType: _vaultType,
      enabled: true,
      staking: DEFAULT_STAKING,
      vaultZapper: address(vaultZapper),
      submitter: address(this),
      metadataCID: CID,
      swapTokenAddresses: swapTokenAddresses,
      swapAddress: SWAP_ADDRESS,
      exchange: 1,
      zapIn: CURVE_ZAP_IN,
      zapOut: CURVE_ZAP_OUT
    });
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
        DEFAULT_STAKING,
        _endorsed,
        CID,
        swapTokenAddresses,
        SWAP_ADDRESS,
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
      DEFAULT_STAKING,
      true,
      CID,
      swapTokenAddresses,
      SWAP_ADDRESS,
      1,
      address(vaultZapper),
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );
    assertEq(vaultsV1Registry.getTotalVaults(), 0);
  }

  function test__deployVaultFromV1FactoryNoZapsReverts() public acceptOwnerships {
    vm.expectRevert(VaultsV1Controller.SetZaps.selector);
    vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      DEFAULT_STAKING,
      true,
      CID,
      swapTokenAddresses,
      SWAP_ADDRESS,
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
      DEFAULT_STAKING,
      true,
      CID,
      swapTokenAddresses,
      SWAP_ADDRESS,
      1,
      address(vaultZapper),
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );

    assertTrue(deployedVault != address(0));

    emit log_named_address("VaultV1Deployment", deployedVault);

    VaultMetadata memory metadata = vaultsV1Registry.getVault(deployedVault);
    assertEq(metadata.vaultAddress, deployedVault);
    assertEq(metadata.vaultType, 1);
    assertEq(metadata.enabled, true);
    assertEq(metadata.staking, DEFAULT_STAKING);
    assertEq(metadata.vaultZapper, address(vaultZapper));
    assertEq(metadata.submitter, address(this));
    assertEq(metadata.metadataCID, CID);
    for (uint256 i = 0; i < 8; i++) {
      assertEq(metadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(metadata.swapAddress, SWAP_ADDRESS);
    assertEq(metadata.exchange, 1);
    assertEq(metadata.zapIn, CURVE_ZAP_IN);
    assertEq(metadata.zapOut, CURVE_ZAP_OUT);

    assertEq(vaultsV1Registry.getRegisteredAddresses()[0], deployedVault);
    assertEq(vaultsV1Registry.getVaultsByAsset(CRV_3CRYPTO)[0], deployedVault);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], deployedVault);
    assertTrue(vaultsV1Registry.endorsed(deployedVault));

    assertEq(vaultZapper.vaults(CRV_3CRYPTO), deployedVault);

    (address zapIn, address zapOut) = vaultZapper.zaps(CRV_3CRYPTO);
    assertEq(zapIn, CURVE_ZAP_IN);
    assertEq(zapOut, CURVE_ZAP_OUT);

    assertTrue(rewardsEscrow.authorized(DEFAULT_STAKING));
  }

  function test__deployVaultFromV1FactoryNotEndorsed() public acceptOwnerships {
    address deployedVault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      DEFAULT_STAKING,
      false,
      CID,
      swapTokenAddresses,
      SWAP_ADDRESS,
      1,
      address(vaultZapper),
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );
    assertTrue(deployedVault != address(0));

    emit log_named_address("VaultV1Deployment", deployedVault);

    VaultMetadata memory metadata = vaultsV1Registry.getVault(deployedVault);
    assertEq(metadata.vaultAddress, deployedVault);
    assertEq(metadata.vaultType, 1);
    assertEq(metadata.enabled, true);
    assertEq(metadata.staking, DEFAULT_STAKING);
    assertEq(metadata.vaultZapper, address(vaultZapper));
    assertEq(metadata.submitter, address(this));
    assertEq(metadata.metadataCID, CID);
    for (uint256 i = 0; i < 8; i++) {
      assertEq(metadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(metadata.swapAddress, SWAP_ADDRESS);
    assertEq(metadata.exchange, 1);
    assertEq(metadata.zapIn, CURVE_ZAP_IN);
    assertEq(metadata.zapOut, CURVE_ZAP_OUT);

    assertEq(vaultsV1Registry.getRegisteredAddresses()[0], deployedVault);
    assertEq(vaultsV1Registry.getVaultsByAsset(CRV_3CRYPTO)[0], deployedVault);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], deployedVault);
    assertFalse(vaultsV1Registry.endorsed(deployedVault));

    assertEq(vaultZapper.vaults(CRV_3CRYPTO), deployedVault);

    (address zapIn, address zapOut) = vaultZapper.zaps(CRV_3CRYPTO);
    assertEq(zapIn, CURVE_ZAP_IN);
    assertEq(zapOut, CURVE_ZAP_OUT);

    assertTrue(rewardsEscrow.authorized(DEFAULT_STAKING));
  }

  /*   Deploy a new Staking contract with the Vault   */
  function test__deployVaultFromV1FactoryWithStaking() public acceptOwnerships {
    address deployedVault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      address(0),
      true,
      CID,
      swapTokenAddresses,
      SWAP_ADDRESS,
      1,
      address(vaultZapper),
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );

    assertTrue(deployedVault != address(0));
    VaultStaking newStaking = new VaultStaking();
    newStaking.initialize(IERC20(address(deployedVault)), IContractRegistry(CONTRACT_REGISTRY));

    vaultsV1Controller.setVaultStaking(deployedVault, address(newStaking));
    emit log_named_address("VaultV1Deployment", deployedVault);

    VaultMetadata memory metadata = vaultsV1Registry.getVault(deployedVault);
    assertEq(metadata.vaultAddress, deployedVault);
    assertEq(metadata.vaultType, 1);
    assertEq(metadata.enabled, true);
    assertEq(metadata.staking, address(newStaking));
    assertEq(metadata.vaultZapper, address(vaultZapper));
    assertEq(metadata.submitter, address(this));
    assertEq(metadata.metadataCID, CID);
    for (uint256 i = 0; i < 8; i++) {
      assertEq(metadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(metadata.swapAddress, SWAP_ADDRESS);
    assertEq(metadata.exchange, 1);
    assertEq(metadata.zapIn, CURVE_ZAP_IN);
    assertEq(metadata.zapOut, CURVE_ZAP_OUT);

    assertEq(vaultsV1Registry.getRegisteredAddresses()[0], deployedVault);
    assertEq(vaultsV1Registry.getVaultsByAsset(CRV_3CRYPTO)[0], deployedVault);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], deployedVault);
    assertTrue(vaultsV1Registry.endorsed(deployedVault));

    IStaking staking = IStaking(newStaking);
    assertEq(address(staking.rewardsToken()), 0xD0Cd466b34A24fcB2f87676278AF2005Ca8A78c4);
    assertEq(address(staking.stakingToken()), deployedVault);

    assertEq(vaultZapper.vaults(CRV_3CRYPTO), deployedVault);

    (address zapIn, address zapOut) = vaultZapper.zaps(CRV_3CRYPTO);
    assertEq(zapIn, CURVE_ZAP_IN);
    assertEq(zapOut, CURVE_ZAP_OUT);

    assertTrue(rewardsEscrow.authorized(address(newStaking)));
  }

  function test__deployVaultFromV1FactoryWithStakingEvents() public acceptOwnerships {
    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    vm.expectEmit(false, false, false, true, address(vaultStakingFactory));
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    vm.expectEmit(false, false, false, true, address(vaultsV1Controller));

    emit VaultV1Deployment(0xF4Ed673C99450FCF96015844eDD1577335B6695B);
    emit VaultStakingDeployment(0x0D7CadAab171Bd7B3a0EA6e1b21b2BfF9F13E14f);
    emit VaultAdded(0xF4Ed673C99450FCF96015844eDD1577335B6695B, 1, true, CID);
    emit VaultStatusChanged(0xF4Ed673C99450FCF96015844eDD1577335B6695B, true, true);
    emit VaultV1Deployed(0xF4Ed673C99450FCF96015844eDD1577335B6695B, true);

    address _vault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      address(0),
      true,
      CID,
      swapTokenAddresses,
      SWAP_ADDRESS,
      1,
      address(vaultZapper),
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );
    console.log("deployed vault", _vault);
    console.log("deployed staking", vaultsV1Registry.getVault(_vault).staking);
  }

  /* Adding vault type to VaultsV1Registry */
  function test__addVaultTypeToRegistryNotOwnerReverts() public acceptOwnerships {
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.addVaultTypeToRegistry(2);

    assertEq(vaultsV1Registry.vaultTypes(), 1);
  }

  function test__addVaultTypeToRegistryIncorrectTypeReverts() public acceptOwnerships {
    vm.expectRevert(VaultsV1Registry.InvalidVaultType.selector);
    vaultsV1Controller.addVaultTypeToRegistry(0);

    vm.expectRevert(VaultsV1Registry.InvalidVaultType.selector);
    vaultsV1Controller.addVaultTypeToRegistry(1);

    vm.expectRevert(VaultsV1Registry.InvalidVaultType.selector);
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
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);

    address[8] memory newSwapTokenAddresses;
    for (uint256 i = 0; i < 8; i++) {
      newSwapTokenAddresses[i] = address(uint160(i * 2));
    }

    VaultMetadata memory newMetadata = VaultMetadata({
      vaultAddress: vault,
      vaultType: 1,
      enabled: false,
      staking: DEFAULT_STAKING,
      vaultZapper: address(vaultZapper),
      submitter: address(this),
      metadataCID: "differentCID",
      swapTokenAddresses: newSwapTokenAddresses,
      swapAddress: SWAP_ADDRESS,
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
    assertEq(vaultsV1RegistryMetadata.staking, DEFAULT_STAKING);
    assertEq(vaultsV1RegistryMetadata.submitter, address(this));
    assertEq(vaultsV1RegistryMetadata.metadataCID, CID);
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsV1RegistryMetadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(vaultsV1RegistryMetadata.swapAddress, SWAP_ADDRESS);
    assertEq(vaultsV1RegistryMetadata.exchange, 1);
    assertEq(vaultsV1RegistryMetadata.zapIn, CURVE_ZAP_IN);
    assertEq(vaultsV1RegistryMetadata.zapOut, CURVE_ZAP_OUT);

    assertEq(vaultsV1Registry.typeVaults(1, 0), vault);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], vault);
    assertEq(vaultsV1Registry.getVaultsByType(1).length, 1);
  }

  function test__updateRegistryVaultAddressNotRegisteredReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);

    address[8] memory newSwapTokenAddresses;
    for (uint256 i = 0; i < 8; i++) {
      newSwapTokenAddresses[i] = address(uint160(i * 2));
    }

    address notVault = address(0x8888);
    VaultMetadata memory newMetadata = VaultMetadata({
      vaultAddress: notVault,
      vaultType: 1,
      enabled: false,
      staking: DEFAULT_STAKING,
      vaultZapper: address(vaultZapper),
      submitter: address(this),
      metadataCID: "differentCID",
      swapTokenAddresses: newSwapTokenAddresses,
      swapAddress: SWAP_ADDRESS,
      exchange: 2,
      zapIn: CURVE_ZAP_IN,
      zapOut: CURVE_ZAP_OUT
    });

    assertTrue(vault != notVault);

    assertEq(vaultsV1Registry.getTotalVaults(), 1);

    vm.expectRevert(VaultsV1Registry.VaultNotRegistered.selector);
    vaultsV1Controller.updateRegistryVault(newMetadata);

    // check no changes
    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(vault);
    assertEq(vaultsV1RegistryMetadata.vaultAddress, vault);
    assertEq(vaultsV1RegistryMetadata.vaultType, 1);
    assertEq(vaultsV1RegistryMetadata.enabled, true);
    assertEq(vaultsV1RegistryMetadata.staking, DEFAULT_STAKING);
    assertEq(vaultsV1RegistryMetadata.submitter, address(this));
    assertEq(vaultsV1RegistryMetadata.metadataCID, CID);
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsV1RegistryMetadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(vaultsV1RegistryMetadata.swapAddress, SWAP_ADDRESS);
    assertEq(vaultsV1RegistryMetadata.exchange, 1);
    assertEq(vaultsV1RegistryMetadata.zapIn, CURVE_ZAP_IN);
    assertEq(vaultsV1RegistryMetadata.zapOut, CURVE_ZAP_OUT);

    assertEq(vaultsV1Registry.typeVaults(1, 0), vault);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], vault);
    assertEq(vaultsV1Registry.getVaultsByType(1).length, 1);
  }

  function test__updateRegistryVault() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);

    address[8] memory newSwapTokenAddresses;
    for (uint256 i = 0; i < 8; i++) {
      newSwapTokenAddresses[i] = address(uint160(i * 2));
    }

    VaultMetadata memory newMetadata = VaultMetadata({
      vaultAddress: vault,
      vaultType: 1,
      enabled: false,
      staking: DEFAULT_STAKING,
      vaultZapper: address(vaultZapper),
      submitter: address(this),
      metadataCID: "differentCID",
      swapTokenAddresses: newSwapTokenAddresses,
      swapAddress: SWAP_ADDRESS,
      exchange: 2,
      zapIn: CURVE_ZAP_IN,
      zapOut: CURVE_ZAP_OUT
    });

    vaultsV1Controller.updateRegistryVault(newMetadata);

    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(vault);
    assertEq(vaultsV1RegistryMetadata.vaultAddress, vault);
    assertEq(vaultsV1RegistryMetadata.vaultType, 1);
    assertEq(vaultsV1RegistryMetadata.enabled, false);
    assertEq(vaultsV1RegistryMetadata.staking, DEFAULT_STAKING);
    assertEq(vaultsV1RegistryMetadata.submitter, address(this));
    assertEq(vaultsV1RegistryMetadata.metadataCID, "differentCID");
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsV1RegistryMetadata.swapTokenAddresses[i], newSwapTokenAddresses[i]);
    }
    assertEq(vaultsV1RegistryMetadata.swapAddress, SWAP_ADDRESS);
    assertEq(vaultsV1RegistryMetadata.exchange, 2);
    assertEq(vaultsV1RegistryMetadata.zapIn, CURVE_ZAP_IN);
    assertEq(vaultsV1RegistryMetadata.zapOut, CURVE_ZAP_OUT);

    assertEq(vaultsV1Registry.typeVaults(1, 0), vault);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], vault);
    assertEq(vaultsV1Registry.getVaultsByType(1).length, 1);
  }

  function test__updateRegistryVaultCannotChangeVaultTypeReverts() public acceptOwnerships {
    helper__addVaultTypesToRegistry(3);

    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    address[8] memory newSwapTokenAddresses;
    for (uint256 i = 0; i < 8; i++) {
      newSwapTokenAddresses[i] = address(uint160(i * 2));
    }

    VaultMetadata memory newMetadata = VaultMetadata({
      vaultAddress: vault,
      vaultType: 2, // attempt to change vault type
      enabled: false,
      staking: DEFAULT_STAKING,
      vaultZapper: address(vaultZapper),
      submitter: address(this),
      metadataCID: "differentCID",
      swapTokenAddresses: newSwapTokenAddresses,
      swapAddress: SWAP_ADDRESS,
      exchange: 2,
      zapIn: CURVE_ZAP_IN,
      zapOut: CURVE_ZAP_OUT
    });

    assertEq(vaultsV1Registry.getVault(vault).vaultType, 1);
    assertEq(vaultsV1Registry.getVaultsByType(1)[0], vault);
    assertEq(vaultsV1Registry.getVaultsByType(1).length, 1);

    vm.expectRevert(VaultsV1Registry.NoTypeVaults.selector);
    vaultsV1Registry.getVaultsByType(2);

    vm.expectRevert(VaultsV1Registry.VaultTypeImmutable.selector);
    vaultsV1Controller.updateRegistryVault(newMetadata);

    // check no changes
    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(vault);
    assertEq(vaultsV1RegistryMetadata.vaultAddress, vault);
    assertEq(vaultsV1RegistryMetadata.vaultType, 1);

    assertEq(vaultsV1Registry.getVaultsByType(1)[0], vault);
    assertEq(vaultsV1Registry.getVaultsByType(1).length, 1);

    vm.expectRevert(VaultsV1Registry.NoTypeVaults.selector);
    vaultsV1Registry.getVaultsByType(2);

    assertEq(vaultsV1RegistryMetadata.enabled, true);
    assertEq(vaultsV1RegistryMetadata.staking, DEFAULT_STAKING);
    assertEq(vaultsV1RegistryMetadata.submitter, address(this));
    assertEq(vaultsV1RegistryMetadata.metadataCID, CID);
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsV1RegistryMetadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(vaultsV1RegistryMetadata.swapAddress, SWAP_ADDRESS);
    assertEq(vaultsV1RegistryMetadata.exchange, 1);
    assertEq(vaultsV1RegistryMetadata.zapIn, CURVE_ZAP_IN);
    assertEq(vaultsV1RegistryMetadata.zapOut, CURVE_ZAP_OUT);
  }

  function test__updateRegistryVaultCannotChangeSubmitterReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);

    address[8] memory newSwapTokenAddresses;
    for (uint256 i = 0; i < 8; i++) {
      newSwapTokenAddresses[i] = address(uint160(i * 2));
    }

    address notSubmitter = address(0x8888);
    VaultMetadata memory newMetadata = VaultMetadata({
      vaultAddress: address(vault),
      vaultType: 1,
      enabled: false,
      staking: DEFAULT_STAKING,
      vaultZapper: address(vaultZapper),
      submitter: notSubmitter, // attempt to change submitter
      metadataCID: "differentCID",
      swapTokenAddresses: newSwapTokenAddresses,
      swapAddress: SWAP_ADDRESS,
      exchange: 2,
      zapIn: CURVE_ZAP_IN,
      zapOut: CURVE_ZAP_OUT
    });

    vm.expectRevert(VaultsV1Registry.SubmitterImmutable.selector);
    vaultsV1Controller.updateRegistryVault(newMetadata);

    // check no changes
    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(vault);
    assertEq(vaultsV1RegistryMetadata.vaultAddress, vault);
    assertTrue(vaultsV1RegistryMetadata.submitter != notSubmitter);
    assertEq(vaultsV1RegistryMetadata.submitter, address(this));
    assertEq(vaultsV1RegistryMetadata.vaultType, 1);
    assertEq(vaultsV1RegistryMetadata.enabled, true);
    assertEq(vaultsV1RegistryMetadata.staking, DEFAULT_STAKING);
    assertEq(vaultsV1RegistryMetadata.metadataCID, CID);
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsV1RegistryMetadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(vaultsV1RegistryMetadata.swapAddress, SWAP_ADDRESS);
    assertEq(vaultsV1RegistryMetadata.exchange, 1);
    assertEq(vaultsV1RegistryMetadata.zapIn, CURVE_ZAP_IN);
    assertEq(vaultsV1RegistryMetadata.zapOut, CURVE_ZAP_OUT);
  }

  function test__updateVaultEvent() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    address[8] memory newSwapTokenAddresses;
    for (uint256 i = 0; i < 8; i++) {
      newSwapTokenAddresses[i] = address(uint160(i * 2));
    }
    VaultMetadata memory newMetadata = VaultMetadata({
      vaultAddress: address(vault),
      vaultType: 1,
      enabled: true,
      staking: DEFAULT_STAKING,
      vaultZapper: address(vaultZapper),
      submitter: address(this),
      metadataCID: "differentCID",
      swapTokenAddresses: newSwapTokenAddresses,
      swapAddress: SWAP_ADDRESS,
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
    address vault = helper__deployThroughFactory(false, DEFAULT_STAKING);
    assertFalse(vaultsV1Registry.endorsed(vault));
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = vault;
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.toggleEndorseRegistryVault(vaultsToToggle);
    assertFalse(vaultsV1Registry.endorsed(vault));
  }

  function test__toggleEndorseVaultAddressNotRegisteredReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(false, DEFAULT_STAKING);
    assertFalse(vaultsV1Registry.endorsed(vault));
    address nonRegistered = address(0x8888);
    assertTrue(vault != nonRegistered);
    assertEq(vaultsV1Registry.getTotalVaults(), 1);
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = nonRegistered;
    vm.expectRevert(VaultsV1Registry.VaultNotRegistered.selector);
    vaultsV1Controller.toggleEndorseRegistryVault(vaultsToToggle);
    assertFalse(vaultsV1Registry.endorsed(vault));
  }

  function test__toggleEndorseVault() public acceptOwnerships {
    address vault = helper__deployThroughFactory(false, DEFAULT_STAKING);
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
    address vault = helper__deployThroughFactory(false, DEFAULT_STAKING);
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
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = vault;
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.toggleEnableRegistryVault(vaultsToToggle);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
  }

  function test__toggleEnableVaultAddressNotRegisteredReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
    address nonRegistered = address(0x8888);
    assertTrue(vault != nonRegistered);
    assertEq(vaultsV1Registry.getTotalVaults(), 1);
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = nonRegistered;
    vm.expectRevert(VaultsV1Registry.VaultNotRegistered.selector);
    vaultsV1Controller.toggleEnableRegistryVault(vaultsToToggle);
    assertTrue(vaultsV1Registry.getVault(vault).enabled);
  }

  function test__toggleEnableVaultOnly() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
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
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
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
    address[] memory vaultArray = new address[](1);
    vaultArray[0] = helper__deployThroughFactory(true, DEFAULT_STAKING);

    IVaultsV1.FeeStructure[] memory newFeeStructure = new IVaultsV1.FeeStructure[](1);
    newFeeStructure[0] = IVaultsV1.FeeStructure({
      deposit: DEPOSIT_FEE * 2,
      withdrawal: WITHDRAWAL_FEE * 2,
      management: MANAGEMENT_FEE * 2,
      performance: PERFORMANCE_FEE * 2
    });

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setVaultFees(vaultArray, newFeeStructure);
  }

  function test__setVaultFeesInvalidFeeStructureReverts() public acceptOwnerships {
    address[] memory vaultArray = new address[](1);
    vaultArray[0] = helper__deployThroughFactory(true, DEFAULT_STAKING);

    IVaultsV1.FeeStructure[] memory newFeeStructure = new IVaultsV1.FeeStructure[](1);
    newFeeStructure[0] = IVaultsV1.FeeStructure({
      deposit: 1e18,
      withdrawal: 1e18,
      management: 1e18,
      performance: 1e18
    });

    vm.expectRevert(Vault.InvalidFeeStructure.selector);
    vaultsV1Controller.setVaultFees(vaultArray, newFeeStructure);
  }

  function test__setVaultFees() public acceptOwnerships {
    address[] memory vaultArray = new address[](2);
    vaultArray[0] = helper__deployThroughFactory(true, DEFAULT_STAKING);
    vaultArray[1] = helper__deployThroughFactory(true, DEFAULT_STAKING);

    IVaultsV1.FeeStructure[] memory newFeeStructure = new IVaultsV1.FeeStructure[](2);
    newFeeStructure[0] = IVaultsV1.FeeStructure({
      deposit: DEPOSIT_FEE * 2,
      withdrawal: WITHDRAWAL_FEE * 2,
      management: MANAGEMENT_FEE * 2,
      performance: PERFORMANCE_FEE * 2
    });
    newFeeStructure[1] = IVaultsV1.FeeStructure({
      deposit: DEPOSIT_FEE * 3,
      withdrawal: WITHDRAWAL_FEE * 3,
      management: MANAGEMENT_FEE * 3,
      performance: PERFORMANCE_FEE * 3
    });

    vaultsV1Controller.setVaultFees(vaultArray, newFeeStructure);

    (uint256 depositAfter1, uint256 withdrawalAfter1, uint256 managementAfter1, uint256 performanceAfter1) = Vault(
      vaultArray[0]
    ).feeStructure();

    assertEq(depositAfter1, newFeeStructure[0].deposit);
    assertEq(withdrawalAfter1, newFeeStructure[0].withdrawal);
    assertEq(managementAfter1, newFeeStructure[0].management);
    assertEq(performanceAfter1, newFeeStructure[0].performance);

    (uint256 depositAfter2, uint256 withdrawalAfter2, uint256 managementAfter2, uint256 performanceAfter2) = Vault(
      vaultArray[1]
    ).feeStructure();
    assertEq(depositAfter2, newFeeStructure[1].deposit);
    assertEq(withdrawalAfter2, newFeeStructure[1].withdrawal);
    assertEq(managementAfter2, newFeeStructure[1].management);
    assertEq(performanceAfter2, newFeeStructure[1].performance);
  }

  function test__setVaultFeesEvent() public acceptOwnerships {
    address[] memory vaultArray = new address[](2);
    vaultArray[0] = helper__deployThroughFactory(true, DEFAULT_STAKING);
    vaultArray[1] = helper__deployThroughFactory(true, DEFAULT_STAKING);

    IVaultsV1.FeeStructure[] memory newFeeStructure = new IVaultsV1.FeeStructure[](2);
    newFeeStructure[0] = IVaultsV1.FeeStructure({
      deposit: DEPOSIT_FEE * 2,
      withdrawal: WITHDRAWAL_FEE * 2,
      management: MANAGEMENT_FEE * 2,
      performance: PERFORMANCE_FEE * 2
    });
    newFeeStructure[1] = IVaultsV1.FeeStructure({
      deposit: DEPOSIT_FEE * 3,
      withdrawal: WITHDRAWAL_FEE * 3,
      management: MANAGEMENT_FEE * 3,
      performance: PERFORMANCE_FEE * 3
    });

    vm.expectEmit(false, false, false, true, vaultArray[0]);
    emit FeesUpdated(vaultParams.feeStructure, newFeeStructure[0]);
    vm.expectEmit(false, false, false, true, vaultArray[1]);
    emit FeesUpdated(vaultParams.feeStructure, newFeeStructure[1]);
    vaultsV1Controller.setVaultFees(vaultArray, newFeeStructure);
  }

  /* Propose strategy for a Vault */

  function test__proposeNewVaultStrategyNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    IERC4626 newStrategy = IERC4626(helper__deployYearnWrapper(YEARN_VAULT));

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.proposeNewVaultStrategy(vault, newStrategy);
  }

  function test__proposeNewVaultStrategy() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    IERC4626 newStrategy = IERC4626(helper__deployYearnWrapper(YEARN_VAULT));
    uint256 expectedTimestamp = block.timestamp;

    vaultsV1Controller.proposeNewVaultStrategy(vault, newStrategy);

    assertEq(address(Vault(vault).proposedStrategy()), address(newStrategy));
    assertEq(Vault(vault).proposalTimeStamp(), expectedTimestamp);
  }

  function test__proposeNewVaultStrategyEvent() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    IERC4626 newStrategy = IERC4626(helper__deployYearnWrapper(YEARN_VAULT));
    uint256 expectedTimestamp = block.timestamp;

    vm.expectEmit(false, false, false, true, vault);
    emit NewStrategyProposed(newStrategy, expectedTimestamp);
    vaultsV1Controller.proposeNewVaultStrategy(vault, newStrategy);
  }

  /* Change strategy for a Vault */

  function test__changeVaultStrategyNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    IERC4626 newStrategy = IERC4626(helper__deployYearnWrapper(YEARN_VAULT));
    vaultsV1Controller.proposeNewVaultStrategy(vault, newStrategy);

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.changeVaultStrategy(vault);
  }

  function test__changeVaultStrategyBefore3DaysReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    IERC4626 newStrategy = IERC4626(helper__deployYearnWrapper(YEARN_VAULT));
    vaultsV1Controller.proposeNewVaultStrategy(vault, newStrategy);

    vm.expectRevert(abi.encodeWithSelector(Vault.NotPassedQuitPeriod.selector, 3 days));
    vaultsV1Controller.changeVaultStrategy(vault);
  }

  function test__changeVaultStrategyOnly() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    IERC4626 newStrategy = IERC4626(helper__deployYearnWrapper(YEARN_VAULT));
    vaultsV1Controller.proposeNewVaultStrategy(vault, newStrategy);

    // Set up for testing
    skip(3 days + 1);
    deal(address(asset), address(this), 1 ether);
    asset.approve(vault, 1 ether);
    Vault(vault).deposit(1 ether);

    vaultsV1Controller.changeVaultStrategy(vault);
    assertEq(address(Vault(vault).strategy()), address(newStrategy));

    assertEq(asset.allowance(vault, address(yearnWrapper)), 0);
    assertEq(asset.allowance(vault, address(newStrategy)), type(uint256).max);
  }

  function test__changeVaultStrategyEvent() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    IERC4626 newStrategy = IERC4626(helper__deployYearnWrapper(YEARN_VAULT));
    vaultsV1Controller.proposeNewVaultStrategy(vault, newStrategy);

    // Set up for testing
    skip(3 days + 1);
    deal(address(asset), address(this), 1 ether);
    asset.approve(vault, 1 ether);
    Vault(vault).deposit(1 ether);

    vm.expectEmit(false, false, false, true, vault);
    emit ChangedStrategy(IERC4626(address(yearnWrapper)), newStrategy);
    vaultsV1Controller.changeVaultStrategy(vault);
  }

  /* Setting vault staking */
  function test__setVaultStakingNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);

    address newStaking = address(0x8888);
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setVaultStaking(vault, newStaking);

    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(vault);
    assertEq(vaultsV1RegistryMetadata.staking, DEFAULT_STAKING);
  }

  function test__setVaultStaking() public acceptOwnerships {
    // Test needs a proper staking contract to interact with
    address vault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      address(0),
      true,
      CID,
      swapTokenAddresses,
      SWAP_ADDRESS,
      1,
      address(vaultZapper),
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );
    VaultStaking newStaking = new VaultStaking();
    newStaking.initialize(IERC20(address(vault)), IContractRegistry(CONTRACT_REGISTRY));

    // Actual test
    VaultMetadata memory oldMetadata = vaultsV1Registry.getVault(vault);

    vaultsV1Controller.setVaultStaking(vault, address(newStaking));

    VaultMetadata memory newMetadata = vaultsV1Registry.getVault(vault);
    assertEq(newMetadata.staking, address(newStaking));

    assertEq(newMetadata.enabled, oldMetadata.enabled);
    assertEq(newMetadata.vaultZapper, oldMetadata.vaultZapper);
    assertEq(newMetadata.metadataCID, oldMetadata.metadataCID);
    assertEq(newMetadata.swapAddress, oldMetadata.swapAddress);
    assertEq(newMetadata.exchange, oldMetadata.exchange);

    assertFalse(rewardsEscrow.authorized(address(0xD457ECDAD18BA6917097BcA0c5A1D6A97da8C26a)));
    assertTrue(rewardsEscrow.authorized(address(newStaking)));
  }

  function test__setVaultStakingEvent() public acceptOwnerships {
    // Test needs a proper staking contract to interact with
    address vault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      address(0),
      true,
      CID,
      swapTokenAddresses,
      SWAP_ADDRESS,
      1,
      address(vaultZapper),
      CURVE_ZAP_IN,
      CURVE_ZAP_OUT
    );
    VaultStaking newStaking = new VaultStaking();
    newStaking.initialize(IERC20(address(vault)), IContractRegistry(CONTRACT_REGISTRY));

    // Actual Test
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultUpdated(vault, 1, true, CID);

    vaultsV1Controller.setVaultStaking(vault, address(newStaking));

    VaultMetadata memory vaultsV1RegistryMetadata = vaultsV1Registry.getVault(vault);
    assertEq(vaultsV1RegistryMetadata.staking, address(newStaking));
  }

  /* Setting vault keeperConfig */
  function test__setVaultKeeperConfigNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
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
    address vault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      address(0),
      true,
      CID,
      swapTokenAddresses,
      SWAP_ADDRESS,
      1,
      address(vaultZapper),
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
    address vault = vaultsV1Controller.deployVaultFromV1Factory(
      vaultParams,
      address(0),
      true,
      CID,
      swapTokenAddresses,
      SWAP_ADDRESS,
      1,
      address(vaultZapper),
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
    emit KeeperConfigUpdated(KEEPER_CONFIG, newKeeperConfig);

    vaultsV1Controller.setVaultKeeperConfig(vault, newKeeperConfig);
  }

  /* Setting vault zapper */
  function test__setVaultZapperNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    address newZapper = address(new VaultsV1Zapper(IContractRegistry(CONTRACT_REGISTRY)));

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setVaultZapper(vault, newZapper);

    VaultMetadata memory metadata = vaultsV1Registry.getVault(vault);
    assertEq(metadata.vaultZapper, address(vaultZapper));
  }

  function test__setVaultZapper() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    VaultsV1Zapper newZapper = new VaultsV1Zapper(IContractRegistry(CONTRACT_REGISTRY));
    VaultMetadata memory oldMetadata = vaultsV1Registry.getVault(vault);

    vaultsV1Controller.setVaultZapper(vault, address(newZapper));

    VaultMetadata memory newMetadata = vaultsV1Registry.getVault(vault);
    assertEq(newMetadata.vaultZapper, address(newZapper));

    assertEq(newMetadata.enabled, oldMetadata.enabled);
    assertEq(newMetadata.staking, oldMetadata.staking);
    assertEq(newMetadata.metadataCID, oldMetadata.metadataCID);
    assertEq(newMetadata.swapAddress, oldMetadata.swapAddress);
    assertEq(newMetadata.exchange, oldMetadata.exchange);

    assertEq(vaultZapper.vaults(CRV_3CRYPTO), address(0));
    assertEq(newZapper.vaults(CRV_3CRYPTO), vault);
  }

  function test__setVaultZapperEvent() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    address newZapper = address(new VaultsV1Zapper(IContractRegistry(CONTRACT_REGISTRY)));

    vm.expectEmit(false, false, false, true, address(vaultZapper));
    emit RemovedVault(CRV_3CRYPTO, vault);

    vm.expectEmit(false, false, false, true, newZapper);
    emit UpdatedVault(CRV_3CRYPTO, vault);

    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultUpdated(vault, 1, true, CID);

    vaultsV1Controller.setVaultZapper(vault, newZapper);

    VaultMetadata memory newMetadata = vaultsV1Registry.getVault(vault);
    assertEq(newMetadata.vaultZapper, address(newZapper));
  }

  /* Setting Factory Vault Implementation */

  function test__setFactoryImplementationNotOwnerReverts() public acceptOwnerships {
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setFactoryImplementation(keccak256("VaultsV1Factory"), NEW_IMPLEMENTATION);
  }

  function test__setFactoryVaultImplementation() public acceptOwnerships {
    vaultsV1Controller.setFactoryImplementation(keccak256("VaultsV1Factory"), NEW_IMPLEMENTATION);
    assertEq(vaultsV1Factory.implementation(), NEW_IMPLEMENTATION);

    vaultsV1Controller.setFactoryImplementation(keccak256("VaultStakingFactory"), NEW_IMPLEMENTATION);
    assertEq(vaultStakingFactory.implementation(), NEW_IMPLEMENTATION);
  }

  function test__setFactoryImplementationEvent() public acceptOwnerships {
    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    emit ImplementationUpdated(vaultImplementation, NEW_IMPLEMENTATION);
    vaultsV1Controller.setFactoryImplementation(keccak256("VaultsV1Factory"), NEW_IMPLEMENTATION);

    vm.expectEmit(false, false, false, true, address(vaultStakingFactory));
    emit ImplementationUpdated(stakingImplementation, NEW_IMPLEMENTATION);
    vaultsV1Controller.setFactoryImplementation(keccak256("VaultStakingFactory"), NEW_IMPLEMENTATION);
  }

  /* Deploy Strategy */

  function test__deployStrategyNotOwnerReverts() public acceptOwnerships {
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.deployStrategy(
      keccak256("YearnWrapperFactory"),
      abi.encodePacked(
        bytes4(keccak256("deploy(address,bytes32)")),
        abi.encode(YEARN_VAULT, keccak256("THIS_IS_A_SALT"))
      )
    );
  }

  function test__deployStrategy() public acceptOwnerships {
    address strategy = vaultsV1Controller.deployStrategy(
      keccak256("YearnWrapperFactory"),
      abi.encodePacked(
        bytes4(keccak256("deploy(address,bytes32)")),
        abi.encode(YEARN_VAULT, keccak256("THIS_IS_A_SALT"))
      )
    );
    assertEq(strategy, address(0x9083b2bD1357c1e9bdF6548FB525C715cf883F0d));
  }

  function test__deployStrategyEvent() public acceptOwnerships {
    vm.expectEmit(false, false, false, true, address(yearnWrapperFactory));
    emit YearnWrapperDeployment(address(0x9083b2bD1357c1e9bdF6548FB525C715cf883F0d));

    vaultsV1Controller.deployStrategy(
      keccak256("YearnWrapperFactory"),
      abi.encodePacked(
        bytes4(keccak256("deploy(address,bytes32)")),
        abi.encode(YEARN_VAULT, keccak256("THIS_IS_A_SALT"))
      )
    );
  }

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
    vm.expectRevert(VaultsV1Registry.InvalidVaultType.selector);
    vaultsV1Controller.pauseAllVaultsByType(0);
    vm.expectRevert(VaultsV1Registry.InvalidVaultType.selector);
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
    vm.expectRevert(VaultsV1Registry.InvalidVaultType.selector);
    vaultsV1Controller.unpauseAllVaultsByType(0);
    vm.expectRevert(VaultsV1Registry.InvalidVaultType.selector);
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

  function test__acceptFactoryAndRegistryOwnershipNotOwnerReverts() public {
    vaultsV1Registry.nominateNewOwner(address(vaultsV1Controller));
    vaultsV1Factory.nominateNewOwner(address(vaultsV1Controller));
    vaultStakingFactory.nominateNewOwner(address(vaultsV1Controller));
    yearnWrapperFactory.nominateNewOwner(address(vaultsV1Controller));

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.acceptFactoryAndRegistryOwnership(FACTORY_NAMES);
  }

  function test__acceptFactoryAndRegistryOwnership() public {
    vaultsV1Registry.nominateNewOwner(address(vaultsV1Controller));
    vaultsV1Factory.nominateNewOwner(address(vaultsV1Controller));
    vaultStakingFactory.nominateNewOwner(address(vaultsV1Controller));
    yearnWrapperFactory.nominateNewOwner(address(vaultsV1Controller));

    vaultsV1Controller.acceptFactoryAndRegistryOwnership(FACTORY_NAMES);

    assertEq(vaultsV1Registry.owner(), address(vaultsV1Controller));
    assertEq(vaultsV1Registry.nominatedOwner(), address(0));
    assertEq(vaultsV1Factory.owner(), address(vaultsV1Controller));
    assertEq(vaultsV1Factory.nominatedOwner(), address(0));
    assertEq(vaultStakingFactory.owner(), address(vaultsV1Controller));
    assertEq(vaultStakingFactory.nominatedOwner(), address(0));
    assertEq(yearnWrapperFactory.owner(), address(vaultsV1Controller));
    assertEq(yearnWrapperFactory.nominatedOwner(), address(0));
  }

  function test__acceptFactoryAndRegistryOwnershipEvents() public {
    vaultsV1Registry.nominateNewOwner(address(vaultsV1Controller));
    vaultsV1Factory.nominateNewOwner(address(vaultsV1Controller));
    vaultStakingFactory.nominateNewOwner(address(vaultsV1Controller));
    yearnWrapperFactory.nominateNewOwner(address(vaultsV1Controller));

    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    vm.expectEmit(false, false, false, true, address(vaultStakingFactory));
    vm.expectEmit(false, false, false, true, address(yearnWrapperFactory));
    emit OwnerChanged(address(this), address(vaultsV1Controller));
    emit OwnerChanged(address(this), address(vaultsV1Controller));
    emit OwnerChanged(address(this), address(vaultsV1Controller));
    emit OwnerChanged(address(this), address(vaultsV1Controller));

    vaultsV1Controller.acceptFactoryAndRegistryOwnership(FACTORY_NAMES);

    assertEq(vaultsV1Registry.owner(), address(vaultsV1Controller));
    assertEq(vaultsV1Factory.owner(), address(vaultsV1Controller));
    assertEq(vaultStakingFactory.owner(), address(vaultsV1Controller));
    assertEq(yearnWrapperFactory.owner(), address(vaultsV1Controller));
  }

  /* Nominating new ownership of VaultsV1Registry and VaultsV1Factory */

  function test__transferFactoryAndRegistryOwnershipNotOwnerReverts() public acceptOwnerships {
    address newOwner = address(0x8888);

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.transferFactoryAndRegistryOwnership(FACTORY_NAMES, newOwner);
  }

  function test__transferFactoryAndRegistryOwnership() public acceptOwnerships {
    address newOwner = address(0x8888);

    vaultsV1Controller.transferFactoryAndRegistryOwnership(FACTORY_NAMES, newOwner);

    assertEq(vaultsV1Registry.nominatedOwner(), newOwner);
    assertEq(vaultsV1Factory.nominatedOwner(), newOwner);
    assertEq(vaultStakingFactory.nominatedOwner(), newOwner);
  }

  function test__transferFactoryAndRegistryOwnershipEvent() public acceptOwnerships {
    address newOwner = address(0x8888);

    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    vm.expectEmit(false, false, false, true, address(vaultsV1Factory));
    vm.expectEmit(false, false, false, true, address(vaultStakingFactory));
    vm.expectEmit(false, false, false, true, address(yearnWrapperFactory));
    emit OwnerNominated(newOwner);
    emit OwnerNominated(newOwner);
    emit OwnerNominated(newOwner);
    emit OwnerNominated(newOwner);

    vaultsV1Controller.transferFactoryAndRegistryOwnership(FACTORY_NAMES, newOwner);

    assertEq(vaultsV1Registry.nominatedOwner(), newOwner);
    assertEq(vaultsV1Factory.nominatedOwner(), newOwner);
    assertEq(vaultStakingFactory.nominatedOwner(), newOwner);
    assertEq(yearnWrapperFactory.nominatedOwner(), newOwner);
  }

  /* Setting Zaps on VaultsV1Zapper */
  function test__setZapperZapsNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    address zapIn = makeAddr("zapIn");
    address zapOut = makeAddr("zapOut");

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setZapperZaps(vault, address(vaultZapper), zapIn, zapOut);
  }

  function test__setZapperZaps() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    address zapIn = makeAddr("zapIn");
    address zapOut = makeAddr("zapOut");

    // Actual test
    vaultsV1Controller.setZapperZaps(vault, address(vaultZapper), zapIn, zapOut);

    VaultMetadata memory newMetadata = vaultsV1Registry.getVault(vault);
    assertEq(newMetadata.zapIn, zapIn);
    assertEq(newMetadata.zapOut, zapOut);

    (address _zapIn, address _zapOut) = vaultZapper.zaps(CRV_3CRYPTO);
    assertEq(_zapIn, zapIn);
    assertEq(_zapOut, zapOut);
  }

  function test__setZapperZapsEvent() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    address zapIn = makeAddr("zapIn");
    address zapOut = makeAddr("zapOut");

    // Actual test
    vm.expectEmit(false, false, false, true, address(vaultsV1Registry));
    emit VaultUpdated(vault, 1, true, CID);

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
    vaultsV1Controller.setZapperAssetFee(address(vaultZapper), CRV_3CRYPTO, true, inFee, outFee);
  }

  function test__setZapperAssetFee() public acceptOwnerships {
    uint256 inFee = 10;
    uint256 outFee = 20;

    // Actual test
    vaultsV1Controller.setZapperAssetFee(address(vaultZapper), CRV_3CRYPTO, true, inFee, outFee);

    (bool _useAssetFee, uint256 _accumulated, uint256 _inFee, uint256 _outFee) = vaultZapper.fees(CRV_3CRYPTO);
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
    emit FeeUpdated(CRV_3CRYPTO, true, inFee, outFee);

    vaultsV1Controller.setZapperAssetFee(address(vaultZapper), CRV_3CRYPTO, true, inFee, outFee);
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
    vaultsV1Controller.setZapperKeeperConfig(address(vaultZapper), CRV_3CRYPTO, newKeeperConfig);
  }

  function test__setZapperKeeperConfig() public acceptOwnerships {
    KeeperConfig memory newKeeperConfig = KeeperConfig({
      minWithdrawalAmount: 42,
      incentiveVigBps: 10,
      keeperPayout: 4
    });

    // Actual test
    vaultsV1Controller.setZapperKeeperConfig(address(vaultZapper), CRV_3CRYPTO, newKeeperConfig);

    (uint256 minWithdrawalAmount, uint256 incentiveVigBps, uint256 keeperPayout) = vaultZapper.keeperConfigs(
      CRV_3CRYPTO
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

    vaultsV1Controller.setZapperKeeperConfig(address(vaultZapper), CRV_3CRYPTO, newKeeperConfig);
  }

  function test__setStakingEscrowDurationsNotOwnerReverts() public acceptOwnerships {
    address[] memory stakingAddrs = new address[](2);
    uint256[] memory stakingDurations = new uint256[](2);

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsV1Controller.setStakingEscrowDurations(stakingAddrs, stakingDurations);
  }

  function test__setStakingEscrowDurations() public acceptOwnerships {
    address vault1 = helper__deployThroughFactory(true, address(0));
    address vault2 = helper__deployThroughFactory(true, address(0));

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
    address vault1 = helper__deployThroughFactory(true, address(0));
    address vault2 = helper__deployThroughFactory(true, address(0));

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
    address vault1 = helper__deployThroughFactory(true, address(0));
    address vault2 = helper__deployThroughFactory(true, address(0));

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
    address vault1 = helper__deployThroughFactory(true, address(0));
    address vault2 = helper__deployThroughFactory(true, address(0));

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
    vm.expectRevert(VaultsV1Registry.InvalidVaultType.selector);
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
    vm.expectRevert(VaultsV1Registry.InvalidVaultType.selector);
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
    vm.expectRevert(VaultsV1Registry.InvalidVaultType.selector);
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

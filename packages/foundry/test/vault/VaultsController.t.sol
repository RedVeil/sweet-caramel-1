// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../../src/vault/VaultsFactory.sol";
import "../../src/vault/VaultStakingFactory.sol";
import "../../src/vault/wrapper/yearn/YearnWrapperFactory.sol";
import { VaultParams } from "../../src/vault/VaultsController.sol";
import "../../src/vault/VaultsRegistry.sol";
import { VaultMetadata } from "../../src/vault/VaultsRegistry.sol";
import { KeeperConfig } from "../../src/utils/KeeperIncentivized.sol";
import "../../src/vault/VaultStaking.sol";
import "../../src/vault/Vault.sol";
import "../../src/vault/VaultsController.sol";
import "../../src/zapper/VaultsV1Zapper.sol";
import "../../src/utils/KeeperIncentiveV2.sol";
import "../../src/interfaces/IContractRegistry.sol";
import "../../src/interfaces/IACLRegistry.sol";
import "../../src/interfaces/IVault.sol";
import "../../src/interfaces/IVaultsV1Zapper.sol";
import "../../src/interfaces/IRewardsEscrow.sol";
import "../../src/interfaces/IOwnable.sol";
import "../../src/vault/wrapper/yearn/YearnWrapper.sol";
import "../../src/interfaces/IYearnVaultWrapper.sol";
import "../../src/interfaces/IERC4626.sol";

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

contract VaultsControllerTest is Test {
  event ImplementationUpdated(address oldImplementation, address newImplementation);
  event VaultV1Deployed(address vaultAddress, bool endorsed);
  /* VaultsRegistry events */
  event VaultAdded(address vaultAddress, uint256 vaultType, bool enabled, string metadataCID);
  event VaultUpdated(address vaultAddress, uint256 vaultType, bool enabled, string metadataCID);
  event VaultTypeAdded(uint256 vaultTypes);
  event VaultStatusChanged(address vaultAddress, bool endorsed, bool enabled);
  /* VaultsFactory events */
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
  event FeesUpdated(Vault.FeeStructure previousFees, IVault.FeeStructure newFees);
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
  VaultsController internal vaultsController;
  VaultsRegistry internal vaultsRegistry;
  VaultsFactory internal vaultsFactory;
  VaultStakingFactory internal vaultStakingFactory;
  YearnWrapperFactory internal yearnWrapperFactory;
  KeeperIncentiveV2 internal keeperIncentive;
  VaultsV1Zapper internal vaultZapper;
  IRewardsEscrow internal rewardsEscrow = IRewardsEscrow(address(0xb5cb5710044D1074097c17B7535a1cF99cBfb17F));
  YearnWrapper internal yearnWrapper;

  address internal vaultImplementation;
  address internal stakingImplementation;
  address internal yearnWrapperImplementation;

  address internal vaultsControllerOwner = address(this);
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
    vaultsRegistry.nominateNewOwner(address(vaultsController));
    vaultsFactory.nominateNewOwner(address(vaultsController));
    vaultStakingFactory.nominateNewOwner(address(vaultsController));
    yearnWrapperFactory.nominateNewOwner(address(vaultsController));

    vaultsController.acceptFactoryAndRegistryOwnership(FACTORY_NAMES);
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

    vaultsFactory = new VaultsFactory(address(this));
    vaultStakingFactory = new VaultStakingFactory(address(this), IContractRegistry(CONTRACT_REGISTRY));
    yearnWrapperFactory = new YearnWrapperFactory(address(this));

    vaultsRegistry = new VaultsRegistry(address(this));
    vaultsController = new VaultsController(address(this), IContractRegistry(CONTRACT_REGISTRY));
    keeperIncentive = new KeeperIncentiveV2(IContractRegistry(CONTRACT_REGISTRY), 25e16, 2000 ether);
    vaultZapper = new VaultsV1Zapper(IContractRegistry(CONTRACT_REGISTRY));

    vaultsFactory.setImplementation(vaultImplementation);
    vaultStakingFactory.setImplementation(stakingImplementation);
    yearnWrapperFactory.setImplementation(yearnWrapperImplementation);

    vm.startPrank(ACL_ADMIN);
    IContractRegistry(CONTRACT_REGISTRY).addContract(
      vaultsRegistry.contractName(),
      address(vaultsRegistry),
      keccak256("1")
    );
    IContractRegistry(CONTRACT_REGISTRY).addContract(
      keccak256("VaultRewardsEscrow"),
      address(rewardsEscrow),
      keccak256("1")
    );
    IContractRegistry(CONTRACT_REGISTRY).addContract(
      vaultsFactory.contractName(),
      address(vaultsFactory),
      keccak256("1")
    );
    IContractRegistry(CONTRACT_REGISTRY).addContract(
      vaultsController.contractName(),
      address(vaultsController),
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

    IACLRegistry(ACL_REGISTRY).grantRole(keccak256("VaultsController"), address(vaultsController));
    IACLRegistry(ACL_REGISTRY).grantRole(keccak256("INCENTIVE_MANAGER_ROLE"), address(vaultsController));
    vm.stopPrank();

    vm.label(address(this), "VaultsControllerOwner");
    vm.label(notOwner, "notOwner");
    vm.label(address(vaultsController), "VaultsController");
    vm.label(address(vaultsFactory), "VaultsFactory");
    vm.label(address(keeperIncentive), "KeeperIncentive");
    vm.label(address(vaultStakingFactory), "VaultStakingFactory");

    for (uint256 i = 0; i < 8; i++) {
      swapTokenAddresses[i] = address(uint160(i));
    }

    // Add factory names for ownership change
    FACTORY_NAMES.push(vaultsRegistry.contractName());
    FACTORY_NAMES.push(vaultsFactory.contractName());
    FACTORY_NAMES.push(vaultStakingFactory.contractName());
    FACTORY_NAMES.push(yearnWrapperFactory.contractName());
  }

  /* ========== HELPER FUNCTIONS ========== */

  function helper__addVaultTypesToRegistry(uint256 _vaultTypes) public {
    for (uint256 i = 2; i <= _vaultTypes; i++) {
      vaultsController.addVaultTypeToRegistry(i);
    }
    assertEq(vaultsRegistry.vaultTypes(), _vaultTypes);
  }

  function helper__deployYearnWrapper(address yearnVault) public returns (address yearnWrapperAddress) {
    yearnWrapperAddress = address(new YearnWrapper());
    YearnWrapper(yearnWrapperAddress).initialize(VaultAPI(yearnVault));
  }

  function helper__deployThroughFactory(bool _endorsed, address _staking) public returns (address) {
    address deployedVault = vaultsController.deployVaultFromV1Factory(
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
    vaultsRegistry.getVault(deployedVault);
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
    uint256 prevAmount = vaultsRegistry.getTotalVaults();
    vaultParams.asset = ERC20(_asset);
    address[] memory deployedVaults = new address[](_amount);
    for (uint256 i = 0; i < _amount; i++) {
      address deployedVault = vaultsController.deployVaultFromV1Factory(
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
    assertEq(vaultsRegistry.getTotalVaults(), prevAmount + _amount);
    return deployedVaults;
  }

  /* ========== MUTATIVE FUNCTIONS TESTS ========== */

  /* Deploying vault from VaultsFactory */

  function test__deployVaultFromV1FactoryNotOwnerReverts() public acceptOwnerships {
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.deployVaultFromV1Factory(
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
    assertEq(vaultsRegistry.getTotalVaults(), 0);
  }

  function test__deployVaultFromV1FactoryNoZapsReverts() public acceptOwnerships {
    vm.expectRevert(VaultsController.SetZaps.selector);
    vaultsController.deployVaultFromV1Factory(
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
    assertEq(vaultsRegistry.getTotalVaults(), 0);
  }

  function test__deployVaultFromV1FactoryEndorsed() public acceptOwnerships {
    address deployedVault = vaultsController.deployVaultFromV1Factory(
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

    VaultMetadata memory metadata = vaultsRegistry.getVault(deployedVault);
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

    assertEq(vaultsRegistry.getRegisteredAddresses()[0], deployedVault);
    assertEq(vaultsRegistry.getVaultsByAsset(CRV_3CRYPTO)[0], deployedVault);
    assertEq(vaultsRegistry.getVaultsByType(1)[0], deployedVault);
    assertTrue(vaultsRegistry.endorsed(deployedVault));

    assertEq(vaultZapper.vaults(CRV_3CRYPTO), deployedVault);

    (address zapIn, address zapOut) = vaultZapper.zaps(CRV_3CRYPTO);
    assertEq(zapIn, CURVE_ZAP_IN);
    assertEq(zapOut, CURVE_ZAP_OUT);

    assertTrue(rewardsEscrow.authorized(DEFAULT_STAKING));
  }

  function test__deployVaultFromV1FactoryNotEndorsed() public acceptOwnerships {
    address deployedVault = vaultsController.deployVaultFromV1Factory(
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

    VaultMetadata memory metadata = vaultsRegistry.getVault(deployedVault);
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

    assertEq(vaultsRegistry.getRegisteredAddresses()[0], deployedVault);
    assertEq(vaultsRegistry.getVaultsByAsset(CRV_3CRYPTO)[0], deployedVault);
    assertEq(vaultsRegistry.getVaultsByType(1)[0], deployedVault);
    assertFalse(vaultsRegistry.endorsed(deployedVault));

    assertEq(vaultZapper.vaults(CRV_3CRYPTO), deployedVault);

    (address zapIn, address zapOut) = vaultZapper.zaps(CRV_3CRYPTO);
    assertEq(zapIn, CURVE_ZAP_IN);
    assertEq(zapOut, CURVE_ZAP_OUT);

    assertTrue(rewardsEscrow.authorized(DEFAULT_STAKING));
  }

  /*   Deploy a new Staking contract with the Vault   */
  function test__deployVaultFromV1FactoryWithStaking() public acceptOwnerships {
    address deployedVault = vaultsController.deployVaultFromV1Factory(
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

    vaultsController.setVaultStaking(deployedVault, address(newStaking));
    emit log_named_address("VaultV1Deployment", deployedVault);

    VaultMetadata memory metadata = vaultsRegistry.getVault(deployedVault);
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

    assertEq(vaultsRegistry.getRegisteredAddresses()[0], deployedVault);
    assertEq(vaultsRegistry.getVaultsByAsset(CRV_3CRYPTO)[0], deployedVault);
    assertEq(vaultsRegistry.getVaultsByType(1)[0], deployedVault);
    assertTrue(vaultsRegistry.endorsed(deployedVault));

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
    vm.expectEmit(false, false, false, true, address(vaultsFactory));
    vm.expectEmit(false, false, false, true, address(vaultStakingFactory));
    vm.expectEmit(false, false, false, true, address(vaultsRegistry));
    vm.expectEmit(false, false, false, true, address(vaultsRegistry));
    vm.expectEmit(false, false, false, true, address(vaultsController));

    emit VaultV1Deployment(0xF4Ed673C99450FCF96015844eDD1577335B6695B);
    emit VaultStakingDeployment(0x0D7CadAab171Bd7B3a0EA6e1b21b2BfF9F13E14f);
    emit VaultAdded(0xF4Ed673C99450FCF96015844eDD1577335B6695B, 1, true, CID);
    emit VaultStatusChanged(0xF4Ed673C99450FCF96015844eDD1577335B6695B, true, true);
    emit VaultV1Deployed(0xF4Ed673C99450FCF96015844eDD1577335B6695B, true);

    vaultsController.deployVaultFromV1Factory(
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
  }

  /* Adding vault type to VaultsRegistry */
  function test__addVaultTypeToRegistryNotOwnerReverts() public acceptOwnerships {
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.addVaultTypeToRegistry(2);

    assertEq(vaultsRegistry.vaultTypes(), 1);
  }

  function test__addVaultTypeToRegistryIncorrectTypeReverts() public acceptOwnerships {
    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsController.addVaultTypeToRegistry(0);

    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsController.addVaultTypeToRegistry(1);

    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsController.addVaultTypeToRegistry(3);

    assertEq(vaultsRegistry.vaultTypes(), 1);
  }

  function test__addVaultTypeToRegistry() public acceptOwnerships {
    vaultsController.addVaultTypeToRegistry(2);
    assertEq(vaultsRegistry.vaultTypes(), 2);

    vaultsController.addVaultTypeToRegistry(3);
    assertEq(vaultsRegistry.vaultTypes(), 3);
  }

  function test__addVaultTypesToRegistryEvent() public acceptOwnerships {
    vm.expectEmit(false, false, false, true, address(vaultsRegistry));
    emit VaultTypeAdded(2);

    vaultsController.addVaultTypeToRegistry(2);
  }

  /* Updating VaultsRegistry registered vault */

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
    vaultsController.updateRegistryVault(newMetadata);

    // check no changes
    VaultMetadata memory vaultsRegistryMetadata = vaultsRegistry.getVault(vault);
    assertEq(vaultsRegistryMetadata.vaultAddress, vault);
    assertEq(vaultsRegistryMetadata.vaultType, 1);
    assertEq(vaultsRegistryMetadata.enabled, true);
    assertEq(vaultsRegistryMetadata.staking, DEFAULT_STAKING);
    assertEq(vaultsRegistryMetadata.submitter, address(this));
    assertEq(vaultsRegistryMetadata.metadataCID, CID);
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsRegistryMetadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(vaultsRegistryMetadata.swapAddress, SWAP_ADDRESS);
    assertEq(vaultsRegistryMetadata.exchange, 1);
    assertEq(vaultsRegistryMetadata.zapIn, CURVE_ZAP_IN);
    assertEq(vaultsRegistryMetadata.zapOut, CURVE_ZAP_OUT);

    assertEq(vaultsRegistry.typeVaults(1, 0), vault);
    assertEq(vaultsRegistry.getVaultsByType(1)[0], vault);
    assertEq(vaultsRegistry.getVaultsByType(1).length, 1);
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

    assertEq(vaultsRegistry.getTotalVaults(), 1);

    vm.expectRevert(VaultsRegistry.VaultNotRegistered.selector);
    vaultsController.updateRegistryVault(newMetadata);

    // check no changes
    VaultMetadata memory vaultsRegistryMetadata = vaultsRegistry.getVault(vault);
    assertEq(vaultsRegistryMetadata.vaultAddress, vault);
    assertEq(vaultsRegistryMetadata.vaultType, 1);
    assertEq(vaultsRegistryMetadata.enabled, true);
    assertEq(vaultsRegistryMetadata.staking, DEFAULT_STAKING);
    assertEq(vaultsRegistryMetadata.submitter, address(this));
    assertEq(vaultsRegistryMetadata.metadataCID, CID);
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsRegistryMetadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(vaultsRegistryMetadata.swapAddress, SWAP_ADDRESS);
    assertEq(vaultsRegistryMetadata.exchange, 1);
    assertEq(vaultsRegistryMetadata.zapIn, CURVE_ZAP_IN);
    assertEq(vaultsRegistryMetadata.zapOut, CURVE_ZAP_OUT);

    assertEq(vaultsRegistry.typeVaults(1, 0), vault);
    assertEq(vaultsRegistry.getVaultsByType(1)[0], vault);
    assertEq(vaultsRegistry.getVaultsByType(1).length, 1);
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

    vaultsController.updateRegistryVault(newMetadata);

    VaultMetadata memory vaultsRegistryMetadata = vaultsRegistry.getVault(vault);
    assertEq(vaultsRegistryMetadata.vaultAddress, vault);
    assertEq(vaultsRegistryMetadata.vaultType, 1);
    assertEq(vaultsRegistryMetadata.enabled, false);
    assertEq(vaultsRegistryMetadata.staking, DEFAULT_STAKING);
    assertEq(vaultsRegistryMetadata.submitter, address(this));
    assertEq(vaultsRegistryMetadata.metadataCID, "differentCID");
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsRegistryMetadata.swapTokenAddresses[i], newSwapTokenAddresses[i]);
    }
    assertEq(vaultsRegistryMetadata.swapAddress, SWAP_ADDRESS);
    assertEq(vaultsRegistryMetadata.exchange, 2);
    assertEq(vaultsRegistryMetadata.zapIn, CURVE_ZAP_IN);
    assertEq(vaultsRegistryMetadata.zapOut, CURVE_ZAP_OUT);

    assertEq(vaultsRegistry.typeVaults(1, 0), vault);
    assertEq(vaultsRegistry.getVaultsByType(1)[0], vault);
    assertEq(vaultsRegistry.getVaultsByType(1).length, 1);
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

    assertEq(vaultsRegistry.getVault(vault).vaultType, 1);
    assertEq(vaultsRegistry.getVaultsByType(1)[0], vault);
    assertEq(vaultsRegistry.getVaultsByType(1).length, 1);

    vm.expectRevert(VaultsRegistry.NoTypeVaults.selector);
    vaultsRegistry.getVaultsByType(2);

    vm.expectRevert(VaultsRegistry.VaultTypeImmutable.selector);
    vaultsController.updateRegistryVault(newMetadata);

    // check no changes
    VaultMetadata memory vaultsRegistryMetadata = vaultsRegistry.getVault(vault);
    assertEq(vaultsRegistryMetadata.vaultAddress, vault);
    assertEq(vaultsRegistryMetadata.vaultType, 1);

    assertEq(vaultsRegistry.getVaultsByType(1)[0], vault);
    assertEq(vaultsRegistry.getVaultsByType(1).length, 1);

    vm.expectRevert(VaultsRegistry.NoTypeVaults.selector);
    vaultsRegistry.getVaultsByType(2);

    assertEq(vaultsRegistryMetadata.enabled, true);
    assertEq(vaultsRegistryMetadata.staking, DEFAULT_STAKING);
    assertEq(vaultsRegistryMetadata.submitter, address(this));
    assertEq(vaultsRegistryMetadata.metadataCID, CID);
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsRegistryMetadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(vaultsRegistryMetadata.swapAddress, SWAP_ADDRESS);
    assertEq(vaultsRegistryMetadata.exchange, 1);
    assertEq(vaultsRegistryMetadata.zapIn, CURVE_ZAP_IN);
    assertEq(vaultsRegistryMetadata.zapOut, CURVE_ZAP_OUT);
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

    vm.expectRevert(VaultsRegistry.SubmitterImmutable.selector);
    vaultsController.updateRegistryVault(newMetadata);

    // check no changes
    VaultMetadata memory vaultsRegistryMetadata = vaultsRegistry.getVault(vault);
    assertEq(vaultsRegistryMetadata.vaultAddress, vault);
    assertTrue(vaultsRegistryMetadata.submitter != notSubmitter);
    assertEq(vaultsRegistryMetadata.submitter, address(this));
    assertEq(vaultsRegistryMetadata.vaultType, 1);
    assertEq(vaultsRegistryMetadata.enabled, true);
    assertEq(vaultsRegistryMetadata.staking, DEFAULT_STAKING);
    assertEq(vaultsRegistryMetadata.metadataCID, CID);
    for (uint256 i = 0; i < 8; i++) {
      assertEq(vaultsRegistryMetadata.swapTokenAddresses[i], swapTokenAddresses[i]);
    }
    assertEq(vaultsRegistryMetadata.swapAddress, SWAP_ADDRESS);
    assertEq(vaultsRegistryMetadata.exchange, 1);
    assertEq(vaultsRegistryMetadata.zapIn, CURVE_ZAP_IN);
    assertEq(vaultsRegistryMetadata.zapOut, CURVE_ZAP_OUT);
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
    vm.expectEmit(false, false, false, true, address(vaultsRegistry));
    emit VaultUpdated(vault, 1, true, "differentCID");
    vaultsController.updateRegistryVault(newMetadata);
    assertEq(vaultsRegistry.getVault(vault).metadataCID, "differentCID");
  }

  /* Toggling endorse VaultsRegistry registered vault */

  function test__toggleEndorseRegistryVaultNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(false, DEFAULT_STAKING);
    assertFalse(vaultsRegistry.endorsed(vault));
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = vault;
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.toggleEndorseRegistryVault(vaultsToToggle);
    assertFalse(vaultsRegistry.endorsed(vault));
  }

  function test__toggleEndorseVaultAddressNotRegisteredReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(false, DEFAULT_STAKING);
    assertFalse(vaultsRegistry.endorsed(vault));
    address nonRegistered = address(0x8888);
    assertTrue(vault != nonRegistered);
    assertEq(vaultsRegistry.getTotalVaults(), 1);
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = nonRegistered;
    vm.expectRevert(VaultsRegistry.VaultNotRegistered.selector);
    vaultsController.toggleEndorseRegistryVault(vaultsToToggle);
    assertFalse(vaultsRegistry.endorsed(vault));
  }

  function test__toggleEndorseVault() public acceptOwnerships {
    address vault = helper__deployThroughFactory(false, DEFAULT_STAKING);
    assertFalse(vaultsRegistry.endorsed(vault));
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = vault;
    vaultsController.toggleEndorseRegistryVault(vaultsToToggle);
    assertTrue(vaultsRegistry.endorsed(vault));
    vaultsController.toggleEndorseRegistryVault(vaultsToToggle);
    assertFalse(vaultsRegistry.endorsed(vault));
    vaultsController.toggleEndorseRegistryVault(vaultsToToggle);
    assertTrue(vaultsRegistry.endorsed(vault));
  }

  function test__toggleEndorseVaultMultiple() public acceptOwnerships {
    uint256 toggleCount = 3;
    address[] memory vaultsToToggle = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, toggleCount, false);
    assertEq(vaultsRegistry.getTotalVaults(), toggleCount);
    assertEq(vaultsToToggle.length, toggleCount);
    for (uint256 i = 0; i < toggleCount; i++) {
      assertFalse(vaultsRegistry.endorsed(vaultsToToggle[i]));
    }
    vaultsController.toggleEndorseRegistryVault(vaultsToToggle);
    for (uint256 i = 0; i < toggleCount; i++) {
      assertTrue(vaultsRegistry.endorsed(vaultsToToggle[i]));
    }
    vaultsController.toggleEndorseRegistryVault(vaultsToToggle);
    for (uint256 i = 0; i < toggleCount; i++) {
      assertFalse(vaultsRegistry.endorsed(vaultsToToggle[i]));
    }
    vaultsController.toggleEndorseRegistryVault(vaultsToToggle);
    for (uint256 i = 0; i < toggleCount; i++) {
      assertTrue(vaultsRegistry.endorsed(vaultsToToggle[i]));
    }
  }

  function test__toggleEndorseVaultEvent() public acceptOwnerships {
    address vault = helper__deployThroughFactory(false, DEFAULT_STAKING);
    assertTrue(vaultsRegistry.getVault(vault).enabled);
    assertFalse(vaultsRegistry.endorsed(vault));
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = vault;
    vm.expectEmit(false, false, false, true, address(vaultsRegistry));
    emit VaultStatusChanged(vault, true, true);
    vaultsController.toggleEndorseRegistryVault(vaultsToToggle);
    assertTrue(vaultsRegistry.endorsed(vault));
    assertTrue(vaultsRegistry.getVault(vault).enabled);
  }

  /* Toggling enable VaultsRegistry registered vault */

  function test__toggleEnableVaultNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    assertTrue(vaultsRegistry.getVault(vault).enabled);
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = vault;
    vm.startPrank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.toggleEnableRegistryVault(vaultsToToggle);
    assertTrue(vaultsRegistry.getVault(vault).enabled);
  }

  function test__toggleEnableVaultAddressNotRegisteredReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    assertTrue(vaultsRegistry.getVault(vault).enabled);
    address nonRegistered = address(0x8888);
    assertTrue(vault != nonRegistered);
    assertEq(vaultsRegistry.getTotalVaults(), 1);
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = nonRegistered;
    vm.expectRevert(VaultsRegistry.VaultNotRegistered.selector);
    vaultsController.toggleEnableRegistryVault(vaultsToToggle);
    assertTrue(vaultsRegistry.getVault(vault).enabled);
  }

  function test__toggleEnableVaultOnly() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    assertTrue(vaultsRegistry.getVault(vault).enabled);
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = vault;
    vaultsController.toggleEnableRegistryVault(vaultsToToggle);
    assertFalse(vaultsRegistry.getVault(vault).enabled);
    vaultsController.toggleEnableRegistryVault(vaultsToToggle);
    assertTrue(vaultsRegistry.getVault(vault).enabled);
    vaultsController.toggleEnableRegistryVault(vaultsToToggle);
    assertFalse(vaultsRegistry.getVault(vault).enabled);
  }

  function test__toggleEnableVaultMultiple() public acceptOwnerships {
    uint256 toggleCount = 3;
    address[] memory vaultsToToggle = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, toggleCount, false);
    assertEq(vaultsRegistry.getTotalVaults(), toggleCount);
    assertEq(vaultsToToggle.length, toggleCount);
    for (uint256 i = 0; i < toggleCount; i++) {
      assertTrue(vaultsRegistry.getVault(vaultsToToggle[i]).enabled);
    }
    vaultsController.toggleEnableRegistryVault(vaultsToToggle);
    for (uint256 i = 0; i < toggleCount; i++) {
      assertFalse(vaultsRegistry.getVault(vaultsToToggle[i]).enabled);
    }
    vaultsController.toggleEnableRegistryVault(vaultsToToggle);
    for (uint256 i = 0; i < toggleCount; i++) {
      assertTrue(vaultsRegistry.getVault(vaultsToToggle[i]).enabled);
    }
    vaultsController.toggleEnableRegistryVault(vaultsToToggle);
    for (uint256 i = 0; i < toggleCount; i++) {
      assertFalse(vaultsRegistry.getVault(vaultsToToggle[i]).enabled);
    }
  }

  function test__toggleEnableVaultEvent() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    assertTrue(vaultsRegistry.getVault(vault).enabled);
    address[] memory vaultsToToggle = new address[](1);
    vaultsToToggle[0] = vault;
    vm.expectEmit(false, false, false, true, address(vaultsRegistry));
    emit VaultStatusChanged(vault, true, false);
    vaultsController.toggleEnableRegistryVault(vaultsToToggle);
    assertTrue(vaultsRegistry.endorsed(vault));
    assertFalse(vaultsRegistry.getVault(vault).enabled);
  }

  /* Setting vault fees */

  function test__setVaultFeesNotOwnerReverts() public acceptOwnerships {
    address[] memory vaultArray = new address[](1);
    vaultArray[0] = helper__deployThroughFactory(true, DEFAULT_STAKING);

    IVault.FeeStructure[] memory newFeeStructure = new IVault.FeeStructure[](1);
    newFeeStructure[0] = IVault.FeeStructure({
      deposit: DEPOSIT_FEE * 2,
      withdrawal: WITHDRAWAL_FEE * 2,
      management: MANAGEMENT_FEE * 2,
      performance: PERFORMANCE_FEE * 2
    });

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.setVaultFees(vaultArray, newFeeStructure);
  }

  function test__setVaultFeesInvalidFeeStructureReverts() public acceptOwnerships {
    address[] memory vaultArray = new address[](1);
    vaultArray[0] = helper__deployThroughFactory(true, DEFAULT_STAKING);

    IVault.FeeStructure[] memory newFeeStructure = new IVault.FeeStructure[](1);
    newFeeStructure[0] = IVault.FeeStructure({ deposit: 1e18, withdrawal: 1e18, management: 1e18, performance: 1e18 });

    vm.expectRevert(Vault.InvalidFeeStructure.selector);
    vaultsController.setVaultFees(vaultArray, newFeeStructure);
  }

  function test__setVaultFees() public acceptOwnerships {
    address[] memory vaultArray = new address[](2);
    vaultArray[0] = helper__deployThroughFactory(true, DEFAULT_STAKING);
    vaultArray[1] = helper__deployThroughFactory(true, DEFAULT_STAKING);

    IVault.FeeStructure[] memory newFeeStructure = new IVault.FeeStructure[](2);
    newFeeStructure[0] = IVault.FeeStructure({
      deposit: DEPOSIT_FEE * 2,
      withdrawal: WITHDRAWAL_FEE * 2,
      management: MANAGEMENT_FEE * 2,
      performance: PERFORMANCE_FEE * 2
    });
    newFeeStructure[1] = IVault.FeeStructure({
      deposit: DEPOSIT_FEE * 3,
      withdrawal: WITHDRAWAL_FEE * 3,
      management: MANAGEMENT_FEE * 3,
      performance: PERFORMANCE_FEE * 3
    });

    vaultsController.setVaultFees(vaultArray, newFeeStructure);

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

    IVault.FeeStructure[] memory newFeeStructure = new IVault.FeeStructure[](2);
    newFeeStructure[0] = IVault.FeeStructure({
      deposit: DEPOSIT_FEE * 2,
      withdrawal: WITHDRAWAL_FEE * 2,
      management: MANAGEMENT_FEE * 2,
      performance: PERFORMANCE_FEE * 2
    });
    newFeeStructure[1] = IVault.FeeStructure({
      deposit: DEPOSIT_FEE * 3,
      withdrawal: WITHDRAWAL_FEE * 3,
      management: MANAGEMENT_FEE * 3,
      performance: PERFORMANCE_FEE * 3
    });

    vm.expectEmit(false, false, false, true, vaultArray[0]);
    emit FeesUpdated(vaultParams.feeStructure, newFeeStructure[0]);
    vm.expectEmit(false, false, false, true, vaultArray[1]);
    emit FeesUpdated(vaultParams.feeStructure, newFeeStructure[1]);
    vaultsController.setVaultFees(vaultArray, newFeeStructure);
  }

  /* Propose strategy for a Vault */

  function test__proposeNewVaultStrategyNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    IERC4626 newStrategy = IERC4626(helper__deployYearnWrapper(YEARN_VAULT));

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.proposeNewVaultStrategy(vault, newStrategy);
  }

  function test__proposeNewVaultStrategy() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    IERC4626 newStrategy = IERC4626(helper__deployYearnWrapper(YEARN_VAULT));
    uint256 expectedTimestamp = block.timestamp;

    vaultsController.proposeNewVaultStrategy(vault, newStrategy);

    assertEq(address(Vault(vault).proposedStrategy()), address(newStrategy));
    assertEq(Vault(vault).proposalTimeStamp(), expectedTimestamp);
  }

  function test__proposeNewVaultStrategyEvent() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    IERC4626 newStrategy = IERC4626(helper__deployYearnWrapper(YEARN_VAULT));
    uint256 expectedTimestamp = block.timestamp;

    vm.expectEmit(false, false, false, true, vault);
    emit NewStrategyProposed(newStrategy, expectedTimestamp);
    vaultsController.proposeNewVaultStrategy(vault, newStrategy);
  }

  /* Change strategy for a Vault */

  function test__changeVaultStrategyNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    IERC4626 newStrategy = IERC4626(helper__deployYearnWrapper(YEARN_VAULT));
    vaultsController.proposeNewVaultStrategy(vault, newStrategy);

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.changeVaultStrategy(vault);
  }

  function test__changeVaultStrategyBefore3DaysReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    IERC4626 newStrategy = IERC4626(helper__deployYearnWrapper(YEARN_VAULT));
    vaultsController.proposeNewVaultStrategy(vault, newStrategy);

    vm.expectRevert(abi.encodeWithSelector(Vault.NotPassedQuitPeriod.selector, 3 days));
    vaultsController.changeVaultStrategy(vault);
  }

  function test__changeVaultStrategyOnly() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    IERC4626 newStrategy = IERC4626(helper__deployYearnWrapper(YEARN_VAULT));
    vaultsController.proposeNewVaultStrategy(vault, newStrategy);

    // Set up for testing
    skip(3 days + 1);
    deal(address(asset), address(this), 1 ether);
    asset.approve(vault, 1 ether);
    Vault(vault).deposit(1 ether);

    vaultsController.changeVaultStrategy(vault);
    assertEq(address(Vault(vault).strategy()), address(newStrategy));

    assertEq(asset.allowance(vault, address(yearnWrapper)), 0);
    assertEq(asset.allowance(vault, address(newStrategy)), type(uint256).max);
  }

  function test__changeVaultStrategyEvent() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    IERC4626 newStrategy = IERC4626(helper__deployYearnWrapper(YEARN_VAULT));
    vaultsController.proposeNewVaultStrategy(vault, newStrategy);

    // Set up for testing
    skip(3 days + 1);
    deal(address(asset), address(this), 1 ether);
    asset.approve(vault, 1 ether);
    Vault(vault).deposit(1 ether);

    vm.expectEmit(false, false, false, true, vault);
    emit ChangedStrategy(IERC4626(address(yearnWrapper)), newStrategy);
    vaultsController.changeVaultStrategy(vault);
  }

  /* Setting vault staking */
  function test__setVaultStakingNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);

    address newStaking = address(0x8888);
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.setVaultStaking(vault, newStaking);

    VaultMetadata memory vaultsRegistryMetadata = vaultsRegistry.getVault(vault);
    assertEq(vaultsRegistryMetadata.staking, DEFAULT_STAKING);
  }

  function test__setVaultStaking() public acceptOwnerships {
    // Test needs a proper staking contract to interact with
    address vault = vaultsController.deployVaultFromV1Factory(
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
    VaultMetadata memory oldMetadata = vaultsRegistry.getVault(vault);

    vaultsController.setVaultStaking(vault, address(newStaking));

    VaultMetadata memory newMetadata = vaultsRegistry.getVault(vault);
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
    address vault = vaultsController.deployVaultFromV1Factory(
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
    vm.expectEmit(false, false, false, true, address(vaultsRegistry));
    emit VaultUpdated(vault, 1, true, CID);

    vaultsController.setVaultStaking(vault, address(newStaking));

    VaultMetadata memory vaultsRegistryMetadata = vaultsRegistry.getVault(vault);
    assertEq(vaultsRegistryMetadata.staking, address(newStaking));
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
    vaultsController.setVaultKeeperConfig(vault, newKeeperConfig);
  }

  function test__setVaultKeeperConfig() public acceptOwnerships {
    // Test needs a proper staking contract to interact with
    address vault = vaultsController.deployVaultFromV1Factory(
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
    vaultsController.setVaultKeeperConfig(vault, newKeeperConfig);

    (uint256 minWithdrawalAmount, uint256 incentiveVigBps, uint256 keeperPayout) = Vault(vault).keeperConfig();

    assertEq(minWithdrawalAmount, newKeeperConfig.minWithdrawalAmount);
    assertEq(incentiveVigBps, newKeeperConfig.incentiveVigBps);
    assertEq(keeperPayout, newKeeperConfig.keeperPayout);
  }

  function test__setVaultKeeperConfigEvent() public acceptOwnerships {
    // Test needs a proper staking contract to interact with
    address vault = vaultsController.deployVaultFromV1Factory(
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

    vaultsController.setVaultKeeperConfig(vault, newKeeperConfig);
  }

  /* Setting vault zapper */
  function test__setVaultZapperNotOwnerReverts() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    address newZapper = address(new VaultsV1Zapper(IContractRegistry(CONTRACT_REGISTRY)));

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.setVaultZapper(vault, newZapper);

    VaultMetadata memory metadata = vaultsRegistry.getVault(vault);
    assertEq(metadata.vaultZapper, address(vaultZapper));
  }

  function test__setVaultZapper() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    VaultsV1Zapper newZapper = new VaultsV1Zapper(IContractRegistry(CONTRACT_REGISTRY));
    VaultMetadata memory oldMetadata = vaultsRegistry.getVault(vault);

    vaultsController.setVaultZapper(vault, address(newZapper));

    VaultMetadata memory newMetadata = vaultsRegistry.getVault(vault);
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

    vm.expectEmit(false, false, false, true, address(vaultsRegistry));
    emit VaultUpdated(vault, 1, true, CID);

    vaultsController.setVaultZapper(vault, newZapper);

    VaultMetadata memory newMetadata = vaultsRegistry.getVault(vault);
    assertEq(newMetadata.vaultZapper, address(newZapper));
  }

  /* Setting Factory Vault Implementation */

  function test__setFactoryImplementationNotOwnerReverts() public acceptOwnerships {
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.setFactoryImplementation(keccak256("VaultsFactory"), NEW_IMPLEMENTATION);
  }

  function test__setFactoryVaultImplementation() public acceptOwnerships {
    vaultsController.setFactoryImplementation(keccak256("VaultsFactory"), NEW_IMPLEMENTATION);
    assertEq(vaultsFactory.implementation(), NEW_IMPLEMENTATION);

    vaultsController.setFactoryImplementation(keccak256("VaultStakingFactory"), NEW_IMPLEMENTATION);
    assertEq(vaultStakingFactory.implementation(), NEW_IMPLEMENTATION);
  }

  function test__setFactoryImplementationEvent() public acceptOwnerships {
    vm.expectEmit(false, false, false, true, address(vaultsFactory));
    emit ImplementationUpdated(vaultImplementation, NEW_IMPLEMENTATION);
    vaultsController.setFactoryImplementation(keccak256("VaultsFactory"), NEW_IMPLEMENTATION);

    vm.expectEmit(false, false, false, true, address(vaultStakingFactory));
    emit ImplementationUpdated(stakingImplementation, NEW_IMPLEMENTATION);
    vaultsController.setFactoryImplementation(keccak256("VaultStakingFactory"), NEW_IMPLEMENTATION);
  }

  /* Deploy Strategy */

  function test__deployStrategyNotOwnerReverts() public acceptOwnerships {
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.deployStrategy(
      keccak256("YearnWrapperFactory"),
      abi.encodePacked(
        bytes4(keccak256("deploy(address,bytes32)")),
        abi.encode(YEARN_VAULT, keccak256("THIS_IS_A_SALT"))
      )
    );
  }

  function test__deployStrategy() public acceptOwnerships {
    address strategy = vaultsController.deployStrategy(
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

    vaultsController.deployStrategy(
      keccak256("YearnWrapperFactory"),
      abi.encodePacked(
        bytes4(keccak256("deploy(address,bytes32)")),
        abi.encode(YEARN_VAULT, keccak256("THIS_IS_A_SALT"))
      )
    );
  }

  /* Pausing VaultsRegistry registered vaults */

  function test__pauseVaultsNotOwnerReverts() public acceptOwnerships {
    uint256 totalVaults = 3;
    uint256 pauseCount = 2;
    address[] memory vaults = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, totalVaults, true);
    assertEq(vaultsRegistry.getTotalVaults(), totalVaults);
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
    vaultsController.pauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertFalse(Vault(vaultsToPause[i]).paused());
    }
  }

  function test__pauseVaults() public acceptOwnerships {
    uint256 totalVaults = 3;
    uint256 pauseCount = 2;
    address[] memory vaults = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, totalVaults, true);
    assertEq(vaultsRegistry.getTotalVaults(), totalVaults);
    assertEq(vaults.length, totalVaults);
    for (uint256 i = 0; i < totalVaults; i++) {
      assertFalse(Vault(vaults[i]).paused());
    }
    address[] memory vaultsToPause = new address[](pauseCount);
    for (uint256 i = 0; i < pauseCount; i++) {
      vaultsToPause[i] = vaults[i];
    }
    vaultsController.pauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertTrue(Vault(vaultsToPause[i]).paused());
    }
  }

  function test__pauseVaultsEvent() public acceptOwnerships {
    uint256 totalVaults = 3;
    uint256 pauseCount = 2;
    address[] memory vaults = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, totalVaults, true);
    assertEq(vaultsRegistry.getTotalVaults(), totalVaults);
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
      emit Paused(address(vaultsController));
    }
    vaultsController.pauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertTrue(Vault(vaultsToPause[i]).paused());
    }
  }

  /* Pausing all VaultsRegistry registered vaults by type */

  function test__pauseAllVaultsByTypeNotOwnerReverts() public acceptOwnerships {
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsRegistry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsController));
      vaultsRegistry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsRegistry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.pauseAllVaultsByType(2);
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
    assertEq(vaultsRegistry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsController));
      vaultsRegistry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsRegistry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsController.pauseAllVaultsByType(0);
    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsController.pauseAllVaultsByType(3);
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
    assertEq(vaultsRegistry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsController));
      vaultsRegistry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsRegistry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    vaultsController.pauseAllVaultsByType(2);
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
    assertEq(vaultsRegistry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsController));
      vaultsRegistry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsRegistry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      vm.expectEmit(false, false, false, true, address(type2VaultAddresses[i]));
      emit Paused(address(vaultsController));
    }
    vaultsController.pauseAllVaultsByType(2);
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
  }

  /* Unpausing VaultsRegistry registered vaults */

  function test__unpauseVaultsNotOwnerReverts() public acceptOwnerships {
    uint256 totalVaults = 3;
    uint256 pauseCount = 2;
    address[] memory vaults = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, totalVaults, true);
    assertEq(vaultsRegistry.getTotalVaults(), totalVaults);
    assertEq(vaults.length, totalVaults);
    for (uint256 i = 0; i < totalVaults; i++) {
      assertFalse(Vault(vaults[i]).paused());
    }
    address[] memory vaultsToPause = new address[](pauseCount);
    for (uint256 i = 0; i < pauseCount; i++) {
      vaultsToPause[i] = vaults[i];
    }
    vaultsController.pauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertTrue(Vault(vaultsToPause[i]).paused());
    }
    // switch from paused back to unpaused
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.unpauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertTrue(Vault(vaultsToPause[i]).paused());
    }
  }

  function test__unpauseVaults() public acceptOwnerships {
    uint256 totalVaults = 3;
    uint256 pauseCount = 2;
    address[] memory vaults = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, totalVaults, true);
    assertEq(vaultsRegistry.getTotalVaults(), totalVaults);
    assertEq(vaults.length, totalVaults);
    for (uint256 i = 0; i < totalVaults; i++) {
      assertFalse(Vault(vaults[i]).paused());
    }
    address[] memory vaultsToPause = new address[](pauseCount);
    for (uint256 i = 0; i < pauseCount; i++) {
      vaultsToPause[i] = vaults[i];
    }
    vaultsController.pauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertTrue(Vault(vaultsToPause[i]).paused());
    }
    // switch from paused back to unpaused
    vaultsController.unpauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertFalse(Vault(vaultsToPause[i]).paused());
    }
  }

  function test__unpauseVaultsEvent() public acceptOwnerships {
    uint256 totalVaults = 3;
    uint256 pauseCount = 2;
    address[] memory vaults = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, totalVaults, true);
    assertEq(vaultsRegistry.getTotalVaults(), totalVaults);
    assertEq(vaults.length, totalVaults);
    for (uint256 i = 0; i < totalVaults; i++) {
      assertFalse(Vault(vaults[i]).paused());
    }
    address[] memory vaultsToPause = new address[](pauseCount);
    for (uint256 i = 0; i < pauseCount; i++) {
      vaultsToPause[i] = vaults[i];
    }
    vaultsController.pauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertTrue(Vault(vaultsToPause[i]).paused());
    }
    // switch from paused back to unpaused
    for (uint256 i = 0; i < pauseCount; i++) {
      vm.expectEmit(false, false, false, true, address(vaultsToPause[i]));
      emit Unpaused(address(vaultsController));
    }
    vaultsController.unpauseVaults(vaultsToPause);
    for (uint256 i = 0; i < pauseCount; i++) {
      assertFalse(Vault(vaultsToPause[i]).paused());
    }
  }

  /* Unpausing all VaultsRegistry registered vaults by type */

  function test__unpauseAllVaultsByTypeNotOwnerReverts() public acceptOwnerships {
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsRegistry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsController));
      vaultsRegistry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsRegistry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    // pause all type2 vaults first
    vaultsController.pauseAllVaultsByType(2);
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    // notOwner attempt to unpause all type2 vaults
    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.unpauseAllVaultsByType(2);
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
    assertEq(vaultsRegistry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsController));
      vaultsRegistry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsRegistry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    // pause all type2 vaults first
    vaultsController.pauseAllVaultsByType(2);
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsController.unpauseAllVaultsByType(0);
    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsController.unpauseAllVaultsByType(3);
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
    assertEq(vaultsRegistry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsController));
      vaultsRegistry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsRegistry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    // pause all type2 vaults first
    vaultsController.pauseAllVaultsByType(2);
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    // unpause all type2 vaults
    vaultsController.unpauseAllVaultsByType(2);
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
    assertEq(vaultsRegistry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsController));
      vaultsRegistry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsRegistry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    // pause all type2 vaults first
    vaultsController.pauseAllVaultsByType(2);
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    // type2 vaults emit event
    for (uint256 i = 0; i < type2Vaults; i++) {
      vm.expectEmit(false, false, false, true, address(type2VaultAddresses[i]));
      emit Unpaused(address(vaultsController));
    }
    // unpause all type2 vaults
    vaultsController.unpauseAllVaultsByType(2);
    // check type2 vaults are unpaused
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
  }

  /* Accepting ownership of VaultsRegistry and VaultsFactory */

  function test__acceptFactoryAndRegistryOwnershipNotOwnerReverts() public {
    vaultsRegistry.nominateNewOwner(address(vaultsController));
    vaultsFactory.nominateNewOwner(address(vaultsController));
    vaultStakingFactory.nominateNewOwner(address(vaultsController));
    yearnWrapperFactory.nominateNewOwner(address(vaultsController));

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.acceptFactoryAndRegistryOwnership(FACTORY_NAMES);
  }

  function test__acceptFactoryAndRegistryOwnership() public {
    vaultsRegistry.nominateNewOwner(address(vaultsController));
    vaultsFactory.nominateNewOwner(address(vaultsController));
    vaultStakingFactory.nominateNewOwner(address(vaultsController));
    yearnWrapperFactory.nominateNewOwner(address(vaultsController));

    vaultsController.acceptFactoryAndRegistryOwnership(FACTORY_NAMES);

    assertEq(vaultsRegistry.owner(), address(vaultsController));
    assertEq(vaultsRegistry.nominatedOwner(), address(0));
    assertEq(vaultsFactory.owner(), address(vaultsController));
    assertEq(vaultsFactory.nominatedOwner(), address(0));
    assertEq(vaultStakingFactory.owner(), address(vaultsController));
    assertEq(vaultStakingFactory.nominatedOwner(), address(0));
    assertEq(yearnWrapperFactory.owner(), address(vaultsController));
    assertEq(yearnWrapperFactory.nominatedOwner(), address(0));
  }

  function test__acceptFactoryAndRegistryOwnershipEvents() public {
    vaultsRegistry.nominateNewOwner(address(vaultsController));
    vaultsFactory.nominateNewOwner(address(vaultsController));
    vaultStakingFactory.nominateNewOwner(address(vaultsController));
    yearnWrapperFactory.nominateNewOwner(address(vaultsController));

    vm.expectEmit(false, false, false, true, address(vaultsRegistry));
    vm.expectEmit(false, false, false, true, address(vaultsFactory));
    vm.expectEmit(false, false, false, true, address(vaultStakingFactory));
    vm.expectEmit(false, false, false, true, address(yearnWrapperFactory));
    emit OwnerChanged(address(this), address(vaultsController));
    emit OwnerChanged(address(this), address(vaultsController));
    emit OwnerChanged(address(this), address(vaultsController));
    emit OwnerChanged(address(this), address(vaultsController));

    vaultsController.acceptFactoryAndRegistryOwnership(FACTORY_NAMES);

    assertEq(vaultsRegistry.owner(), address(vaultsController));
    assertEq(vaultsFactory.owner(), address(vaultsController));
    assertEq(vaultStakingFactory.owner(), address(vaultsController));
    assertEq(yearnWrapperFactory.owner(), address(vaultsController));
  }

  /* Nominating new ownership of VaultsRegistry and VaultsFactory */

  function test__transferFactoryAndRegistryOwnershipNotOwnerReverts() public acceptOwnerships {
    address newOwner = address(0x8888);

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.transferFactoryAndRegistryOwnership(FACTORY_NAMES, newOwner);
  }

  function test__transferFactoryAndRegistryOwnership() public acceptOwnerships {
    address newOwner = address(0x8888);

    vaultsController.transferFactoryAndRegistryOwnership(FACTORY_NAMES, newOwner);

    assertEq(vaultsRegistry.nominatedOwner(), newOwner);
    assertEq(vaultsFactory.nominatedOwner(), newOwner);
    assertEq(vaultStakingFactory.nominatedOwner(), newOwner);
  }

  function test__transferFactoryAndRegistryOwnershipEvent() public acceptOwnerships {
    address newOwner = address(0x8888);

    vm.expectEmit(false, false, false, true, address(vaultsRegistry));
    vm.expectEmit(false, false, false, true, address(vaultsFactory));
    vm.expectEmit(false, false, false, true, address(vaultStakingFactory));
    vm.expectEmit(false, false, false, true, address(yearnWrapperFactory));
    emit OwnerNominated(newOwner);
    emit OwnerNominated(newOwner);
    emit OwnerNominated(newOwner);
    emit OwnerNominated(newOwner);

    vaultsController.transferFactoryAndRegistryOwnership(FACTORY_NAMES, newOwner);

    assertEq(vaultsRegistry.nominatedOwner(), newOwner);
    assertEq(vaultsFactory.nominatedOwner(), newOwner);
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
    vaultsController.setZapperZaps(vault, address(vaultZapper), zapIn, zapOut);
  }

  function test__setZapperZaps() public acceptOwnerships {
    address vault = helper__deployThroughFactory(true, DEFAULT_STAKING);
    address zapIn = makeAddr("zapIn");
    address zapOut = makeAddr("zapOut");

    // Actual test
    vaultsController.setZapperZaps(vault, address(vaultZapper), zapIn, zapOut);

    VaultMetadata memory newMetadata = vaultsRegistry.getVault(vault);
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
    vm.expectEmit(false, false, false, true, address(vaultsRegistry));
    emit VaultUpdated(vault, 1, true, CID);

    vaultsController.setZapperZaps(vault, address(vaultZapper), zapIn, zapOut);
  }

  /* Setting GlobalFee on VaultsV1Zapper */
  function test__setZapperGlobalFeeNotOwnerReverts() public acceptOwnerships {
    uint256 inBps = 10;
    uint256 outBps = 20;

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.setZapperGlobalFee(address(vaultZapper), inBps, outBps);
  }

  function test__setZapperGlobalFee() public acceptOwnerships {
    uint256 inBps = 10;
    uint256 outBps = 20;

    // Actual test
    vaultsController.setZapperGlobalFee(address(vaultZapper), inBps, outBps);

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

    vaultsController.setZapperGlobalFee(address(vaultZapper), inBps, outBps);
  }

  /* Setting fees on VaultsV1Zapper */
  function test__setZapperAssetFeeNotOwnerReverts() public acceptOwnerships {
    uint256 inFee = 10;
    uint256 outFee = 20;

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.setZapperAssetFee(address(vaultZapper), CRV_3CRYPTO, true, inFee, outFee);
  }

  function test__setZapperAssetFee() public acceptOwnerships {
    uint256 inFee = 10;
    uint256 outFee = 20;

    // Actual test
    vaultsController.setZapperAssetFee(address(vaultZapper), CRV_3CRYPTO, true, inFee, outFee);

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

    vaultsController.setZapperAssetFee(address(vaultZapper), CRV_3CRYPTO, true, inFee, outFee);
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
    vaultsController.setZapperKeeperConfig(address(vaultZapper), CRV_3CRYPTO, newKeeperConfig);
  }

  function test__setZapperKeeperConfig() public acceptOwnerships {
    KeeperConfig memory newKeeperConfig = KeeperConfig({
      minWithdrawalAmount: 42,
      incentiveVigBps: 10,
      keeperPayout: 4
    });

    // Actual test
    vaultsController.setZapperKeeperConfig(address(vaultZapper), CRV_3CRYPTO, newKeeperConfig);

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

    vaultsController.setZapperKeeperConfig(address(vaultZapper), CRV_3CRYPTO, newKeeperConfig);
  }

  function test__setStakingEscrowDurationsNotOwnerReverts() public acceptOwnerships {
    address[] memory stakingAddrs = new address[](2);
    uint256[] memory stakingDurations = new uint256[](2);

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.setStakingEscrowDurations(stakingAddrs, stakingDurations);
  }

  function test__setStakingEscrowDurations() public acceptOwnerships {
    address vault1 = helper__deployThroughFactory(true, address(0));
    address vault2 = helper__deployThroughFactory(true, address(0));

    VaultMetadata memory vault1Data = vaultsRegistry.getVault(vault1);
    VaultMetadata memory vault2Data = vaultsRegistry.getVault(vault2);

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
    vaultsController.setStakingEscrowDurations(stakingAddrs, stakingDurations);

    assertEq(IStaking(staking1).escrowDuration(), duration1);
    assertEq(IStaking(staking2).escrowDuration(), duration2);
  }

  function test__setStakingRewardsDurationsNotOwnerReverts() public acceptOwnerships {
    address[] memory stakingAddrs = new address[](2);
    uint256[] memory stakingDurations = new uint256[](2);

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.setStakingRewardsDurations(stakingAddrs, stakingDurations);
  }

  function test__setStakingRewardsDurations() public acceptOwnerships {
    address vault1 = helper__deployThroughFactory(true, address(0));
    address vault2 = helper__deployThroughFactory(true, address(0));

    VaultMetadata memory vault1Data = vaultsRegistry.getVault(vault1);
    VaultMetadata memory vault2Data = vaultsRegistry.getVault(vault2);

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
    vaultsController.setStakingRewardsDurations(stakingAddrs, stakingDurations);

    assertEq(IStaking(staking1).rewardsDuration(), duration1);
    assertEq(IStaking(staking2).rewardsDuration(), duration2);
  }

  function test__pauseStakingContractsNotOwnerReverts() public acceptOwnerships {
    address[] memory stakingAddrs = new address[](2);

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.pauseStakingContracts(stakingAddrs);
  }

  function test__pauseStakingContracts() public acceptOwnerships {
    address vault1 = helper__deployThroughFactory(true, address(0));
    address vault2 = helper__deployThroughFactory(true, address(0));

    VaultMetadata memory vault1Data = vaultsRegistry.getVault(vault1);
    VaultMetadata memory vault2Data = vaultsRegistry.getVault(vault2);

    address staking1 = vault1Data.staking;
    address staking2 = vault2Data.staking;

    address[] memory stakingAddrs = new address[](2);
    stakingAddrs[0] = staking1;
    stakingAddrs[1] = staking2;

    // Actual test
    vaultsController.pauseStakingContracts(stakingAddrs);

    assertTrue(IStaking(staking1).paused());
    assertTrue(IStaking(staking2).paused());
  }

  function test__unpauseStakingContractsNotOwnerReverts() public acceptOwnerships {
    address[] memory stakingAddrs = new address[](2);

    vm.prank(notOwner);
    vm.expectRevert("Only the contract owner may perform this action");
    vaultsController.unpauseStakingContracts(stakingAddrs);
  }

  function test__unpauseStakingContracts() public acceptOwnerships {
    address vault1 = helper__deployThroughFactory(true, address(0));
    address vault2 = helper__deployThroughFactory(true, address(0));

    VaultMetadata memory vault1Data = vaultsRegistry.getVault(vault1);
    VaultMetadata memory vault2Data = vaultsRegistry.getVault(vault2);

    address staking1 = vault1Data.staking;
    address staking2 = vault2Data.staking;

    address[] memory stakingAddrs = new address[](2);
    stakingAddrs[0] = staking1;
    stakingAddrs[1] = staking2;

    // Actual test
    vaultsController.pauseStakingContracts(stakingAddrs);

    assertTrue(IStaking(staking1).paused());
    assertTrue(IStaking(staking2).paused());

    vaultsController.unpauseStakingContracts(stakingAddrs);

    assertFalse(IStaking(staking1).paused());
    assertFalse(IStaking(staking2).paused());
  }

  /* ========== FUZZ TESTS ========== */

  function test__fuzz__addVaultTypeToRegistry(uint256 vaultType) public acceptOwnerships {
    vm.assume(vaultType != vaultsRegistry.vaultTypes() + 1);
    vm.assume(vaultType > 1);
    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsController.addVaultTypeToRegistry(vaultType);
    assertEq(vaultsRegistry.vaultTypes(), 1);
  }

  function test__fuzz__pauseAllVaultsByType(uint256 vaultType) public acceptOwnerships {
    vm.assume(vaultType != vaultsRegistry.vaultTypes() + 1);
    vm.assume(vaultType > 1);
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsRegistry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsController));
      vaultsRegistry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsRegistry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsController.pauseAllVaultsByType(vaultType);
    // check vaults still not paused
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
  }

  function test__fuzz__unpauseAllVaultsByType(uint256 vaultType) public acceptOwnerships {
    vm.assume(vaultType != vaultsRegistry.vaultTypes() + 1);
    vm.assume(vaultType > 1);
    uint256 type1Vaults = 3;
    uint256 type2Vaults = 2;
    helper__addVaultTypesToRegistry(2);
    assertEq(vaultsRegistry.vaultTypes(), 2);
    address[] memory type1VaultAddresses = helper__deployMultipleVaultsAndRegister(CRV_3CRYPTO, type1Vaults, true);
    address[] memory type2VaultAddresses = new address[](type2Vaults);
    for (uint256 i = 0; i < type2Vaults; i++) {
      (Vault type2Vault, VaultMetadata memory type2VaultMetadata) = helper__deployVault(2);
      type2VaultAddresses[i] = address(type2Vault);
      vm.prank(address(vaultsController));
      vaultsRegistry.registerVault(type2VaultMetadata);
    }
    assertEq(vaultsRegistry.getTotalVaults(), type1Vaults + type2Vaults);
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertFalse(Vault(type2VaultAddresses[i]).paused());
    }
    // pause all type2 vaults first
    vaultsController.pauseAllVaultsByType(2);
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
    vm.expectRevert(VaultsRegistry.InvalidVaultType.selector);
    vaultsController.unpauseAllVaultsByType(vaultType);
    // check vaults are still paused
    for (uint256 i = 0; i < type2Vaults; i++) {
      assertTrue(Vault(type2VaultAddresses[i]).paused());
    }
    for (uint256 i = 0; i < type1Vaults; i++) {
      assertFalse(Vault(type1VaultAddresses[i]).paused());
    }
  }
}

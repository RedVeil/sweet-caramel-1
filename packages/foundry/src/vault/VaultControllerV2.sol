// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "./VaultsRegistry.sol";
import "./VaultsFactory.sol";
import "../utils/Owned.sol";
import "../utils/ContractRegistryAccess.sol";
import "../interfaces/IKeeperIncentiveV2.sol";
import "../interfaces/IContractRegistry.sol";
import { IERC20 } from "openzeppelin-contracts/token/ERC20/IERC20.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IVault } from "../interfaces/vault/IVault.sol";
import { IMultiRewardsStaking } from "../interfaces/IMultiRewardsStaking.sol";
import { IMultiRewardsEscrow } from "../interfaces/IMultiRewardsEscrow.sol";
import { IVaultsFactory } from "../interfaces/vault/IVaultsFactory.sol";
import { IManagementExecutor } from "../interfaces/vault/IManagementExecutor.sol";
import "../interfaces/IRewardsEscrow.sol";
import "../interfaces/vault/IERC4626.sol";
import { KeeperConfig } from "../utils/KeeperIncentivized.sol";
import { IContractFactory } from "../interfaces/IContractFactory.sol";

/**
 * @notice controls deploying, registering vaults, adding vault types, updating registry vaults, endorsing and enabling registry vaults, and pausing/unpausing vaults
 * @dev all functions can only be called by owner
 */

struct VaultParams {
  ERC20 asset;
  IERC4626 strategy;
  IContractRegistry contractRegistry;
  IVault.FeeStructure feeStructure;
  address feeRecipient;
  KeeperConfig keeperConfig;
}

contract VaultsController is Owned, ContractRegistryAccess {
  /*//////////////////////////////////////////////////////////////
                               IMMUTABLES
    //////////////////////////////////////////////////////////////*/
  bytes32 public immutable VAULT = "Vault";
  bytes32 public immutable ADAPTER = "Adapter";
  bytes32 public immutable STRATEGY = "Strategy";
  bytes32 public immutable STAKING = "Staking";

  bytes32 public constant contractName = keccak256("VaultsController");

  constructor(address _owner, IContractRegistry _contractRegistry)
    Owned(_owner)
    ContractRegistryAccess(_contractRegistry)
  {}

  /*//////////////////////////////////////////////////////////////
                          DEPLOYMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  event VaultDeployed(address indexed vault, address indexed staking, address indexed strategy);

  struct DeploymentArgs {
    /// @Notice templateKey
    bytes32 key;
    /// @Notice encoded init params
    bytes data;
  }

  // TODO check that asset is verified
  function deployVault(
    bytes32 strategyId,
    DeploymentArgs memory adapterData,
    bytes memory stakingData,
    bytes memory rewardsData,
    VaultParams memory vaultData,
    VaultMetadata memory metadata
  ) external onlyOwner returns (address vault) {
    address adapter;
    if (adapterData.key.length > 0) adapter = deployStrategyAndAdapter(stratData, adapterData);

    vault = _deployVault(vaultData, adapter);

    address staking;
    if (stakingData.length > 0) {
      staking = deployStaking(stakingData);

      if (rewardsData.length > 0) {
        address[] memory stakingContracts = new address[](1);
        stakingContracts[0] = staking;
        bytes[] memory rewardsDatas = new bytes[](1);
        rewardsDatas[0] = rewardsData;
        addRewardsToken(stakingContracts, rewardsDatas);
      }
    }

    _handleKeeperSetup(vault, keeperConfig, addKeeperData);

    _registerVault(vault, staking, metadata);

    emit VaultDeployed(vault, staking, strategy);
  }

  // TODO make harcoded types state variables?
  // TODO how to decide if a strategy even needs to be deployed?
  function deployStrategyAndAdapter(bytes32 strategyId, DeploymentArgs memory adapterData)
    public
    onlyOwner
    returns (address adapter)
  {
    if (strategyId.length == 0 || adapterData.key.length == 0) revert InsufficientData();

    IVaultsFactory vaultsFactory = _vaultsFactory();
    address strategy = vaultsFactory.deploy(STRATEGY, strategyId, "");

    // TODO create this data nicer and/or move it into Factory
    bytes memory popERC4626InitData = abi.encode(
      asset,
      IContractRegistry(CONTRACT_REGISTRY),
      50,
      IStrategy(strategy),
      abi.encode(feeRecipient),
      0
    );

    // TODO all adapter must use just bytes for init and than decode them inside -- USE BYTES BYTES
    adapter = vaultsFactory.deploy(
      ADAPTER,
      adapterData.key,
      abi.encodePacked(bytes4(keccak256("initialize(bytes,bytes)")), bytes.concat(popERC4626InitData, adapterData.data))
    );
  }

  function _deployVault(VaultParams memory vaultData, address adapter) internal returns (address vault) {
    if (vaultData.strategy != address(0) || adapter != address(0)) revert MisConfig();
    vaultData.strategy = adapter;

    IVaultsFactory vaultsFactory = _vaultsFactory();
    vault = vaultsFactory.deploy(VAULT, "V1", abi.encode(vaultData));
  }

  function deployStaking(bytes memory stakingData) public onlyOwner returns (address staking) {
    IVaultsFactory vaultsFactory = _vaultsFactory();
    staking = vaultsFactory.deploy(STAKING, "MultiRewardsStaking", stakingData);
  }

  /**
   * @notice sets keeperConfig and creates incentive for new vault deployment
   * @param _vault - address of the newly deployed vault
   * @param _keeperConfig - the keeperConfig struct from the VaultParams used in vault deployment
   * @param _keeperEnabled - bool if the incentive is enabled
   * @param _keeperOpenToEveryone - bool if the incentive is open to all
   * @param _keeperCooldown - time period that must pass before calling keeper enabled functions
   * @dev avoids stack too deep in deployVaultFromFactory
   */
  function _handleKeeperSetup(
    address _vault,
    KeeperConfig memory _keeperConfig,
    bytes memory addKeeperData
  ) internal {
    (bool _keeperEnabled, bool _keeperOpenToEveryone, uint256 _keeperCooldown) = abi.decode(
      addKeeperData,
      (bool, bool, uint256)
    );
    IVault(_vault).setKeeperConfig(_keeperConfig);
    IKeeperIncentiveV2(_getContract(keccak256("KeeperIncentive"))).createIncentive(
      _vault,
      _keeperConfig.keeperPayout,
      _keeperEnabled,
      _keeperOpenToEveryone,
      _vault,
      _keeperCooldown,
      0
    );
  }

  function _registerVault(
    address vault,
    address staking,
    VaultMetadata memory metadata
  ) internal {
    metadata.vaultAddress = vault;
    metadata.staking = staking;
    metadata.submitter = msg.sender;

    _vaultsRegistry().registerVault(metadata);
  }

  /*//////////////////////////////////////////////////////////////
                          VAULT MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/
  // TODO make sure that new strategy is a registered adapter. Add strategys and adapter to registry? -- ADD CLONE REGISTRY WITH CLONE EXISTS AND CLONE ARRAY FOR FRONTEND
  /**
   * @notice Propose a new Strategy.
   * @param _vaults - addresses of the vaults
   * @param _newStrategies - new strategies to be proposed for the vault
   * @dev index of _vaults array and _newStrategies array must coincide
   */
  function proposeNewVaultStrategy(address[] memory _vaults, IERC4626[] memory _newStrategies) external {
    for (uint256 i = 0; i < _vaults.length; i++) {
      _verifySubmitter(_vaults[i]);
      IVault(_vaults[i]).proposeNewStrategy(_newStrategies[i]);
    }
  }

  /**
   * @notice Change strategy of a vault to the previously proposed strategy.
   * @param _vaults - addresses of the vaults
   */
  function changeVaultStrategy(address[] memory _vaults) external {
    for (uint256 i = 0; i < _vaults.length; i++) {
      IVault(_vaults[i]).changeStrategy();
    }
  }

  /**
   * @notice Sets different fees per vault
   * @param _vaults - addresses of the vaults to change
   * @param _newFees - new fee structures for these vaults
   * @dev Value is in 1e18, e.g. 100% = 1e18 - 1 BPS = 1e12
   * @dev index of _vaults array and _newFees must coincide
   */
  function setVaultFees(address[] memory _vaults, IVault.FeeStructure[] memory _newFees) external {
    for (uint8 i; i < _vaults.length; i++) {
      _verifySubmitter(_vaults[i]);
      IVault(_vaults[i]).setFees(_newFees[i]);
    }
  }

  /**
   * @notice Sets keeperConfig for a vault
   * @param _vaults - addresses of the newly deployed vaults
   * @param _keeperConfigs - the keeperConfig structs from the VaultParams used in vault deployment
   * @dev index of _vaults array and _keeperConfigs must coincide
   */
  function setVaultKeeperConfig(address[] memory _vaults, KeeperConfig[] memory _keeperConfigs) external {
    for (uint256 i = 0; i < _vaults.length; i++) {
      _verifySubmitter(_vaults[i]);
      IVault(_vaults[i]).setKeeperConfig(_keeperConfigs[i]);
    }
  }

  error NotSubmitter(address caller);

  function _verifySubmitter(address vault) internal returns (VaultMetadata memory metadata) {
    metadata = _vaultsRegistry().getVault(vault);
    if (msg.sender != metadata.submitter) revert NotSubmitter(msg.sender);
  }

  /*//////////////////////////////////////////////////////////////
                          ENDORSEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  /**
   * @notice switches whether a vault is endorsed or unendorsed
   * @param _vaultAddresses - addresses of the vaults to change endorsement
   */
  function toggleEndorsement(address[] memory _vaultAddresses) external onlyOwner {
    VaultsRegistry vaultsRegistry = _vaultsRegistry();
    for (uint256 i = 0; i < _vaultAddresses.length; i++) {
      vaultsRegistry.toggleEndorseVault(_vaultAddresses[i]);
    }
  }

  /*//////////////////////////////////////////////////////////////
                          STAKING MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  // TODO - check RewardsToken against endorsementRegistry
  function addRewardsToken(address[] memory vaults, bytes[] memory rewardsTokenData) external {
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      (
        address rewardsToken,
        uint160 rewardsPerSecond,
        uint256 amount,
        bool useEscrow,
        uint224 escrowDuration,
        uint24 escrowPercentage,
        uint256 offset
      ) = abi.decode(rewardsTokenData, (address, uint160, uint256, bool, uint224, uint24, uint256));
      VaultsMetadata memory metadata = _verifySubmitter(vaults[i]);
      IMultiRewardsStaking(metadata.staking).addRewardsToken(
        IERC20(rewardsToken),
        rewardsPerSecond,
        amount,
        useEscrow,
        escrowDuration,
        escrowPercentage,
        offset
      );
    }
  }

  function changeRewardsSpeed(address[] memory vaults, bytes[] memory rewardsTokenData) external {
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      VaultsMetadata memory metadata = _verifySubmitter(vaults[i]);
      (address rewardsToken, uint160 rewardsPerSecond) = abi.decode(rewardsTokenData, (address, uint160));
      IMultiRewardsStaking(metadata.staking).changeRewardSpeed(IERC20(rewardsToken), rewardsPerSecond);
    }
  }

  function fundReward(address[] memory vaults, bytes[] memory rewardsTokenData) external {
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      VaultsMetadata memory metadata = _verifySubmitter(vaults[i]);
      (address rewardsToken, uint256 amount) = abi.decode(rewardsTokenData, (address, uint256));
      IMultiRewardsStaking(metadata.staking).fundReward(IERC20(rewardsToken), amount);
    }
  }

  /*//////////////////////////////////////////////////////////////
                          ESCROW MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  function setEscrowTokenFee(IERC20[] memory tokens, uint256[] memory fees) external onlyOwner {
    IMultiRewardsEscrow(_getContract(MULTI_REWARD_ESCROW)).setFees(tokens, fees);
  }

  function setEscrowKeeperPerc(uint256 keeperPerc) external onlyOwner {
    IMultiRewardsEscrow(_getContract(MULTI_REWARD_ESCROW)).setKeeperPerc(keeperPerc);
  }

  /*//////////////////////////////////////////////////////////////
                          FACTORY MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  function addTemplateType(bytes32[] memory templateTypes) external onlyOwner {
    IVaultsFactory factory = IVaultsFactory(_getContract(VAULT_FACTORY));
    uint8 len = templateTypes.length;
    for (uint256 i = 0; i < len; i++) {
      factory.addTemplateType(templateTypes[i]);
    }
  }

  /*//////////////////////////////////////////////////////////////
                          PAUSING LOGIC
    //////////////////////////////////////////////////////////////*/
  error NotSubmitterNorOwner(address caller);

  function pauseAdapter(address[] calldata vaults) external {
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      _verifySubmitterOrOwner(vaults[i]);
      address adapter = IVault(vaults[i]).strategy();
      IVault(adapter).pause();
    }
  }

  function pauseVault(address[] calldata vaults) external {
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      _verifySubmitterOrOwner(vaults[i]);
      IVault(vaults[i]).pause();
    }
  }

  function unpauseAdapter(address[] calldata vaults) external {
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      _verifySubmitterOrOwner(vaults[i]);
      address adapter = IVault(vaults[i]).strategy();
      IVault(adapter).unpause();
    }
  }

  function unpauseVault(address[] calldata vaults) external {
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      _verifySubmitterOrOwner(vaults[i]);
      IVault(vaults[i]).unpause();
    }
  }

  function _verifySubmitterOrOwner(address vault) internal returns (VaultMetadata memory metadata) {
    metadata = _vaultsRegistry().getVault(vault);
    if (msg.sender != metadata.submitter || msg.sender != owner) revert NotSubmitterNorOwner(msg.sender);
  }

  /*//////////////////////////////////////////////////////////////
                          OWNERSHIP LOGIC
    //////////////////////////////////////////////////////////////*/

  IAdminProxy public adminProxy;

  event ManagementExecutorUpdated(address oldManEx, address newManEx);

  /**
   * @notice transfers ownership of VaultRegistry and VaultsV1Factory contracts from controller
   * @dev newOwner address must call acceptOwnership on registry and factory
   */
  function transferOwnership(address newOwner) external onlyOwner {
    managementExecutor.transferOwnership(newOwner);
  }

  /**
   * @notice transfers ownership of VaultRegistry and VaultsV1Factory contracts to controller
   * @dev registry and factory must nominate controller as new owner first
   * acceptance function should be called when deploying controller contract
   */
  function acceptOwnership(address[] contracts) external onlyOwner {
    managementExecutor.acceptOwnership();
  }

  function updateManagementExecutor(IManagementExecutor newManagementExecutor) external onlyOwner {
    emit ManagementExecutorUpdated(address(managementExecutor), address(newManagementExecutor));

    managementExecutor = newManagementExecutor;
  }

  /*//////////////////////////////////////////////////////////////
                      CONTRACT REGISTRY LOGIC
  //////////////////////////////////////////////////////////////*/

  bytes32 internal constant VAULT_REWARDS_ESCROW = keccak256("VaultRewardsEscrow");
  bytes32 internal constant VAULT_REGISTRY = keccak256("VaultsRegistry");
  bytes32 internal constant VAULT_FACTORY = keccak256("VaultsFactory");
  bytes32 internal constant MULTI_REWARD_ESCROW = keccak256("MultiRewardsEscrow");

  /**
   * @notice helper function to get VaultsRegistry contract
   */
  function _vaultsRegistry() private view returns (VaultsRegistry) {
    return VaultsRegistry(_getContract(VAULT_REGISTRY));
  }

  /**
   * @notice helper function to get VaultsFactory contract
   */
  function _vaultsFactory() private view returns (VaultsFactory) {
    return IVaultsFactory(_getContract(VAULT_FACTORY));
  }

  /**
   * @notice Override for ContractRegistryAccess.
   */
  function _getContract(bytes32 _name) internal view override(ContractRegistryAccess) returns (address) {
    return super._getContract(_name);
  }
}

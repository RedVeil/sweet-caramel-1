// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "./VaultsRegistry.sol";
import "./VaultsFactory.sol";
import "../utils/Owned.sol";
import "../utils/ContractRegistryAccess.sol";
import "../interfaces/IKeeperIncentiveV2.sol";
import "../interfaces/IContractRegistry.sol";
import "../interfaces/vault/IVault.sol";
import "../interfaces/IStaking.sol";
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
  /* ========== CUSTOM ERRORS ========== */

  error ConflictingInterest();

  /* ========== STATE VARIABLES ========== */

  bytes32 public constant contractName = keccak256("VaultsController");
  bytes32 internal constant VAULT_REWARDS_ESCROW = keccak256("VaultRewardsEscrow");

  /* ========== EVENTS ========== */

  event VaultDeployed(address indexed vault, address indexed staking, address indexed strategy);

  /* ========== CONSTRUCTOR ========== */

  constructor(
    address _owner,
    IContractRegistry _contractRegistry
  ) Owned(_owner) ContractRegistryAccess(_contractRegistry) {}

  /* ========== VAULT DEPLOYMENT ========== */

  /**
   * @notice deploys and registers Vault from VaultsFactory
   * @param _cloneAddresses - encoded implementation contract addresses for deploying clones of Vault, VaultStaking, and Strategy contracts
   * @param _vaultParams - struct containing Vault init params (ERC20 asset_, IERC4626 strategy_ IContractRegistry contractRegistry_, FeeStructure memory feeStructure_, address feeRecipient_, KeeperConfig, memory keeperConfig_)
   * @param _staking - Adds a staking contract to the registry for this particular vault. (If address(0) it will deploy a new VaultStaking contract)
   * @param _strategyParams - encoded params of initialize function for strategy contract
   * @param _metadataCID - ipfs CID of vault metadata
   * @param _swapTokenAddresses - underlying assets to deposit and recieve LP token
   * @param _swapAddress - ex: stableSwapAddress for Curve
   * @param _exchange - number specifying exchange (1 = curve)
   * @param _keeperEnabled - bool if the incentive is enabled
   * @param _keeperOpenToEveryone - bool if the incentive is open to all
   * @param _keeperCooldown - time period that must pass before calling keeper enabled functions
   * @dev the submitter in the VaultMetadata from the factory will be function caller
   */

  // 1. Adapter
  // 2. OPTIONAL - Strategy
  // 3. Vault
  // 4. OPTIONAL - Staking
  function deployVaultFromFactory(
    bytes memory _cloneAddresses,
    VaultParams memory _vaultParams,
    address _staking,
    bytes memory _strategyParams,
    string memory _metadataCID,
    address[8] memory _swapTokenAddresses,
    address _swapAddress,
    uint256 _exchange,
    bool _keeperEnabled,
    bool _keeperOpenToEveryone,
    uint256 _keeperCooldown
  ) external returns (address vault) {
    VaultsRegistry vaultsRegistry = _vaultsRegistry();

    (address vaultImplementation, address stakingImplementation, address strategyImplementation) = abi.decode(
      _cloneAddresses,
      (address, address, address)
    );

    vault = _vaultsFactory().deploy(vaultImplementation, abi.encode(_vaultParams));

    if (_staking == address(0)) {
      address stakingToken = IVault(vault).asset();

      _staking = _vaultsFactory().deploy(
        stakingImplementation,
        abi.encode(IERC20(stakingToken), _vaultParams.contractRegistry)
      );
    }

    address strategy = _deployStrategy(strategyImplementation, _strategyParams);

    _handleKeeperSetup(vault, _vaultParams.keeperConfig, _keeperEnabled, _keeperOpenToEveryone, _keeperCooldown);

    IRewardsEscrow(_getContract(VAULT_REWARDS_ESCROW)).addAuthorizedContract(_staking);

    VaultMetadata memory metadata = VaultMetadata({
      vaultAddress: vault,
      staking: _staking,
      submitter: msg.sender,
      metadataCID: _metadataCID,
      swapTokenAddresses: _swapTokenAddresses,
      swapAddress: _swapAddress,
      exchange: _exchange
    });

    vaultsRegistry.registerVault(metadata);

    emit VaultDeployed(vault, _staking, strategy);
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
    bool _keeperEnabled,
    bool _keeperOpenToEveryone,
    uint256 _keeperCooldown
  ) internal {
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

  /* ========== VAULT MANAGEMENT FUNCTIONS ========== */

  /**
   * @notice updates the VaultMetadata in registry
   * @param _vaultMetadata - struct with updated values
   * @dev vaultAddress and submitter are immutable
   */
  function updateRegistryVault(VaultMetadata[] memory _vaultMetadata) external onlyOwner {
    VaultsRegistry vaultsRegistry = _vaultsRegistry();
    for (uint256 i = 0; i < _vaultMetadata.length; i++) {
      vaultsRegistry.updateVault(_vaultMetadata[i]);
    }
  }

  /**
   * @notice switches whether a vault is endorsed or unendorsed
   * @param _vaultAddresses - addresses of the vaults to change endorsement
   */
  function toggleEndorseRegistryVault(address[] memory _vaultAddresses) external onlyOwner {
    VaultsRegistry vaultsRegistry = _vaultsRegistry();
    for (uint256 i = 0; i < _vaultAddresses.length; i++) {
      vaultsRegistry.toggleEndorseVault(_vaultAddresses[i]);
    }
  }

  /**
   * @notice switches whether a vault is enabled or disabled
   * @param _vaultAddresses - addresses of the vaults to enable or disable
   */
  function toggleEnableRegistryVault(address[] memory _vaultAddresses) external onlyOwner {
    VaultsRegistry vaultsRegistry = _vaultsRegistry();
    for (uint256 i = 0; i < _vaultAddresses.length; i++) {
      vaultsRegistry.toggleEnableVault(_vaultAddresses[i]);
    }
  }

  /**
   * @notice Propose a new Strategy.
   * @param _vaults - addresses of the vaults
   * @param _newStrategies - new strategies to be proposed for the vault
   * @dev index of _vaults array and _newStrategies array must coincide
   */
  function proposeNewVaultStrategy(address[] memory _vaults, IERC4626[] memory _newStrategies) external onlyOwner {
    for (uint256 i = 0; i < _vaults.length; i++) {
      IVault(_vaults[i]).proposeNewStrategy(_newStrategies[i]);
    }
  }

  /**
   * @notice Change strategy of a vault to the previously proposed strategy.
   * @param _vaults - addresses of the vaults
   */
  function changeVaultStrategy(address[] memory _vaults) external onlyOwner {
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
  function setVaultFees(address[] memory _vaults, IVault.FeeStructure[] memory _newFees) external onlyOwner {
    for (uint8 i; i < _vaults.length; i++) {
      IVault(_vaults[i]).setFees(_newFees[i]);
    }
  }

  /**
   * @notice Set staking contract for a vault.
   * @param _vaults - addresses of the vaults
   * @param _stakingContracts - addresses of the staking contracts
   * @dev index of _vaults array and _stakingContracts must coincide
   */
  function setVaultStaking(address[] memory _vaults, address[] memory _stakingContracts) external onlyOwner {
    VaultsRegistry vaultsRegistry = _vaultsRegistry();

    for (uint256 i = 0; i < _vaults.length; i++) {
      VaultMetadata memory vaultMetadata = vaultsRegistry.getVault(_vaults[i]);

      if (_stakingContracts[i] != address(0)) {
        IRewardsEscrow(_getContract(VAULT_REWARDS_ESCROW)).addAuthorizedContract(_stakingContracts[i]);
      }
      vaultMetadata.staking = _stakingContracts[i];

      vaultsRegistry.updateVault(vaultMetadata);
    }
  }

  /**
   * @notice Sets keeperConfig for a vault
   * @param _vaults - addresses of the newly deployed vaults
   * @param _keeperConfigs - the keeperConfig structs from the VaultParams used in vault deployment
   * @dev index of _vaults array and _keeperConfigs must coincide
   */
  function setVaultKeeperConfig(address[] memory _vaults, KeeperConfig[] memory _keeperConfigs) external onlyOwner {
    for (uint256 i = 0; i < _vaults.length; i++) {
      IVault(_vaults[i]).setKeeperConfig(_keeperConfigs[i]);
    }
  }

  /**
   * @notice Pause deposits
   * @param _vaultAddresses - addresses of the vaults to pause
   * @dev caller on vault contract must have DAO_ROLE or VAULTS_CONTROLLER from ACLRegistry
   */
  function pauseVaults(address[] memory _vaultAddresses) public onlyOwner {
    for (uint256 i = 0; i < _vaultAddresses.length; i++) {
      IVault(_vaultAddresses[i]).pauseContract();
    }
  }

  /**
   * @notice Unpause deposits
   * @param _vaultAddresses - addresses of the vaults to unpause
   * @dev caller on vault contract must have DAO_ROLE or VAULTS_CONTROLLER from ACLRegistry
   */
  function unpauseVaults(address[] memory _vaultAddresses) public onlyOwner {
    for (uint256 i = 0; i < _vaultAddresses.length; i++) {
      IVault(_vaultAddresses[i]).unpauseContract();
    }
  }

  /* ========== VAULTSTAKING MANAGEMENT FUNCTIONS ========== */

  function setStakingEscrowDurations(
    address[] calldata _stakingContracts,
    uint256[] calldata _escrowDurations
  ) external onlyOwner {
    for (uint256 i = 0; i < _stakingContracts.length; i++) {
      IStaking(_stakingContracts[i]).setEscrowDuration(_escrowDurations[i]);
    }
  }

  function setStakingRewardsDurations(
    address[] calldata _stakingContracts,
    uint256[] calldata _rewardsDurations
  ) external onlyOwner {
    for (uint256 i = 0; i < _stakingContracts.length; i++) {
      IStaking(_stakingContracts[i]).setRewardsDuration(_rewardsDurations[i]);
    }
  }

  function pauseStakingContracts(address[] calldata _stakingContracts) external onlyOwner {
    for (uint256 i = 0; i < _stakingContracts.length; i++) {
      IStaking(_stakingContracts[i]).pauseContract();
    }
  }

  function unpauseStakingContracts(address[] calldata _stakingContracts) external onlyOwner {
    for (uint256 i = 0; i < _stakingContracts.length; i++) {
      IStaking(_stakingContracts[i]).unpauseContract();
    }
  }

  /* ========== STRATEGY/WRAPPER DEPLOYMENT FUNCTIONS ========== */

  function _deployStrategy(address _strategyImplementation, bytes memory _deploymentParams) internal returns (address) {
    return _vaultsFactory().deploy(_strategyImplementation, _deploymentParams);
  }

  /* ========== OWNERSHIP FUNCTIONS ========== */

  /**
   * @notice transfers ownership of VaultRegistry and VaultsV1Factory contracts from controller
   * @dev newOwner address must call acceptOwnership on registry and factory
   */
  function transferFactoryAndRegistryOwnership(bytes32[] memory _factoryNames, address _newOwner) external onlyOwner {
    for (uint8 i; i < _factoryNames.length; i++) {
      IContractFactory(_getContract(_factoryNames[i])).nominateNewOwner(_newOwner);
    }
  }

  /**
   * @notice transfers ownership of VaultRegistry and VaultsV1Factory contracts to controller
   * @dev registry and factory must nominate controller as new owner first
   * acceptance function should be called when deploying controller contract
   */
  function acceptFactoryAndRegistryOwnership(bytes32[] memory _factoryNames) external onlyOwner {
    for (uint8 i; i < _factoryNames.length; i++) {
      IContractFactory(_getContract(_factoryNames[i])).acceptOwnership();
    }
  }

  /* ========== INTERNAL FUNCTIONS ========== */

  /**
   * @notice helper function to get VaultsRegistry contract
   */
  function _vaultsRegistry() private view returns (VaultsRegistry) {
    return VaultsRegistry(_getContract(keccak256("VaultsRegistry")));
  }

  /**
   * @notice helper function to get VaultsFactory contract
   */
  function _vaultsFactory() private view returns (VaultsFactory) {
    return VaultsFactory(_getContract(keccak256("VaultsFactory")));
  }

  /**
   * @notice Override for ContractRegistryAccess.
   */
  function _getContract(bytes32 _name) internal view override(ContractRegistryAccess) returns (address) {
    return super._getContract(_name);
  }
}

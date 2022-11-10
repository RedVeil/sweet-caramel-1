// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "./VaultsRegistry.sol";
import "./VaultsFactory.sol";
import "./VaultStakingFactory.sol";
import "../../utils/Owned.sol";
import "../../utils/ContractRegistryAccess.sol";
import "../../interfaces/IKeeperIncentiveV2.sol";
import "../../interfaces/IContractRegistry.sol";
import "../../interfaces/IVault.sol";
import "../../interfaces/IStaking.sol";
import "../../interfaces/IRewardsEscrow.sol";
import "../../interfaces/IERC4626.sol";
import { KeeperConfig } from "../../utils/KeeperIncentivized.sol";
import { IContractFactory } from "../../interfaces/IContractFactory.sol";

/**
 * @notice controls deploying, registering vaults, updating registry vaults, endorsing and enabling registry vaults, and pausing/unpausing vaults
 * @dev all functions can only be called by owner
 */

contract VaultsController is Owned, ContractRegistryAccess {
  /* ========== STATE VARIABLES ========== */

  bytes32 public constant contractName = keccak256("VaultsController");
  bytes32 internal constant VAULT_REWARDS_ESCROW = keccak256("VaultRewardsEscrow");

  /* ========== EVENTS ========== */

  event VaultDeployed(address vaultAddress);

  /* ========== CONSTRUCTOR ========== */

  constructor(address _owner, IContractRegistry _contractRegistry)
    Owned(_owner)
    ContractRegistryAccess(_contractRegistry)
  {}

  /* ========== VAULT DEPLOYMENT ========== */

  /**
   * @notice deploys and registers Vault from VaultsFactory
   * @param _vaultParams - struct containing Vault constructor params (ERC20 asset, IERC4626 strategy, IContractRegistry contractRegistry, Vault.FeeStructure feeStructure, address feeRecipient, KeeperConfig keeperConfig)
   * @param _staking - Adds a staking contract to the registry for this particular vault. (If address(0) it will deploy a new VaultStaking contract)
   * @param _metadataCID - ipfs CID of vault metadata
   * @param _swapTokenAddresses - underlying assets to deposit and recieve LP token
   * @param _swapAddress - ex: stableSwapAddress for Curve
   * @param _exchange - number specifying exchange (1 = curve)
   * @dev the submitter in the VaultMetadata from the factory will be function caller
   */
  function deployVaultFromFactory(
    VaultParams memory _vaultParams,
    address _staking,
    string memory _metadataCID,
    address[8] memory _swapTokenAddresses,
    address _swapAddress,
    uint256 _exchange
  ) external onlyOwner returns (address vault) {
    VaultsRegistry vaultsRegistry = _vaultsRegistry();

    vault = _vaultsFactory().deploy(_vaultParams);

    if (_staking == address(0)) {
      _staking = _vaultStakingFactory().deploy(vault);
    }
    _handleKeeperSetup(vault, _vaultParams.keeperConfig, address(_vaultParams.asset));

    IRewardsEscrow(_getContract(VAULT_REWARDS_ESCROW)).addAuthorizedContract(_staking);

    VaultMetadata memory metadata = VaultMetadata({
      vaultAddress: vault,
      enabled: true,
      staking: _staking,
      submitter: msg.sender,
      metadataCID: _metadataCID,
      swapTokenAddresses: _swapTokenAddresses,
      swapAddress: _swapAddress,
      exchange: _exchange,
      zapIn: _zapIn,
      zapOut: _zapOut
    });

    vaultsRegistry.registerVault(metadata);

    emit VaultDeployed(vault);
  }

  /**
   * @notice sets keeperConfig and creates incentive for new vault deployment
   * @param _vault - address of the newly deployed vault
   * @param _keeperConfig - the keeperConfig struct from the VaultParams used in vault deployment
   * @dev avoids stack too deep in deployVaultFromFactory
   */
  function _handleKeeperSetup(
    address _vault,
    KeeperConfig memory _keeperConfig,
    address _asset
  ) internal {
    IVaults(_vault).setKeeperConfig(_keeperConfig);
    IKeeperIncentiveV2(_getContract(keccak256("KeeperIncentive"))).createIncentive(
      _vault,
      _keeperConfig.keeperPayout,
      true,
      false,
      _asset,
      1 days,
      0
    );
  }

  /* ========== VAULT MANAGEMENT FUNCTIONS ========== */

  /**
   * @notice updates the VaultMetadata in registry
   * @param _vaultMetadata - struct with updated values
   * @dev vaultAddress and submitter are immutable
   */
  function updateRegistryVault(VaultMetadata memory _vaultMetadata) external onlyOwner {
    _vaultsRegistry().updateVault(_vaultMetadata);
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
   * @param _vault - address of the vault
   * @param _newStrategy - new strategy to be proposed for the vault
   */
  function proposeNewVaultStrategy(address _vault, IERC4626 _newStrategy) external onlyOwner {
    IVaults(_vault).proposeNewStrategy(_newStrategy);
  }

  /**
   * @notice Change strategy of a vault to the previously proposed strategy.
   * @param _vault - address of the vault
   */
  function changeVaultStrategy(address _vault) external onlyOwner {
    IVaults(_vault).changeStrategy();
  }

  /**
   * @notice Sets different fees per vault
   * @param _vaults - addresses of the vaults to change
   * @param _newFees - new fee structures for these vaults
   * @dev Value is in 1e18, e.g. 100% = 1e18 - 1 BPS = 1e12
   */
  function setVaultFees(address[] memory _vaults, IVaults.FeeStructure[] memory _newFees) external onlyOwner {
    for (uint8 i; i < _vaults.length; i++) {
      IVaults(_vaults[i]).setFees(_newFees[i]);
    }
  }

  /**
   * @notice Set staking contract for a vault.
   * @param _vault - address of the vault
   * @param _staking Address of the staking contract.
   */
  function setVaultStaking(address _vault, address _staking) external onlyOwner {
    VaultsRegistry vaultsRegistry = _vaultsRegistry();

    VaultMetadata memory vaultMetadata = vaultsRegistry.getVault(_vault);

    if (vaultMetadata.staking != address(0)) {
      IRewardsEscrow(_getContract(VAULT_REWARDS_ESCROW)).removeAuthorizedContract(vaultMetadata.staking);
    }

    if (_staking != address(0)) {
      IRewardsEscrow(_getContract(VAULT_REWARDS_ESCROW)).addAuthorizedContract(_staking);
    }

    vaultMetadata.staking = _staking;

    vaultsRegistry.updateVault(vaultMetadata);
  }

  /**
   * @notice Sets keeperConfig for a vault
   * @param _vault - address of the newly deployed vault
   * @param _keeperConfig - the keeperConfig struct from the VaultParams used in vault deployment
   */
  function setVaultKeeperConfig(address _vault, KeeperConfig memory _keeperConfig) external onlyOwner {
    IVaults(_vault).setKeeperConfig(_keeperConfig);
  }

  /**
   * @notice Pause deposits
   * @param _vaultAddresses - addresses of the vaults to pause
   * @dev caller on vault contract must have DAO_ROLE or VAULTS_CONTROLLER from ACLRegistry
   */
  function pauseVaults(address[] memory _vaultAddresses) public onlyOwner {
    for (uint256 i = 0; i < _vaultAddresses.length; i++) {
      IVaults(_vaultAddresses[i]).pauseContract();
    }
  }

  /**
   * @notice Unpause deposits
   * @param _vaultAddresses - addresses of the vaults to unpause
   * @dev caller on vault contract must have DAO_ROLE or VAULTS_CONTROLLER from ACLRegistry
   */
  function unpauseVaults(address[] memory _vaultAddresses) public onlyOwner {
    for (uint256 i = 0; i < _vaultAddresses.length; i++) {
      IVaults(_vaultAddresses[i]).unpauseContract();
    }
  }

  /* ========== VAULTSTAKING MANAGEMENT FUNCTIONS ========== */

  function setStakingEscrowDurations(address[] calldata _stakingContracts, uint256[] calldata _escrowDurations)
    external
    onlyOwner
  {
    for (uint256 i = 0; i < _stakingContracts.length; i++) {
      IStaking(_stakingContracts[i]).setEscrowDuration(_escrowDurations[i]);
    }
  }

  function setStakingRewardsDurations(address[] calldata _stakingContracts, uint256[] calldata _rewardsDurations)
    external
    onlyOwner
  {
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

  /* ========== FACTORY MANAGEMENT FUNCTIONS ========== */

  function setFactoryImplementation(bytes32 _factoryName, address _implementation) external onlyOwner {
    IContractFactory(_getContract(_factoryName)).setImplementation(_implementation);
  }

  /* ========== STRATEGY/WRAPPER DEPLOYMENT FUNCTIONS ========== */

  function deployStrategy(bytes32 _factoryName, bytes memory _deploymentParams)
    external
    onlyOwner
    returns (address strategy)
  {
    (, bytes memory result) = _getContract(_factoryName).call(_deploymentParams);
    strategy = abi.decode(result, (address));
  }

  /* ========== OWNERSHIP FUNCTIONS ========== */

  /**
   * @notice transfers ownership of VaultRegistry and VaultsFactory contracts from controller
   * @dev newOwner address must call acceptOwnership on registry and factory
   */
  function transferFactoryAndRegistryOwnership(bytes32[] memory _factoryNames, address _newOwner) external onlyOwner {
    for (uint8 i; i < _factoryNames.length; i++) {
      IContractFactory(_getContract(_factoryNames[i])).nominateNewOwner(_newOwner);
    }
  }

  /**
   * @notice transfers ownership of VaultRegistry and VaultsFactory contracts to controller
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
   * @notice helper function to get VaultStakingFactory contract
   */
  function _vaultStakingFactory() private view returns (VaultStakingFactory) {
    return VaultStakingFactory(_getContract(keccak256("VaultStakingFactory")));
  }

  /**
   * @notice Override for ContractRegistryAccess.
   */
  function _getContract(bytes32 _name) internal view override(ContractRegistryAccess) returns (address) {
    return super._getContract(_name);
  }
}

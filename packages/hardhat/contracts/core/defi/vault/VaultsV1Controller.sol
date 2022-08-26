// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "./VaultsV1Registry.sol";
import "./VaultsV1Factory.sol";
import "../../utils/Owned.sol";
import "../../utils/ContractRegistryAccess.sol";
import "../../interfaces/IKeeperIncentiveV2.sol";
import "../../interfaces/IContractRegistry.sol";
import "../../interfaces/IVaultsV1Factory.sol";
import "../../interfaces/IVaultsV1.sol";

/**
 * @notice controls deploying, registering vaults, adding vault types, updating registry vaults, endorsing and enabling registry vaults, and pausing/unpausing vaults
 * @dev all functions can only be called by owner
 */

contract VaultsV1Controller is Owned, ContractRegistryAccess {
  /* ========== STATE VARIABLES ========== */

  bytes32 public constant contractName = keccak256("VaultsV1Controller");

  /* ========== EVENTS ========== */

  event VaultV1Deployed(address vaultAddress, bool endorsed);

  /* ========== CONSTRUCTOR ========== */

  constructor(address _owner, IContractRegistry _contractRegistry)
    Owned(_owner)
    ContractRegistryAccess(_contractRegistry)
  {}

  /**
   * @notice deploys and registers V1 Vault from VaultsV1Factory
   * @param _vaultParams - struct containing Vault contructor params (address token_, address yearnRegistry_,
    IContractRegistry contractRegistry_, address staking_, FeeStructure feeStructure_)
    @param _enabled - bool if vault enabled or disabled
    @param _stakingAddress - address of the staking contract for the vault
    @param _metadataCID - ipfs CID of vault metadata
    @param _swapTokenAddresses - array of underlying tokens to recieve LP tokens
    @param _exchange - number that marks exchange
    @param _endorse - bool if vault is to be endorsed after registration
    @dev the submitter in the VaultMetadata from the factory will be function caller
   */
  function deployVaultFromV1Factory(
    VaultParams memory _vaultParams,
    bool _enabled,
    address _stakingAddress,
    string memory _metadataCID,
    address[8] memory _swapTokenAddresses,
    address _swapAddress,
    uint256 _exchange,
    bool _endorse
  ) external onlyOwner returns (address) {
    VaultsV1Registry vaultsV1Registry = _vaultsV1Registry();
    (VaultMetadata memory metadata, address vault) = _vaultsV1Factory().deployVaultV1(
      _vaultParams,
      _enabled,
      _stakingAddress,
      msg.sender,
      _metadataCID,
      _swapTokenAddresses,
      _swapAddress,
      _exchange
    );
    _handleKeeperSetup(vault, (1e18 * (1e18 - _vaultParams.keeperVigBps)) / 1e18, _vaultParams.token);
    vaultsV1Registry.registerVault(metadata);
    if (_endorse) {
      vaultsV1Registry.toggleEndorseVault(vault);
    }
    emit VaultV1Deployed(vault, _endorse);
    return vault;
  }

  /**
   * @notice sets keeperConfig and creates incentive for new vault deployment
   * @param _vault - address of the newly deployed vault
   * @param _keeperPayout - the keeper reward for calling incentivized functions on the vault
   * @dev avoids stack too deep in deployVaultFromV1Factory
   */
  function _handleKeeperSetup(
    address _vault,
    uint256 _keeperPayout,
    address _asset
  ) internal {
    IKeeperIncentiveV2(_getContract(keccak256("KeeperIncentive"))).createIncentive(
      _vault, // controller contract
      _keeperPayout, // reward amount
      true, // enabled
      true, // open to everyone
      _asset, // reward token
      1 days, // cool down
      0 // burn percentage
    );
  }

  /**
   * @notice updates the VaultMetadata in registry
   * @param _vaultMetadata - struct with updated values
   * @dev vaultAddress, vaultType, and submitter are immutable
   */
  function updateRegistryVault(VaultMetadata memory _vaultMetadata) external onlyOwner {
    _vaultsV1Registry().updateVault(_vaultMetadata);
  }

  /**
   * @notice increase the types of vaults that can be registered
   * @param _type - the next vault type to be registered
   * @dev _type must be exactly 1 more than current vaultTypes
   */
  function addVaultTypeToRegistry(uint256 _type) external onlyOwner {
    _vaultsV1Registry().addVaultType(_type);
  }

  /**
   * @notice switches whether a vault is endorsed or unendorsed
   * @param _vaultAddresses - addresses of the vaults to change endorsement
   */
  function toggleEndorseRegistryVault(address[] memory _vaultAddresses) external onlyOwner {
    VaultsV1Registry vaultsV1Registry = _vaultsV1Registry();
    for (uint256 i = 0; i < _vaultAddresses.length; i++) {
      vaultsV1Registry.toggleEndorseVault(_vaultAddresses[i]);
    }
  }

  /**
   * @notice switches whether a vault is enabled or disabled
   * @param _vaultAddresses - addresses of the vaults to enable or disable
   */
  function toggleEnableRegistryVault(address[] memory _vaultAddresses) external onlyOwner {
    VaultsV1Registry vaultsV1Registry = _vaultsV1Registry();
    for (uint256 i = 0; i < _vaultAddresses.length; i++) {
      vaultsV1Registry.toggleEnableVault(_vaultAddresses[i]);
    }
  }

  /**
   * @notice set fees in BPS. Caller must have DAO_ROLE or VAULTS_CONTROlLER from ACLRegistry
   * @param _vault - address of the vault
   * @param _newFees - new fee structure for the vault
   * @dev Value is in 1e18, e.g. 100% = 1e18 - 1 BPS = 1e12
   */
  function setVaultFees(address _vault, IVaultsV1.FeeStructure memory _newFees) external onlyOwner {
    IVaultsV1(_vault).setFees(_newFees);
  }

  /**
   * @notice Set whether to use locally configured fees. Caller must have DAO_ROLE or VAULTS_CONTROlLER from ACLRegistry.
   * @param _vault - address of the vault
   * @param _useLocalFees `true` to use local fees, `false` to use the VaultFeeController contract.
   */
  function setVaultUseLocalFees(address _vault, bool _useLocalFees) external onlyOwner {
    IVaultsV1(_vault).setUseLocalFees(_useLocalFees);
  }

  /**
   * @notice Set staking contract for a vault. Caller must have DAO_ROLE or VAULTS_CONTROlLER from ACLRegistry.
   * @param _vault - address of the vault
   * @param _staking Address of the staking contract.
   */
  function setVaultStaking(address _vault, address _staking) external onlyOwner {
    IVaultsV1(_vault).setStaking(_staking);
  }

  /**
   * @notice Used to update the yearn registry. Caller must have DAO_ROLE or VAULTS_CONTROlLER from ACLRegistry.
   * @param _vault - address of the vault
   * @param _registry The new _registry address.
   */
  function setVaultRegistry(address _vault, address _registry) external onlyOwner {
    IVaultsV1(_vault).setRegistry(_registry);
  }

  /**
   * @notice Pause deposits
   * @param _vaultAddresses - addresses of the vaults to pause
   * @dev caller on vault contract must have DAO_ROLE or VAULTS_V1_CONTROLLER from ACLRegistry
   */
  function pauseVaults(address[] memory _vaultAddresses) public onlyOwner {
    for (uint256 i = 0; i < _vaultAddresses.length; i++) {
      IVaultsV1(_vaultAddresses[i]).pauseContract();
    }
  }

  /**
   * @notice Unpause deposits
   * @param _vaultAddresses - addresses of the vaults to unpause
   * @dev caller on vault contract must have DAO_ROLE or VAULTS_V1_CONTROLLER from ACLRegistry
   */
  function unpauseVaults(address[] memory _vaultAddresses) public onlyOwner {
    for (uint256 i = 0; i < _vaultAddresses.length; i++) {
      IVaultsV1(_vaultAddresses[i]).unpauseContract();
    }
  }

  /**
   * @notice Pause deposits on all vaults in registry
   */
  function pauseAllVaultsByType(uint256 _type) external onlyOwner {
    require(_type <= _vaultsV1Registry().vaultTypes() && _type > 0, "invalid vault type");
    try _vaultsV1Registry().getVaultsByType(_type) returns (address[] memory registeredTypeVaults) {
      pauseVaults(registeredTypeVaults);
    } catch {
      return;
    }
  }

  /**
   * @notice Unpause deposits on all vaults in registry
   */
  function unpauseAllVaultsByType(uint256 _type) external onlyOwner {
    require(_type <= _vaultsV1Registry().vaultTypes() && _type > 0, "invalid vault type");
    try _vaultsV1Registry().getVaultsByType(_type) returns (address[] memory registeredTypeVaults) {
      unpauseVaults(registeredTypeVaults);
    } catch {
      return;
    }
  }

  /**
   * @notice transfers ownership of VaultRegistry and VaultsV1Factory contracts to controller
   * @dev registry and factory must nominate controller as new owner first
   * acceptance function should be called when deploying controller contract
   */
  function acceptRegistryFactoryOwnership() external onlyOwner {
    _vaultsV1Registry().acceptOwnership();
    _vaultsV1Factory().acceptOwnership();
  }

  /**
   * @notice transfers ownership of VaultRegistry and VaultsV1Factory contracts from controller
   * @dev newOwner address must call acceptOwnership on registry and factory
   */
  function transferRegistryFactoryOwnership(address _newOwner) external onlyOwner {
    _vaultsV1Registry().nominateNewOwner(_newOwner);
    _vaultsV1Factory().nominateNewOwner(_newOwner);
  }

  /**
   * @notice helper function to get VaultsV1Registry contract
   */
  function _vaultsV1Registry() private view returns (VaultsV1Registry) {
    return VaultsV1Registry(_getContract(keccak256("VaultsV1Registry")));
  }

  /**
   * @notice helper function to get VaultsV1Factory contract
   */
  function _vaultsV1Factory() private view returns (VaultsV1Factory) {
    return VaultsV1Factory(_getContract(keccak256("VaultsV1Factory")));
  }

  /**
   * @notice Override for ContractRegistryAccess.
   */
  function _getContract(bytes32 _name) internal view override(ContractRegistryAccess) returns (address) {
    return super._getContract(_name);
  }
}

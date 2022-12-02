// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "../interfaces/vault/IERC4626.sol";
import "../utils/Owned.sol";

struct VaultMetadata {
  address vaultAddress; // address of vault
  uint256 vaultType; // version of vault
  bool enabled; // is the vault enabled
  address staking; // address of vault staking contract
  address vaultZapper; // address of vault zapper contract
  address submitter; // address of vault submitter
  string metadataCID; // ipfs CID of vault metadata
  address[8] swapTokenAddresses; // underlying assets to deposit and recieve LP token
  address swapAddress; // ex: stableSwapAddress for Curve
  uint256 exchange; // number specifying exchange (1 = curve)
  address zapIn; // address of inbound zap contract
  address zapOut; // address of outbount zap contract
}

/**
 * @notice Registry for vaults deployed through VaultsV1Factory
 * @dev all mutative functions can only be called by VaultsV1Controller
 */
contract VaultsV1Registry is Owned {
  /* ========== CUSTOM ERRORS ========== */

  error VaultNotRegistered();
  error NoAssetVaults();
  error InvalidVaultType();
  error NoTypeVaults();
  error VaultAlreadyRegistered();
  error VaultTypeImmutable();
  error SubmitterImmutable();

  /* ========== STATE VARIABLES ========== */

  // vault address to vault metadata
  mapping(address => VaultMetadata) public vaults;

  // vault address to endorsed
  mapping(address => bool) public endorsed;

  // asset to vault addresses
  mapping(address => address[]) public assetVaults;

  // type to vault addresses
  mapping(uint256 => address[]) public typeVaults;

  // addresses of all registered vaults
  address[] public vaultAddresses;

  // types of vaults currently registered
  uint256 public vaultTypes = 1;

  bytes32 public constant contractName = keccak256("VaultsV1Registry");

  /* ========== EVENTS ========== */

  event VaultAdded(address vaultAddress, uint256 vaultType, bool enabled, string metadataCID);
  event VaultUpdated(address vaultAddress, uint256 vaultType, bool enabled, string metadataCID);
  event VaultTypeAdded(uint256 vaultTypes);
  event VaultStatusChanged(address vaultAddress, bool endorsed, bool enabled);

  /* ========== CONSTRUCTOR ========== */

  constructor(address _owner) Owned(_owner) {}

  /* ========== VIEW FUNCTIONS ========== */

  /**
   * @notice returns VaultMetadata for registered vault address
   * @param _vaultAddress - address of registered vault
   */
  function getVault(address _vaultAddress) external view returns (VaultMetadata memory) {
    if (vaults[_vaultAddress].vaultAddress == address(0)) revert VaultNotRegistered();

    return vaults[_vaultAddress];
  }

  /**
   * @notice returns array containing all vaults with asset token
   * @param _asset - address of vault asset
   */
  function getVaultsByAsset(address _asset) external view returns (address[] memory) {
    if (assetVaults[_asset].length <= 0) revert NoAssetVaults();

    return assetVaults[_asset];
  }

  /**
   * @notice returns address array of all vaults of specified type
   * @param _type - type of vault
   */
  function getVaultsByType(uint256 _type) external view returns (address[] memory) {
    if (_type > vaultTypes || _type <= 0) revert InvalidVaultType();
    if (typeVaults[_type].length <= 0) revert NoTypeVaults();

    return typeVaults[_type];
  }

  /**
   * @notice returns number of vaults in registry
   */
  function getTotalVaults() external view returns (uint256) {
    return vaultAddresses.length;
  }

  /**
   * @notice returns all registered vault addresses
   */
  function getRegisteredAddresses() external view returns (address[] memory) {
    return vaultAddresses;
  }

  /* ========== MUTATIVE FUNCTIONS ========== */

  /**
   * @notice registers vault and adds address to mapping array of type and asset
   * @param params - VaultMetadata constructed by Factory after deployVaultFromV1Factory called by Controller
   */
  function registerVault(VaultMetadata memory params) external onlyOwner {
    if (vaults[params.vaultAddress].vaultAddress != address(0)) revert VaultAlreadyRegistered();
    if (params.vaultType > vaultTypes || params.vaultType <= 0) revert InvalidVaultType();

    _registerVault(params);
  }

  function _registerVault(VaultMetadata memory params) internal {
    vaults[params.vaultAddress] = params;

    vaultAddresses.push(params.vaultAddress);
    assetVaults[IERC4626(params.vaultAddress).asset()].push(params.vaultAddress);
    typeVaults[params.vaultType].push(params.vaultAddress);

    emit VaultAdded(params.vaultAddress, params.vaultType, params.enabled, params.metadataCID);
  }

  /**
   * @notice updates the VaultMetadata in registry
   * @param _vaultMetadata struct with updated values
   * @dev vaultAddress, vaultType, and submitter are immutable
   */
  function updateVault(VaultMetadata memory _vaultMetadata) external onlyOwner {
    VaultMetadata storage updatedVault = vaults[_vaultMetadata.vaultAddress];

    if (updatedVault.vaultAddress == address(0)) revert VaultNotRegistered();
    if (_vaultMetadata.vaultType != updatedVault.vaultType) revert VaultTypeImmutable();
    if (_vaultMetadata.submitter != updatedVault.submitter) revert SubmitterImmutable();

    updatedVault.enabled = _vaultMetadata.enabled;
    updatedVault.staking = _vaultMetadata.staking;
    updatedVault.vaultZapper = _vaultMetadata.vaultZapper;
    updatedVault.metadataCID = _vaultMetadata.metadataCID;
    updatedVault.swapTokenAddresses = _vaultMetadata.swapTokenAddresses;
    updatedVault.swapAddress = _vaultMetadata.swapAddress;
    updatedVault.exchange = _vaultMetadata.exchange;
    updatedVault.zapIn = _vaultMetadata.zapIn;
    updatedVault.zapOut = _vaultMetadata.zapOut;

    emit VaultUpdated(
      _vaultMetadata.vaultAddress,
      _vaultMetadata.vaultType,
      _vaultMetadata.enabled,
      _vaultMetadata.metadataCID
    );
  }

  //TODO get rid of vaultType
  /**
   * @notice increase the types of vaults that can be registered
   * @param _type - the next vault type to be registered
   * @dev _type must be exactly 1 more than current vaultTypes
   */
  function addVaultType(uint256 _type) external onlyOwner {
    if (_type != vaultTypes + 1) revert InvalidVaultType();

    vaultTypes = _type;
    emit VaultTypeAdded(vaultTypes);
  }

  /**
   * @notice switches whether a vault is endorsed or unendorsed
   * @param _vaultAddress address of the vault to change endorsement
   */
  function toggleEndorseVault(address _vaultAddress) external onlyOwner {
    if (vaults[_vaultAddress].vaultAddress == address(0)) revert VaultNotRegistered();

    endorsed[_vaultAddress] = !endorsed[_vaultAddress];
    emit VaultStatusChanged(_vaultAddress, endorsed[_vaultAddress], vaults[_vaultAddress].enabled);
  }

  /**
   * @notice switches whether a vault is enabled or disabled
   * @param _vaultAddress address of the vault to enable or disable
   */
  function toggleEnableVault(address _vaultAddress) external onlyOwner {
    if (vaults[_vaultAddress].vaultAddress == address(0)) revert VaultNotRegistered();

    vaults[_vaultAddress].enabled = !vaults[_vaultAddress].enabled;
    emit VaultStatusChanged(_vaultAddress, endorsed[_vaultAddress], vaults[_vaultAddress].enabled);
  }
}

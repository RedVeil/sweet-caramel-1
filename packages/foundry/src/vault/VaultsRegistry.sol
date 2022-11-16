// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "../../interfaces/IERC4626.sol";
import "../../utils/Owned.sol";

struct VaultMetadata {
  address vaultAddress; // address of vault
  bool enabled; // is the vault enabled
  address staking; // address of vault staking contract
  address submitter; // address of vault submitter
  string metadataCID; // ipfs CID of vault metadata
  address[8] swapTokenAddresses; // underlying assets to deposit and recieve LP token
  address swapAddress; // ex: stableSwapAddress for Curve
  uint256 exchange; // number specifying exchange (1 = curve)
}

/**
 * @notice Registry for vaults deployed through VaultsV1Factory
 * @dev all mutative functions can only be called by VaultsV1Controller
 */
contract VaultsRegistry is Owned {
  /* ========== CUSTOM ERRORS ========== */

  error VaultNotRegistered();
  error NoAssetVaults();
  error VaultAlreadyRegistered();
  error SubmitterImmutable();

  /* ========== STATE VARIABLES ========== */

  // vault address to vault metadata
  mapping(address => VaultMetadata) public vaults;

  // vault address to endorsed
  mapping(address => bool) public endorsed;

  // asset to vault addresses
  mapping(address => address[]) public assetVaults;

  // addresses of all registered vaults
  address[] public vaultAddresses;

  bytes32 public constant contractName = keccak256("VaultsRegistry");

  /* ========== EVENTS ========== */

  event VaultAdded(address vaultAddress, bool enabled, string metadataCID);
  event VaultUpdated(address vaultAddress, bool enabled, string metadataCID);
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
   * @notice registers vault and adds address to mapping array of asset
   * @param params - VaultMetadata constructed by Factory after deployVaultFromV1Factory called by Controller
   */
  function registerVault(VaultMetadata memory params) external onlyOwner {
    if (vaults[params.vaultAddress].vaultAddress != address(0)) revert VaultAlreadyRegistered();

    _registerVault(params);
  }

  function _registerVault(VaultMetadata memory params) internal {
    vaults[params.vaultAddress] = params;

    vaultAddresses.push(params.vaultAddress);
    assetVaults[IERC4626(params.vaultAddress).asset()].push(params.vaultAddress);

    emit VaultAdded(params.vaultAddress, params.enabled, params.metadataCID);
  }

  /**
   * @notice updates the VaultMetadata in registry
   * @param _vaultMetadata struct with updated values
   * @dev vaultAddress and submitter are immutable
   */
  function updateVault(VaultMetadata memory _vaultMetadata) external onlyOwner {
    VaultMetadata storage updatedVault = vaults[_vaultMetadata.vaultAddress];

    if (updatedVault.vaultAddress == address(0)) revert VaultNotRegistered();
    if (_vaultMetadata.submitter != updatedVault.submitter) revert SubmitterImmutable();

    updatedVault.enabled = _vaultMetadata.enabled;
    updatedVault.staking = _vaultMetadata.staking;
    updatedVault.metadataCID = _vaultMetadata.metadataCID;
    updatedVault.swapTokenAddresses = _vaultMetadata.swapTokenAddresses;
    updatedVault.swapAddress = _vaultMetadata.swapAddress;
    updatedVault.exchange = _vaultMetadata.exchange;

    emit VaultUpdated(
      _vaultMetadata.vaultAddress,
      _vaultMetadata.enabled,
      _vaultMetadata.metadataCID
    );
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
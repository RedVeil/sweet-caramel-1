// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15
pragma solidity ^0.8.15;

import { IERC4626 } from "../interfaces/vault/IERC4626.sol";
import { Owned } from "../utils/Owned.sol";

struct VaultMetadata {
  address vaultAddress; // address of vault
  address staking; // address of vault staking contract
  address submitter; // address of vault submitter
  string metadataCID; // ipfs CID of vault metadata
  address[8] swapTokenAddresses; // underlying assets to deposit and recieve LP token
  address swapAddress; // ex: stableSwapAddress for Curve
  uint256 exchange; // number specifying exchange (1 = curve)
}

/**
 * @notice Registry for vaults deployed through VaultsFactory
 * @dev all mutative functions can only be called by VaultsController
 */
contract VaultsRegistry is Owned {
  /*//////////////////////////////////////////////////////////////
                            IMMUTABLES
    //////////////////////////////////////////////////////////////*/

  bytes32 public constant contractName = keccak256("VaultsRegistry");

  constructor(address _owner) Owned(_owner) {}

  /*//////////////////////////////////////////////////////////////
                            REGISTRATION LOGIC
    //////////////////////////////////////////////////////////////*/

  // vault address to vault metadata
  mapping(address => VaultMetadata) public vaults;

  // asset to vault addresses
  mapping(address => address[]) public assetVaults;

  // addresses of all registered vaults
  address[] public vaultAddresses;

  event VaultAdded(address vaultAddress, string metadataCID);

  error VaultAlreadyRegistered();

  // TODO how do we deal with vaults with wrong data?
  /**
   * @notice registers vault and adds address to mapping array of asset
   * @param params - VaultMetadata constructed by Factory after deployVaultFromFactory called by Controller
   */
  function registerVault(VaultMetadata memory params) external onlyOwner {
    if (vaults[params.vaultAddress].vaultAddress != address(0)) revert VaultAlreadyRegistered();

    vaults[params.vaultAddress] = params;

    vaultAddresses.push(params.vaultAddress);
    assetVaults[IERC4626(params.vaultAddress).asset()].push(params.vaultAddress);

    emit VaultAdded(params.vaultAddress, params.metadataCID);
  }

  /*//////////////////////////////////////////////////////////////
                            VAULT VIEWING LOGIC
    //////////////////////////////////////////////////////////////*/

  /**
   * @notice returns VaultMetadata for registered vault address
   * @param _vaultAddress - address of registered vault
   */
  function getVault(address _vaultAddress) external view returns (VaultMetadata memory) {
    return vaults[_vaultAddress];
  }

  /**
   * @notice returns array containing all vaults with asset token
   * @param _asset - address of vault asset
   */
  function getVaultsByAsset(address _asset) external view returns (address[] memory) {
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
}

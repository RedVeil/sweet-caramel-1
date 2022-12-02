// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "../utils/Owned.sol";

/**
 * @notice Factory that deploys Vault, VaultStaking, and Wrapper contracts
 * @dev deploy functions can only be called by VaultsController
 */
contract VaultsFactory is Owned {
  /* ========== CUSTOM ERRORS ========== */

  error DeploymentInitFailed();

  /* ========== EVENTS ========== */

  event Deployment(address indexed implementation);

  /* ========== STATE VARIABLES ========== */

  bytes32 public constant contractName = keccak256("VaultsFactory");

  /* ========== CONSTRUCTOR ========== */

  constructor(address _owner) Owned(_owner) {}

  /**
   * @notice Deploys Vault, VaultStaking, or Wrapper contracts
   * @param implementation - address of contract to clone behavior code
   * @param data - calldata
   * @dev This should always be called through the VaultsController
   */
  function deploy(address implementation, bytes calldata data) external onlyOwner returns (address clone) {
    clone = Clones.clone(implementation);

    (bool success, ) = clone.call(data);

    if (!success) revert DeploymentInitFailed();

    emit Deployment(clone);
  }
}

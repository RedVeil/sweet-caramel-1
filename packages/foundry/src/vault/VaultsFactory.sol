// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";

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
   * @param _implementation - address of contract to clone behavior code
   * @dev This should always be called through the VaultsController
   */
  function deploy(address _implementation, bytes calldata _args)
    external
    onlyOwner
    returns (address clone, bytes memory returnData)
  {
    clone = Clones.clone(_implementation);

    bytes4 selector = clone.initialize.selector;

    (bool success, bytes memory returnData) = clone.call(abi.encodeWithSelector(selector, _args));

    if (!success) revert DeploymentInitFailed();

    emit Deployment(clone);
  }
}

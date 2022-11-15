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

  /* 
  * - All factories should be reduced to one.
  * - Implementation should be an input param together with bytes encoded init args
  * - Factory should clone implementation and than call the clone init function with encoded args + later return address of clone as usual
  * - This will allow us to create Vault,VaultStaking and any wrapper in one simple factory
  /* 

  /**
   * @notice Deploys Vault, VaultStaking, or Wrapper contracts
   * @param _implementation - address of contract to clone behavior code
   * @dev This should always be called through the VaultController
   */
  function deploy(address _implementation, bytes32 calldata _args)
    external
    onlyOwner
    returns (address implementation, bytes32 memory returnData)
  {
    implementation = Clones.clone(implementation);

    bytes4 selector = implementation.initialize.selector;

    (bool success, bytes32 memory returnData) = implementation.call(abi.encodeWithSelector(selector, _args));

    if (!success) revert DeploymentInitFailed();

    emit Deployment(implementation);
  }
}

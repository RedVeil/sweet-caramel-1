// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "../utils/Owned.sol";
import "../interfaces/IInitializable.sol";

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
   * @param data - calldata
   * @dev This should always be called through the VaultsController
   */
  function deploy(address _implementation, bytes calldata data)
    external
    onlyOwner
    returns (address clone, bytes memory)
  {
    clone = Clones.clone(_implementation);

    bytes4 selector = _getSelector(data);

    (bool success, bytes memory _returnData) = clone.call(abi.encodeWithSelector(selector, data));

    if (!success) revert DeploymentInitFailed();

    emit Deployment(clone);

    return (clone, _returnData);
  }

  function _getSelector(bytes memory payload) internal pure returns (bytes4 selector) {
    selector = payload[0] | (bytes4(payload[1]) >> 8) | (bytes4(payload[2]) >> 16) | (bytes4(payload[3]) >> 24);
  }
}

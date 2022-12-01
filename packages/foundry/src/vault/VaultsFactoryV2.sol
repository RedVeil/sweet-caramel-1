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
  /*//////////////////////////////////////////////////////////////
                               IMMUTABLES
    //////////////////////////////////////////////////////////////*/

  bytes32 public constant contractName = keccak256("VaultsFactory");

  constructor(address _owner) Owned(_owner) {}

  /*//////////////////////////////////////////////////////////////
                          DEPLOY LOGIC
    //////////////////////////////////////////////////////////////*/

  struct Template {
    address implementation;
    bool endorsed;
  }

  error DeploymentInitFailed();
  error NotEndorsed(bytes32 templateKey);

  event Deployment(address indexed implementation);

  // TypeIdentifier => Key => Template
  mapping(bytes32 => mapping(bytes32 => Template)) public templates;

  /**
   * @notice Deploys Vault, VaultStaking, or Wrapper contracts
   * @dev This should always be called through the VaultsController
   */
  function deploy(
    bytes32 templateType,
    bytes32 templateKey,
    bytes memory data
  ) external onlyOwner returns (address clone) {
    Template memory template = templates[templateType][templateKey];

    if (!template.endorsed) revert NotEndorsed(templateKey);

    clone = Clones.clone(template.implementation);

    bool success = true;
    if (data.length > 0) (success, ) = clone.call(data);

    if (!success) revert DeploymentInitFailed();

    emit Deployment(clone);
  }
}

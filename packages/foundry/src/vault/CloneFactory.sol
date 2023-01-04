// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;

import { Clones } from "openzeppelin-contracts/proxy/Clones.sol";
import { Owned } from "../utils/Owned.sol";
import { Template } from "../interfaces/vault/ITemplateRegistry.sol";

contract CloneFactory is Owned {
  /*//////////////////////////////////////////////////////////////
                               IMMUTABLES
    //////////////////////////////////////////////////////////////*/

  constructor(address _owner) Owned(_owner) {}

  /*//////////////////////////////////////////////////////////////
                          DEPLOY LOGIC
    //////////////////////////////////////////////////////////////*/

  error DeploymentInitFailed();
  error NotEndorsed(bytes32 templateKey);

  event Deployment(address indexed clone);

  /**
   * @notice Deploys Vault, VaultStaking, or Wrapper contracts
   * @dev This should always be called through the DeploymentController
   */
  function deploy(Template memory template, bytes memory data) external onlyOwner returns (address clone) {
    clone = Clones.clone(template.implementation);

    bool success = true;
    if (template.requiresInitData) (success, ) = clone.call(data);

    if (!success) revert DeploymentInitFailed();

    emit Deployment(clone);
  }
}

// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;

import { Owned } from "../utils/Owned.sol";
import { IEndorsementRegistry } from "../interfaces/vault/IEndorsementRegistry.sol";

/**
 * @notice Factory that deploys Vault, VaultStaking, and Wrapper contracts
 * @dev deploy functions can only be called by VaultController
 */
contract EndorsementRegistry is Owned {
  /*//////////////////////////////////////////////////////////////
                            IMMUTABLES
    //////////////////////////////////////////////////////////////*/

  constructor(address _owner) Owned(_owner) {}

  /*//////////////////////////////////////////////////////////////
                          ENDORSEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  mapping(address => bool) public endorsed;

  event EndorsementToggled(address target, bool oldEndorsement, bool newEndorsement);

  function toggleEndorsement(address[] memory targets) external onlyOwner {
    bool oldEndorsement;
    address target;

    uint256 len = targets.length;
    for (uint256 i = 0; i < len; i++) {
      target = targets[i];
      oldEndorsement = endorsed[target];

      emit EndorsementToggled(target, oldEndorsement, !oldEndorsement);

      endorsed[target] = !oldEndorsement;
    }
  }
}

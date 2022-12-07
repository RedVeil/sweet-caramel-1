// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15
pragma solidity ^0.8.15;

import { Owned } from "../utils/Owned.sol";

contract CloneRegistry is Owned {
  /*//////////////////////////////////////////////////////////////
                            IMMUTABLES
    //////////////////////////////////////////////////////////////*/

  bytes32 public constant contractName = keccak256("CloneRegistry");

  constructor(address _owner) Owned(_owner) {}

  /*//////////////////////////////////////////////////////////////
                          ENDORSEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  mapping(address => bool) public cloneExists;

  event CloneAdded(address clone);

  function addClone(address clone) external onlyOwner {
    cloneExists[clone] = true;

    emit CloneAdded(clone);
  }
}

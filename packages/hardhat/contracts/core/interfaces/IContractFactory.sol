// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

/**
 * @dev External interface of for any kind of factories in the vault ecosystem
 */
interface IContractFactory {
  event ImplementationUpdated(address oldImplementation, address newImplementation);

  function setImplementation(address _implementation) external;
}

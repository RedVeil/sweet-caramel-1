// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

/**
 * @dev External interface of for contracts with initialize function
 */

interface IInitializable {
  function intialize(bytes calldata data) external;
}

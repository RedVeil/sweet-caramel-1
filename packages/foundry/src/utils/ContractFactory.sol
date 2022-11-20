// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0

pragma solidity ^0.8.0;

contract ContractFactory is ACLAuth {
  /* ========== CUSTOM ERRORS ========== */

  error ImplementationAlreadyRegistered();
  error ImplementationAlreadyEndorsed();
  error ImplementationNotRegistered();

  /* ========== STATE VARIABLES ========== */

  mapping(address => bytes) public implementationToInitSelector;

  mapping(address => bool) public implementationToEndorsed;

  /* ========== EVENTS ========== */

  event ImplementationRegistered(address indexed implementation);
  event ImplementationEndorsed(address indexed implementation);
  event ImplementationSelectorUpdated(address indexed implementation);

  /* ========== VIEW FUNCTIONS ========== */

  function getInitSelector(address _implementation) external view returns (bytes) {
    return implementationToInitSelector[_implementation];
  }

  function isEndorsed(address _implementation) external view returns (bool) {
    return implementationToEndorsed[_implementation];
  }

  /* ========== MUTATIVE FUNCTIONS ========== */

  function registerImplementation(address _implementation, bytes memory initSelector) external {
    if (implementationToInitSelector[_implementation] != 0x00) revert ImplementationAlreadyRegistered();

    implementationToInitSelector[_implementation] = initSelector;

    emit ImplementationRegistered(_implementation);
  }

  function endorseImplementation(address _implementation) external onlyRole(DAO_ROLE) {
    if (implementationToEndorsed[_implementation]) revert ImplementationNotRegistered();

    implementationToEndorsed[_implementation] = true;

    emit ImplementationEndorsed(_implementation);
  }

  function updateImplementationInitSelector(address _implementation, bytes memory newInitSelector) external {
    if (implementationToInitSelector[_implementation] == 0x00) revert ImplementationNotRegistered();

    implementationToInitSelector[_implementation] = newInitSelector;

    emit ImplementationSelectorUpdated(_implementation);
  }
}

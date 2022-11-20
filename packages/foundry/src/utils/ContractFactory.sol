// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0

pragma solidity ^0.8.0;

import "openzeppelin-contracts/proxy/Clones.sol";
import "./ACLAuth.sol";
import "./ContractRegistryAccess.sol";

contract ContractFactory is ACLAuth, ContractRegistryAccess {
  /* ========== CUSTOM ERRORS ========== */

  error ImplementationAlreadyRegistered();
  error ImplementationAlreadyEndorsed();
  error ImplementationNotRegistered();
  error ImplementationNotEndorsed();
  error DeploymentInitFailed();

  /* ========== STATE VARIABLES ========== */

  mapping(address => bytes4) public implementationToInitSelector;

  mapping(address => bool) public implementationToEndorsed;

  /* ========== EVENTS ========== */

  event ImplementationRegistered(address indexed implementation);
  event ImplementationEndorsed(address indexed implementation);
  event ImplementationSelectorUpdated(address indexed implementation);
  event Deployment(address indexed clonedContract);

  /* ========== CONSTRUCTOR ========== */

  constructor(IContractRegistry _contractRegistry) ContractRegistryAccess(_contractRegistry) {}

  /* ========== VIEW FUNCTIONS ========== */

  function getInitSelector(address _implementation) external view returns (bytes4) {
    return implementationToInitSelector[_implementation];
  }

  function isEndorsed(address _implementation) external view returns (bool) {
    return implementationToEndorsed[_implementation];
  }

  /* ========== MUTATIVE FUNCTIONS ========== */

  /* ========== IMPLEMENTATION REGISTERING ========== */

  function registerImplementation(address _implementation, bytes4 initSelector) external {
    if (implementationToInitSelector[_implementation].length != 0) revert ImplementationAlreadyRegistered();

    implementationToInitSelector[_implementation] = initSelector;

    emit ImplementationRegistered(_implementation);
  }

  // NOTE: if implementation is confirmed valid, DAO can endorse
  function endorseImplementation(address _implementation) external onlyRole(DAO_ROLE) {
    if (implementationToEndorsed[_implementation]) revert ImplementationNotRegistered();

    implementationToEndorsed[_implementation] = true;

    emit ImplementationEndorsed(_implementation);
  }

  function updateImplementationInitSelector(address _implementation, bytes4 newInitSelector) external {
    if (implementationToInitSelector[_implementation].length == 0) revert ImplementationNotRegistered();

    implementationToInitSelector[_implementation] = newInitSelector;

    emit ImplementationSelectorUpdated(_implementation);
  }

  /* ========== IMPLEMENTATION CLONE DEPLOYMENT ========== */

  function deploy(address _implementation, bytes calldata _deploymentArgs)
    external
    returns (address clone, bytes memory returnData)
  {
    if (!implementationToEndorsed[_implementation]) revert ImplementationNotEndorsed();

    clone = Clones.clone(_implementation);

    bytes4 initSelector = implementationToInitSelector[_implementation];

    (bool success, bytes memory returnData) = clone.call(abi.encodeWithSelector(initSelector, _deploymentArgs));

    if (!success) revert DeploymentInitFailed();

    emit Deployment(clone);
  }

  /* ========== Overrides ========== */

  /**
   * @notice Override for ACLAuth and ContractRegistryAccess.
   */
  function _getContract(bytes32 _name) internal view override(ACLAuth, ContractRegistryAccess) returns (address) {
    return super._getContract(_name);
  }
}

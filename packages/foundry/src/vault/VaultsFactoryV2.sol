// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/proxy/Clones.sol";
import { Owned } from "../utils/Owned.sol";
import { ContractRegistryAccess, IContractRegistry } from "../utils/ContractRegistryAccess.sol";
import { IEndorsementRegistry } from "../interfaces/vault/IEndorsementRegistry.sol";

/**
 * @notice Factory that deploys Vault, VaultStaking, and Wrapper contracts
 * @dev deploy functions can only be called by VaultsController
 */
contract VaultsFactory is Owned, ContractRegistryAccess {
  /*//////////////////////////////////////////////////////////////
                               IMMUTABLES
    //////////////////////////////////////////////////////////////*/

  bytes32 public constant contractName = keccak256("VaultsFactory");

  constructor(
    address _owner,
    IContractRegistry _contractRegistry
  ) Owned(_owner) ContractRegistryAccess(_contractRegistry) {}

  /*//////////////////////////////////////////////////////////////
                          TEMPLATE LOGIC
    //////////////////////////////////////////////////////////////*/
  struct Template {
    address implementation;
    string metadataCid;
    bool requiresInitData;
  }

  // TypeIdentifier => Key => Template
  mapping(bytes32 => mapping(bytes32 => Template)) public templates;
  mapping(bytes32 => bytes32[]) public templateKeys;

  mapping(bytes32 => bool) public templateTypeExists;
  bytes32[] public templateTypes;

  error KeyNotFound(bytes32 templateType);
  error TemplateExists(bytes32 templateType, bytes32 templateKey);
  error TemplateTypeExists(bytes32 templateType);

  event TemplateTypeAdded(bytes32 templateType);
  event TemplateAdded(bytes32 templateType, bytes32 templateKey, address implementation);
  event TemplateUpdated(bytes32 templateType, bytes32 templateKey);

  function addTemplate(
    bytes32 templateType,
    bytes32 templateKey,
    address implementation,
    string memory metadataCid,
    bool requiresInitData
  ) external {
    if (!templateTypeExists[templateType]) revert KeyNotFound(templateType);
    if (templates[templateType][templateKey].implementation != address(0))
      revert TemplateExists(templateType, templateKey);

    templates[templateType][templateKey] = Template({
      implementation: implementation,
      metadataCid: metadataCid,
      requiresInitData: requiresInitData
    });

    templateKeys[templateType].push(templateKey);

    emit TemplateAdded(templateType, templateKey, implementation);
  }

  function addTemplateType(bytes32 templateType) external onlyOwner {
    if (templateTypeExists[templateType]) revert TemplateTypeExists(templateType);

    templateTypeExists[templateType] = true;
    templateTypes.push(templateType);

    emit TemplateTypeAdded(templateType);
  }

  function getTemplateTypes() external view returns (bytes32[] memory) {
    return templateTypes;
  }

  function getTemplateKeys(bytes32 templateType) external view returns (bytes32[] memory) {
    return templateKeys[templateType];
  }

  /*//////////////////////////////////////////////////////////////
                          DEPLOY LOGIC
    //////////////////////////////////////////////////////////////*/

  error DeploymentInitFailed();
  error NotEndorsed(bytes32 templateKey);

  event Deployment(address indexed implementation);

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

    if (IEndorsementRegistry(_getContract(ENDORSEMENT_REGISTRY)).endorsed(template.implementation))
      revert NotEndorsed(templateKey);

    clone = Clones.clone(template.implementation);

    bool success = true;
    if (template.requiresInitData) (success, ) = clone.call(data);

    if (!success) revert DeploymentInitFailed();

    emit Deployment(clone);
  }

  /*//////////////////////////////////////////////////////////////
                      CONTRACT REGISTRY LOGIC
  //////////////////////////////////////////////////////////////*/

  bytes32 public constant ENDORSEMENT_REGISTRY = keccak256("EndorsementRegistry");

  /**
   * @notice Override for ContractRegistryAccess.
   */
  function _getContract(bytes32 _name) internal view override(ContractRegistryAccess) returns (address) {
    return super._getContract(_name);
  }
}

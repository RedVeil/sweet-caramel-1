// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15
pragma solidity ^0.8.15;

import { Owned } from "../utils/Owned.sol";
import { Template } from "../interfaces/vault/ITemplateRegistry.sol";

contract TemplateRegistry is Owned {
  /*//////////////////////////////////////////////////////////////
                               IMMUTABLES
    //////////////////////////////////////////////////////////////*/

  constructor(address _owner) Owned(_owner) {}

  /*//////////////////////////////////////////////////////////////
                          TEMPLATE LOGIC
    //////////////////////////////////////////////////////////////*/

  // TypeIdentifier => Id => Template
  mapping(bytes32 => mapping(bytes32 => Template)) public templates;
  mapping(bytes32 => bytes32[]) public templateIds;
  mapping(bytes32 => bool) public templateExists;

  mapping(bytes32 => bool) public templateTypeExists;
  bytes32[] public templateTypes;

  error KeyNotFound(bytes32 templateType);
  error TemplateExists(bytes32 templateId);
  error TemplateTypeExists(bytes32 templateType);

  event TemplateTypeAdded(bytes32 templateType);
  event TemplateAdded(bytes32 templateType, bytes32 templateId, address implementation);
  event TemplateUpdated(bytes32 templateType, bytes32 templateId);

  function addTemplate(
    bytes32 templateType,
    bytes32 templateId,
    address implementation,
    string memory metadataCid,
    bool requiresInitData
  ) external onlyOwner {
    if (!templateTypeExists[templateType]) revert KeyNotFound(templateType);
    if (templateTypeExists[templateId]) revert TemplateExists(templateId);

    templates[templateType][templateId] = Template({
      implementation: implementation,
      metadataCid: metadataCid,
      requiresInitData: requiresInitData
    });

    templateIds[templateType].push(templateId);
    templateExists[templateId] = true;

    emit TemplateAdded(templateType, templateId, implementation);
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
    return templateIds[templateType];
  }
}

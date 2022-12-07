// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15
pragma solidity ^0.8.15;

import { Owned } from "../utils/Owned.sol";
import { ICloneFactory } from "../interfaces/vault/ICloneFactory.sol";
import { ICloneRegistry } from "../interfaces/vault/ICloneRegistry.sol";
import { ITemplateRegistry, Template } from "../interfaces/vault/ITemplateRegistry.sol";
import { IEndorsementRegistry } from "../interfaces/vault/IEndorsementRegistry.sol";

contract DeploymentController is Owned {
  /*//////////////////////////////////////////////////////////////
                               IMMUTABLES
    //////////////////////////////////////////////////////////////*/

  ICloneFactory public cloneFactory;
  ICloneRegistry public cloneRegistry;
  ITemplateRegistry public templateRegistry;
  IEndorsementRegistry public endorsementRegistry;

  bytes32 public constant contractName = keccak256("DeploymentController");

  constructor(
    address _owner,
    ICloneFactory _cloneFactory,
    ICloneRegistry _cloneRegistry,
    ITemplateRegistry _templateRegistry,
    IEndorsementRegistry _endorsementRegistry
  ) Owned(_owner) {
    cloneFactory = _cloneFactory;
    cloneRegistry = _cloneRegistry;
    templateRegistry = _templateRegistry;
    endorsementRegistry = _endorsementRegistry;
  }

  /*//////////////////////////////////////////////////////////////
                          TEMPLATE LOGIC
    //////////////////////////////////////////////////////////////*/

  function addTemplate(
    bytes32 templateType,
    bytes32 templateId,
    address implementation,
    string memory metadataCid,
    bool requiresInitData
  ) external {
    templateRegistry.addTemplate(templateType, templateId, implementation, metadataCid, requiresInitData);
  }

  function addTemplateType(bytes32 templateType) external onlyOwner {
    templateRegistry.addTemplateType(templateType);
  }

  function templateTypeExists(bytes32 templateType) external view returns (bool) {
    return templateRegistry.templateTypeExists(templateType);
  }

  function templateExists(bytes32 templateId) external view returns (bool) {
    templateRegistry.templateExists(templateId);
  }

  /*//////////////////////////////////////////////////////////////
                          DEPLOY LOGIC
    //////////////////////////////////////////////////////////////*/

  error NotEndorsed(bytes32 templateKey);

  function deploy(
    bytes32 templateType,
    bytes32 templateId,
    bytes memory data
  ) external onlyOwner returns (address clone) {
    Template memory template = templateRegistry.templates(templateType, templateId);

    if (endorsementRegistry.endorsed(template.implementation)) revert NotEndorsed(templateKey);

    clone = cloneFactory.deploy(templateType, templateKey, data);

    cloneRegistry.addClone(clone);
  }

  function cloneExists(address clone) external view returns (bool) {
    return cloneRegistry.cloneExists(clone);
  }
}

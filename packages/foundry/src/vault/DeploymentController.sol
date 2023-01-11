// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;

import { Owned } from "../utils/Owned.sol";
import { IOwned } from "../interfaces/IOwned.sol";
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

  function addTemplateType(bytes32 templateType) external onlyOwner {
    templateRegistry.addTemplateType(templateType);
  }

  function addTemplate(
    bytes32 templateType,
    bytes32 templateId,
    Template memory template
  ) external {
    templateRegistry.addTemplate(templateType, templateId, template);
  }

  /*//////////////////////////////////////////////////////////////
                          TEMPLATE VIEW LOGIC
    //////////////////////////////////////////////////////////////*/

  function templateTypeExists(bytes32 templateType) external view returns (bool) {
    return templateRegistry.templateTypeExists(templateType);
  }

  function templateExists(bytes32 templateId) external view returns (bool) {
    return templateRegistry.templateExists(templateId);
  }

  function getTemplateTypes() external view returns (bytes32[] memory) {
    return templateRegistry.getTemplateTypes();
  }

  function getTemplateIds(bytes32 templateType) external view returns (bytes32[] memory) {
    return templateRegistry.getTemplateIds(templateType);
  }

  function getTemplate(bytes32 templateType, bytes32 templateId) external view returns (Template memory) {
    return templateRegistry.getTemplate(templateType, templateId);
  }

  /*//////////////////////////////////////////////////////////////
                          DEPLOY LOGIC
    //////////////////////////////////////////////////////////////*/

  error NotEndorsed(bytes32 templateId);

  function deploy(
    bytes32 templateType,
    bytes32 templateId,
    bytes memory data
  ) external onlyOwner returns (address clone) {
    Template memory template = templateRegistry.getTemplate(templateType, templateId);

    if (!endorsementRegistry.endorsed(template.implementation)) revert NotEndorsed(templateId);

    clone = cloneFactory.deploy(template, data);

    cloneRegistry.addClone(clone);
  }

  function cloneExists(address clone) external view returns (bool) {
    return cloneRegistry.cloneExists(clone);
  }

  /*//////////////////////////////////////////////////////////////
                          OWNERSHIP LOGIC
    //////////////////////////////////////////////////////////////*/

  function nominateNewDependencyOwner(address _owner) external onlyOwner {
    IOwned(address(cloneFactory)).nominateNewOwner(_owner);
    IOwned(address(cloneRegistry)).nominateNewOwner(_owner);
    IOwned(address(templateRegistry)).nominateNewOwner(_owner);
  }

  function acceptDependencyOwnership() external {
    IOwned(address(cloneFactory)).acceptOwnership();
    IOwned(address(cloneRegistry)).acceptOwnership();
    IOwned(address(templateRegistry)).acceptOwnership();
  }
}

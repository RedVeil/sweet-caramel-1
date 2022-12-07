// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;

import { ICloneFactory } from "./ICloneFactory.sol";
import { ICloneRegistry } from "./ICloneRegistry.sol";

interface IDeploymentController is ICloneFactory, ICloneRegistry {
  function templateTypeExists(bytes32 templateType) external view returns (bool);

  function templateExists(bytes32 templateId) external view returns (bool);

  function addTemplate(
    bytes32 templateType,
    bytes32 templateId,
    address implementation,
    string memory metadataCid,
    bool requiresInitData
  ) external;

  function addTemplateType(bytes32 templateType) external;
}

// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;

import { IOwned } from "../IOwned.sol";

struct Template {
  address implementation;
  string metadataCid;
  bool requiresInitData;
  bytes4[8] requriedSigs; // Only for Strategies
}

interface ITemplateRegistry is IOwned {
  function templates(bytes32 templateType, bytes32 templateId) external view returns (Template memory);

  function templateTypeExists(bytes32 templateType) external view returns (bool);

  function templateExists(bytes32 templateId) external view returns (bool);

  function getTemplateTypes() external view returns (bytes32[] memory);

  function getTemplateIds(bytes32 templateType) external view returns (bytes32[] memory);

  function addTemplate(
    bytes32 templateType,
    bytes32 templateId,
    address implementation,
    string memory metadataCid,
    bool requiresInitData,
    bytes4[8] memory requiredSigs
  ) external;

  function addTemplateType(bytes32 templateType) external;
}

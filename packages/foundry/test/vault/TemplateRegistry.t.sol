// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.15;

import { Test } from "forge-std/Test.sol";
import { TemplateRegistry } from "../../src/vault/TemplateRegistry.sol";
import { EndorsementRegistry } from "../../src/vault/EndorsementRegistry.sol";
import { WithContractRegistry, IContractRegistry } from "../utils/WithContractRegistry.sol";
import { ClonableWithInitData } from "../utils/mocks/ClonableWithInitData.sol";
import { ClonableWithoutInitData } from "../utils/mocks/ClonableWithoutInitData.sol";

contract TemplateRegistryTEst is Test, WithContractRegistry {
  TemplateRegistry registry;

  bytes32 public constant ENDORSEMENT_REGISTRY = keccak256("EndorsementRegistry");

  address nonOwner = address(0x666);
  bytes32 templateType = "templateType";

  address[] addressArray;

  event TemplateTypeAdded(bytes32 templateType);
  event TemplateAdded(bytes32 templateType, bytes32 templateKey, address implementation);
  event TemplateUpdated(bytes32 templateType, bytes32 templateKey);

  function setUp() public {
    _adminPrepare();

    registry = new TemplateRegistry(address(this));
  }

  /*//////////////////////////////////////////////////////////////
                          ADD_TEMPLATE_TYPE
    //////////////////////////////////////////////////////////////*/
  function test__addTemplateType() public {
    vm.expectEmit(true, true, true, false, address(registry));
    emit TemplateTypeAdded(templateType);

    registry.addTemplateType(templateType);

    bytes32[] memory templateTypes = registry.getTemplateTypes();
    assertEq(templateTypes.length, 1);
    assertEq(templateTypes[0], templateType);
    assertTrue(registry.templateTypeExists(templateType));
  }

  function testFail__addTemplateType_nonOwner() public {
    vm.prank(nonOwner);
    registry.addTemplateType(templateType);
  }

  function testFail__addTemplateType_templateType_already_exists() public {
    registry.addTemplateType(templateType);

    vm.expectRevert(TemplateRegistry.TemplateTypeExists.selector);
    registry.addTemplateType(templateType);
  }

  /*//////////////////////////////////////////////////////////////
                          ADD_TEMPLATE
    //////////////////////////////////////////////////////////////*/

  function test__addTemplate() public {
    registry.addTemplateType(templateType);
    ClonableWithInitData clonableWithInitData = new ClonableWithInitData();

    vm.expectEmit(true, true, true, false, address(registry));
    emit TemplateAdded(templateType, "ClonableWithInitData", address(clonableWithInitData));

    registry.addTemplate(templateType, "ClonableWithInitData", address(clonableWithInitData), "cid", true);

    (address implementation, string memory metadataCid, bool requiresInitData) = registry.templates(
      templateType,
      "ClonableWithInitData"
    );
    assertEq(implementation, address(clonableWithInitData));
    assertEq(metadataCid, "cid");
    assertEq(requiresInitData, true);

    bytes32[] memory templateKeys = registry.getTemplateKeys(templateType);
    assertEq(templateKeys.length, 1);
    assertEq(templateKeys[0], "ClonableWithInitData");
  }

  function testFail__addTemplateType_templateType_doesnt_exists() public {}

  function testFail__addTemplateType_template_already_exists() public {}
}

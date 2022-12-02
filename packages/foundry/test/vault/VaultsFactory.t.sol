// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.15;

import { Test } from "forge-std/Test.sol";
import { VaultsFactory } from "../../src/vault/VaultsFactoryV2.sol";
import { EndorsementRegistry } from "../../src/vault/EndorsementRegistry.sol";
import { WithContractRegistry, IContractRegistry } from "../utils/WithContractRegistry.sol";
import { ClonableWithInitData } from "../utils/mocks/ClonableWithInitData.sol";
import { ClonableWithoutInitData } from "../utils/mocks/ClonableWithoutInitData.sol";

contract VaultsFactoryTest is Test, WithContractRegistry {
  VaultsFactory factory;
  EndorsementRegistry registry;

  bytes32 public constant ENDORSEMENT_REGISTRY = keccak256("EndorsementRegistry");

  address nonOwner = address(0x666);
  bytes32 templateType = "templateType";

  address[] addressArray;

  event TemplateTypeAdded(bytes32 templateType);
  event TemplateAdded(bytes32 templateType, bytes32 templateKey, address implementation);
  event TemplateUpdated(bytes32 templateType, bytes32 templateKey);

  function setUp() public {
    _adminPrepare();

    registry = new EndorsementRegistry(address(this));
    factory = new VaultsFactory(address(this), IContractRegistry(contractRegistry));

    contractRegistry.addContract(ENDORSEMENT_REGISTRY, address(registry), "1");
  }

  /*//////////////////////////////////////////////////////////////
                          ADD_TEMPLATE_TYPE
    //////////////////////////////////////////////////////////////*/
  function test__addTemplateType() public {
    vm.expectEmit(true, true, true, false, address(factory));
    emit TemplateTypeAdded(templateType);

    factory.addTemplateType(templateType);

    bytes32[] memory templateTypes = factory.getTemplateTypes();
    assertEq(templateTypes.length, 1);
    assertEq(templateTypes[0], templateType);
    assertTrue(factory.templateTypeExists(templateType));
  }

  function testFail__addTemplateType_nonOwner() public {
    vm.prank(nonOwner);
    factory.addTemplateType(templateType);
  }

  function testFail__addTemplateType_templateType_already_exists() public {
    factory.addTemplateType(templateType);

    vm.expectRevert(VaultsFactory.TemplateTypeExists.selector);
    factory.addTemplateType(templateType);
  }

  /*//////////////////////////////////////////////////////////////
                          ADD_TEMPLATE
    //////////////////////////////////////////////////////////////*/

  function test__addTemplate() public {
    factory.addTemplateType(templateType);
    ClonableWithInitData clonableWithInitData = new ClonableWithInitData();

    vm.expectEmit(true, true, true, false, address(factory));
    emit TemplateAdded(templateType, "ClonableWithInitData", address(clonableWithInitData));

    factory.addTemplate(templateType, "ClonableWithInitData", address(clonableWithInitData), "cid", true);

    (address implementation, string memory metadataCid, bool requiresInitData) = factory.templates(
      templateType,
      "ClonableWithInitData"
    );
    assertEq(implementation, address(clonableWithInitData));
    assertEq(metadataCid, "cid");
    assertEq(requiresInitData, true);

    bytes32[] memory templateKeys = factory.getTemplateKeys(templateType);
    assertEq(templateKeys.length, 1);
    assertEq(templateKeys[0], "ClonableWithInitData");
  }

  function testFail__addTemplateType_templateType_doesnt_exists() public {}

  function testFail__addTemplateType_template_already_exists() public {}

  /*//////////////////////////////////////////////////////////////
                          EDIT_TEMPLATE
    //////////////////////////////////////////////////////////////*/

  function test__editTemplate() public {}

  function testFail__editTemplate_nonOwner() public {}

  function testFail__editTemplate_templateType_doesnt_exists() public {}

  function testFail__editTemplate_template_doesnt_exists() public {}

  /*//////////////////////////////////////////////////////////////
                              DEPLOY
    //////////////////////////////////////////////////////////////*/

  function test__deploy() public {}

  function testFail__deploy_nonOwner() public {}

  function testFail__deploy_not_endorsed() public {}

  function testFail__deploy_init_failed() public {}
}

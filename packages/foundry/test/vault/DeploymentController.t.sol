// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;

import { Test } from "forge-std/Test.sol";
import { CloneRegistry } from "../../src/vault/CloneRegistry.sol";
import { CloneFactory } from "../../src/vault/CloneFactory.sol";
import { EndorsementRegistry } from "../../src/vault/EndorsementRegistry.sol";
import { TemplateRegistry, Template } from "../../src/vault/TemplateRegistry.sol";
import { ICloneRegistry } from "../../src/interfaces/vault/ICloneRegistry.sol";
import { ICloneFactory } from "../../src/interfaces/vault/ICloneFactory.sol";
import { IEndorsementRegistry } from "../../src/interfaces/vault/IEndorsementRegistry.sol";
import { ITemplateRegistry } from "../../src/interfaces/vault/ITemplateRegistry.sol";
import { IOwned } from "../../src/interfaces/IOwned.sol";
import { ClonableWithInitData } from "../utils/mocks/ClonableWithInitData.sol";
import { ClonableWithoutInitData } from "../utils/mocks/ClonableWithoutInitData.sol";
import { DeploymentController } from "../../src/vault/DeploymentController.sol";

contract DeploymentControllerTest is Test {
  ITemplateRegistry templateRegistry;
  IEndorsementRegistry endorsementRegistry;
  ICloneRegistry cloneRegistry;
  ICloneFactory factory;
  DeploymentController controller;

  ClonableWithInitData clonableWithInitDataImpl;
  ClonableWithoutInitData clonableWithoutInitDataImpl;

  address nonOwner = makeAddr("non owner");
  address registry = makeAddr("registry");

  bytes32 templateType = "templateType";
  bytes32 templateId = "ClonableWithoutInitData";
  string metadataCid = "cid";
  bytes4[8] requiredSigs;
  address[] addressArray;

  event TemplateTypeAdded(bytes32 templateType);
  event TemplateAdded(bytes32 templateType, bytes32 templateId, address implementation);
  event TemplateUpdated(bytes32 templateType, bytes32 templateId);

  event Deployment(address indexed clone);

  event CloneAdded(address clone);

  function setUp() public {
    deployDependencies(address(this));
    deployDeploymentController(address(this));
    nominateDependencyOwner(address(this), address(controller));
    controller.acceptDependencyOwnership();

    clonableWithInitDataImpl = new ClonableWithInitData();
    clonableWithoutInitDataImpl = new ClonableWithoutInitData();
  }

  /*//////////////////////////////////////////////////////////////
                              HELPER
    //////////////////////////////////////////////////////////////*/

  function deployDependencies(address owner) public {
    factory = ICloneFactory(address(new CloneFactory(owner)));
    cloneRegistry = ICloneRegistry(address(new CloneRegistry(owner)));
    templateRegistry = ITemplateRegistry(address(new TemplateRegistry(owner)));
    endorsementRegistry = IEndorsementRegistry(address(new EndorsementRegistry(owner)));
  }

  function nominateDependencyOwner(address owner, address newOwner) public {
    vm.startPrank(owner);
    factory.nominateNewOwner(newOwner);
    cloneRegistry.nominateNewOwner(newOwner);
    templateRegistry.nominateNewOwner(newOwner);
    endorsementRegistry.nominateNewOwner(newOwner);
    vm.stopPrank();
  }

  function deployDeploymentController(address owner) public {
    controller = new DeploymentController(owner, factory, cloneRegistry, templateRegistry, endorsementRegistry);
  }

  function addTemplate() public {
    controller.addTemplateType(templateType);

    controller.addTemplate(
      templateType,
      templateId,
      Template({
        implementation: address(clonableWithoutInitDataImpl),
        metadataCid: metadataCid,
        requiresInitData: false,
        registry: address(0x2222),
        requiredSigs: requiredSigs
      })
    );
    addressArray.push(address(clonableWithoutInitDataImpl));
    endorsementRegistry.toggleEndorsement(addressArray);
  }

  /*//////////////////////////////////////////////////////////////
                        INITIALIZATION
    //////////////////////////////////////////////////////////////*/

  function test__initilization() public {
    assertEq(address(controller.cloneFactory()), address(factory));
    assertEq(address(controller.cloneRegistry()), address(cloneRegistry));
    assertEq(address(controller.templateRegistry()), address(templateRegistry));
    assertEq(address(controller.endorsementRegistry()), address(endorsementRegistry));

    assertEq(controller.owner(), address(this));
    assertEq(factory.owner(), address(controller));
    assertEq(cloneRegistry.owner(), address(controller));
    assertEq(templateRegistry.owner(), address(controller));
    assertEq(endorsementRegistry.owner(), address(this));
  }

  /*//////////////////////////////////////////////////////////////
                        ADD_TEMPLATE_TYPE
    //////////////////////////////////////////////////////////////*/
  function test__addTemplateType() public {
    vm.expectEmit(true, true, true, false, address(templateRegistry));
    emit TemplateTypeAdded(templateType);

    controller.addTemplateType(templateType);

    bytes32[] memory templateTypes = controller.getTemplateTypes();
    assertEq(templateTypes.length, 1);
    assertEq(templateTypes[0], templateType);
    assertTrue(controller.templateTypeExists(templateType));
  }

  function testFail__addTemplateType_nonOwner() public {
    vm.prank(nonOwner);
    controller.addTemplateType(templateType);
  }

  function testFail__addTemplateType_templateType_already_exists() public {
    controller.addTemplateType(templateType);

    vm.expectRevert(TemplateRegistry.TemplateTypeExists.selector);
    controller.addTemplateType(templateType);
  }

  function testFail__addTemplateType_controller_is_not_dependency_owner() public {
    deployDependencies(address(this));
    nominateDependencyOwner(address(this), address(this));
    deployDeploymentController(address(this));

    controller.addTemplateType(templateType);
  }

  /*//////////////////////////////////////////////////////////////
                          ADD_TEMPLATE
    //////////////////////////////////////////////////////////////*/

  function test__addTemplate() public {
    controller.addTemplateType(templateType);
    ClonableWithInitData clonableWithInitData = new ClonableWithInitData();

    vm.expectEmit(true, true, true, false, address(templateRegistry));
    emit TemplateAdded(templateType, templateId, address(clonableWithInitData));

    controller.addTemplate(
      templateType,
      templateId,
      Template({
        implementation: address(clonableWithInitData),
        metadataCid: metadataCid,
        requiresInitData: true,
        registry: address(0x2222),
        requiredSigs: requiredSigs
      })
    );

    Template memory template = controller.getTemplate(templateType, templateId);
    assertEq(template.implementation, address(clonableWithInitData));
    assertEq(template.metadataCid, metadataCid);
    assertEq(template.requiresInitData, true);
    assertEq(template.registry, address(0x2222));
    assertEq(template.requiredSigs[0], requiredSigs[0]);
    assertEq(template.requiredSigs[7], requiredSigs[7]);

    bytes32[] memory templateIds = controller.getTemplateIds(templateType);
    assertEq(templateIds.length, 1);
    assertEq(templateIds[0], templateId);

    assertTrue(controller.templateExists(templateId));
  }

  function testFail__addTemplate_templateType_doesnt_exists() public {
    ClonableWithInitData clonableWithInitData = new ClonableWithInitData();

    controller.addTemplate(
      templateType,
      templateId,
      Template({
        implementation: address(clonableWithInitData),
        metadataCid: metadataCid,
        requiresInitData: true,
        registry: address(0x2222),
        requiredSigs: requiredSigs
      })
    );
  }

  function testFail__addTemplate_template_already_exists() public {
    controller.addTemplateType(templateType);
    ClonableWithInitData clonableWithInitData = new ClonableWithInitData();

    controller.addTemplate(
      templateType,
      templateId,
      Template({
        implementation: address(clonableWithInitData),
        metadataCid: metadataCid,
        requiresInitData: true,
        registry: address(0x2222),
        requiredSigs: requiredSigs
      })
    );

    controller.addTemplate(
      templateType,
      templateId,
      Template({
        implementation: address(clonableWithInitData),
        metadataCid: metadataCid,
        requiresInitData: true,
        registry: address(0x2222),
        requiredSigs: requiredSigs
      })
    );
  }

  function testFail__addTemplate_controller_is_not_dependency_owner() public {
    deployDependencies(address(this));
    nominateDependencyOwner(address(this), address(this));
    deployDeploymentController(address(this));

    controller.addTemplateType(templateType);
    controller.addTemplate(
      templateType,
      templateId,
      Template({
        implementation: address(clonableWithInitDataImpl),
        metadataCid: metadataCid,
        requiresInitData: true,
        registry: address(0x2222),
        requiredSigs: requiredSigs
      })
    );
  }

  /*//////////////////////////////////////////////////////////////
                              DEPLOY
    //////////////////////////////////////////////////////////////*/

  function test__deploy() public {
    addTemplate();

    vm.expectEmit(true, false, false, false, address(factory));
    emit Deployment(address(0x104fBc016F4bb334D775a19E8A6510109AC63E00));

    address clone = controller.deploy(templateType, templateId, "");

    assertEq(ClonableWithoutInitData(clone).val(), 10);
    assertTrue(controller.cloneExists(address(clone)));
  }

  function test__deployWithInitData() public {
    controller.addTemplateType(templateType);
    controller.addTemplate(
      templateType,
      "ClonableWithInitData",
      Template({
        implementation: address(clonableWithInitDataImpl),
        metadataCid: metadataCid,
        requiresInitData: true,
        registry: address(0x2222),
        requiredSigs: requiredSigs
      })
    );
    addressArray.push(address(clonableWithInitDataImpl));
    endorsementRegistry.toggleEndorsement(addressArray);

    bytes memory initData = abi.encodeCall(ClonableWithInitData.initialize, (100));

    vm.expectEmit(true, false, false, false, address(factory));
    emit Deployment(address(0x104fBc016F4bb334D775a19E8A6510109AC63E00));

    address clone = controller.deploy(templateType, "ClonableWithInitData", initData);

    assertEq(ClonableWithInitData(clone).val(), 100);
    assertTrue(controller.cloneExists(address(clone)));
  }

  function testFail__deploy_nonOwner() public {
    addTemplate();

    vm.prank(nonOwner);
    controller.deploy(templateType, templateId, "");
  }

  function testFail__deploy_init() public {
    controller.addTemplate(
      templateType,
      "ClonableWithInitData",
      Template({
        implementation: address(clonableWithoutInitDataImpl),
        metadataCid: metadataCid,
        requiresInitData: true,
        registry: registry,
        requiredSigs: requiredSigs
      })
    );

    // Call revert method on clone
    bytes memory initData = abi.encodeCall(ClonableWithoutInitData.fail, ());

    controller.deploy(templateType, "ClonableWithInitData", initData);
  }

  function testFail__deploy_not_endorsed() public {
    controller.addTemplate(
      templateType,
      "ClonableWithInitData",
      Template({
        implementation: address(clonableWithInitDataImpl),
        metadataCid: metadataCid,
        requiresInitData: true,
        registry: registry,
        requiredSigs: requiredSigs
      })
    );

    // Call revert method on clone
    bytes memory initData = abi.encodeCall(ClonableWithoutInitData.fail, ());

    controller.deploy(templateType, "ClonableWithInitData", initData);
  }

  function testFail__deploy_controller_is_not_dependency_owner() public {
    deployDependencies(address(this));
    nominateDependencyOwner(address(this), address(this));
    deployDeploymentController(address(this));
    addTemplate();

    controller.deploy(templateType, templateId, "");
  }

  /*//////////////////////////////////////////////////////////////
                        DEPENDENCY OWNERSHIP
    //////////////////////////////////////////////////////////////*/

  function test__nominateDependencyOwner() public {
    controller.nominateNewDependencyOwner(address(0x2222));
    assertEq(IOwned(address(controller.cloneFactory())).nominatedOwner(), address(0x2222));
    assertEq(IOwned(address(controller.cloneRegistry())).nominatedOwner(), address(0x2222));
    assertEq(IOwned(address(controller.templateRegistry())).nominatedOwner(), address(0x2222));
  }

  function testFail__nominateDependencyOwner_nonOwner() public {
    vm.prank(nonOwner);
    controller.nominateNewDependencyOwner(address(0x2222));
  }

  function test__acceptDependencyOwnership() public {
    deployDependencies(address(this));
    deployDeploymentController(address(this));
    nominateDependencyOwner(address(this), address(controller));

    controller.acceptDependencyOwnership();
    assertEq(IOwned(address(controller.cloneFactory())).owner(), address(controller));
    assertEq(IOwned(address(controller.cloneRegistry())).owner(), address(controller));
    assertEq(IOwned(address(controller.templateRegistry())).owner(), address(controller));
  }
}

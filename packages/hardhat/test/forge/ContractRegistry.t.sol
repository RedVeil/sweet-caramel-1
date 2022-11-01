// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";

import "../../../contracts/core/utils/ACLRegistry.sol";
import "../../../contracts/core/utils/ContractRegistry.sol";
import "../../../contracts/mocks/MockERC20.sol";

contract ContractRegistryTest is Test {
  // Contracts
  ACLRegistry internal aclRegistry;
  ContractRegistry internal contractRegistry;
  MockERC20 internal pop;
  MockERC20 internal popV2;

  // Roles
  bytes32 constant DAO_ROLE = keccak256("DAO");

  // Accounts
  address internal admin = makeAddr("admin");
  address internal other = makeAddr("other");

  function setUp() public {
    // Set up contracts
    aclRegistry = new ACLRegistry();
    contractRegistry = new ContractRegistry(aclRegistry);
    pop = new MockERC20("POP", "POP", 18);
    popV2 = new MockERC20("POPV2", "POPV2", 18);

    // Grant roles
    aclRegistry.grantRole(DAO_ROLE, admin);
  }
}

contract TestConstructor is ContractRegistryTest {
  function test__registersACLRegistryContract() public {
    assertEq(address(contractRegistry.aclRegistry()), address(aclRegistry));

    (address contractAddress, bytes32 version) = contractRegistry.contracts(keccak256("ACLRegistry"));
    assertEq(contractAddress, address(aclRegistry));
    assertEq(version, keccak256("1"));

    bytes32[] memory contractNames = contractRegistry.getContractNames();
    assertEq(contractNames.length, 1);
    assertEq(contractNames[0], keccak256("ACLRegistry"));
  }
}

contract TestAddContract is ContractRegistryTest {
  event ContractAdded(bytes32 _name, address _address, bytes32 _version);

  function test__registersNewContract() public {
    bytes32 name = keccak256("POP");
    bytes32 version = keccak256("1");

    vm.expectEmit(false, false, false, true);
    emit ContractAdded(name, address(pop), version);

    vm.prank(admin);
    contractRegistry.addContract(name, address(pop), version);

    (address contractAddress, bytes32 contractVersion) = contractRegistry.contracts(name);
    assertEq(contractAddress, address(pop));
    assertEq(contractVersion, version);

    bytes32[] memory contractNames = contractRegistry.getContractNames();
    assertEq(contractNames.length, 2);
    assertEq(contractNames[0], keccak256("ACLRegistry"));
    assertEq(contractNames[1], name);

    assertEq(contractRegistry.getContractIdFromAddress(address(pop)), name);
  }

  function test__revertsIfContractNameExists() public {
    bytes32 name = keccak256("POP");
    bytes32 version = keccak256("1");

    vm.startPrank(admin);
    contractRegistry.addContract(name, address(pop), version);

    vm.expectRevert("contract already exists");
    contractRegistry.addContract(name, address(pop), version);

    vm.stopPrank();
  }

  function test__revertsIfAddressExists() public {
    bytes32 name = keccak256("POP");
    bytes32 version = keccak256("1");

    vm.startPrank(admin);
    contractRegistry.addContract(name, address(pop), version);

    vm.expectRevert("contract address already in use");
    contractRegistry.addContract(keccak256("POP Fake Name"), address(pop), version);

    vm.stopPrank();
  }

  function test__revertsIfCallerNotDAO() public {
    bytes32 name = keccak256("POP");
    bytes32 version = keccak256("1");

    vm.prank(other);
    vm.expectRevert("you dont have the right role");
    contractRegistry.addContract(name, address(pop), version);
  }
}

contract TestUpdateContract is ContractRegistryTest {
  event ContractUpdated(bytes32 _name, address _address, bytes32 _version);

  function test__updatesExistingContract() public {
    bytes32 name = keccak256("POP");
    bytes32 v1 = keccak256("1");
    bytes32 v2 = keccak256("2");

    vm.prank(admin);
    contractRegistry.addContract(name, address(pop), v1);

    assertEq(contractRegistry.getContractIdFromAddress(address(pop)), name);

    vm.expectEmit(false, false, false, true);
    emit ContractUpdated(name, address(popV2), v2);

    vm.prank(admin);
    contractRegistry.updateContract(name, address(popV2), v2);

    (address contractAddress, bytes32 version) = contractRegistry.contracts(name);
    assertEq(contractAddress, address(popV2));
    assertEq(version, v2);

    bytes32[] memory contractNames = contractRegistry.getContractNames();
    assertEq(contractNames.length, 2);
    assertEq(contractNames[0], keccak256("ACLRegistry"));
    assertEq(contractNames[1], name);

    assertEq(contractRegistry.getContractIdFromAddress(address(popV2)), name);
    assertEq(contractRegistry.getContractIdFromAddress(address(pop)), bytes32(0));
  }

  function test__revertsIfContractDoesNotExist() public {
    bytes32 name = keccak256("POP");
    bytes32 version = keccak256("1");

    vm.expectRevert("contract doesnt exist");
    vm.prank(admin);
    contractRegistry.updateContract(name, address(pop), version);
  }

  function test__revertsIfNewAddressIsRegistered() public {
    bytes32 nameV1 = keccak256("POP");
    bytes32 nameV2 = keccak256("POP V2");
    bytes32 v1 = keccak256("1");
    bytes32 v2 = keccak256("2");

    vm.startPrank(admin);
    contractRegistry.addContract(nameV1, address(pop), v1);
    contractRegistry.addContract(nameV2, address(popV2), v1);

    vm.expectRevert("contract address already in use");
    contractRegistry.updateContract(nameV2, address(popV2), v2);
    vm.stopPrank();
  }

  function test__revertsIfNotCalledByDAO() public {
    bytes32 name = keccak256("POP");
    bytes32 v1 = keccak256("1");
    bytes32 v2 = keccak256("2");

    vm.prank(admin);
    contractRegistry.addContract(name, address(pop), v1);

    vm.expectRevert("you dont have the right role");
    vm.prank(other);
    contractRegistry.updateContract(name, address(popV2), v2);
  }
}

contract TestDeleteContract is ContractRegistryTest {
  event ContractDeleted(bytes32 _name);

  function test__deletesContract() public {
    bytes32 name = keccak256("POP");
    bytes32 v1 = keccak256("1");

    vm.prank(admin);
    contractRegistry.addContract(name, address(pop), v1);

    assertEq(contractRegistry.getContractIdFromAddress(address(pop)), name);

    vm.expectEmit(false, false, false, true);
    emit ContractDeleted(name);

    vm.prank(admin);
    contractRegistry.deleteContract(name, 1);

    (address contractAddress, bytes32 version) = contractRegistry.contracts(name);
    assertEq(contractAddress, address(0));
    assertEq(version, bytes32(0));

    bytes32[] memory contractNames = contractRegistry.getContractNames();
    assertEq(contractNames.length, 2);
    assertEq(contractNames[0], keccak256("ACLRegistry"));
    assertEq(contractNames[1], bytes32(0));

    assertEq(contractRegistry.getContractIdFromAddress(address(pop)), bytes32(0));
  }

  function test__revertsIfContractDoesNotExist() public {
    vm.expectRevert("contract doesnt exist");
    vm.prank(admin);
    contractRegistry.deleteContract(keccak256("DoesNotExist"), 1);
  }

  function test__revertsOnMismatchedIndex() public {
    bytes32 name = keccak256("POP");
    bytes32 v1 = keccak256("1");

    vm.prank(admin);
    contractRegistry.addContract(name, address(pop), v1);

    vm.expectRevert("this is not the contract you are looking for");
    vm.prank(admin);
    contractRegistry.deleteContract(name, 0);
  }

  function test__revertsIfNotCalledByDAO() public {
    bytes32 name = keccak256("POP");
    bytes32 v1 = keccak256("1");

    vm.prank(admin);
    contractRegistry.addContract(name, address(pop), v1);

    vm.expectRevert("you dont have the right role");
    vm.prank(other);
    contractRegistry.deleteContract(name, 1);
  }
}

contract TestGetContract is ContractRegistryTest {
  function test__getByName() public {
    assertEq(contractRegistry.getContract(keccak256("ACLRegistry")), address(aclRegistry));
  }

  function test__getByAddress() public {
    assertEq(contractRegistry.getContractIdFromAddress(address(aclRegistry)), keccak256("ACLRegistry"));
  }
}

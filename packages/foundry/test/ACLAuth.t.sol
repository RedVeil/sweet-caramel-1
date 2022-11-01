// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";

import "../../../contracts/core/utils/ACLRegistry.sol";
import "../../../contracts/core/utils/ContractRegistry.sol";
import "../../../contracts/test_helpers/ACLAuthHelper.sol";

contract ACLAuthTest is Test {
  // Contracts
  ACLRegistry internal aclRegistry;
  ContractRegistry internal contractRegistry;
  ACLAuthHelper internal helper;

  // Roles
  bytes32 constant KEEPER_ROLE = keccak256("Keeper");
  bytes32 constant DAO_ROLE = keccak256("DAO");
  bytes32 constant APPROVED_CONTRACT_ROLE = keccak256("ApprovedContract");

  // Permissions
  bytes32 constant TEST_PERMISSION = keccak256("Test Permission");

  // Accounts
  address internal keeper = makeAddr("keeper");
  address internal dao = makeAddr("dao");
  address internal hasTestPermission = makeAddr("address with test permission");
  address internal noRole = makeAddr("no role");
  address internal noPermissions = makeAddr("no permissions");
  address internal eoa = makeAddr("EOA");

  function setUp() public {
    // Set up contracts
    aclRegistry = new ACLRegistry();
    contractRegistry = new ContractRegistry(aclRegistry);
    helper = new ACLAuthHelper(contractRegistry);

    // Grant roles
    aclRegistry.grantRole(KEEPER_ROLE, keeper);
    aclRegistry.grantRole(DAO_ROLE, dao);

    // Grant permissions
    aclRegistry.grantPermission(TEST_PERMISSION, hasTestPermission);
  }
}

contract TestOnlyRoleModifier is ACLAuthTest {
  function test__revertsForCallersWithoutRole() public {
    vm.expectRevert("you dont have the right role");
    helper.onlyKeeperModifier();

    vm.expectRevert("you dont have the right role");
    helper.onlyDaoModifier();
  }

  function test__allowsCallersWithRole() public {
    vm.prank(keeper);
    helper.onlyKeeperModifier();

    vm.prank(dao);
    helper.onlyDaoModifier();
  }
}

contract TestHasRole is ACLAuthTest {
  function test__returnsTrueIfCallerAddressHasRole() public {
    vm.prank(keeper);
    assertEq(helper.hasKeeperRole(), true);
  }

  function test__returnsFalseIfCallerAddressDoesNotHaveRole() public {
    vm.prank(noRole);
    assertEq(helper.hasKeeperRole(), false);
  }
}

contract TestRequireRole is ACLAuthTest {
  function test__restrictsAccessToCallersWithRole() public {
    vm.expectRevert("you dont have the right role");
    helper.onlyKeeperRequireRole();

    vm.expectRevert("you dont have the right role");
    helper.onlyDaoRequireRole();
  }

  function test__allowsAccessFromCallersWithRole() public {
    vm.prank(keeper);
    helper.onlyKeeperRequireRole();

    vm.prank(dao);
    helper.onlyDaoRequireRole();
  }

  function test__withAccountArgument__restrictsAccessToCallersWithRole() public {
    vm.expectRevert("you dont have the right role");
    helper.requireKeeperRoleWithAddress(noRole);
  }

  function test__withAccountArgument__allowsAccessFromCallersWithRole() public {
    vm.prank(keeper);
    helper.requireKeeperRoleWithAddress(keeper);
  }
}

contract TestHasPermissionModifier is ACLAuthTest {
  function test__revertsForCallerWithoutPermission() public {
    vm.expectRevert("you dont have the right permissions");
    helper.onlyTestPermissionModifier();
  }

  function test__allowsCallerWithPermission() public {
    vm.prank(hasTestPermission);
    helper.onlyTestPermissionModifier();
  }
}

contract TestHasPermissionFunction is ACLAuthTest {
  function test__returnsTrueIfCallerHasPermission() public {
    vm.prank(hasTestPermission);
    assertEq(helper.hasTestPermission(), true);
  }

  function test__returnsFalseIfCallerDoesNotHavePermission() public {
    assertEq(helper.hasTestPermission(), false);
  }
}

contract TestRequirePermissionFunction is ACLAuthTest {
  function test__revertsForCallersWithoutPermission() public {
    vm.expectRevert("you dont have the right permissions");
    helper.onlyTestPermissionRequirePermission();
  }

  function test__allowsCallersWithPermission() public {
    vm.prank(hasTestPermission);
    helper.onlyTestPermissionRequirePermission();
  }

  function test__accountArgument__revertsForCallersWithoutPermission() public {
    vm.prank(hasTestPermission);
    vm.expectRevert("you dont have the right permissions");
    helper.requirePermissionWithAddress(noPermissions);
  }

  function test__accountArgument__allowsCallersWithPermission() public {
    vm.prank(hasTestPermission);
    helper.requirePermissionWithAddress(hasTestPermission);
  }
}

contract TestIsApprovedContractOrEOAModifier is ACLAuthTest {
  function test__revertsWhenCalledByContractWithoutApprovedContractRole() public {
    vm.expectRevert("Access denied for caller");
    helper.callOtherContractWithIsApprovedContractOrEOAModifier();
  }

  function test__allowsCallsFromApprovedContracts() public {
    aclRegistry.grantRole(APPROVED_CONTRACT_ROLE, address(helper));
    assertEq(aclRegistry.hasRole(APPROVED_CONTRACT_ROLE, address(helper)), true);
    helper.callOtherContractWithIsApprovedContractOrEOAModifier();
  }

  function test__allowsDirectCallsFromEOAs() public {
    vm.startPrank(eoa, eoa);
    helper.otherContract().testApprovedContractOrEOAModifier();
    vm.stopPrank();
  }
}

contract TestRequireApprovedContractOrEOAFunction is ACLAuthTest {
  function test__revertsWhenCalledByContractWithoutApprovedContractRole() public {
    vm.expectRevert("Access denied for caller");
    helper.callOtherContractWithRequireApprovedContractOrEOA();
  }

  function test__allowsCallsFromApprovedContracts() public {
    aclRegistry.grantRole(APPROVED_CONTRACT_ROLE, address(helper));
    assertEq(aclRegistry.hasRole(APPROVED_CONTRACT_ROLE, address(helper)), true);
    helper.callOtherContractWithRequireApprovedContractOrEOA();
  }

  function test__allowsDirectCallsFromEOAs() public {
    vm.startPrank(eoa, eoa);
    helper.otherContract().testApprovedContractOrEOARequire();
    vm.stopPrank();
  }

  function test__accountArgument__revertsWhenCalledByContractWithoutApprovedContractRole() public {
    vm.expectRevert("Access denied for caller");
    helper.callOtherContractWithRequireApprovedContractOrEOAWithAddress(address(aclRegistry));
  }

  function test__accountArgument__allowsCallsFromApprovedContracts() public {
    aclRegistry.grantRole(APPROVED_CONTRACT_ROLE, address(helper));
    assertEq(aclRegistry.hasRole(APPROVED_CONTRACT_ROLE, address(helper)), true);
    helper.callOtherContractWithRequireApprovedContractOrEOAWithAddress(address(helper));
  }

  function test__accountArgument__allowsDirectCallsFromEOAs() public {
    vm.startPrank(eoa, eoa);
    helper.otherContract().testApprovedContractOrEOARequireWithAddress(eoa);
  }
}

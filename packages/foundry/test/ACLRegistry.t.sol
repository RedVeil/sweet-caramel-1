// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";

import "../src/utils/ACLRegistry.sol";
import "./utils/ACLRegistryHelper.sol";

contract ACLRegistryTest is Test {
  // Contracts
  ACLRegistry internal aclRegistry;
  ACLRegistryHelper internal helper;

  // Roles
  bytes32 constant DEFAULT_ADMIN_ROLE = bytes32(0);
  bytes32 constant ROLE = keccak256("ROLE");
  bytes32 constant OTHER_ROLE = keccak256("OTHER_ROLE");

  // Permissions
  bytes32 constant PERMISSION = keccak256("PERMISSION");

  // Accounts
  address internal admin = makeAddr("admin");
  address internal authorized = makeAddr("authorized");
  address internal other = makeAddr("other");
  address internal otherAdmin = makeAddr("other admin");

  function setUp() public virtual {
    // Set up contracts
    vm.prank(admin);
    aclRegistry = new ACLRegistry();
    helper = new ACLRegistryHelper(aclRegistry);
  }
}

contract TestDefaultAdmin is ACLRegistryTest {
  function test__deployerHasDefaultAdminRole() public {
    assertEq(aclRegistry.hasRole(DEFAULT_ADMIN_ROLE, admin), true);
  }

  function test__defaultAdminIsRoleAdminforOtherRoles() public {
    assertEq(aclRegistry.getRoleAdmin(ROLE), DEFAULT_ADMIN_ROLE);
  }

  function test__defaultAdminRoleAdminIsSelf() public {
    assertEq(aclRegistry.getRoleAdmin(DEFAULT_ADMIN_ROLE), DEFAULT_ADMIN_ROLE);
  }
}

contract TestGrantRoles is ACLRegistryTest {
  function test__adminCanGrantRole() public {
    vm.prank(admin);
    aclRegistry.grantRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), true);
  }

  function test__revertsIfNonAdminAttemptsToGrantRole() public {
    vm.expectRevert("you dont have the required role");
    aclRegistry.grantRole(ROLE, other);
  }

  function test__roleCanBeGrantedMultipleTimes() public {
    vm.startPrank(admin);
    aclRegistry.grantRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), true);

    aclRegistry.grantRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), true);
    vm.stopPrank();
  }
}

contract TestRevokeRoles is ACLRegistryTest {
  event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

  function test__adminCanRevokeUngrantedRole() public {
    assertEq(aclRegistry.hasRole(ROLE, authorized), false);

    vm.prank(admin);
    aclRegistry.revokeRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), false);
  }

  function test__adminCanRevokeGrantedRole() public {
    vm.prank(admin);
    aclRegistry.grantRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), true);

    vm.expectEmit(true, true, true, false);
    emit RoleRevoked(ROLE, authorized, admin);

    vm.prank(admin);
    aclRegistry.revokeRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), false);
  }

  function test__nonAdminCannotRevokeRole() public {
    vm.prank(admin);
    aclRegistry.grantRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), true);

    vm.expectRevert("you dont have the required role");
    vm.prank(other);
    aclRegistry.revokeRole(ROLE, authorized);
  }

  function test__adminCanRevokeRoleMultipleTimes() public {
    vm.prank(admin);
    aclRegistry.grantRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), true);

    vm.startPrank(admin);
    aclRegistry.revokeRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), false);

    aclRegistry.revokeRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), false);
    vm.stopPrank();
  }
}

contract TestRenounceRoles is ACLRegistryTest {
  event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

  function test__adminCanRenounceUnownedRole() public {
    vm.prank(admin);
    aclRegistry.renounceRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), false);
  }

  function test__roleOwnerCanRenounceGrantedRole() public {
    vm.prank(admin);
    aclRegistry.grantRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), true);

    vm.expectEmit(true, true, true, false);
    emit RoleRevoked(ROLE, authorized, authorized);

    vm.prank(authorized);
    aclRegistry.renounceRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), false);
  }

  function test__revertsIfUnauthorizedCallerRenouncesRole() public {
    vm.prank(admin);
    aclRegistry.grantRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), true);

    vm.expectRevert("you cant renounce this role");
    vm.prank(other);
    aclRegistry.renounceRole(ROLE, authorized);
  }

  function test__roleOwnerCanRenounceMultipleTimes() public {
    vm.prank(admin);
    aclRegistry.grantRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), true);

    vm.startPrank(authorized);
    aclRegistry.renounceRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), false);

    aclRegistry.renounceRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), false);
    vm.stopPrank();
  }
}

contract TestRoleAdmin is ACLRegistryTest {
  event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);
  event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
  event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

  function test__adminCanSetRoleAdminForOtherRoles() public {
    vm.expectEmit(true, true, true, false);
    emit RoleAdminChanged(ROLE, DEFAULT_ADMIN_ROLE, OTHER_ROLE);

    vm.startPrank(admin);
    aclRegistry.setRoleAdmin(ROLE, OTHER_ROLE);
    aclRegistry.grantRole(OTHER_ROLE, otherAdmin);
    assertEq(aclRegistry.hasRole(OTHER_ROLE, otherAdmin), true);
    vm.stopPrank();
  }

  function test__newRoleAdminCanGrantRoles() public {
    vm.startPrank(admin);
    aclRegistry.setRoleAdmin(ROLE, OTHER_ROLE);
    aclRegistry.grantRole(OTHER_ROLE, otherAdmin);
    vm.stopPrank();

    vm.expectEmit(true, true, true, false);
    emit RoleGranted(ROLE, authorized, otherAdmin);

    vm.prank(otherAdmin);
    aclRegistry.grantRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), true);
  }

  function test__newRoleAdminCanRevokeRoles() public {
    vm.startPrank(admin);
    aclRegistry.setRoleAdmin(ROLE, OTHER_ROLE);
    aclRegistry.grantRole(OTHER_ROLE, otherAdmin);
    vm.stopPrank();

    vm.prank(otherAdmin);
    aclRegistry.grantRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), true);

    vm.expectEmit(true, true, true, false);
    emit RoleRevoked(ROLE, authorized, otherAdmin);

    vm.prank(otherAdmin);
    aclRegistry.revokeRole(ROLE, authorized);
    assertEq(aclRegistry.hasRole(ROLE, authorized), false);
  }

  function test__previousAdminCannotGrantRoles() public {
    vm.startPrank(admin);
    aclRegistry.setRoleAdmin(ROLE, OTHER_ROLE);
    aclRegistry.grantRole(OTHER_ROLE, otherAdmin);
    vm.stopPrank();

    vm.expectRevert("you dont have the required role");
    aclRegistry.grantRole(ROLE, authorized);
  }

  function test__previousAdminCannotRevokeRoles() public {
    vm.startPrank(admin);
    aclRegistry.setRoleAdmin(ROLE, OTHER_ROLE);
    aclRegistry.grantRole(OTHER_ROLE, otherAdmin);
    vm.stopPrank();

    vm.expectRevert("you dont have the required role");
    aclRegistry.revokeRole(ROLE, authorized);
  }
}

contract TestPermissions is ACLRegistryTest {
  function test__adminCanGrantPermission() public {
    assertEq(aclRegistry.hasPermission(PERMISSION, authorized), false);

    vm.prank(admin);
    aclRegistry.grantPermission(PERMISSION, authorized);

    assertEq(aclRegistry.hasPermission(PERMISSION, authorized), true);
  }

  function test__grantRevertsIfSenderIsNotAdmin() public {
    vm.expectRevert("only for admin");
    vm.prank(other);
    aclRegistry.grantPermission(PERMISSION, authorized);
  }

  function test__adminCanRevokePermission() public {
    assertEq(aclRegistry.hasPermission(PERMISSION, authorized), false);

    vm.prank(admin);
    aclRegistry.grantPermission(PERMISSION, authorized);

    assertEq(aclRegistry.hasPermission(PERMISSION, authorized), true);

    vm.prank(admin);
    aclRegistry.revokePermission(PERMISSION);

    assertEq(aclRegistry.hasPermission(PERMISSION, authorized), false);
  }

  function test__revokeRevertsIfSenderIsNotAdmin() public {
    vm.expectRevert("only for admin");
    vm.prank(other);
    aclRegistry.revokePermission(PERMISSION);
  }
}

contract TestOnlyRoleModifier is ACLRegistryTest {
  function test__doesNotRevertIfSenderHasRole() public {
    vm.prank(admin);
    aclRegistry.grantRole(ROLE, authorized);

    vm.prank(authorized);
    helper.senderProtected(ROLE);
  }

  function test__revertIfSenderDoesntHaveRoleOne() public {
    vm.prank(admin);
    aclRegistry.grantRole(ROLE, authorized);

    vm.prank(other);
    vm.expectRevert("you dont have the required role");
    helper.senderProtected(ROLE);
  }

  function test__revertIfSenderDoesntHaveRoleTwo() public {
    vm.prank(admin);
    aclRegistry.grantRole(ROLE, authorized);

    vm.prank(authorized);
    vm.expectRevert("you dont have the required role");
    helper.senderProtected(OTHER_ROLE);
  }
}

// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.15;

import { Test } from "forge-std/Test.sol";
import { CloneFactory } from "../../src/vault/CloneFactory.sol";
import { EndorsementRegistry } from "../../src/vault/EndorsementRegistry.sol";
import { WithContractRegistry, IContractRegistry } from "../utils/WithContractRegistry.sol";
import { ClonableWithInitData } from "../utils/mocks/ClonableWithInitData.sol";
import { ClonableWithoutInitData } from "../utils/mocks/ClonableWithoutInitData.sol";

contract CloneFactoryTest is Test, WithContractRegistry {
  CloneFactory factory;

  address nonOwner = address(0x666);
  bytes32 templateType = "templateType";

  address[] addressArray;

  function setUp() public {
    _adminPrepare();

    factory = new CloneFactory(address(this));
  }

  /*//////////////////////////////////////////////////////////////
                              DEPLOY
    //////////////////////////////////////////////////////////////*/

  function test__deploy() public {}

  function testFail__deploy_nonOwner() public {}

  function testFail__deploy_not_endorsed() public {}

  function testFail__deploy_init_failed() public {}
}

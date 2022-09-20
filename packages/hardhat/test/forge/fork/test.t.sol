// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../DeployScript.sol";

contract RandomTest is DeployScript {
  address constant ACL_REGISTRY = 0x8A41aAa4B467ea545DDDc5759cE3D35984F093f4;
  address randomAddress = address(1);

  function setUp() public {
    instantiateRegistryContracts(true);
  }

  function testSetup() public {
    address popMainnetForkAddress = getMainnetContractAddress("popStaking");
    assertEq(
      popMainnetForkAddress,
      address(0xeEE1d31297B042820349B03027aB3b13a9406184),
      "PopStaking address not equal"
    );
    assertEq(address(aclRegistry), ACL_REGISTRY, "extraction failed");
    grantRole("DAO", address(randomAddress));
  }
}

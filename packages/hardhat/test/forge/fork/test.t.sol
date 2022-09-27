// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../utils/AbstractTestScript.sol";

contract RandomTest is AbstractTestScript {
  address constant ACL_REGISTRY = 0x8A41aAa4B467ea545DDDc5759cE3D35984F093f4;
  address randomAddress = address(1);

  string[] public erc20KeyArray;
  string[] public stakingKeyArray;

  function setUp() public {
    instantiateOrDeployRegistryContracts(true);
  }

  function testSetup() public {
    address popMainnetForkAddress = getMainnetContractAddress("popStaking");
    assertEq(
      popMainnetForkAddress,
      address(0xeEE1d31297B042820349B03027aB3b13a9406184),
      "PopStaking address not equal"
    );
    assertEq(address(aclRegistry), ACL_REGISTRY, "extraction failed");
  }

  function testERC20AndStakingDeploy() public {
    erc20KeyArray.push("pop");
    instantiateOrDeployERC20(true, erc20KeyArray);
    assertEq(address(erc20Contracts["pop"]), address(IERC20(getMainnetContractAddress("pop"))), "failed");

    instantiateOrDeployERC20(false, erc20KeyArray);
    assertFalse(address(erc20Contracts["pop"]) == address(IERC20(getMainnetContractAddress("pop"))), "failed");
  }

  function testInstantiatePopButterAndDeployStaking() public {
    erc20KeyArray.push("pop");
    erc20KeyArray.push("butter");
    instantiateOrDeployERC20(true, erc20KeyArray);

    stakingKeyArray.push("butter");
    instantiateOrDeployStaking(false, stakingKeyArray);

    assertEq(
      address(stakingContracts["butter"].rewardsToken()),
      address(erc20Contracts["pop"]),
      "rewardtoken not properly set"
    );
    assertEq(
      address(stakingContracts["butter"].stakingToken()),
      address(erc20Contracts["butter"]),
      "rewardtoken not properly set"
    );
  }
}

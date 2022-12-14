// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import { Test } from "forge-std/Test.sol";

import { BeefyERC4626, SafeERC20, IERC20, Math, IBeefyVault, IBeefyBooster } from "../../../../src/vault/adapter/beefy/BeefyERC4626.sol";
import { BeefyTestConfigStorage, BeefyTestConfig } from "./BeefyTestConfigStorage.sol";
import { AbstractAdapterTest, ITestConfigStorage } from "../abstract/AbstractAdapterTest.sol";

contract BeefyAdapterTest is AbstractAdapterTest {
  address lpChef = 0x1083926054069AaD75d7238E9B809b0eF9d94e5B;

  // TODO update this fork -- maybe via config
  function setUp() public {
    uint256 forkId = vm.createSelectFork("https://polygon-mainnet.g.alchemy.com/v2/KsuP431uPWKR3KFb-K_0MT1jcwpUnjAg");
    vm.selectFork(forkId);

    // testConfigStorage = ITestConfigStorage(address(new BeefyTestConfigStorage()));

    // rewardsToken.push(rewardToken);

    // erc4626 = new BeefyERC4626();

    // rewardsClaimer = new RewardsClaimer();

    // bytes memory popERC4626InitData = abi.encode(
    //   asset,
    //   address(this),
    //   IStrategy(address(rewardsClaimer)),
    //   0,
    //   new bytes4[](8),
    //   abi.encode(feeRecipient)
    // );

    // vm.prank(factory);
    // erc4626.initialize(popERC4626InitData, address(0), abi.encode(beefyVault, beefyBooster, 0));

    // deal(address(asset), address(this), 1000 ether);
  }

  // NOTE: You MUST override this. Its should use exactly setup to override the previous setup
  function setUpViaConfig(bytes memory testConfig) public override {
    // setUpBasetest();
    // protocol specific setup();
  }

  /*//////////////////////////////////////////////////////////////
                          HELPER
    //////////////////////////////////////////////////////////////*/

  // NOTE: You MUST override these

  // Increase the pricePerShare of the external protocol
  // sometimes its enough to simply add assets, othertimes one also needs to call some functions before the external protocol reflects the change
  function increasePricePerShare(uint256 amount) public override {}

  // Check the balance of the external protocol held by the adapter
  // Most of the time this should be a simple `balanceOf` call to the external protocol but some might have different implementations
  function iouBalance() public view override returns (uint256) {
    // extProt.balanceOf(address(adapter))
  }

  // Verify that totalAssets returns the expected amount
  function verify_totalAssets() public override {}

  // Verify that convertToShares returns the expected amount
  function verify_convertToShares() public override {}

  // Verify that convertToAssets returns the expected amount
  function verify_convertToAssets() public override {}

  /*//////////////////////////////////////////////////////////////
                          INITIALIZATION
    //////////////////////////////////////////////////////////////*/

  function test__initialization() public override {
    uint8 len = uint8(testConfigStorage.getTestConfigLength());
    for (uint8 i; i < len; i++) {
      bytes memory testConfig = testConfigStorage.getTestConfig(i);
      if (i > 0) setUpViaConfig(testConfig);
      (address beefyVault, ) = abi.decode(testConfig, (address, uint256));

      // expect correct asset, owner, strategy, harvestCooldown, stratConfig and feesUpdatedAt
      // expect calling strategy init if it exists
      // expect correct name,symbol and decimals
    }
  }
}

// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.15;

import { Test } from "forge-std/Test.sol";

import { BeefyRewardsForwarder, SafeERC20, ERC20, Math, IBeefyVault, IBeefyBooster } from "../../../src/vault/wrapper/beefy/BeefyRewardsForwarder.sol";

contract BeefyERC4626Test is Test {
  using Math for uint256;

  BeefyRewardsForwarder erc4626;
  ERC20 asset = ERC20(0x8159462d255C1D24915CB51ec361F700174cD994);
  IBeefyVault beefyVault = IBeefyVault(0xF79BF908d0e6d8E7054375CD80dD33424B1980bf);
  IBeefyBooster beefyBooster = IBeefyBooster(0x69C28193185CFcd42D62690Db3767915872bC5EA);
  ERC20 rewardToken = ERC20(0xC3C7d422809852031b44ab29EEC9F1EfF2A58756);

  ERC20[] rewardsToken;

  address feeRecipient = address(0x4444);

  function setUp() public {
    uint256 forkId = vm.createSelectFork("https://polygon-mainnet.g.alchemy.com/v2/KsuP431uPWKR3KFb-K_0MT1jcwpUnjAg");
    vm.selectFork(forkId);

    rewardsToken.push(rewardToken);

    erc4626 = new BeefyRewardsForwarder();
    erc4626.initialize(asset, beefyVault, beefyBooster, 0, feeRecipient, rewardsToken);

    deal(address(asset), address(this), 1000 ether);
  }

  function test__deposit() public {
    asset.approve(address(erc4626), 1000 ether);
    erc4626.deposit(1000 ether, address(this));
    assertEq(erc4626.balanceOf(address(this)), 1000 ether);
    assertApproxEqRel(beefyBooster.balanceOf(address(erc4626)), 984669629869522176013, 1e14);
  }

  function test__forward_reward() public {
    asset.approve(address(erc4626), 1000 ether);
    erc4626.deposit(1000 ether, address(this));

    vm.warp(block.timestamp + 1000);

    erc4626.harvest();

    assertGt(rewardToken.balanceOf(feeRecipient), 0);
  }
}

// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.15;

import { Test } from "forge-std/Test.sol";

import { BeefyERC4626, SafeERC20, IERC20, Math, IBeefyVault, IBeefyBooster } from "../../../src/vault/adapter/beefy/BeefyERC4626.sol";
import { RewardsClaimer } from "../../../src/vault/strategy/RewardsClaimer.sol";
import { IStrategy } from "../../../src/interfaces/vault/IStrategy.sol";
import { IACLRegistry } from "../../../src/interfaces/IACLRegistry.sol";

// Addresses for Polygon
address constant ACL_ADMIN = 0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f;
address constant ACL_REGISTRY = 0x0C0991CB6e1c8456660A49aa200B71de6158b85C;
address constant CONTRACT_REGISTRY = 0x078927eF642319963a976008A7B1161059b7E77a;

contract BeefyERC4626Test is Test {
  using Math for uint256;

  BeefyERC4626 erc4626;
  RewardsClaimer rewardsClaimer;

  IERC20 asset = IERC20(0x8159462d255C1D24915CB51ec361F700174cD994);
  IBeefyVault beefyVault = IBeefyVault(0xF79BF908d0e6d8E7054375CD80dD33424B1980bf);
  IBeefyBooster beefyBooster = IBeefyBooster(0x69C28193185CFcd42D62690Db3767915872bC5EA);
  IERC20 rewardToken = IERC20(0xC3C7d422809852031b44ab29EEC9F1EfF2A58756);

  IERC20[] rewardsToken;

  address feeRecipient = address(0x4444);
  address admin = address(0x1111);
  address factory = address(0x2222);

  function setUp() public {
    uint256 forkId = vm.createSelectFork("https://polygon-mainnet.g.alchemy.com/v2/KsuP431uPWKR3KFb-K_0MT1jcwpUnjAg");
    vm.selectFork(forkId);

    rewardsToken.push(rewardToken);

    erc4626 = new BeefyERC4626();

    rewardsClaimer = new RewardsClaimer();

    bytes memory popERC4626InitData = abi.encode(
      asset,
      address(this),
      IStrategy(address(rewardsClaimer)),
      0,
      new bytes4[](8),
      abi.encode(feeRecipient)
    );

    vm.prank(factory);
    erc4626.initialize(popERC4626InitData, abi.encode(beefyVault, beefyBooster, 0));

    deal(address(asset), address(this), 1000 ether);
  }

  function test__deposit() public {
    asset.approve(address(erc4626), 1000 ether);
    erc4626.deposit(1000 ether, address(this));
    assertEq(erc4626.balanceOf(address(this)), 1000 ether);
    assertApproxEqRel(beefyBooster.balanceOf(address(erc4626)), 984133549971546269225, 1e14);
  }

  function test__forward_reward() public {
    asset.approve(address(erc4626), 1000 ether);
    erc4626.deposit(1000 ether, address(this));

    vm.warp(block.timestamp + 1000);

    erc4626.harvest();

    assertGt(rewardToken.balanceOf(feeRecipient), 0);
  }
}

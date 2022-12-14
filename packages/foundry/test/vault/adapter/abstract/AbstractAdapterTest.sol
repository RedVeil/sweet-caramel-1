// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import { Test } from "forge-std/Test.sol";

import { PropertyTest } from "./PropertyTest.prop.sol";
import { IAdapter } from "../../../../src/interfaces/vault/IAdapter.sol";
import { IStrategy } from "../../../../src/interfaces/vault/IStrategy.sol";
import { IERC20Upgradeable as IERC20, IERC20MetadataUpgradeable as IERC20Metadata } from "openzeppelin-contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import { ITestConfigStorage } from "./ITestConfigStorage.sol";
import { MockStrategy } from "../../../utils/mocks/MockStrategy.sol";

contract AbstractAdapterTest is PropertyTest {
  ITestConfigStorage testConfigStorage;

  string baseTestId; // Depends on external Protocol (e.g. Beefy,Yearn...)
  string testId; // baseTestId + Asset

  bytes32 constant PERMIT_TYPEHASH =
    keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

  address bob = address(1);
  address alice = address(2);
  address feeRecipient = address(0x4444);

  uint256 defaultAmount;
  uint256 raise;

  uint256 maxAssets;
  uint256 maxShares;

  IERC20 asset;
  IAdapter adapter;
  IStrategy strategy;

  function setUpBaseTest(
    IERC20 asset_,
    IAdapter adapter_,
    uint256 delta_,
    string memory baseTestId_
  ) public {
    // Setup PropertyTest
    _asset_ = address(asset_);
    _vault_ = address(adapter_);
    _delta_ = delta_;

    asset = asset_;
    adapter = adapter_;

    defaultAmount = 10**IERC20Metadata(address(adapter)).decimals();

    raise = defaultAmount * 10_000;
    maxAssets = defaultAmount * 1000;
    maxShares = (maxAssets * 4) / 3;

    baseTestId = baseTestId_;
    testId = string.concat(baseTestId_, IERC20Metadata(address(asset)).symbol());

    strategy = IStrategy(address(new MockStrategy()));
  }

  /*//////////////////////////////////////////////////////////////
                          HELPER
    //////////////////////////////////////////////////////////////*/

  // NOTE: You MUST override these

  // Its should use exactly setup to override the previous setup
  function overrideSetup(bytes memory testConfig) public virtual {
    // setUpBasetest();
    // protocol specific setup();
  }

  // Construct a new Adapter and set it to `adapter`
  function createAdapter() public virtual {}

  // Increase the pricePerShare of the external protocol
  // sometimes its enough to simply add assets, othertimes one also needs to call some functions before the external protocol reflects the change
  function increasePricePerShare(uint256 amount) public virtual {}

  // Check the balance of the external protocol held by the adapter
  // Most of the time this should be a simple `balanceOf` call to the external protocol but some might have different implementations
  function iouBalance() public view virtual returns (uint256) {
    // extProt.balanceOf(address(adapter))
  }

  // Verify that totalAssets returns the expected amount
  function verify_totalAssets() public virtual {}

  function verify_adapterInit() public virtual {}

  /*//////////////////////////////////////////////////////////////
                          INITIALIZATION
    //////////////////////////////////////////////////////////////*/

  event SelectorsVerified();
  event AdapterVerified();
  event StrategySetup();
  event Initialized(uint8 version);

  function test__initialization() public virtual {
    createAdapter();
    uint256 callTime = block.timestamp;

    vm.expectEmit(false, false, false, true, address(adapter));
    emit SelectorsVerified();
    vm.expectEmit(false, false, false, true, address(adapter));
    emit AdapterVerified();
    vm.expectEmit(false, false, false, true, address(adapter));
    emit StrategySetup();
    vm.expectEmit(false, false, false, true, address(adapter));
    emit Initialized(uint8(1));
    adapter.initialize(
      abi.encode(asset, address(this), strategy, 0, new bytes4[](8), ""),
      address(0),
      testConfigStorage.getTestConfig(0)
    );

    assertEq(adapter.owner(), address(this), "owner");
    assertEq(adapter.strategy(), address(strategy), "strategy");
    assertEq(adapter.harvestCooldown(), 0, "harvestCooldown");
    assertEq(adapter.strategyConfig(), "", "strategyConfig");
    assertEq(adapter.feesUpdatedAt(), callTime, "feesUpdatedAt");
    assertEq(IERC20Metadata(address(adapter)).decimals(), IERC20Metadata(address(asset)).decimals(), "decimals");

    verify_adapterInit();
  }

  /*//////////////////////////////////////////////////////////////
                          GENERAL VIEWS
    //////////////////////////////////////////////////////////////*/

  // OPTIONAL
  function test__rewardsTokens() public virtual {}

  function test__asset() public virtual {
    prop_asset();
  }

  function test__totalAssets() public virtual {
    prop_totalAssets();
    verify_totalAssets();
  }

  /*//////////////////////////////////////////////////////////////
                          CONVERSION VIEWS
    //////////////////////////////////////////////////////////////*/

  function test__convertToShares() public virtual {
    prop_convertToShares(bob, alice, defaultAmount);
  }

  function test__convertToAssets() public virtual {
    prop_convertToAssets(bob, alice, defaultAmount);
  }

  /*//////////////////////////////////////////////////////////////
                          MAX VIEWS
    //////////////////////////////////////////////////////////////*/

  // NOTE: These Are just prop tests currently. Override tests here if the adapter has unique max-functions which override AdapterBase.sol

  function test__maxDeposit() public virtual {
    prop_maxDeposit(bob);

    adapter.pause();
    assertEq(adapter.maxDeposit(bob), 0);
  }

  function test__maxMint() public virtual {
    prop_maxMint(bob);

    adapter.pause();
    assertEq(adapter.maxMint(bob), 0);
  }

  function test__maxWithdraw() public virtual {
    prop_maxWithdraw(bob);
  }

  function test__maxRedeem() public virtual {
    prop_maxRedeem(bob);
  }

  /*//////////////////////////////////////////////////////////////
                          PREVIEW VIEWS
    //////////////////////////////////////////////////////////////*/
  function test__previewDeposit(uint256 amount) public virtual {
    amount = bound(amount, 10, maxAssets);

    deal(address(asset), bob, maxAssets);
    vm.prank(bob);
    asset.approve(address(adapter), maxAssets);

    prop_previewDeposit(bob, bob, amount, testId);
  }

  function test__previewMint(uint256 amount) public virtual {
    amount = bound(amount, 10, maxShares);

    deal(address(asset), bob, maxAssets);
    vm.prank(bob);
    asset.approve(address(adapter), maxAssets);

    prop_previewMint(bob, bob, amount, testId);
  }

  function test__previewWithdraw(uint256 amount) public virtual {
    amount = bound(amount, 10, maxAssets);

    deal(address(asset), bob, maxAssets);
    vm.startPrank(bob);
    asset.approve(address(adapter), maxAssets);
    adapter.deposit(maxAssets, bob);
    vm.stopPrank();

    prop_previewWithdraw(bob, bob, bob, amount, testId);
  }

  function test__previewRedeem(uint256 amount) public virtual {
    amount = bound(amount, 10, maxShares);

    deal(address(asset), bob, maxAssets);
    vm.startPrank(bob);
    asset.approve(address(adapter), maxAssets);
    adapter.deposit(maxAssets, bob);
    vm.stopPrank();

    prop_previewRedeem(bob, bob, bob, amount, testId);
  }

  /*//////////////////////////////////////////////////////////////
                    DEPOSIT/MINT/WITHDRAW/REDEEM
    //////////////////////////////////////////////////////////////*/

  function test__deposit(uint256 amount) public virtual {
    uint8 len = uint8(testConfigStorage.getTestConfigLength());
    for (uint8 i; i < len; i++) {
      if (i > 0) overrideSetup(testConfigStorage.getTestConfig(i));

      amount = bound(amount, 10, maxAssets);

      (, uint256 receivedShares1) = prop_deposit(bob, bob, amount, testId);
      increasePricePerShare(raise);
      (, uint256 receivedShares2) = prop_deposit(bob, alice, amount, testId);

      // received1 should be greater than received2
      assertGe(receivedShares1, receivedShares2, string.concat("pps", testId));
    }
  }

  function test__mint(uint256 amount) public virtual {
    uint8 len = uint8(testConfigStorage.getTestConfigLength());
    for (uint8 i; i < len; i++) {
      if (i > 0) overrideSetup(testConfigStorage.getTestConfig(i));

      amount = bound(amount, 10, maxShares);

      (uint256 paidAssets1, ) = prop_mint(bob, bob, amount, testId);
      increasePricePerShare(raise);
      (uint256 paidAssets2, ) = prop_mint(bob, alice, amount, testId);

      // paidAssets2 should be greater than paidAssets1
      assertGe(paidAssets2, paidAssets1, string.concat("pps", testId));
    }
  }

  function test__withdraw(uint256 amount) public virtual {
    uint8 len = uint8(testConfigStorage.getTestConfigLength());
    for (uint8 i; i < len; i++) {
      if (i > 0) overrideSetup(testConfigStorage.getTestConfig(i));

      amount = bound(amount, 10, maxAssets);

      (uint256 paidShares1, ) = prop_withdraw(bob, bob, amount, testId);
      increasePricePerShare(raise);
      (uint256 paidShares2, ) = prop_withdraw(alice, bob, amount, testId);

      // paidShares1 should be greater than paidShares2
      assertGe(paidShares1, paidShares2, string.concat("pps", testId));
    }
  }

  function test__redeem(uint256 amount) public virtual {
    uint8 len = uint8(testConfigStorage.getTestConfigLength());
    for (uint8 i; i < len; i++) {
      if (i > 0) overrideSetup(testConfigStorage.getTestConfig(i));

      amount = bound(amount, 10, maxShares);

      (, uint256 receivedAssets1) = prop_redeem(bob, bob, amount, testId);
      increasePricePerShare(raise);
      (, uint256 receivedAssets2) = prop_redeem(alice, bob, amount, testId);

      // receivedAssets2 should be greater than receivedAssets1
      assertGe(receivedAssets2, receivedAssets1, string.concat("pps", testId));
    }
  }

  /*//////////////////////////////////////////////////////////////
                              PAUSE
    //////////////////////////////////////////////////////////////*/

  function test__pause() public virtual {
    deal(address(asset), bob, defaultAmount);

    vm.startPrank(bob);
    asset.approve(address(adapter), defaultAmount);
    adapter.deposit(defaultAmount, bob);
    vm.stopPrank();

    uint256 oldTotalAssets = adapter.totalAssets();
    uint256 oldTotalSupply = adapter.totalSupply();
    uint256 oldUserAssets = asset.balanceOf(bob);
    uint256 oldUserShares = adapter.balanceOf(bob);

    adapter.pause();

    // We simply withdraw into the adapter
    // TotalSupply and Assets dont change
    assertEq(oldTotalAssets, adapter.totalAssets(), "totalAssets");
    assertEq(oldTotalSupply, adapter.totalSupply(), "totalSupply");
    assertEq(asset.balanceOf(address(adapter)), oldTotalAssets, "asset balance");
    assertEq(iouBalance(), 0, "iou balance");

    vm.startPrank(bob);
    // Deposit and mint are paused
    vm.expectRevert("Pausable: paused");
    adapter.deposit(defaultAmount, bob);

    vm.expectRevert("Pausable: paused");
    adapter.mint(defaultAmount, bob);

    // Withdraw and Redeem dont revert
    adapter.withdraw(defaultAmount / 10, bob, bob);
    adapter.redeem(defaultAmount / 10, bob, bob);
  }

  function testFail__pause_nonOwner() public virtual {
    vm.prank(alice);
    adapter.pause();
  }

  function test__unpause() public virtual {
    deal(address(asset), bob, defaultAmount * 3);

    vm.startPrank(bob);
    asset.approve(address(adapter), defaultAmount * 3);
    adapter.deposit(defaultAmount, bob);
    vm.stopPrank();

    uint256 oldTotalAssets = adapter.totalAssets();
    uint256 oldTotalSupply = adapter.totalSupply();

    adapter.pause();
    adapter.unpause();

    // We simply deposit back into the external protocol
    // TotalSupply and Assets dont change
    assertEq(oldTotalAssets, adapter.totalAssets(), "totalAssets");
    assertEq(oldTotalSupply, adapter.totalSupply(), "totalSupply");
    assertEq(asset.balanceOf(address(adapter)), 0, "asset balance");
    assertGt(iouBalance(), 0, "iou balance");

    // Deposit and mint dont revert
    vm.startPrank(bob);
    adapter.deposit(defaultAmount, bob);
    adapter.mint(defaultAmount, bob);
  }

  function testFail__unpause_nonOwner() public virtual {
    adapter.pause();

    vm.prank(alice);
    adapter.unpause();
  }

  /*//////////////////////////////////////////////////////////////
                              HARVEST
    //////////////////////////////////////////////////////////////*/

  event StrategyExecuted();
  event Harvested();

  function test__harvest() public virtual {
    deal(address(asset), bob, defaultAmount);

    vm.startPrank(bob);
    asset.approve(address(adapter), defaultAmount);
    adapter.deposit(defaultAmount, bob);

    // Skip a year
    vm.warp(block.timestamp + 365.25 days);

    uint256 expectedFee = adapter.convertToShares((defaultAmount * 5e16) / 1e18);
    uint256 callTime = block.timestamp;

    vm.expectEmit(false, false, false, true, address(adapter));
    emit Harvested();
    vm.expectEmit(false, false, false, true, address(adapter));
    emit StrategyExecuted();
    adapter.harvest();

    assertEq(adapter.feesUpdatedAt(), callTime);
    assertEq(adapter.assetsCheckpoint(), defaultAmount);
    assertEq(adapter.totalSupply(), defaultAmount + expectedFee);
  }

  /*//////////////////////////////////////////////////////////////
                            MANAGEMENT FEE
    //////////////////////////////////////////////////////////////*/

  event ManagementFeeChanged(uint256 oldFee, uint256 newFee);

  function test__setManagementFee() public virtual {
    vm.expectEmit(false, false, false, true, address(adapter));
    emit ManagementFeeChanged(uint256(0), 1e16);
    adapter.setManagementFee(1e16);

    assertEq(adapter.managementFee(), 1e16);
  }

  function testFail__setManagementFee_nonOwner() public virtual {
    vm.prank(alice);
    adapter.setManagementFee(1e16);
  }

  function testFail__setManagementFee_invalid_fee() public virtual {
    adapter.setManagementFee(1e17);
  }

  /*//////////////////////////////////////////////////////////////
                              CLAIM
    //////////////////////////////////////////////////////////////*/

  // OPTIONAL
  function testClaim() public virtual {}

  /*//////////////////////////////////////////////////////////////
                              PERMIT
    //////////////////////////////////////////////////////////////*/

  function testPermit() public {
    uint256 privateKey = 0xBEEF;
    address owner = vm.addr(privateKey);

    (uint8 v, bytes32 r, bytes32 s) = vm.sign(
      privateKey,
      keccak256(
        abi.encodePacked(
          "\x19\x01",
          adapter.DOMAIN_SEPARATOR(),
          keccak256(abi.encode(PERMIT_TYPEHASH, owner, address(0xCAFE), 1e18, 0, block.timestamp))
        )
      )
    );

    adapter.permit(owner, address(0xCAFE), 1e18, block.timestamp, v, r, s);

    assertEq(adapter.allowance(owner, address(0xCAFE)), 1e18, "allowance");
    assertEq(adapter.nonces(owner), 1, "nonce");
  }
}

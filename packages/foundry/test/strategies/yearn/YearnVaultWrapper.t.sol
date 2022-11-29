// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.12;

import { TestFixture } from "./utils/TestFixture.sol";
import { StrategyParams } from "../../../src/interfaces/external/yearn/IVault.sol";
import { YearnWrapper } from "../../../src/vault/adapter/yearn/YearnWrapper.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "forge-std/console.sol";

// NOTE -- totalAssets, maxDeposit and maxMint are the only functions not tested

contract VaultWrapperTest is TestFixture {
  bytes32 constant PERMIT_TYPEHASH =
    keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

  function assertWithin(
    uint256 expected,
    uint256 actual,
    uint256 delta
  ) internal {
    if (expected > actual) {
      assertLe(expected - actual, delta);
    } else if (actual > expected) {
      assertLe(actual - expected, delta);
    } else {
      assertEq(expected, actual);
    }
  }

  function setUp() public override {
    uint256 forkId = vm.createSelectFork(vm.rpcUrl("FORKING_RPC_URL"), 15008113);
    vm.selectFork(forkId);

    super.setUp();
  }

  /*//////////////////////////////////////////////////////////////
                        GENERAL FUNCTIONS
  //////////////////////////////////////////////////////////////*/

  function test__setup_Wrapper() public {
    console.log("address of wrapper", address(vaultWrapper));
    assertTrue(address(0) != address(vaultWrapper));
    assertEq(vaultWrapper.asset(), address(want));
    assertEq(IERC20Metadata(address(vaultWrapper)).decimals(), IERC20Metadata(address(want)).decimals());
  }

  function test__ERC20_compatibility(uint256 _amount) public {
    vm.assume(_amount > minFuzzAmt && _amount < maxFuzzAmt);
    deal(address(want), whale, _amount);
    vm.startPrank(whale);
    want.approve(address(vaultWrapper), _amount);

    uint256 _shares = vaultWrapper.deposit(_amount, whale);
    assertEq(vaultWrapper.balanceOf(whale), _shares);
    vaultWrapper.transfer(user, _amount);
    vm.stopPrank();

    assertRelApproxEq(want.balanceOf(address(vault)), _amount, DELTA);
    assertEq(vaultWrapper.balanceOf(user), _shares);
    assertEq(vaultWrapper.balanceOf(whale), 0);
    assertEq(vaultWrapper.maxRedeem(user), _shares);
    assertEq(vault.balanceOf(address(vaultWrapper)), _shares);
    assertEq(vaultWrapper.totalSupply(), _shares);
  }

  /*//////////////////////////////////////////////////////////////
                        DEPOSIT / MINT
  //////////////////////////////////////////////////////////////*/

  function test__deposit(uint256 _amount) public {
    vm.assume(_amount > minFuzzAmt && _amount < maxFuzzAmt);
    deal(address(want), user, _amount);
    vm.startPrank(user);
    want.approve(address(vaultWrapper), _amount);

    uint256 _shares = vaultWrapper.deposit(_amount, user);
    vm.stopPrank();

    assertRelApproxEq(want.balanceOf(address(vault)), _amount, DELTA);
    assertEq(vaultWrapper.balanceOf(user), _shares);
    assertEq(vaultWrapper.maxRedeem(user), _shares);
    assertEq(vault.balanceOf(address(vaultWrapper)), _shares);
    assertEq(vaultWrapper.totalSupply(), _shares);
  }

  // function test__preview_deposit_equals_actual_shares(uint80 vaultIncrease, uint80 depositAmount) public {
  //   vm.assume(vaultIncrease > 1 ether);
  //   vm.assume(vaultIncrease < maxFuzzAmt);
  //   vm.assume(depositAmount > 1 ether);
  //   vm.assume(depositAmount < maxFuzzAmt);

  //   deal(address(want), address(user), depositAmount + 1);

  //   vm.startPrank(user);
  //   want.approve(address(vaultWrapper), depositAmount + 1);
  //   vaultWrapper.deposit(1, user);
  //   vm.stopPrank();

  //   deal(address(want), address(vault), vaultIncrease);
  //   uint256 expectedShares = vaultWrapper.previewDeposit(depositAmount);

  //   vm.prank(user);
  //   uint256 actualShares = vaultWrapper.deposit(depositAmount, user);

  //   assertWithin(actualShares, expectedShares, 1);
  // }

  function test__mint(uint256 _amount) public {
    vm.assume(_amount > minFuzzAmt && _amount < maxFuzzAmt);
    deal(address(want), user, vaultWrapper.previewMint(_amount));
    vm.startPrank(user);
    want.approve(address(vaultWrapper), _amount);

    vaultWrapper.mint(_amount, user);
    vm.stopPrank();

    assertRelApproxEq(want.balanceOf(address(vault)), _amount, DELTA);
    assertEq(vaultWrapper.balanceOf(user), _amount);
    assertEq(vaultWrapper.maxRedeem(user), _amount);
    assertEq(vault.balanceOf(address(vaultWrapper)), _amount);
    assertEq(vaultWrapper.totalSupply(), _amount);
  }

  // function test__preview_mint_equals_actual_assets(uint80 vaultIncrease, uint80 depositAmount) public {
  //   vm.assume(vaultIncrease > 1 ether);
  //   vm.assume(vaultIncrease < maxFuzzAmt);
  //   vm.assume(depositAmount > 1 ether);
  //   vm.assume(depositAmount < maxFuzzAmt);

  //   deal(address(want), address(user), 1);
  //   vm.startPrank(user);
  //   want.approve(address(vaultWrapper), 1);
  //   vaultWrapper.deposit(1, user);
  //   vm.stopPrank();

  //   deal(address(want), address(vault), vaultIncrease);

  //   uint256 expectedAssets = vaultWrapper.previewMint(depositAmount);
  //   deal(address(want), address(user), expectedAssets);

  //   vm.startPrank(user);
  //   want.approve(address(vaultWrapper), expectedAssets);
  //   uint256 actualAssets = vaultWrapper.mint(depositAmount, user);
  //   vm.stopPrank();

  //   assertWithin(actualAssets, expectedAssets, 1);
  // }

  /*//////////////////////////////////////////////////////////////
                        WITHDRAW / REDEEM
  //////////////////////////////////////////////////////////////*/

  function test__withdraw(uint256 _amount) public {
    vm.assume(_amount > minFuzzAmt && _amount < maxFuzzAmt);
    deal(address(want), user, _amount);

    uint256 balanceBefore = want.balanceOf(address(user));
    vm.startPrank(user);
    want.approve(address(vaultWrapper), _amount);
    uint256 _shares = vaultWrapper.deposit(_amount, user);
    vm.stopPrank();
    assertRelApproxEq(want.balanceOf(address(vault)), _amount, DELTA);
    assertEq(vaultWrapper.balanceOf(user), _shares);
    assertEq(vaultWrapper.maxRedeem(user), _shares);

    skip(3 minutes);

    uint256 withdrawAmount = vaultWrapper.maxWithdraw(user);
    vm.prank(user);
    vaultWrapper.withdraw(withdrawAmount, user, user);

    assertRelApproxEq(want.balanceOf(user), balanceBefore, DELTA);
    assertEq(vaultWrapper.balanceOf(user), 0);
  }

  // function test_preview_withdraw_equals_actual_withdraw(uint80 vaultIncrease, uint80 depositAmount) public {
  //   vm.assume(vaultIncrease > 1 ether);
  //   vm.assume(vaultIncrease < maxFuzzAmt);
  //   vm.assume(depositAmount > 1 ether);
  //   vm.assume(depositAmount < maxFuzzAmt);

  //   deal(address(want), address(user), depositAmount);
  //   vm.startPrank(user);
  //   want.approve(address(vaultWrapper), depositAmount);
  //   vaultWrapper.deposit(depositAmount, user);
  //   vm.stopPrank();

  //   deal(address(want), address(vault), vaultIncrease);

  //   uint256 expectedWithdraw = vaultWrapper.previewWithdraw(depositAmount);
  //   vm.prank(user);
  //   uint256 actualWithdraw = vaultWrapper.withdraw(depositAmount, user, user);

  //   assertWithin(expectedWithdraw, actualWithdraw, 100);
  // }

  function test__redeem(uint256 _amount) public {
    vm.assume(_amount > minFuzzAmt && _amount < maxFuzzAmt);
    deal(address(want), user, _amount);

    uint256 balanceBefore = want.balanceOf(address(user));
    vm.startPrank(user);
    want.approve(address(vaultWrapper), _amount);
    uint256 _shares = vaultWrapper.deposit(_amount, user);
    vm.stopPrank();
    assertRelApproxEq(want.balanceOf(address(vault)), _amount, DELTA);
    assertEq(vaultWrapper.balanceOf(user), _shares);
    assertEq(vaultWrapper.maxRedeem(user), _shares);

    skip(3 minutes);

    uint256 redeemAmount = vaultWrapper.maxRedeem(user);
    vm.prank(user);
    vaultWrapper.redeem(redeemAmount, user, user);

    assertRelApproxEq(want.balanceOf(user), balanceBefore, DELTA);
    assertEq(vaultWrapper.balanceOf(user), 0);
  }

  // function test_preview_redeem_equals_actual_redeem(uint80 vaultIncrease, uint80 depositAmount) public {
  //   vm.assume(vaultIncrease > 1 ether);
  //   vm.assume(vaultIncrease < maxFuzzAmt);
  //   vm.assume(depositAmount > 1 ether);
  //   vm.assume(depositAmount < maxFuzzAmt);

  //   deal(address(want), address(user), depositAmount);
  //   vm.startPrank(user);
  //   want.approve(address(vaultWrapper), depositAmount);
  //   uint256 shares = vaultWrapper.deposit(depositAmount, user);
  //   vm.stopPrank();

  //   deal(address(want), address(vault), vaultIncrease);

  //   uint256 expectedRedeem = vaultWrapper.previewRedeem(shares);
  //   vm.prank(user);
  //   uint256 actualRedeem = vaultWrapper.redeem(shares, user, user);

  //   assertWithin(expectedRedeem, actualRedeem, 100);
  // }

  /*//////////////////////////////////////////////////////////////
                        STRATEGY OPERATIONS
  //////////////////////////////////////////////////////////////*/

  function test__strategy_operation(uint256 _amount) public {
    vm.assume(_amount > minFuzzAmt && _amount < maxFuzzAmt);
    deal(address(want), user, _amount);

    uint256 balanceBefore = want.balanceOf(address(user));
    vm.startPrank(user);
    want.approve(address(vaultWrapper), _amount);
    uint256 _shares = vaultWrapper.deposit(_amount, user);
    vm.stopPrank();
    assertRelApproxEq(want.balanceOf(address(vault)), _amount, DELTA);
    assertEq(vaultWrapper.balanceOf(user), _shares);
    assertEq(vaultWrapper.maxRedeem(user), _shares);

    skip(3 minutes);

    vm.prank(strategist);
    strategy.harvest();
    assertRelApproxEq(strategy.estimatedTotalAssets(), _amount, DELTA);

    uint256 withdrawAmount = vaultWrapper.maxWithdraw(user);
    vm.prank(user);
    vaultWrapper.withdraw(withdrawAmount, user, user);

    assertRelApproxEq(want.balanceOf(user), balanceBefore, DELTA);
    assertEq(vaultWrapper.balanceOf(user), 0);
  }

  function test__profitable__harvest(uint256 _amount) public {
    vm.assume(_amount > minFuzzAmt && _amount < maxFuzzAmt);
    deal(address(want), user, _amount);
    deal(address(want), address(this), _amount / 2);

    // Deposit to the vault
    vm.startPrank(user);
    want.approve(address(vaultWrapper), _amount);
    uint256 _shares = vaultWrapper.deposit(_amount, user);
    vm.stopPrank();
    assertEq(vaultWrapper.balanceOf(user), _shares);
    assertRelApproxEq(want.balanceOf(address(vault)), _amount, DELTA);

    uint256 beforePps = vault.pricePerShare();
    console.log("beforePps", beforePps);
    uint256 wrapperPps = vaultWrapper.convertToAssets(1) * 10**vault.decimals();
    console.log("yTokenPps", wrapperPps);
    assertEq(beforePps, wrapperPps);

    // Harvest 1: Send funds through the strategy
    skip(1);
    vm.prank(strategist);
    strategy.harvest();
    assertRelApproxEq(strategy.estimatedTotalAssets(), _amount, DELTA);

    // Airdrop gains to the strategy
    want.transfer(address(strategy), want.balanceOf(address(this)));

    // Harvest 2: Realize profit
    skip(1);
    vm.prank(strategist);
    strategy.harvest();
    skip(6 hours);

    // check profits
    uint256 profit = want.balanceOf(address(vault));
    assertGt(want.balanceOf(address(strategy)) + profit, _amount);
    assertGt(vault.pricePerShare(), beforePps);
  }

  /*//////////////////////////////////////////////////////////////
                              PERMIT
  //////////////////////////////////////////////////////////////*/

  function test__permit() public {
    uint256 privateKey = 0xBEEF;
    address owner = vm.addr(privateKey);
    YearnWrapper wrapper = YearnWrapper(address(vaultWrapper));

    (uint8 v, bytes32 r, bytes32 s) = vm.sign(
      privateKey,
      keccak256(
        abi.encodePacked(
          "\x19\x01",
          wrapper.DOMAIN_SEPARATOR(),
          keccak256(abi.encode(PERMIT_TYPEHASH, owner, address(0xCAFE), 1e18, 0, block.timestamp))
        )
      )
    );

    wrapper.permit(owner, address(0xCAFE), 1e18, block.timestamp, v, r, s);

    assertEq(wrapper.allowance(owner, address(0xCAFE)), 1e18);
    assertEq(wrapper.nonces(owner), 1);
  }
}

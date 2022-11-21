// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.12;

import { ExtendedDSTest } from "./utils/ExtendedDSTest.sol";
import { StrategyParams, IVault } from "../../../src/interfaces/external/yearn/IVault.sol";
import { VaultAPI } from "../../../src/interfaces/external/yearn/IVaultAPI.sol";
import { YearnWrapper } from "../../../src/vault/wrapper/yearn/YearnWrapper.sol";
import { IERC20Metadata } from "openzeppelin-contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { IERC20 } from "openzeppelin-contracts/token/ERC20/IERC20.sol";

import "forge-std/console.sol";

// NOTE -- totalAssets, maxDeposit and maxMint are the only functions not tested

contract VaultWrapperAbstractTest is ExtendedDSTest {
  bytes32 constant PERMIT_TYPEHASH =
    keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

  VaultAPI public vault;
  YearnWrapper public vaultWrapper;
  IERC20 public want;

  address public user = address(1);
  address public whale = address(2);

  uint256 public minFuzzAmt;
  // @dev maximum amount of want tokens deposited based on @maxDollarNotional
  uint256 public maxFuzzAmt;

  uint256 public DELTA = 1;

  function setUpTest(
    address _want,
    address _vault,
    uint256 maxFuzzTokenAmount
  ) public {
    uint256 forkId = vm.createSelectFork(vm.rpcUrl("FORKING_RPC_URL"), 16018408);
    vm.selectFork(forkId);

    want = IERC20(_want);
    vault = VaultAPI(_vault);
    vaultWrapper = new YearnWrapper();

    vm.label(address(want), "want");
    vm.label(address(vault), "vault");
    vm.label(address(vaultWrapper), "vaultWrapper");
    vm.label(address(this), "this");

    vaultWrapper.initialize(vault);

    minFuzzAmt = 10**vault.decimals() / 10;
    maxFuzzAmt = maxFuzzTokenAmount * 10**vault.decimals();
  }

  /*//////////////////////////////////////////////////////////////
                        GENERAL FUNCTIONS
  //////////////////////////////////////////////////////////////*/

  function test__setup_Wrapper() public {
    console.log("address of wrapper", address(vaultWrapper));
    assertTrue(address(0) != address(vaultWrapper));
    assertEq(vaultWrapper.asset(), address(want));
    assertEq(vaultWrapper.asset(), vault.token());
    assertEq(IERC20Metadata(address(vaultWrapper)).decimals(), IERC20Metadata(address(want)).decimals());
  }

  function test__ERC20_compatibility(uint256 _amount) public {
    vm.assume(_amount > minFuzzAmt && _amount < maxFuzzAmt);
    deal(address(want), whale, _amount);
    vm.startPrank(whale);
    want.approve(address(vaultWrapper), _amount);

    uint256 _shares = vaultWrapper.deposit(_amount, whale);
    assertEq(vaultWrapper.balanceOf(whale), _shares);
    vaultWrapper.transfer(user, _shares);
    vm.stopPrank();

    assertEq(vaultWrapper.balanceOf(user), _shares);
    assertEq(vaultWrapper.balanceOf(whale), 0);
    assertEq(vault.balanceOf(address(vaultWrapper)), _shares);
    assertEq(vaultWrapper.totalSupply(), _shares);
  }

  /*//////////////////////////////////////////////////////////////
                        DEPOSIT / MINT
  //////////////////////////////////////////////////////////////*/

  function test__preview_deposit_equals_actual_shares(uint80 depositAmount) public {
    vm.assume(depositAmount > minFuzzAmt && depositAmount < maxFuzzAmt);

    deal(address(want), address(user), depositAmount);
    uint256 expectedShares = vaultWrapper.previewDeposit(depositAmount);

    vm.startPrank(user);
    want.approve(address(vaultWrapper), depositAmount);
    uint256 actualShares = vaultWrapper.deposit(depositAmount, user);
    vm.stopPrank();

    assertRelApproxEq(actualShares, expectedShares, DELTA);
    assertRelApproxEq(vaultWrapper.totalAssets(), depositAmount, DELTA);
    assertEq(vaultWrapper.balanceOf(user), actualShares);
    assertEq(vaultWrapper.maxRedeem(user), actualShares);
    assertEq(vault.balanceOf(address(vaultWrapper)), actualShares);
    assertEq(vaultWrapper.totalSupply(), actualShares);
  }

  function test__preview_mint_equals_actual_assets(uint80 depositAmount) public {
    vm.assume(depositAmount > minFuzzAmt && depositAmount < maxFuzzAmt);

    uint256 expectedAssets = vaultWrapper.previewMint(depositAmount);
    deal(address(want), address(user), expectedAssets);

    vm.startPrank(user);
    want.approve(address(vaultWrapper), expectedAssets);
    uint256 actualAssets = vaultWrapper.mint(depositAmount, user);
    vm.stopPrank();

    assertRelApproxEq(actualAssets, expectedAssets, DELTA);
    assertRelApproxEq(vaultWrapper.totalAssets(), expectedAssets, DELTA);
    assertRelApproxEq(vaultWrapper.balanceOf(user), depositAmount, DELTA);
    assertRelApproxEq(vaultWrapper.maxRedeem(user), depositAmount, DELTA);
    assertRelApproxEq(vault.balanceOf(address(vaultWrapper)), depositAmount, DELTA);
    assertRelApproxEq(vaultWrapper.totalSupply(), depositAmount, DELTA);
  }

  /*//////////////////////////////////////////////////////////////
                        WITHDRAW / REDEEM
  //////////////////////////////////////////////////////////////*/

  function test_preview_withdraw_equals_actual_withdraw(uint80 depositAmount) public {
    vm.assume(depositAmount > minFuzzAmt && depositAmount < maxFuzzAmt);

    deal(address(want), address(user), depositAmount);
    vm.startPrank(user);
    want.approve(address(vaultWrapper), depositAmount);
    vaultWrapper.deposit(depositAmount, user);
    vm.stopPrank();

    // NOTE USING DEPOSIT AMOUNT WILL MAKE THIS FAIL SINCE THE CALCULATION IS OFF BY 1 WEI
    // we could solve this by using the maxWithdraw value internally when amount is too high but that would mean that we adjust user inputs without their knowledge
    uint256 maxWithdraw = vaultWrapper.maxWithdraw(user);
    uint256 expectedWithdraw = vaultWrapper.previewWithdraw(maxWithdraw);

    vm.prank(user);
    uint256 actualWithdraw = vaultWrapper.withdraw(maxWithdraw, user, user);

    assertWithin(expectedWithdraw, actualWithdraw, 2);
    assertEq(vaultWrapper.balanceOf(user), 0);
    assertEq(vaultWrapper.totalSupply(), 0);
    assertEq(vaultWrapper.totalAssets(), 0);
  }

  function test_preview_redeem_equals_actual_redeem(uint80 depositAmount) public {
    vm.assume(depositAmount > minFuzzAmt && depositAmount < maxFuzzAmt);

    deal(address(want), address(user), depositAmount);
    vm.startPrank(user);
    want.approve(address(vaultWrapper), depositAmount);
    uint256 shares = vaultWrapper.deposit(depositAmount, user);
    vm.stopPrank();

    uint256 expectedRedeem = vaultWrapper.previewRedeem(shares);

    vm.prank(user);
    uint256 actualRedeem = vaultWrapper.redeem(shares, user, user);

    assertRelApproxEq(expectedRedeem, actualRedeem, DELTA);
    assertEq(vaultWrapper.balanceOf(user), 0);
    assertEq(vaultWrapper.totalSupply(), 0);
    assertEq(vaultWrapper.totalAssets(), 0);
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

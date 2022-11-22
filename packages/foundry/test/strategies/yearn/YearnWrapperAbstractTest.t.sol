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

contract YearnWrapperAbstractTest is ExtendedDSTest {
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

  uint256 public DELTA = 2e14; // 2 BPS DELTA

  bool internal isTesting;

  modifier runTest() {
    if (!isTesting) return;
    _;
  }

  function setUpTest(
    address _want,
    address _vault,
    uint256 maxFuzzTokenAmount
  ) public {
    uint256 forkId = vm.createSelectFork(vm.rpcUrl("FORKING_RPC_URL"), 16018408);
    vm.selectFork(forkId);

    isTesting = true;

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

  function test__setup_Wrapper() public runTest {
    console.log("address of wrapper", address(vaultWrapper));
    assertTrue(address(0) != address(vaultWrapper));
    assertEq(vaultWrapper.asset(), address(want));
    assertEq(vaultWrapper.asset(), vault.token());
    assertEq(IERC20Metadata(address(vaultWrapper)).decimals(), IERC20Metadata(address(want)).decimals());
  }

  function test__ERC20_compatibility(uint256 _amount) public runTest {
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

  function test__preview_deposit_equals_actual_shares(uint80 depositAmount) public runTest {
    vm.assume(depositAmount > minFuzzAmt && depositAmount < maxFuzzAmt);

    deal(address(want), address(user), depositAmount);
    uint256 expectedShares = vaultWrapper.previewDeposit(depositAmount);

    vm.startPrank(user);
    want.approve(address(vaultWrapper), depositAmount);
    uint256 actualShares = vaultWrapper.deposit(depositAmount, user);
    vm.stopPrank();

    assertApproxGteRel(actualShares, expectedShares, DELTA);
    assertApproxLteRel(vaultWrapper.totalAssets(), depositAmount, DELTA);
    assertEq(vaultWrapper.balanceOf(user), actualShares);
    assertEq(vaultWrapper.maxRedeem(user), actualShares);
    assertEq(vault.balanceOf(address(vaultWrapper)), actualShares);
    assertEq(vaultWrapper.totalSupply(), actualShares);
  }

  function test__preview_mint_equals_actual_assets(uint80 depositAmount) public runTest {
    vm.assume(depositAmount > minFuzzAmt && depositAmount < maxFuzzAmt);

    uint256 expectedAssets = vaultWrapper.previewMint(depositAmount);
    deal(address(want), address(user), expectedAssets);

    vm.startPrank(user);
    want.approve(address(vaultWrapper), expectedAssets);
    uint256 actualAssets = vaultWrapper.mint(depositAmount, user);
    vm.stopPrank();

    assertApproxGteRel(actualAssets, expectedAssets, DELTA);
    assertApproxLteRel(vaultWrapper.totalAssets(), expectedAssets, DELTA);
    assertApproxLteRel(vaultWrapper.balanceOf(user), depositAmount, DELTA);
    assertApproxLteRel(vaultWrapper.maxRedeem(user), depositAmount, DELTA);
    assertApproxLteRel(vault.balanceOf(address(vaultWrapper)), depositAmount, DELTA);
    assertApproxLteRel(vaultWrapper.totalSupply(), depositAmount, DELTA);
  }

  /*//////////////////////////////////////////////////////////////
                        WITHDRAW / REDEEM
  //////////////////////////////////////////////////////////////*/

  function test_preview_withdraw_equals_actual_withdraw(uint80 depositAmount) public runTest {
    vm.assume(depositAmount > minFuzzAmt && depositAmount < maxFuzzAmt);

    deal(address(want), address(user), depositAmount);
    vm.startPrank(user);
    want.approve(address(vaultWrapper), depositAmount);
    uint256 shares = vaultWrapper.deposit(depositAmount, user);
    vm.stopPrank();

    uint256 withdrawAmount = (depositAmount * 10) / 100;

    uint256 expectedShares = vaultWrapper.previewWithdraw(withdrawAmount);

    vm.prank(user);
    uint256 actualShares = vaultWrapper.withdraw(withdrawAmount, user, user);

    uint256 absDelta = 10**vault.decimals() / 10_000;
    assertApproxLteRel(actualShares, expectedShares, DELTA);
    assertApproxEqAbs(vaultWrapper.balanceOf(user), shares - expectedShares, absDelta);
    assertApproxEqAbs(vaultWrapper.totalSupply(), shares - expectedShares, absDelta);
    assertApproxEqRel(vaultWrapper.totalAssets(), depositAmount - withdrawAmount, DELTA);
  }

  function test_preview_redeem_equals_actual_redeem(uint80 depositAmount) public runTest {
    vm.assume(depositAmount > minFuzzAmt && depositAmount < maxFuzzAmt);

    deal(address(want), address(user), depositAmount);
    vm.startPrank(user);
    want.approve(address(vaultWrapper), depositAmount);
    uint256 shares = vaultWrapper.deposit(depositAmount, user);
    vm.stopPrank();

    uint256 expectedRedeem = vaultWrapper.previewRedeem(shares);

    vm.prank(user);
    uint256 actualRedeem = vaultWrapper.redeem(shares, user, user);

    assertApproxLteRel(actualRedeem, expectedRedeem, DELTA);
    assertEq(vaultWrapper.balanceOf(user), 0);
    assertEq(vaultWrapper.totalSupply(), 0);
    assertEq(vaultWrapper.totalAssets(), 0);
  }

  /*//////////////////////////////////////////////////////////////
                              PERMIT
  //////////////////////////////////////////////////////////////*/

  function test__permit() public runTest {
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

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import { Test } from "forge-std/Test.sol";

import { YearnAdapter, SafeERC20, IERC20, IERC20Metadata, Math, VaultAPI, IYearnRegistry } from "../../../../src/vault/adapter/yearn/YearnAdapter.sol";
import { YearnTestConfigStorage, YearnTestConfig } from "./YearnTestConfigStorage.sol";
import { AbstractAdapterTest, ITestConfigStorage, IAdapter } from "../abstract/AbstractAdapterTest.sol";

contract YearnAdapterTest is AbstractAdapterTest {
  using Math for uint256;

  VaultAPI yearnVault;

  // TODO update this fork -- maybe via config
  function setUp() public {
    uint256 forkId = vm.createSelectFork("https://eth-mainnet.alchemyapi.io/v2/KsuP431uPWKR3KFb-K_0MT1jcwpUnjAg");
    vm.selectFork(forkId);

    testConfigStorage = ITestConfigStorage(address(new YearnTestConfigStorage()));

    _setUpTest(testConfigStorage.getTestConfig(0));
  }

  function overrideSetup(bytes memory testConfig) public override {
    _setUpTest(testConfig);
  }

  function _setUpTest(bytes memory testConfig) internal {
    createAdapter();

    address _asset = abi.decode(testConfig, (address));

    setUpBaseTest(IERC20(_asset), adapter, 0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804, 10, "Yearn ", false);

    yearnVault = VaultAPI(IYearnRegistry(externalRegistry).latestVault(_asset));

    vm.label(address(yearnVault), "yearnVault");
    vm.label(address(asset), "asset");
    vm.label(address(this), "test");

    adapter.initialize(abi.encode(asset, address(this), address(0), 0, sigs, ""), externalRegistry, "");
  }

  /*//////////////////////////////////////////////////////////////
                          HELPER
    //////////////////////////////////////////////////////////////*/

  function createAdapter() public override {
    adapter = IAdapter(address(new YearnAdapter()));
  }

  function increasePricePerShare(uint256 amount) public override {
    deal(address(asset), address(yearnVault), asset.balanceOf(address(yearnVault)) + amount);
  }

  function iouBalance() public view override returns (uint256) {
    return yearnVault.balanceOf(address(adapter));
  }

  // Verify that totalAssets returns the expected amount
  function verify_totalAssets() public override {
    // Make sure totalAssets isnt 0
    deal(address(asset), bob, defaultAmount);
    vm.startPrank(bob);
    asset.approve(address(adapter), defaultAmount);
    adapter.deposit(defaultAmount, bob);
    vm.stopPrank();

    assertEq(
      adapter.totalAssets(),
      adapter.convertToAssets(adapter.totalSupply()),
      string.concat("totalSupply converted != totalAssets", baseTestId)
    );
    assertEq(
      adapter.totalAssets(),
      iouBalance().mulDiv(
        yearnVault.pricePerShare(),
        10 ** IERC20Metadata(address(adapter)).decimals(),
        Math.Rounding.Up
      ),
      string.concat("totalAssets != yearn assets", baseTestId)
    );
  }

  function test__harvest() public override {
    // Without a keeper harvesting `_calculateLockedProfit()` drops to 0 after some point unlocking some further assets.
    // Realisticly this would never happens since the keeper wouldnt forfeit their fees.
    // Since the end value is slightly different in the base test i overwrote this test.
    // Everything else in this test remains as usual.
    uint256 additionalAsset = 50;

    _mintFor(defaultAmount, bob);

    vm.prank(bob);
    adapter.deposit(defaultAmount, bob);

    // Skip a year
    vm.warp(block.timestamp + 365.25 days);

    uint256 expectedFee = adapter.convertToShares((defaultAmount * 5e16) / 1e18);
    uint256 callTime = block.timestamp;

    if (address(strategy) != address(0)) {
      vm.expectEmit(false, false, false, true, address(adapter));
      emit StrategyExecuted();
    }
    vm.expectEmit(false, false, false, true, address(adapter));
    emit Harvested();

    adapter.harvest();

    assertEq(adapter.feesUpdatedAt(), callTime, "feesUpdatedAt");
    assertApproxEqAbs(adapter.assetsCheckpoint(), defaultAmount + additionalAsset, _delta_, "assetsCheckpoint");
    assertApproxEqAbs(adapter.totalSupply(), defaultAmount + expectedFee, _delta_, "totalSupply");
  }

  /*//////////////////////////////////////////////////////////////
                          INITIALIZATION
    //////////////////////////////////////////////////////////////*/

  function verify_adapterInit() public override {
    assertEq(adapter.asset(), yearnVault.token(), "asset");
    assertEq(
      IERC20Metadata(address(adapter)).name(),
      string.concat("Popcorn Yearn", IERC20Metadata(address(asset)).name(), " Adapter"),
      "name"
    );
    assertEq(
      IERC20Metadata(address(adapter)).symbol(),
      string.concat("popY-", IERC20Metadata(address(asset)).symbol()),
      "symbol"
    );

    assertEq(asset.allowance(address(adapter), address(yearnVault)), type(uint256).max, "allowance");
  }
}

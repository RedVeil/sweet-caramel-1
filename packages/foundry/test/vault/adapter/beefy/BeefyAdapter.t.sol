// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import { Test } from "forge-std/Test.sol";

import { BeefyERC4626, SafeERC20, IERC20, IERC20Metadata, Math, IBeefyVault, IBeefyBooster } from "../../../../src/vault/adapter/beefy/BeefyERC4626.sol";
import { BeefyTestConfigStorage, BeefyTestConfig } from "./BeefyTestConfigStorage.sol";
import { AbstractAdapterTest, ITestConfigStorage, IAdapter } from "../abstract/AbstractAdapterTest.sol";

contract BeefyAdapterTest is AbstractAdapterTest {
  using Math for uint256;

  IBeefyBooster beefyBooster;
  IBeefyVault beefyVault;

  // TODO update this fork -- maybe via config
  function setUp() public {
    uint256 forkId = vm.createSelectFork("https://polygon-mainnet.g.alchemy.com/v2/KsuP431uPWKR3KFb-K_0MT1jcwpUnjAg");
    vm.selectFork(forkId);

    testConfigStorage = ITestConfigStorage(address(new BeefyTestConfigStorage()));

    _setUpTest(testConfigStorage.getTestConfig(0));
  }

  // NOTE: You MUST override this. Its should use exactly setup to override the previous setup
  function overrideSetup(bytes memory testConfig) public override {
    _setUpTest(testConfig);
  }

  function _setUpTest(bytes memory testConfig) internal {
    createAdapter();

    (address _beefyVault, address _beefyBooster, ) = abi.decode(testConfig, (address, address, uint256));
    beefyVault = IBeefyVault(_beefyVault);
    beefyBooster = IBeefyBooster(_beefyBooster);

    setUpBaseTest(IERC20(IBeefyVault(beefyVault).want()), adapter, 10, "Beefy ");

    adapter.initialize(abi.encode(asset, address(this), strategy, 0, new bytes4[](8), ""), address(0), testConfig);
  }

  /*//////////////////////////////////////////////////////////////
                          HELPER
    //////////////////////////////////////////////////////////////*/

  function createAdapter() public override {
    adapter = IAdapter(address(new BeefyERC4626()));
  }

  function increasePricePerShare(uint256 amount) public override {
    deal(address(asset), address(beefyVault), amount);
    beefyVault.earn();
  }

  function iouBalance() public view override returns (uint256) {
    return beefyVault.balanceOf(address(adapter));
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
      iouBalance().mulDiv(beefyVault.balance(), beefyVault.totalSupply(), Math.Rounding.Up),
      string.concat("totalAssets != beefy assets", baseTestId)
    );
  }

  /*//////////////////////////////////////////////////////////////
                          INITIALIZATION
    //////////////////////////////////////////////////////////////*/

  function verify_adapterInit() public override {
    assertEq(adapter.asset(), beefyVault.want(), "asset");
    assertEq(
      IERC20Metadata(address(adapter)).name(),
      string.concat("Popcorn Beefy", IERC20Metadata(address(asset)).name(), " Adapter"),
      "name"
    );
    assertEq(
      IERC20Metadata(address(adapter)).symbol(),
      string.concat("popB-", IERC20Metadata(address(asset)).symbol()),
      "symbol"
    );

    assertEq(asset.allowance(address(adapter), address(beefyVault)), type(uint256).max, "allowance");
  }
}

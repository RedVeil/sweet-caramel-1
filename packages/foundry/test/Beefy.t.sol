// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;
import { Test } from "forge-std/Test.sol";
import { Math } from "openzeppelin-contracts/utils/math/Math.sol";
import { MockERC20 } from "./utils/mocks/MockERC20.sol";
import { SafeCastLib } from "solmate/utils/SafeCastLib.sol";
import { BeefyAdapter, SafeERC20, IERC20, IERC20Metadata, IBeefyVault, IBeefyBooster, IBeefyBalanceCheck } from "../src/vault/adapter/beefy/BeefyAdapter.sol";
import { PermissionRegistry } from "../src/vault/PermissionRegistry.sol";
import { Permission } from "../src/interfaces/vault/IPermissionRegistry.sol";

contract BeefyOnlyTest is Test {
  PermissionRegistry permissionRegistry;

  IBeefyVault beefyVault = IBeefyVault(address(0x66F5263d51174bab17Ac2bda31E51F5bcF05a69A));

  BeefyAdapter adapter;
  IERC20 asset = IERC20(address(0xdf0770dF86a8034b3EFEf0A1Bb3c889B8332FF56));

  bytes4[8] sigs;

  function setPermission(
    address target,
    bool endorsed,
    bool rejected
  ) public {
    address[] memory targets = new address[](1);
    Permission[] memory permissions = new Permission[](1);
    targets[0] = target;
    permissions[0] = Permission(endorsed, rejected);
    permissionRegistry.setPermissions(targets, permissions);
  }

  function _mintFor(uint256 amount, address receiver) internal {
    deal(address(asset), receiver, amount);

    vm.prank(receiver);
    asset.approve(address(adapter), amount);
  }

  function setUp() public {
    uint256 forkId = vm.createSelectFork(vm.rpcUrl("mainnet"));
    vm.selectFork(forkId);

    // Endorse Beefy Vault
    permissionRegistry = new PermissionRegistry(address(this));
    setPermission(address(beefyVault), true, false);

    adapter = new BeefyAdapter();
    adapter.initialize(
      abi.encode(asset, address(this), address(0), 0, sigs, ""),
      address(permissionRegistry),
      abi.encode(address(beefyVault), address(0))
    );
  }

  function test__deposit() public {
    _mintFor(12, address(this));
    adapter.deposit(2, address(this));
    emit log_named_uint("beefy in adapter", beefyVault.balanceOf(address(adapter)));
    emit log_named_uint("totalAssets", adapter.totalAssets());
    emit log_named_uint("totalSupply", adapter.totalSupply());
    emit log_named_uint("convert", adapter.convertToAssets(adapter.totalSupply()));
    emit log_named_uint("assets", asset.balanceOf(address(this)));

    adapter.deposit(10, address(this));
    emit log_named_uint("beefy in adapter", beefyVault.balanceOf(address(adapter)));
    emit log_named_uint("totalAssets", adapter.totalAssets());
    emit log_named_uint("totalSupply", adapter.totalSupply());
    emit log_named_uint("convert", adapter.convertToAssets(adapter.totalSupply()));
    emit log_named_uint("assets", asset.balanceOf(address(this)));

    adapter.withdraw(9, address(this), address(this));
    emit log_named_uint("beefy in adapter", beefyVault.balanceOf(address(adapter)));
    emit log_named_uint("totalAssets", adapter.totalAssets());
    emit log_named_uint("totalSupply", adapter.totalSupply());
    emit log_named_uint("convert", adapter.convertToAssets(adapter.totalSupply()));
    emit log_named_uint("assets", asset.balanceOf(address(this)));
  }

  function test__deposit2() public {
    _mintFor(12, address(this));
    adapter.deposit(2, address(this));
    emit log_named_uint("beefy in adapter", beefyVault.balanceOf(address(adapter)));
    emit log_named_uint("totalAssets", adapter.totalAssets());
    emit log_named_uint("totalSupply", adapter.totalSupply());
    emit log_named_uint("convert", adapter.convertToAssets(adapter.totalSupply()));
    emit log_named_uint("assets", asset.balanceOf(address(this)));

    adapter.deposit(10, address(this));
    emit log_named_uint("beefy in adapter", beefyVault.balanceOf(address(adapter)));
    emit log_named_uint("totalAssets", adapter.totalAssets());
    emit log_named_uint("totalSupply", adapter.totalSupply());
    emit log_named_uint("convert", adapter.convertToAssets(adapter.totalSupply()));
    emit log_named_uint("assets", asset.balanceOf(address(this)));

    adapter.redeem(adapter.totalSupply(), address(this), address(this));
    emit log_named_uint("beefy in adapter", beefyVault.balanceOf(address(adapter)));
    emit log_named_uint("totalAssets", adapter.totalAssets());
    emit log_named_uint("totalSupply", adapter.totalSupply());
    emit log_named_uint("convert", adapter.convertToAssets(adapter.totalSupply()));
    emit log_named_uint("assets", asset.balanceOf(address(this)));
  }
}

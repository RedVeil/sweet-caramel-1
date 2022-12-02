// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Test } from "forge-std/Test.sol";
import { KeeperConfig } from "../../src/utils/KeeperIncentivized.sol";
import "../../src/vault/Vault.sol";
import "../../src/vault/adapter/yearn/YearnWrapper.sol";
import "../../src/interfaces/IContractRegistry.sol";
import "../../src/interfaces/IACLRegistry.sol";
import "../../src/interfaces/vault/IYearnVaultWrapper.sol";
import "../../src/interfaces/vault/IERC4626.sol";

address constant CRV_3CRYPTO = 0xc4AD29ba4B3c580e6D59105FFf484999997675Ff;
address constant YEARN_REGISTRY = 0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804;
address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;
address constant ACL_REGISTRY = 0x8A41aAa4B467ea545DDDc5759cE3D35984F093f4;
address constant ACL_ADMIN = 0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f;
address constant YEARN_VAULT = 0xE537B5cc158EB71037D4125BDD7538421981E6AA;

contract User {
  Vault internal vault;
  IERC20 internal asset;

  constructor(Vault _vault, IERC20 _asset) {
    vault = _vault;
    asset = _asset;
  }

  function approve(address spender, uint256 amount) public {
    asset.approve(spender, amount);
  }

  function deposit(uint256 assets) public returns (uint256) {
    return vault.deposit(assets);
  }

  function redeem(uint256 shares) public returns (uint256) {
    return vault.redeem(shares);
  }

  function withdraw(uint256 assets) public returns (uint256) {
    return vault.withdraw(assets);
  }
}

contract VaultIntegrationTest is Test {
  ERC20 internal asset;
  User internal alice;
  User internal bob;
  Vault internal vault;
  YearnWrapper internal yearnWrapper;
  address internal feeRecipient = address(0x1234);

  uint256 constant DEPOSIT_FEE = 50 * 1e14;
  uint256 constant WITHDRAWAL_FEE = 50 * 1e14;
  uint256 constant MANAGEMENT_FEE = 200 * 1e14;
  uint256 constant PERFORMANCE_FEE = 2000 * 1e14;

  uint256 constant MAX_DEPOSIT = 995_939 ether;

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

  function setUp() public {
    uint256 forkId = vm.createSelectFork(vm.rpcUrl("FORKING_RPC_URL"), 15008113);
    vm.selectFork(forkId);

    asset = ERC20(CRV_3CRYPTO);
    vm.label(CRV_3CRYPTO, "asset");

    address yearnWrapperAddress = address(new YearnWrapper());
    vm.label(yearnWrapperAddress, "yearnWrapper");

    yearnWrapper = YearnWrapper(yearnWrapperAddress);
    yearnWrapper.initialize(VaultAPI(YEARN_VAULT));
    vm.label(YEARN_VAULT, "yearnVault");

    address vaultAddress = address(new Vault());
    vm.label(vaultAddress, "vault");

    vault = Vault(vaultAddress);
    vault.initialize(
      asset,
      IERC4626(yearnWrapperAddress),
      IContractRegistry(CONTRACT_REGISTRY),
      Vault.FeeStructure({ deposit: 0, withdrawal: 0, management: 0, performance: 0 }),
      feeRecipient,
      KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1, keeperPayout: 9 })
    );

    alice = new User(vault, asset);
    bob = new User(vault, asset);

    vm.startPrank(ACL_ADMIN);
    IACLRegistry(ACL_REGISTRY).grantRole(keccak256("VaultsController"), ACL_ADMIN);
    IACLRegistry(ACL_REGISTRY).grantRole(keccak256("ApprovedContract"), address(alice));
    IACLRegistry(ACL_REGISTRY).grantRole(keccak256("ApprovedContract"), address(bob));
    vm.stopPrank();

    deal(address(asset), address(alice), 10_000_000 ether);
    deal(address(asset), address(bob), 10_000_000 ether);

    alice.approve(vaultAddress, type(uint256).max);
    bob.approve(vaultAddress, type(uint256).max);

    vm.prank(ACL_ADMIN);
    IContractRegistry(CONTRACT_REGISTRY).addContract(keccak256("FeeRecipient"), feeRecipient, keccak256("1"));
  }

  function test_assets_per_share_constant_after_deposit(uint80 amount) public {
    vm.assume(amount > 1e16);
    vm.assume(amount < MAX_DEPOSIT / 4);
    vm.assume(amount % 4 == 0);
    uint256 tolerance = 100;

    // First deposit
    alice.deposit(amount);

    uint256 valueBefore = vault.convertToAssets(1 ether);
    alice.deposit(amount);
    uint256 valueAfter = vault.convertToAssets(1 ether);

    assertWithin(valueAfter, valueBefore, tolerance);

    valueBefore = vault.convertToAssets(1 ether);
    alice.deposit(amount);
    valueAfter = vault.convertToAssets(1 ether);

    assertWithin(valueAfter, valueBefore, tolerance);

    valueBefore = vault.convertToAssets(1 ether);
    alice.deposit(amount);
    valueAfter = vault.convertToAssets(1 ether);

    assertWithin(valueAfter, valueBefore, tolerance);
  }

  function test_preview_deposit_equals_actual_shares(uint8 steps, uint80 totalAmount) public {
    vm.assume(steps > 1);
    vm.assume(steps < 50);
    vm.assume(totalAmount > 2 ether);
    vm.assume(totalAmount < MAX_DEPOSIT);

    uint256 totalVaultIncrease = totalAmount / 2;
    uint256 totalDepositAmount = totalAmount / 2;

    deal(address(asset), address(this), totalVaultIncrease);

    uint256 depositAmount = totalDepositAmount / steps;
    uint256 vaultIncrease = totalVaultIncrease / steps;

    for (uint256 i; i < steps; ++i) {
      _assert_preview_deposit_equals_actual_shares(depositAmount, vaultIncrease);
    }
  }

  function _assert_preview_deposit_equals_actual_shares(uint256 depositAmount, uint256 vaultIncrease) internal {
    asset.transfer(yearnWrapper.vault(), vaultIncrease);

    uint256 expectedShares = vault.previewDeposit(depositAmount);
    uint256 actualShares = alice.deposit(depositAmount);

    assertWithin(actualShares, expectedShares, 1);
  }

  function test_preview_redeem_equals_actual_redeem(
    uint8 steps,
    uint16 timeJump,
    uint80 totalAmount
  ) public {
    vm.assume(steps > 1);
    vm.assume(steps < 50);
    vm.assume(totalAmount > 2 ether);
    vm.assume(totalAmount < MAX_DEPOSIT);

    uint256 totalVaultIncrease = totalAmount / 2;
    uint256 totalDepositAmount = totalAmount / 2;

    deal(address(asset), address(this), totalVaultIncrease);

    uint256 depositAmount = totalDepositAmount / steps;
    uint256 vaultIncrease = totalVaultIncrease / steps;

    for (uint256 i; i < steps; ++i) {
      _assert_preview_redeem_equals_actual_redeem(timeJump, depositAmount, vaultIncrease);
    }
  }

  function _assert_preview_redeem_equals_actual_redeem(
    uint16 timeJump,
    uint256 depositAmount,
    uint256 vaultIncrease
  ) internal {
    asset.transfer(yearnWrapper.vault(), vaultIncrease);

    uint256 shares = alice.deposit(depositAmount);
    vm.warp(block.timestamp + timeJump);
    uint256 expectedRedeem = vault.previewRedeem(shares);
    uint256 actualRedeem = alice.redeem(shares);

    assertWithin(expectedRedeem, actualRedeem, 100);

    vm.warp(block.timestamp + timeJump);
  }

  function test_assets_per_share_increase(
    uint8 steps,
    uint16 timeJump,
    uint80 totalAmount
  ) public {
    vm.assume(steps > 1);
    vm.assume(steps < 50);
    vm.assume(totalAmount > 10 ether);
    vm.assume(totalAmount < MAX_DEPOSIT);

    deal(address(asset), address(this), totalAmount);

    uint256 vaultIncrease = totalAmount / steps;

    alice.deposit(1 ether);
    vm.warp(block.timestamp + timeJump);

    for (uint256 i; i < steps; ++i) {
      _assert_assets_per_share_increase(timeJump, vaultIncrease);
    }
  }

  function _assert_assets_per_share_increase(uint16 timeJump, uint256 vaultIncrease) internal {
    uint256 prevAssetsPerShare = vault.convertToAssets(1 ether);

    asset.transfer(yearnWrapper.vault(), vaultIncrease);

    assertGe(vault.convertToAssets(1 ether), prevAssetsPerShare);

    vm.warp(block.timestamp + timeJump);
  }

  function test_assets_hwm_increase(
    uint8 steps,
    uint16 timeJump,
    uint80 totalAmount
  ) public {
    vm.assume(steps > 1);
    vm.assume(steps < 50);
    vm.assume(totalAmount > 10 ether);
    vm.assume(totalAmount < MAX_DEPOSIT);

    uint256 totalVaultIncrease = totalAmount / 2;
    uint256 totalDepositAmount = totalAmount / 2;

    deal(address(asset), address(this), totalVaultIncrease);

    uint256 depositAmount = totalDepositAmount / steps;
    uint256 withdrawalAmount = depositAmount;
    uint256 vaultIncrease = totalVaultIncrease / steps;

    alice.deposit(1 ether);
    vm.warp(block.timestamp + timeJump);

    for (uint256 i; i < steps; ++i) {
      _assert_assets_hwm_increase(timeJump, depositAmount, vaultIncrease);
    }
    for (uint256 i; i < steps; ++i) {
      _assert_hwm_constant_or_increases(timeJump, withdrawalAmount);
    }
  }

  function _assert_assets_hwm_increase(
    uint16 timeJump,
    uint256 depositAmount,
    uint256 vaultIncrease
  ) internal {
    uint256 prevHWM = vault.vaultShareHWM();
    uint256 prevAssets = vault.assetsCheckpoint();

    asset.transfer(yearnWrapper.vault(), vaultIncrease);
    alice.deposit(depositAmount);

    assertGe(vault.vaultShareHWM(), prevHWM);
    assertGe(vault.assetsCheckpoint(), prevAssets);

    vm.warp(block.timestamp + timeJump);
  }

  function _assert_hwm_constant_or_increases(uint16 timeJump, uint256 withdrawalAmount) internal {
    uint256 prevHWM = vault.vaultShareHWM();

    alice.withdraw(withdrawalAmount);

    assertWithin(vault.vaultShareHWM(), prevHWM, 1);

    vm.warp(block.timestamp + timeJump);
  }
}

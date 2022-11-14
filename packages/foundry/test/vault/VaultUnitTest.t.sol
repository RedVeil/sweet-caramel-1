// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";

import { ERC20 } from "openzeppelin-contracts/token/ERC20/ERC20.sol";
import { MockERC20 } from "../utils/mocks/MockERC20.sol";
import { MockERC4626 } from "../utils/mocks/MockERC4626.sol";
import { Vault } from "../../src/vault/Vault.sol";
import { KeeperConfig } from "../../src/utils/KeeperIncentivized.sol";
import { KeeperIncentiveV2 } from "../../src/utils/KeeperIncentiveV2.sol";
import { IContractRegistry } from "../../src/interfaces/IContractRegistry.sol";

import { IACLRegistry } from "../../src/interfaces/IACLRegistry.sol";
import { IERC4626 } from "../../src/interfaces/IERC4626.sol";
import { FixedPointMathLib } from "solmate/utils/FixedPointMathLib.sol";

address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;
address constant ACL_REGISTRY = 0x8A41aAa4B467ea545DDDc5759cE3D35984F093f4;
address constant ACL_ADMIN = 0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f;

contract VaultUnitTest is Test {
  using FixedPointMathLib for uint256;

  bytes32 constant PERMIT_TYPEHASH =
    keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

  MockERC20 underlying;
  MockERC4626 strategy;
  Vault vault;
  KeeperIncentiveV2 keeperIncentive;
  address feeRecipient = address(0x4444);
  address alice = address(0xABCD);
  address bob = address(0xDCBA);

  event NewStrategyProposed(IERC4626 newStrategy, uint256 timestamp);
  event ChangedStrategy(IERC4626 oldStrategy, IERC4626 newStrategy);
  event FeesUpdated(Vault.FeeStructure previousFees, Vault.FeeStructure newFees);
  event KeeperConfigUpdated(KeeperConfig oldConfig, KeeperConfig newConfig);
  event Paused(address account);
  event Unpaused(address account);

  function setUp() public {
    uint256 forkId = vm.createSelectFork(vm.rpcUrl("FORKING_RPC_URL"), 15008113);
    vm.selectFork(forkId);

    vm.label(feeRecipient, "feeRecipient");
    vm.label(alice, "alice");
    vm.label(bob, "bob");

    underlying = new MockERC20("Mock Token", "TKN", 18);
    strategy = new MockERC4626(underlying, "Mock Token Vault", "vwTKN");

    keeperIncentive = new KeeperIncentiveV2(IContractRegistry(CONTRACT_REGISTRY), 0, 0);

    address vaultAddress = address(new Vault());
    vm.label(vaultAddress, "vault");

    vault = Vault(vaultAddress);
    vault.initialize(
      ERC20(address(underlying)),
      IERC4626(address(strategy)),
      IContractRegistry(CONTRACT_REGISTRY),
      Vault.FeeStructure({ deposit: 0, withdrawal: 0, management: 0, performance: 0 }),
      KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1e17, keeperPayout: 9 })
    );

    vm.startPrank(ACL_ADMIN);
    IACLRegistry(ACL_REGISTRY).grantRole(keccak256("VaultsController"), ACL_ADMIN);
    IACLRegistry(ACL_REGISTRY).grantRole(keccak256("INCENTIVE_MANAGER_ROLE"), ACL_ADMIN);

    IContractRegistry(CONTRACT_REGISTRY).addContract(keccak256("FeeRecipient"), feeRecipient, keccak256("1"));

    IContractRegistry(CONTRACT_REGISTRY).updateContract(
      keccak256("KeeperIncentive"),
      address(keeperIncentive),
      keccak256("2")
    );

    keeperIncentive.createIncentive(address(vault), 1, false, true, address(underlying), 1, 0);
    vm.stopPrank();
  }

  function test_Metadata() public {
    assertEq(vault.name(), "Popcorn Mock Token Vault");
    assertEq(vault.symbol(), "pop-TKN");
    assertEq(vault.decimals(), 18);
  }

  function testPermit() public {
    uint256 privateKey = 0xBEEF;
    address owner = vm.addr(privateKey);

    (uint8 v, bytes32 r, bytes32 s) = vm.sign(
      privateKey,
      keccak256(
        abi.encodePacked(
          "\x19\x01",
          vault.DOMAIN_SEPARATOR(),
          keccak256(abi.encode(PERMIT_TYPEHASH, owner, address(0xCAFE), 1e18, 0, block.timestamp))
        )
      )
    );

    vault.permit(owner, address(0xCAFE), 1e18, block.timestamp, v, r, s);

    assertEq(vault.allowance(owner, address(0xCAFE)), 1e18);
    assertEq(vault.nonces(owner), 1);
  }

  function test_SingleDepositWithdraw(uint128 amount) public {
    if (amount == 0) amount = 1;

    uint256 aliceUnderlyingAmount = amount;

    underlying.mint(alice, aliceUnderlyingAmount);

    vm.prank(alice);
    underlying.approve(address(vault), aliceUnderlyingAmount);
    assertEq(underlying.allowance(alice, address(vault)), aliceUnderlyingAmount);

    uint256 alicePreDepositBal = underlying.balanceOf(alice);

    vm.prank(alice);
    uint256 aliceShareAmount = vault.deposit(aliceUnderlyingAmount, alice);

    assertEq(strategy.afterDepositHookCalledCounter(), 1);

    // Expect exchange rate to be 1:1 on initial deposit.
    assertEq(aliceUnderlyingAmount, aliceShareAmount);
    assertEq(vault.previewWithdraw(aliceShareAmount), aliceUnderlyingAmount);
    assertEq(vault.previewDeposit(aliceUnderlyingAmount), aliceShareAmount);
    assertEq(vault.totalSupply(), aliceShareAmount);
    assertEq(vault.totalAssets(), aliceUnderlyingAmount);
    assertEq(vault.balanceOf(alice), aliceShareAmount);
    assertEq(vault.convertToAssets(vault.balanceOf(alice)), aliceUnderlyingAmount);
    assertEq(underlying.balanceOf(alice), alicePreDepositBal - aliceUnderlyingAmount);

    vm.prank(alice);
    vault.withdraw(aliceUnderlyingAmount, alice, alice);

    assertEq(strategy.beforeWithdrawHookCalledCounter(), 1);

    assertEq(vault.totalAssets(), 0);
    assertEq(vault.balanceOf(alice), 0);
    assertEq(vault.convertToAssets(vault.balanceOf(alice)), 0);
    assertEq(underlying.balanceOf(alice), alicePreDepositBal);
  }

  function test_SingleMintRedeem(uint128 amount) public {
    if (amount == 0) amount = 1;

    uint256 aliceShareAmount = amount;

    underlying.mint(alice, aliceShareAmount);

    vm.prank(alice);
    underlying.approve(address(vault), aliceShareAmount);
    assertEq(underlying.allowance(alice, address(vault)), aliceShareAmount);

    uint256 alicePreDepositBal = underlying.balanceOf(alice);

    vm.prank(alice);
    uint256 aliceUnderlyingAmount = vault.mint(aliceShareAmount, alice);

    assertEq(strategy.afterDepositHookCalledCounter(), 1);

    // Expect exchange rate to be 1:1 on initial mint.
    assertEq(aliceShareAmount, aliceUnderlyingAmount);
    assertEq(vault.previewWithdraw(aliceShareAmount), aliceUnderlyingAmount);
    assertEq(vault.previewDeposit(aliceUnderlyingAmount), aliceShareAmount);
    assertEq(vault.totalSupply(), aliceShareAmount);
    assertEq(vault.totalAssets(), aliceUnderlyingAmount);
    assertEq(vault.balanceOf(alice), aliceUnderlyingAmount);
    assertEq(vault.convertToAssets(vault.balanceOf(alice)), aliceUnderlyingAmount);
    assertEq(underlying.balanceOf(alice), alicePreDepositBal - aliceUnderlyingAmount);

    vm.prank(alice);
    vault.redeem(aliceShareAmount, alice, alice);

    assertEq(strategy.beforeWithdrawHookCalledCounter(), 1);

    assertEq(vault.totalAssets(), 0);
    assertEq(vault.balanceOf(alice), 0);
    assertEq(vault.convertToAssets(vault.balanceOf(alice)), 0);
    assertEq(underlying.balanceOf(alice), alicePreDepositBal);
  }

  function test_MultipleMintDepositRedeemWithdraw() public {
    // Scenario:
    // A = Alice, B = Bob
    //  ________________________________________________________
    // | Vault shares | A share | A assets | B share | B assets |
    // |========================================================|
    // | 1. Alice mints 2000 shares (costs 2000 tokens)         |
    // |--------------|---------|----------|---------|----------|
    // |         2000 |    2000 |     2000 |       0 |        0 |
    // |--------------|---------|----------|---------|----------|
    // | 2. Bob deposits 4000 tokens (mints 4000 shares)        |
    // |--------------|---------|----------|---------|----------|
    // |         6000 |    2000 |     2000 |    4000 |     4000 |
    // |--------------|---------|----------|---------|----------|
    // | 3. Vault mutates by +3000 tokens...                    |
    // |    (simulated yield returned from strategy)...         |
    // |--------------|---------|----------|---------|----------|
    // |         6000 |    2000 |     3000 |    4000 |     6000 |
    // |--------------|---------|----------|---------|----------|
    // | 4. Alice deposits 2000 tokens (mints 1333 shares)      |
    // |--------------|---------|----------|---------|----------|
    // |         7333 |    3333 |     4999 |    4000 |     6000 |
    // |--------------|---------|----------|---------|----------|
    // | 5. Bob mints 2000 shares (costs 3000 assets)           |
    // |--------------|---------|----------|---------|----------|
    // |         9333 |    3333 |     4999 |    6000 |     9000 |
    // |--------------|---------|----------|---------|----------|
    // | 6. Vault mutates by +3000 tokens...                    |
    // |    (simulated yield returned from strategy)            |
    // |    NOTE: Vault holds 17001 tokens, but sum of          |
    // |          assetsOf() is 17000.                          |
    // |--------------|---------|----------|---------|----------|
    // |         9333 |    3333 |     6071 |    6000 |    10928 |
    // |--------------|---------|----------|---------|----------|
    // | 7. Alice redeem 1333 shares (2428 assets)              |
    // |--------------|---------|----------|---------|----------|
    // |         8000 |    2000 |     3643 |    6000 |    10929 |
    // |--------------|---------|----------|---------|----------|
    // | 8. Bob withdraws 2928 assets (1608 shares)             |
    // |--------------|---------|----------|---------|----------|
    // |         6392 |    2000 |     3642 |    4392 |     8000 |
    // |--------------|---------|----------|---------|----------|
    // | 9. Alice withdraws 3643 assets (2000 shares)           |
    // |--------------|---------|----------|---------|----------|
    // |         4392 |       0 |        0 |    4392 |     8000 |
    // |--------------|---------|----------|---------|----------|
    // | 10. Bob redeem 4392 shares (8000 tokens)               |
    // |--------------|---------|----------|---------|----------|
    // |            0 |       0 |        0 |       0 |        0 |
    // |______________|_________|__________|_________|__________|

    uint256 mutationUnderlyingAmount = 3000;

    underlying.mint(alice, 4000);

    vm.prank(alice);
    underlying.approve(address(vault), 4000);

    assertEq(underlying.allowance(alice, address(vault)), 4000);

    underlying.mint(bob, 7001);

    vm.prank(bob);
    underlying.approve(address(vault), 7001);

    assertEq(underlying.allowance(bob, address(vault)), 7001);

    // 1. Alice mints 2000 shares (costs 2000 tokens)
    vm.prank(alice);
    uint256 aliceUnderlyingAmount = vault.mint(2000, alice);

    uint256 aliceShareAmount = vault.previewDeposit(aliceUnderlyingAmount);
    assertEq(strategy.afterDepositHookCalledCounter(), 1);

    // Expect to have received the requested mint amount.
    assertEq(aliceShareAmount, 2000);
    assertEq(vault.balanceOf(alice), aliceShareAmount);
    assertEq(vault.convertToAssets(vault.balanceOf(alice)), aliceUnderlyingAmount);
    assertEq(vault.convertToShares(aliceUnderlyingAmount), vault.balanceOf(alice));

    // Expect a 1:1 ratio before mutation.
    assertEq(aliceUnderlyingAmount, 2000);

    // Sanity check.
    assertEq(vault.totalSupply(), aliceShareAmount);
    assertEq(vault.totalAssets(), aliceUnderlyingAmount);

    // 2. Bob deposits 4000 tokens (mints 4000 shares)
    vm.prank(bob);
    uint256 bobShareAmount = vault.deposit(4000, bob);
    uint256 bobUnderlyingAmount = vault.previewWithdraw(bobShareAmount);
    assertEq(strategy.afterDepositHookCalledCounter(), 2);

    // Expect to have received the requested underlying amount.
    assertEq(bobUnderlyingAmount, 4000);
    assertEq(vault.balanceOf(bob), bobShareAmount);
    assertEq(vault.convertToAssets(vault.balanceOf(bob)), bobUnderlyingAmount);
    assertEq(vault.convertToShares(bobUnderlyingAmount), vault.balanceOf(bob));

    // Expect a 1:1 ratio before mutation.
    assertEq(bobShareAmount, bobUnderlyingAmount);

    // Sanity check.
    uint256 preMutationShareBal = aliceShareAmount + bobShareAmount;
    uint256 preMutationBal = aliceUnderlyingAmount + bobUnderlyingAmount;
    assertEq(vault.totalSupply(), preMutationShareBal);
    assertEq(vault.totalAssets(), preMutationBal);
    assertEq(vault.totalSupply(), 6000);
    assertEq(vault.totalAssets(), 6000);

    // 3. Vault mutates by +3000 tokens...                    |
    //    (simulated yield returned from strategy)...
    // The Vault now contains more tokens than deposited which causes the exchange rate to change.
    // Alice share is 33.33% of the Vault, Bob 66.66% of the Vault.
    // Alice's share count stays the same but the underlying amount changes from 2000 to 3000.
    // Bob's share count stays the same but the underlying amount changes from 4000 to 6000.
    underlying.mint(address(strategy), mutationUnderlyingAmount);
    assertEq(vault.totalSupply(), preMutationShareBal);
    assertEq(vault.totalAssets(), preMutationBal + mutationUnderlyingAmount);
    assertEq(vault.balanceOf(alice), aliceShareAmount);
    assertEq(vault.convertToAssets(vault.balanceOf(alice)), aliceUnderlyingAmount + (mutationUnderlyingAmount / 3) * 1);
    assertEq(vault.balanceOf(bob), bobShareAmount);
    assertEq(vault.convertToAssets(vault.balanceOf(bob)), bobUnderlyingAmount + (mutationUnderlyingAmount / 3) * 2);

    // 4. Alice deposits 2000 tokens (mints 1333 shares)
    vm.prank(alice);
    vault.deposit(2000, alice);

    assertEq(vault.totalSupply(), 7333);
    assertEq(vault.balanceOf(alice), 3333);
    assertEq(vault.convertToAssets(vault.balanceOf(alice)), 4999);
    assertEq(vault.balanceOf(bob), 4000);
    assertEq(vault.convertToAssets(vault.balanceOf(bob)), 6000);

    // 5. Bob mints 2000 shares (costs 3000 assets)
    // NOTE: Bob's assets spent got rounded up
    // NOTE: Alices's vault assets got rounded up
    vm.prank(bob);
    vault.mint(2000, bob);

    assertEq(vault.totalSupply(), 9333);
    assertEq(vault.balanceOf(alice), 3333);
    assertEq(vault.convertToAssets(vault.balanceOf(alice)), 4999);
    assertEq(vault.balanceOf(bob), 6000);
    assertEq(vault.convertToAssets(vault.balanceOf(bob)), 9000);

    // Sanity checks:
    // Alice and bob should have spent all their tokens now
    // Bob still has 1 wei left
    assertEq(underlying.balanceOf(alice), 0);
    assertEq(underlying.balanceOf(bob), 1);
    // Assets in vault: 4k (alice) + 7k (bob) + 3k (yield)
    assertEq(vault.totalAssets(), 14000);

    // 6. Vault mutates by +3000 tokens
    underlying.mint(address(strategy), mutationUnderlyingAmount);
    assertEq(vault.totalAssets(), 17000);
    assertEq(vault.convertToAssets(vault.balanceOf(alice)), 6071);
    assertEq(vault.convertToAssets(vault.balanceOf(bob)), 10928);

    // 7. Alice redeem 1333 shares (2428 assets)
    vm.prank(alice);
    vault.redeem(1333, alice, alice);

    assertEq(underlying.balanceOf(alice), 2428);
    assertEq(vault.totalSupply(), 8000);
    assertEq(vault.totalAssets(), 14572);
    assertEq(vault.balanceOf(alice), 2000);
    assertEq(vault.convertToAssets(vault.balanceOf(alice)), 3643);
    assertEq(vault.balanceOf(bob), 6000);
    assertEq(vault.convertToAssets(vault.balanceOf(bob)), 10929);

    // 8. Bob withdraws 2929 assets (1608 shares)
    vm.prank(bob);
    vault.withdraw(2929, bob, bob);

    assertEq(underlying.balanceOf(bob), 2930);
    assertEq(vault.totalSupply(), 6392);
    assertEq(vault.totalAssets(), 11643);
    assertEq(vault.balanceOf(alice), 2000);
    assertEq(vault.convertToAssets(vault.balanceOf(alice)), 3642);
    assertEq(vault.balanceOf(bob), 4392);
    assertEq(vault.convertToAssets(vault.balanceOf(bob)), 8000);

    // 9. Alice withdraws 3643 assets (2000 shares)
    vm.prank(alice);
    vault.withdraw(3643, alice, alice);

    assertEq(underlying.balanceOf(alice), 6071);
    assertEq(vault.totalSupply(), 4392);
    assertEq(vault.totalAssets(), 8000);
    assertEq(vault.balanceOf(alice), 0);
    assertEq(vault.convertToAssets(vault.balanceOf(alice)), 0);
    assertEq(vault.balanceOf(bob), 4392);
    assertEq(vault.convertToAssets(vault.balanceOf(bob)), 8000);

    // 10. Bob redeem 4392 shares (8000 tokens)
    vm.prank(bob);
    vault.redeem(4392, bob, bob);
    assertEq(underlying.balanceOf(bob), 10930);
    assertEq(vault.totalSupply(), 0);
    assertEq(vault.totalAssets(), 0);
    assertEq(vault.balanceOf(alice), 0);
    assertEq(vault.convertToAssets(vault.balanceOf(alice)), 0);
    assertEq(vault.balanceOf(bob), 0);
    assertEq(vault.convertToAssets(vault.balanceOf(bob)), 0);

    // Sanity check
    assertEq(underlying.balanceOf(address(vault)), 0);
  }

  function testFail_DepositWithNotEnoughApproval() public {
    underlying.mint(address(this), 0.5e18);
    underlying.approve(address(vault), 0.5e18);
    assertEq(underlying.allowance(address(this), address(vault)), 0.5e18);

    vault.deposit(1e18, address(this));
  }

  function testFail_WithdrawWithNotEnoughUnderlyingAmount() public {
    underlying.mint(address(this), 0.5e18);
    underlying.approve(address(vault), 0.5e18);

    vault.deposit(0.5e18, address(this));

    vault.withdraw(1e18, address(this), address(this));
  }

  function testFail_RedeemWithNotEnoughShareAmount() public {
    underlying.mint(address(this), 0.5e18);
    underlying.approve(address(vault), 0.5e18);

    vault.deposit(0.5e18, address(this));

    vault.redeem(1e18, address(this), address(this));
  }

  function testFail_WithdrawWithNoUnderlyingAmount() public {
    vault.withdraw(1e18, address(this), address(this));
  }

  function testFail_RedeemWithNoShareAmount() public {
    vault.redeem(1e18, address(this), address(this));
  }

  function testFail_DepositWithNoApproval() public {
    vault.deposit(1e18, address(this));
  }

  function testFail_MintWithNoApproval() public {
    vault.mint(1e18, address(this));
  }

  function testFail_DepositZero() public {
    vault.deposit(0, address(this));
  }

  function testFail_MintZero() public {
    vault.mint(0, address(this));
  }

  function test_RedeemZero() public {
    vault.redeem(0, address(this), address(this));
  }

  function test_WithdrawZero() public {
    vault.withdraw(0, address(this), address(this));
  }

  function test_VaultInteractionsForSomeoneElse() public {
    // init 2 users with a 1e18 balance
    underlying.mint(alice, 1e18);
    underlying.mint(bob, 1e18);

    vm.prank(alice);
    underlying.approve(address(vault), 1e18);

    vm.prank(bob);
    underlying.approve(address(vault), 1e18);

    // alice deposits 1e18 for bob
    vm.prank(alice);
    vault.deposit(1e18, bob);

    assertEq(vault.balanceOf(alice), 0);
    assertEq(vault.balanceOf(bob), 1e18);
    assertEq(underlying.balanceOf(alice), 0);

    // bob mint 1e18 for alice
    vm.prank(bob);
    vault.mint(1e18, alice);
    assertEq(vault.balanceOf(alice), 1e18);
    assertEq(vault.balanceOf(bob), 1e18);
    assertEq(underlying.balanceOf(bob), 0);

    // alice redeem 1e18 for bob
    vm.prank(alice);
    vault.redeem(1e18, bob, alice);

    assertEq(vault.balanceOf(alice), 0);
    assertEq(vault.balanceOf(bob), 1e18);
    assertEq(underlying.balanceOf(bob), 1e18);

    // bob withdraw 1e18 for alice
    vm.prank(bob);
    vault.withdraw(1e18, alice, bob);

    assertEq(vault.balanceOf(alice), 0);
    assertEq(vault.balanceOf(bob), 0);
    assertEq(underlying.balanceOf(alice), 1e18);
  }

  function test_PreviewDepositMintTakesFeesIntoAccount(uint128 amount) public {
    // Define lower bound for the test due to fees and underflow
    if (amount == 0) amount = 1;
    // Define upper bound for the test due to overflow
    vm.assume(amount < 283568639100782052886145506193140176214);

    vm.prank(ACL_ADMIN);
    vault.setFees(Vault.FeeStructure({ deposit: 1e17, withdrawal: 0, management: 0, performance: 0 }));

    underlying.mint(alice, amount);
    underlying.mint(bob, amount + amount / 5);

    vm.prank(alice);
    underlying.approve(address(vault), amount);

    vm.prank(bob);
    underlying.approve(address(vault), amount + (amount / 5));

    // Test PreviewDeposit and Deposit
    uint256 expectedShares = vault.previewDeposit(amount);

    vm.prank(alice);
    uint256 actualShares = vault.deposit(amount, alice);
    assertApproxEqAbs(expectedShares, actualShares, 2);

    // Test PreviewMint and Mint
    uint256 expectedDeposit = vault.previewMint(amount);

    vm.prank(bob);
    uint256 actualDeposit = vault.mint(amount, bob);
    assertApproxEqAbs(expectedDeposit, actualDeposit, 2);
  }

  function test_PreviewWithdrawRedeemTakesFeesIntoAccount(uint128 amount) public {
    // Define lower bound for the test due to fees and underflow
    if (amount == 0) amount = 1;
    // Define upper bound for the test due to overflow
    vm.assume(amount < 216554372251204060390530395229862551237);

    vm.prank(ACL_ADMIN);
    vault.setFees(Vault.FeeStructure({ deposit: 0, withdrawal: 1e17, management: 0, performance: 0 }));

    underlying.mint(alice, amount);
    underlying.mint(bob, amount);

    vm.startPrank(alice);
    underlying.approve(address(vault), amount);
    uint256 shares = vault.deposit(amount, alice);
    vm.stopPrank();

    vm.startPrank(bob);
    underlying.approve(address(vault), amount);
    vault.deposit(amount, bob);
    vm.stopPrank();

    // Test PreviewWithdraw and Withdraw
    // NOTE: Reduce the amount of assets to withdraw to take withdrawalFee into account (otherwise we would withdraw more than we deposited)
    uint256 withdrawAmount = (amount / 10) * 9;
    uint256 expectedShares = vault.previewWithdraw(withdrawAmount);

    vm.prank(alice);
    uint256 actualShares = vault.withdraw(withdrawAmount, alice, alice);
    assertApproxEqAbs(expectedShares, actualShares, 1);

    // Test PreviewRedeem and Redeem
    uint256 expectedAssets = vault.previewRedeem(shares);

    vm.prank(bob);
    uint256 actualAssets = vault.redeem(shares, bob, bob);
    assertApproxEqAbs(expectedAssets, actualAssets, 1);
  }

  function test_managementFee(uint128 timeframe) public {
    // Test Timeframe less than 10 years
    vm.assume(timeframe <= 315576000);
    uint256 depositAmount = 1 ether;

    vm.prank(ACL_ADMIN);
    vault.setFees(Vault.FeeStructure({ deposit: 0, withdrawal: 0, management: 1e17, performance: 0 }));

    underlying.mint(alice, depositAmount);
    vm.startPrank(alice);
    underlying.approve(address(vault), depositAmount);
    vault.deposit(depositAmount, alice);
    vm.stopPrank();

    // Increase Block Time to trigger managementFee
    uint256 timestamp = block.timestamp + timeframe;
    vm.roll(timestamp);

    uint256 expectedFeeInAsset = vault.accruedManagementFee();
    uint256 expectedFeeInShares = vault.convertToShares(expectedFeeInAsset);

    vault.takeManagementAndPerformanceFees();

    assertEq(vault.totalSupply(), depositAmount + expectedFeeInShares);
    assertEq(vault.balanceOf(address(vault)), expectedFeeInShares);

    // High Water Mark should remain unchanged
    assertEq(vault.vaultShareHWM(), 1e18);
    // AssetsCheckpoint should remain unchanged
    assertEq(vault.assetsCheckpoint(), depositAmount);
  }

  function test_performanceFee(uint128 amount) public {
    vm.assume(amount <= 315576000);
    uint256 depositAmount = 1 ether;

    vm.prank(ACL_ADMIN);
    vault.setFees(Vault.FeeStructure({ deposit: 0, withdrawal: 0, management: 0, performance: 1e17 }));

    underlying.mint(alice, depositAmount);
    vm.startPrank(alice);
    underlying.approve(address(vault), depositAmount);
    vault.deposit(depositAmount, alice);
    vm.stopPrank();

    // Increase underlying assets to trigger performanceFee
    underlying.mint(address(strategy), amount);

    uint256 expectedFeeInAsset = vault.accruedPerformanceFee();
    uint256 expectedFeeInShares = vault.convertToShares(expectedFeeInAsset);

    vault.takeManagementAndPerformanceFees();

    assertEq(vault.totalSupply(), depositAmount + expectedFeeInShares);
    assertEq(vault.balanceOf(address(vault)), expectedFeeInShares);

    // There should be a new High Water Mark
    assertEq(vault.vaultShareHWM(), (depositAmount + amount).mulDivDown(depositAmount, depositAmount));
    // AssetsCheckpoint should be advanced
    assertEq(vault.assetsCheckpoint(), depositAmount + amount);
  }

  function test_withdrawAccruedDepositFees() public {
    uint256 depositAmount = 1 ether;

    uint256 keeperBalBefore = vault.balanceOf(address(keeperIncentive));
    uint256 accruedFeesBefore = vault.balanceOf(address(vault));

    vm.prank(ACL_ADMIN);
    vault.setFees(Vault.FeeStructure({ deposit: 1e17, withdrawal: 0, management: 0, performance: 0 }));
    (uint256 depositFee, , , ) = vault.feeStructure();

    underlying.mint(alice, depositAmount);

    vm.startPrank(alice);
    underlying.approve(address(vault), depositAmount);
    vault.deposit(depositAmount, alice);
    vm.stopPrank();

    uint256 accruedFeesAfter = vault.balanceOf(address(vault));

    vm.prank(ACL_ADMIN);
    vault.withdrawAccruedFees();

    uint256 keeperBalAfter = vault.balanceOf(address(keeperIncentive));
    uint256 keeperEarnings = keeperBalAfter - keeperBalBefore;
    uint256 depositFeesEarned = accruedFeesAfter - accruedFeesBefore;

    assertTrue(accruedFeesAfter > accruedFeesBefore);

    assertTrue(keeperBalAfter > keeperBalBefore);

    assertEq(depositFeesEarned, (depositAmount * depositFee) / 1e18);

    // Fees sub incentive tip
    assertEq(vault.balanceOf(feeRecipient), depositFeesEarned - keeperEarnings);
  }

  // ----- Change Strategy ----- //

  // Propose Strategy
  function testFail_proposeStrategyNonVaultController() public {
    MockERC4626 newStrategy = new MockERC4626(underlying, "Mock Token Vault", "vwTKN");

    vm.prank(alice);
    vault.proposeNewStrategy(IERC4626(address(newStrategy)));
  }

  function test_proposeStrategy() public {
    MockERC4626 newStrategy = new MockERC4626(underlying, "Mock Token Vault", "vwTKN");

    vm.expectEmit(false, false, false, true, address(vault));
    emit NewStrategyProposed(IERC4626(address(newStrategy)), 1655909093);

    vm.prank(ACL_ADMIN);
    vault.proposeNewStrategy(IERC4626(address(newStrategy)));

    assertEq(vault.proposalTimeStamp(), 1655909093);
    assertEq(address(vault.proposedStrategy()), address(newStrategy));
  }

  // Change Strategy
  function testFail_changeStrategyNonVaultController() public {
    vm.prank(alice);
    vault.changeStrategy();
  }

  function testFail_changeStrategyRespectRageQuit() public {
    MockERC4626 newStrategy = new MockERC4626(underlying, "Mock Token Vault", "vwTKN");

    vm.startPrank(ACL_ADMIN);
    vault.proposeNewStrategy(IERC4626(address(newStrategy)));

    // Didnt respect 3 days before propsal and change
    vault.changeStrategy();
  }

  function test_changeStrategy() public {
    MockERC4626 newStrategy = new MockERC4626(underlying, "Mock Token Vault", "vwTKN");
    uint256 depositAmount = 1 ether;

    // SetUp Fees to check hwm and assetCheckpoint later
    vm.prank(ACL_ADMIN);
    vault.setFees(Vault.FeeStructure({ deposit: 0, withdrawal: 0, management: 0, performance: 1e17 }));

    // Deposit funds for testing
    underlying.mint(alice, depositAmount);
    vm.startPrank(alice);
    underlying.approve(address(vault), depositAmount);
    vault.deposit(depositAmount, alice);
    vm.stopPrank();

    // Increase assets in underlying Strategy to check hwm and assetCheckpoint later
    underlying.mint(address(strategy), depositAmount);
    vault.takeManagementAndPerformanceFees();
    uint256 oldHWM = vault.vaultShareHWM();
    uint256 oldAssetCheckpoint = vault.assetsCheckpoint();

    // Preparation to change the strategy
    vm.prank(ACL_ADMIN);
    vault.proposeNewStrategy(IERC4626(address(newStrategy)));

    vm.warp(block.timestamp + 3 days + 1);

    vm.expectEmit(false, false, false, true, address(vault));
    emit ChangedStrategy(IERC4626(address(strategy)), IERC4626(address(newStrategy)));

    vm.prank(ACL_ADMIN);
    vault.changeStrategy();

    assertEq(underlying.allowance(address(vault), address(strategy)), 0);
    assertEq(underlying.balanceOf(address(strategy)), 0);
    assertEq(strategy.balanceOf(address(vault)), 0);

    assertEq(underlying.balanceOf(address(newStrategy)), depositAmount * 2);
    assertEq(newStrategy.balanceOf(address(vault)), depositAmount * 2);
    assertEq(underlying.allowance(address(vault), address(newStrategy)), type(uint256).max);

    assertLt(vault.vaultShareHWM(), oldHWM);

    assertEq(vault.assetsCheckpoint(), oldAssetCheckpoint);
    assertEq(vault.vaultShareHWM(), vault.convertToAssets(1 ether));
    assertEq(vault.assetsCheckpoint(), vault.totalAssets());
  }

  // Set Fees
  function testFail_setFeesNonVaultController() public {
    Vault.FeeStructure memory newFeeStructure = Vault.FeeStructure({
      deposit: 1,
      withdrawal: 1,
      management: 1,
      performance: 1
    });

    vm.prank(alice);
    vault.setFees(newFeeStructure);
  }

  function test_setFees() public {
    Vault.FeeStructure memory newFeeStructure = Vault.FeeStructure({
      deposit: 1,
      withdrawal: 1,
      management: 1,
      performance: 1
    });

    vm.expectEmit(false, false, false, true, address(vault));
    emit FeesUpdated(Vault.FeeStructure({ deposit: 0, withdrawal: 0, management: 0, performance: 0 }), newFeeStructure);

    vm.prank(ACL_ADMIN);
    vault.setFees(newFeeStructure);

    (uint256 deposit, uint256 withdrawal, uint256 management, uint256 performance) = vault.feeStructure();
    assertEq(deposit, 1);
    assertEq(withdrawal, 1);
    assertEq(management, 1);
    assertEq(performance, 1);
  }

  // Set KeeperConfig
  function testFail_setKeeperConfigNonVaultController() public {
    KeeperConfig memory newKeeperConfig = KeeperConfig({
      minWithdrawalAmount: 200,
      incentiveVigBps: 1e12,
      keeperPayout: 20
    });

    vm.prank(alice);
    vault.setKeeperConfig(newKeeperConfig);
  }

  function test_setKeeperConfig() public {
    KeeperConfig memory newKeeperConfig = KeeperConfig({
      minWithdrawalAmount: 200,
      incentiveVigBps: 1e12,
      keeperPayout: 20
    });

    vm.expectEmit(false, false, false, true, address(vault));
    emit KeeperConfigUpdated(
      KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1e17, keeperPayout: 9 }),
      newKeeperConfig
    );

    vm.prank(ACL_ADMIN);
    vault.setKeeperConfig(newKeeperConfig);

    (uint256 minWithdrawalAmount, uint256 incentiveVigBps, uint256 keeperPayout) = vault.keeperConfig();
    assertEq(minWithdrawalAmount, 200);
    assertEq(incentiveVigBps, 1e12);
    assertEq(keeperPayout, 20);
  }

  // Pause
  function testFail_pauseContractNonVaultController() public {
    vm.prank(alice);
    vault.pauseContract();
  }

  function test_pauseContract() public {
    uint256 depositAmount = 1 ether;

    // Deposit funds for testing
    underlying.mint(alice, depositAmount * 3);
    vm.startPrank(alice);
    underlying.approve(address(vault), depositAmount * 3);
    vault.deposit(depositAmount * 2, alice);
    vm.stopPrank();

    vm.expectEmit(false, false, false, true, address(vault));
    emit Paused(ACL_ADMIN);

    vm.prank(ACL_ADMIN);
    vault.pauseContract();

    assertTrue(vault.paused());

    vm.prank(alice);
    vm.expectRevert("Pausable: paused");
    vault.deposit(depositAmount, alice);

    vm.prank(alice);
    vm.expectRevert("Pausable: paused");
    vault.mint(depositAmount, alice);

    vm.prank(alice);
    vault.withdraw(depositAmount, alice, alice);

    vm.prank(alice);
    vault.redeem(depositAmount, alice, alice);
  }

  // Unpause
  function testFail_unpauseContractNonVaultController() public {
    vm.prank(ACL_ADMIN);
    vault.pauseContract();

    vm.prank(alice);
    vault.unpauseContract();
  }

  function test_unpauseContract() public {
    uint256 depositAmount = 1 ether;

    // Deposit funds for testing
    underlying.mint(alice, depositAmount * 2);
    vm.prank(alice);
    underlying.approve(address(vault), depositAmount * 2);

    vm.prank(ACL_ADMIN);
    vault.pauseContract();

    vm.expectEmit(false, false, false, true, address(vault));
    emit Unpaused(ACL_ADMIN);

    vm.prank(ACL_ADMIN);
    vault.unpauseContract();

    assertFalse(vault.paused());

    vm.prank(alice);
    vault.deposit(depositAmount, alice);

    vm.prank(alice);
    vault.mint(depositAmount, alice);

    vm.prank(alice);
    vault.withdraw(depositAmount, alice, alice);

    vm.prank(alice);
    vault.redeem(depositAmount, alice, alice);
  }
}
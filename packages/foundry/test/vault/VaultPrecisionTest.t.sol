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

abstract contract VaultTest is Test {
  using FixedPointMathLib for uint256;

  MockERC20 underlying;
  MockERC4626 strategy;
  Vault vault;
  KeeperIncentiveV2 keeperIncentive;
  address feeRecipient = address(0x4444);
  address alice = address(0xABCD);
  address bob = address(0xDCBA);

  uint8 decimals;
  uint256 immutable UNIT;

  constructor(uint8 _decimals) {
    decimals = _decimals;
    UNIT = 10**_decimals;
  }

  function setUp() public {
    uint256 forkId = vm.createSelectFork(vm.rpcUrl("FORKING_RPC_URL"), 15008113);
    vm.selectFork(forkId);

    vm.label(feeRecipient, "feeRecipient");
    vm.label(alice, "alice");
    vm.label(bob, "bob");

    underlying = new MockERC20("Mock Token", "TKN", decimals);
    strategy = new MockERC4626(underlying, "Mock Token Vault", "vwTKN");

    keeperIncentive = new KeeperIncentiveV2(IContractRegistry(CONTRACT_REGISTRY), 0, 0);

    address vaultAddress = address(new Vault());
    vm.label(vaultAddress, "vault");

    vault = Vault(vaultAddress);
    vault.initialize(
      ERC20(address(underlying)),
      IERC4626(address(strategy)),
      IContractRegistry(CONTRACT_REGISTRY),
      Vault.FeeStructure({ deposit: 0, withdrawal: 0, management: 200e14, performance: 2000e14 }),
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


  function test_decimals() public {
    assertEq(vault.decimals(), decimals);
  }

  function test_feeDecimalConversions() public {
    uint256 mutationUnderlyingAmount = 3000 * UNIT;

    underlying.mint(alice, 2000 * UNIT);

    vm.prank(alice);
    underlying.approve(address(vault), 2000 * UNIT);

    underlying.mint(bob, 4000 * UNIT);

    vm.prank(bob);
    underlying.approve(address(vault), 4000 * UNIT);

    // 1. Alice mints 2000 shares (costs 2000 tokens)
    vm.prank(alice);
    uint256 aliceUnderlyingAmount = vault.mint(2000 * UNIT, alice);

    uint256 aliceShareAmount = vault.previewDeposit(aliceUnderlyingAmount);

    // Expect to have received the requested mint amount.
    assertEq(aliceShareAmount, 2000 * UNIT);
    assertEq(vault.balanceOf(alice), aliceShareAmount);
    assertEq(vault.convertToAssets(vault.balanceOf(alice)), aliceUnderlyingAmount);
    assertEq(vault.convertToShares(aliceUnderlyingAmount), vault.balanceOf(alice));

    // Expect a 1:1 ratio before mutation.
    assertEq(aliceUnderlyingAmount, 2000 * UNIT);

    // Sanity check.
    assertEq(vault.totalSupply(), aliceShareAmount);
    assertEq(vault.totalAssets(), aliceUnderlyingAmount);

    // 2. Bob deposits 4000 tokens (mints 4000 shares)
    vm.prank(bob);
    uint256 bobShareAmount = vault.deposit(4000 * UNIT, bob);
    uint256 bobUnderlyingAmount = vault.previewWithdraw(bobShareAmount);

    // Expect to have received the requested underlying amount.
    assertEq(bobUnderlyingAmount, 4000 * UNIT);
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
    assertEq(vault.totalSupply(), 6000 * UNIT);
    assertEq(vault.totalAssets(), 6000 * UNIT);

    // 3. Vault mutates by +3000 tokens...
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

    assertEq(vault.convertToAssets(UNIT), 15 * UNIT / 10);
    assertEq(vault.accruedPerformanceFee(), 600 * UNIT); // 20% of the 3000 token increase

    vm.warp(block.timestamp + 525_600 minutes);
    assertEq(vault.accruedManagementFee(), 90 * UNIT); // 2% of the 4500 token average
  }

}

contract ThreeDecimalsVaultTest is VaultTest(3) {}
contract SixDecimalsVaultTest is VaultTest(6) {}
contract TwelveDecimalsVaultTest is VaultTest(12) {}
contract EighteenDecimalsVaultTest is VaultTest(18) {}
contract TwentyFourDecimalsVaultTest is VaultTest(24) {}
contract ThirtyDecimalsVaultTest is VaultTest(30) {}

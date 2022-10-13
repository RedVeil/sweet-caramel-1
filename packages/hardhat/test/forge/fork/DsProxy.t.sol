// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";
import { Vault } from "../../../contracts/core/defi/vault/Vault.sol";
import { VaultStaking } from "../../../contracts/core/defi/vault/VaultStaking.sol";
import { VaultFeeController } from "../../../contracts/core/defi/vault/VaultFeeController.sol";
import { DSProxy, DSProxyFactory } from "../../../contracts/externals/dapptools/ds-proxy.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { KeeperConfig } from "../../../contracts/core/utils/KeeperIncentivized.sol";
import { IContractRegistry } from "../../../contracts/core/interfaces/IContractRegistry.sol";
import { IContractRegistry } from "../../../contracts/core/interfaces/IContractRegistry.sol";
import { IACLRegistry } from "../../../contracts/core/interfaces/IACLRegistry.sol";

address constant CRV_3CRYPTO = 0xc4AD29ba4B3c580e6D59105FFf484999997675Ff;
address constant YEARN_REGISTRY = 0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804;
address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;
address constant ACL_REGISTRY = 0x8A41aAa4B467ea545DDDc5759cE3D35984F093f4;
address constant ACL_ADMIN = 0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f;

uint256 constant DEPOSIT_FEE = 50 * 1e14;
uint256 constant WITHDRAWAL_FEE = 50 * 1e14;
uint256 constant MANAGEMENT_FEE = 200 * 1e14;
uint256 constant PERFORMANCE_FEE = 2000 * 1e14;

contract DsProxyTest is Test {
  DSProxy internal proxy;
  DSProxyFactory internal proxyFactory;
  Vault internal vault;
  VaultStaking internal staking;
  IERC20 internal asset;
  VaultFeeController internal feeController;

  function setUp() public {
    asset = IERC20(CRV_3CRYPTO);

    // Setup Vault
    address vaultAddress = address(new Vault());
    Vault(vaultAddress).initialize(
      CRV_3CRYPTO,
      YEARN_REGISTRY,
      IContractRegistry(CONTRACT_REGISTRY),
      address(0),
      address(0),
      Vault.FeeStructure({
        deposit: DEPOSIT_FEE,
        withdrawal: WITHDRAWAL_FEE,
        management: MANAGEMENT_FEE,
        performance: PERFORMANCE_FEE
      }),
      KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1, keeperPayout: 9 })
    );
    vault = Vault(vaultAddress);

    feeController = new VaultFeeController(
      VaultFeeController.FeeStructure({
        deposit: DEPOSIT_FEE,
        withdrawal: WITHDRAWAL_FEE,
        management: MANAGEMENT_FEE,
        performance: PERFORMANCE_FEE
      }),
      IContractRegistry(CONTRACT_REGISTRY)
    );

    // Setup Staking
    address stakingAddress = address(new VaultStaking());
    VaultStaking(stakingAddress).initialize(IERC20(address(vault)), IContractRegistry(CONTRACT_REGISTRY));
    staking = VaultStaking(stakingAddress);

    // Role and Contract Registry setup
    vm.startPrank(ACL_ADMIN);
    IACLRegistry(ACL_REGISTRY).grantRole(keccak256("VaultsController"), ACL_ADMIN);
    vm.stopPrank();

    vm.prank(ACL_ADMIN);
    IContractRegistry(CONTRACT_REGISTRY).addContract(
      keccak256("VaultFeeController"),
      address(feeController),
      keccak256("1")
    );

    // Setup DsProxy Factory
    proxyFactory = new DSProxyFactory();

    // Deal and approve for later
    deal(address(asset), address(this), 100 ether);
    asset.approve(address(vault), type(uint256).max);
  }

  function testCreateProxy() public {
    proxy = DSProxy(proxyFactory.build());
  }
}

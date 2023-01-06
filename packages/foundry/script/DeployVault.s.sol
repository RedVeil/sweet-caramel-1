// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15
pragma solidity ^0.8.15;

import { Script } from "forge-std/Script.sol";
import { MockERC4626, IERC20Metadata } from "../test/utils/mocks/MockERC4626.sol";
import { IERC4626, IERC20 } from "../src/interfaces/vault/IERC4626.sol";
import { ERC20 } from "openzeppelin-contracts/token/ERC20/ERC20.sol";
import { KeeperIncentiveV2, IKeeperIncentiveV2 } from "../src/utils/KeeperIncentiveV2.sol";
import { Vault } from "../src/vault/Vault.sol";
import { KeeperConfig } from "../src/utils/KeeperIncentivized.sol";
import { KeeperIncentiveV2, IKeeperIncentiveV2 } from "../src/utils/KeeperIncentiveV2.sol";
import { IContractRegistry } from "../src/interfaces/IContractRegistry.sol";
import { FeeStructure } from "../src/interfaces/vault/IVault.sol";

address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;

contract VulnerableScript is Script {
  IERC20 asset = IERC20(0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb); //sETH
  address feeRecipient = address(0x4444);
  MockERC4626 adapter;
  KeeperIncentiveV2 keeperIncentive;
  Vault vault;
  address deployer;

  event log(string str);
  event log_named_address(string str, address addr);

  function run() public {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    deployer = vm.addr(deployerPrivateKey);

    vm.startBroadcast(deployerPrivateKey);

    adapter = new MockERC4626(asset, "Mock Token Vault", "vwTKN");

    keeperIncentive = new KeeperIncentiveV2(IContractRegistry(CONTRACT_REGISTRY), 0, 0);

    address vaultAddress = address(new Vault());

    vault = Vault(vaultAddress);
    vault.initialize(
      asset,
      IERC4626(address(adapter)),
      FeeStructure({ deposit: 0, withdrawal: 0, management: 0, performance: 0 }),
      feeRecipient,
      IKeeperIncentiveV2(keeperIncentive),
      KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1e15, keeperPayout: 9 }),
      deployer
    );
    emit log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    emit log_named_address("Vault Address: ", vaultAddress);
    emit log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

    vm.stopBroadcast();
  }
}

// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.12;

import { ExtendedDSTest } from "./utils/ExtendedDSTest.sol";
import { StrategyParams, IVault } from "../../../src/interfaces/external/yearn/IVault.sol";
import { VaultAPI } from "../../../src/interfaces/external/yearn/IVaultAPI.sol";
import { YearnWrapper } from "../../../src/vault/wrapper/yearn/YearnWrapper.sol";
import { IERC20Metadata } from "openzeppelin-contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { IERC20 } from "openzeppelin-contracts/token/ERC20/IERC20.sol";
import { VaultWrapperAbstractTest } from "./VaultWrapperAbstractTest.t.sol";
import "forge-std/console.sol";

contract YearnWrapperUsdcTest is VaultWrapperAbstractTest {
  function setUp() public {
    super.setUpTest(
      address(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48),
      address(0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE),
      uint256(1_000_000)
    );
  }
}

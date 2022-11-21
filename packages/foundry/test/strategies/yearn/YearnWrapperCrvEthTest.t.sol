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

contract YearnWrapperCrvEthTest is VaultWrapperAbstractTest {
  function setUp() public {
    super.setUpTest(
      address(0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c),
      address(0x986b4AFF588a109c09B50A03f42E4110E29D353F),
      uint256(10_000)
    );
  }
}

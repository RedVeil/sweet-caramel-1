// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import { Script } from "forge-std/Script.sol";
import "forge-std/Test.sol";
import "../test/utils/Faucet.sol";
import "@openzeppelin/contracts/mocks/ERC4626Mock.sol";
import "@openzeppelin/contracts/mocks/ERC20Mock.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/// @notice A very simple deployment script
contract deployMockVaultAndStaking is Script {
  address public curvePool = 0xc5424B857f758E906013F3555Dad202e4bdB4567;
  address public lpToken = 0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c;
  address public tester = address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
  address public seth = address(0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb);

  constructor() {}

  /// @notice The main script entrypoint
  function run() external {
    vm.startBroadcast();
    Faucet faucet = new Faucet(address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D));
    faucet.sendCrvSethLPTokens{ value: 1 ether }(1, tester);
    ERC4626Mock vault = new ERC4626Mock(IERC20Metadata(address(lpToken)), "MockVault sETH/ETH", "MCK-VSETH");
    ERC4626Mock staking = new ERC4626Mock(IERC20Metadata(address(vault)), "MockStaking sETH/ETH", "MCK-STK-SETH");
    vm.stopBroadcast();
  }
}

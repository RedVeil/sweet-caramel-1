// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;

interface IPopERC4626 {
  function afterDeposit(uint256 assets, uint256 shares) external {}

  function beforeWithdraw(uint256 assets, uint256 shares) external {}

  function _claim() external {}
}

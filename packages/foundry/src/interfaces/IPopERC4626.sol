// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;

interface IPopERC4626 {
  function getStrategyData() external view returns (bytes memory);

  function asset() external view returns (address);

  function strategyDeposit(uint256 assets, uint256 shares) external;

  function strategyWithdraw(uint256 assets, uint256 shares) external;

  function claim() external;
}

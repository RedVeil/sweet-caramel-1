// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IERC4626 is IERC20 {
  function asset() external view returns (address);

  function totalAssets() external view returns (uint256);

  function convertToShares(uint256 assets) external view returns (uint256);

  function convertToAssets(uint256 shares) external view returns (uint256);

  function maxDeposit(address receiver) external view returns (uint256);

  function previewDeposit(uint256 assets) external view returns (uint256);

  function deposit(uint256 assets, address receiver) external returns (uint256);

  function maxMint(address receiver) external view returns (uint256);

  function previewMint(uint256 shares) external view returns (uint256);

  function mint(uint256 shares, address receiver) external returns (uint256);

  function maxWithdraw(address owner) external view returns (uint256);

  function previewWithdraw(uint256 assets) external view returns (uint256);

  function withdraw(
    uint256 assets,
    address receiver,
    address owner
  ) external returns (uint256);

  function maxRedeem(address owner) external view returns (uint256);

  function previewRedeem(uint256 shares) external view returns (uint256);

  function redeem(
    uint256 shares,
    address receiver,
    address owner
  ) external returns (uint256);

  event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);

  event Withdraw(
    address indexed caller,
    address indexed receiver,
    address indexed owner,
    uint256 assets,
    uint256 shares
  );
}
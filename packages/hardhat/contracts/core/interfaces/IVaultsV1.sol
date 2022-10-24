// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "./IERC4626.sol";
import "../defi/vault/Vault.sol";
import { KeeperConfig } from "../utils/KeeperIncentivized.sol";

interface IVaultsV1 is IERC4626 {
  /* ========== STRUCTS ========== */

  struct FeeStructure {
    uint256 deposit;
    uint256 withdrawal;
    uint256 management;
    uint256 performance;
  }

  /* ========== VIEWS ========== */
  function assetsPerShare() external view returns (uint256);

  function asset() external view override returns (address);

  function staking() external view returns (address);

  function zapper() external view returns (address);

  function totalAssets() external view override(IERC4626) returns (uint256);

  function assetsOf(address owner) external view returns (uint256);

  function convertToAssets(uint256 shares) external view override returns (uint256);

  function convertToShares(uint256 assets) external view override returns (uint256);

  /* ========== VIEWS ( PREVIEWS ) ========== */

  function previewDeposit(uint256 assets) external view override returns (uint256 shares);

  function previewMint(uint256 shares) external view override returns (uint256 assets);

  function previewWithdraw(uint256 assets) external view override returns (uint256 shares);

  function previewRedeem(uint256 shares) external view override returns (uint256 assets);

  /* ========== VIEWS ( FEES ) ========== */

  function accruedManagementFee() external view returns (uint256);

  function accruedPerformanceFee() external view returns (uint256);

  function getDepositFee() external view returns (uint256);

  function getWithdrawalFee() external view returns (uint256);

  /* ========== VIEWS ( MAX ) ========== */

  function maxDeposit(address) external view override returns (uint256);

  function maxMint(address) external view override returns (uint256);

  function maxWithdraw(address caller) external view override returns (uint256);

  function maxRedeem(address caller) external view override returns (uint256);

  /* ========== MUTATIVE FUNCTIONS ========== */

  function deposit(uint256 assets) external returns (uint256);

  function deposit(uint256 assets, address receiver) external override returns (uint256 shares);

  function depositAndStake(uint256 assets) external returns (uint256);

  function depositAndStakeFor(uint256 assets, address receiver) external returns (uint256 shares);

  function mint(uint256 shares) external returns (uint256);

  function mint(uint256 shares, address receiver) external override returns (uint256 assets);

  function mintAndStake(uint256 shares) external returns (uint256);

  function mintAndStakeFor(uint256 shares, address receiver) external returns (uint256 assets);

  function withdraw(uint256 assets) external returns (uint256);

  function withdraw(
    uint256 assets,
    address receiver,
    address owner
  ) external override returns (uint256 shares);

  function redeem(uint256 shares) external returns (uint256);

  function redeem(
    uint256 shares,
    address receiver,
    address owner
  ) external override returns (uint256 assets);

  function unstakeAndRedeem(uint256 shares) external;

  function unstakeAndRedeemFor(
    uint256 shares,
    address receiver,
    address owner
  ) external;

  function takeManagementAndPerformanceFees() external;

  /* ========== RESTRICTED FUNCTIONS ========== */

  function proposeNewStrategy(IERC4626 newStrategy) external;

  function changeStrategy() external;

  function setFees(FeeStructure memory newFees) external;

  function setStaking(address _staking) external;

  function setZapper(address _zapper) external;

  function setRegistry(address _registry) external;

  function withdrawAccruedFees() external;

  function setKeeperConfig(KeeperConfig memory _config) external;

  function pauseContract() external;

  function unpauseContract() external;
}

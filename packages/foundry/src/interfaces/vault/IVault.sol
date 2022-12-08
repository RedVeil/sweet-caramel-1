// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15
pragma solidity ^0.8.15;

import { IERC4626 } from "./IERC4626.sol";
import { KeeperConfig } from "../../utils/KeeperIncentivized.sol";
import { IOwned } from "../IOwned.sol";
import { IPermit } from "../IPermit.sol";
import { IPausable } from "../IPausable.sol";

// Fees are set in 1e18 for 100% (1 BPS = 1e14)
// Raise Fees in BPS by 1e14 to get an accurate value
struct FeeStructure {
  uint256 deposit;
  uint256 withdrawal;
  uint256 management;
  uint256 performance;
}

struct VaultParams {
  IERC20 asset;
  IERC4626 strategy;
  IVault.FeeStructure feeStructure;
  address feeRecipient;
  IKeeperIncentiveV2 keeperIncentive;
  KeeperConfig keeperConfig;
  address owner;
}

interface IVault is IERC4626, IOwned, IPausable, IPermit {
  // FEE VIEWS

  function accruedManagementFee() external view returns (uint256);

  function accruedPerformanceFee() external view returns (uint256);

  function vaultShareHWM() external view returns (uint256);

  function assetsCheckpoint() external view returns (uint256);

  function feesUpdatedAt() external view returns (uint256);

  function feeStructure() external view returns (FeeStructure);

  function proposedFees() external view returns (FeeStructure);

  function proposedFeeTimeStamp() external view returns (uint256);

  function feeRecipient() external view returns (address);

  // USER INTERACTIONS

  function deposit(uint256 assets) external returns (uint256);

  function mint(uint256 shares) external returns (uint256);

  function withdraw(uint256 assets) external returns (uint256);

  function redeem(uint256 shares) external returns (uint256);

  function takeManagementAndPerformanceFees() external;

  // MANAGEMENT FUNCTIONS - STRATEGY

  function strategy() external view returns (address);

  function proposedStrategy() external view returns (address);

  function proposalTimeStamp() external view returns (uint256);

  function proposeNewStrategy(IERC4626 newStrategy) external;

  function changeStrategy() external;

  // MANAGEMENT FUNCTIONS - FEES

  function proposeNewFees(FeeStructure memory newFees) external;

  function setFees() external;

  function withdrawAccruedFees() external;

  function setFeeRecipient(address feeRecipient) external;

  // MANAGEMENT FUNCTIONS - OTHER

  function quitPeriod() external view returns (uint256);

  function setQuitPeriod(uint256 _quitPeriod) external;

  function setKeeperConfig(KeeperConfig memory _config) external;
}

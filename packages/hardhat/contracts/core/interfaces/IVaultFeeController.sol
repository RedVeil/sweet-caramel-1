// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

interface IVaultFeeController {
  function feeRecipient() external view returns (address);

  function getDepositFee() external view returns (uint256);

  function getMintFee() external view returns (uint256);

  function getWithdrawalFee() external view returns (uint256);

  function getRedeemFee() external view returns (uint256);

  function getManagementFee() external view returns (uint256);

  function getPerformanceFee() external view returns (uint256);
}

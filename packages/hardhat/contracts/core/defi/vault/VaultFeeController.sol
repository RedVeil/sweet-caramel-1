// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "../../utils/ACLAuth.sol";
import "../../utils/ContractRegistryAccess.sol";

contract VaultFeeController is ACLAuth, ContractRegistryAccess {
  // Fees are set in 1e18 for 100% (1 BPS = 1e14)
  // Raise Fees in BPS by 1e14 to get an accurate value
  // Both mint and reedem fee must be slightly higher than deposit/withdrawal to account for rounding
  struct FeeStructure {
    uint256 deposit;
    uint256 withdrawal;
    uint256 management;
    uint256 performance;
  }

  /* ========== STATE VARIABLES ========== */

  FeeStructure public feeStructure;
  address public feeRecipient;

  /* ========== EVENTS ========== */

  event FeesChanged(FeeStructure previousFees, FeeStructure newFees);
  event FeeRecipientChanged(address previousFeeRecipient, address newFeeRecipient);

  /* ========== CONSTRUCTOR ========== */

  constructor(FeeStructure memory _feeStructure, IContractRegistry _contractRegistry)
    ContractRegistryAccess(_contractRegistry)
  {
    feeStructure = _feeStructure;
  }

  /* ========== VIEWS ========== */

  function getDepositFee() external view returns (uint256) {
    return feeStructure.deposit;
  }

  function getWithdrawalFee() external view returns (uint256) {
    return feeStructure.withdrawal;
  }

  function getManagementFee() external view returns (uint256) {
    return feeStructure.management;
  }

  function getPerformanceFee() external view returns (uint256) {
    return feeStructure.performance;
  }

  /* ========== RESTRICTED FUNCTIONS ========== */

  /**
   * @notice Set fees in BPS. Caller must have DAO_ROLE from ACLRegistry.
   * @param _newFees New `feeStructure`.
   * @dev Value is in basis points, i.e. 100 BPS = 1%
   */
  function setFees(FeeStructure memory _newFees) external onlyRole(DAO_ROLE) {
    // prettier-ignore
    require(
      _newFees.deposit < 1e18 &&
      _newFees.withdrawal < 1e18 &&
      _newFees.management < 1e18 &&
      _newFees.performance < 1e18,
      "Invalid FeeStructure"
    );
    emit FeesChanged(feeStructure, _newFees);
    feeStructure = _newFees;
  }

  /**
   * @notice Sets fee recipient for all sweet vaults. Caller must have DAO_ROLE from ACLRegistry.
   * @param _feeRecipient New `feeRecipient`.
   */
  function setFeeRecipient(address _feeRecipient) external onlyRole(DAO_ROLE) {
    emit FeeRecipientChanged(feeRecipient, _feeRecipient);
    feeRecipient = _feeRecipient;
  }

  /* ========== INTERNAL FUNCTIONS ========== */

  /**
   * @notice Override for ACLAuth and ContractRegistryAccess.
   */
  function _getContract(bytes32 _name) internal view override(ACLAuth, ContractRegistryAccess) returns (address) {
    return super._getContract(_name);
  }
}

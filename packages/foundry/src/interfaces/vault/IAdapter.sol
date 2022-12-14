// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;

import { IOwned } from "../IOwned.sol";
import { IERC4626 } from "./IERC4626.sol";
import { IPermit } from "../IPermit.sol";
import { IPausable } from "../IPausable.sol";

interface IAdapter is IERC4626, IOwned, IPermit, IPausable {
  function strategyConfig() external view returns (bytes memory);

  function strategyDeposit(uint256 assets, uint256 shares) external;

  function strategyWithdraw(uint256 assets, uint256 shares) external;

  function supportsInterface(bytes4 interfaceId) external view returns (bool);

  function setManagementFee(uint256 fee) external;

  function managementFee() external view returns (uint256);

  function initialize(bytes memory adapterBaseData, address externalRegistry, bytes memory adapterData) external;
}
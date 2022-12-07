// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;

import { IOwned } from "../IOwned.sol";

interface IFeeProxy is IOwned {
  // TODO change interface
  function execute() external;
}

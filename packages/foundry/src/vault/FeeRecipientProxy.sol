// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15
pragma solidity ^0.8.15;

import { Owned } from "../utils/Owned.sol";

contract FeeRecipientProxy is Owned {
  constructor(address owner) Owned(owner) {}

  // TODO return success and response
  function execute(address target, bytes memory callData) external onlyOwner {
    target.call(callData);
  }
}

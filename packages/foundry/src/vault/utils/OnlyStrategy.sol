// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

contract OnlyStrategy {
  error OnlyStrategy(address sender);

  modifier onlyStrategy() {
    if (msg.sender != address(this)) revert OnlyStrategy(msg.sender);
    _;
  }
}

// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;

interface IEndorsementRegistry {
  function endorsed(address target) external view returns (bool);
}

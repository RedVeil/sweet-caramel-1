// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IGrantRegistry {
  function createGrant(
    uint8,
    address[] calldata,
    uint256[] calldata
  ) external;
}

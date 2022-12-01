// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

contract EIP165 {
  mapping(bytes4 => bool) internal hasFunc;

  function isFunctionImplemented(bytes4 sig) external view returns (bool) {
    return hasFunc[sig];
  }

  function _addFunctionSignatures() internal virtual {}
}

// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

contract IEIP165 {
  function supportsInterface(bytes4 interfaceId) public view virtual returns (bool);
}

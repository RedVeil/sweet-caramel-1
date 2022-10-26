// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract MultiDelegatecall {
  error DelegatecallFailed();

  function multiDelegatecall(address[] memory addresses, bytes[] memory data)
    external
    payable
    returns (bytes[] memory results)
  {
    results = new bytes[](data.length);

    for (uint256 i; i < data.length; i++) {
      (bool ok, bytes memory res) = address(addresses[i]).delegatecall(data[i]);
      if (!ok) {
        revert DelegatecallFailed();
      }
      results[i] = res;
    }
  }
}

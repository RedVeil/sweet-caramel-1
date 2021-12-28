// SPDX-License-Identifier: MIT

pragma solidity >0.6.0;

interface IRewardsEscrow {
  function lock(
    address _address,
    uint256 _amount,
    uint256 duration
  ) external;
}

// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0

pragma solidity ^0.8.0;

import "openzeppelin-contracts/token/ERC20/IERC20.sol";

interface IRewardsEscrow {
  function authorized(address _user) external view returns (bool);

  function lock(IERC20 token, address user, uint256 amount, uint256 duration, uint256 offset) external;

  function lock(address user, uint256 amount, uint256 duration) external;

  function addAuthorizedContract(address _staking) external;

  function removeAuthorizedContract(address _staking) external;
}

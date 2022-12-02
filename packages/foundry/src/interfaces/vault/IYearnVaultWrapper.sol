// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.12;

interface IYearnVaultWrapper {
  error NoAvailableShares();
  error NotEnoughAvailableSharesForAmount();

  function vault() external view returns (address);
}

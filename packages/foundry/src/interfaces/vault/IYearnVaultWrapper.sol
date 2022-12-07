// SPDX-License-Identifier: AGPL-3.0-only
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;

interface IYearnVaultWrapper is IPopERC4626 {
  error NoAvailableShares();
  error NotEnoughAvailableSharesForAmount();

  function vault() external view returns (address);
}

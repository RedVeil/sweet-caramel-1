// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.15;

interface ICToken {
  /**
   * @dev Returns the address of the underlying asset of this cToken
   **/
  function underlying() external view returns (address);

  /**
   * @dev Returns the symbol of this cToken
   **/
  function symbol() external view returns (string memory);

  /**
   * @dev Returns the address of the comptroller
   **/
  function comptroller() external view returns (address);

  function balanceOf(address) external view returns (uint256);

  /**
   * @dev Send underlying to mint cToken.
   **/
  function mint(uint256) external;

  function redeem(uint256) external;
}

interface IComptroller {
  /**
   * @dev Returns the address of the underlying asset of this cToken
   **/
  function getCompAddress() external view returns (address);

  /**
   * @dev Returns the address of the underlying asset of this cToken
   **/
  function compSpeeds(address) external view returns (uint256);
}

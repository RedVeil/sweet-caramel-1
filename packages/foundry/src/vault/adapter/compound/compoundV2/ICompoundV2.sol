// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.15;

import { LibFuse, CToken } from "../../../../../lib/libcompound/src/LibFuse.sol";

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

  // function underlyingBalanceOf(address, address) external view returns (uint256) {
  //   CToken token = CToken(token);
  //   return LibFuse.viewUnderlyingBalanceOf(token, user);
  // }

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

  /**
   * @dev Returns the isListed, collateralFactorMantissa, and isCompred of the cToken market
   **/
  function markets(address)
    external
    view
    returns (
      bool,
      uint256,
      bool
    );
}

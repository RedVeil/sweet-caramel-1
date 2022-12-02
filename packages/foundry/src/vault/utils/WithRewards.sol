// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import { EIP165 } from "./EIP165.sol";
import { OnlyStrategy } from "./OnlyStrategy.sol";
import { IPopERC4626WithRewards } from "../../interfaces/vault/IPopERC4626WithRewards.sol";

contract WithRewards is EIP165, OnlyStrategy {
  function rewardTokens() external view virtual returns (address[] memory) {}

  function claim() public virtual onlyStrategy {}

  /*//////////////////////////////////////////////////////////////
                      EIP-165 LOGIC
  //////////////////////////////////////////////////////////////*/

  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId == type(IPopERC4626WithRewards).interfaceId;
  }
}

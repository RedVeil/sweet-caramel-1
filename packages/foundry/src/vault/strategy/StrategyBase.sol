// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import { IPopERC4626 } from "../../interfaces/vault/IPopERC4626.sol";

contract StrategyBase {
  error FunctionNotImplemented(bytes4 sig);

  function verifyAndSetupStrategy() public {
    bytes memory strategyConfig = IPopERC4626(address(this)).strategyConfig();
    _verifyAdapterCompatibility(strategyConfig);
    _setUpStrategy(strategyConfig);
  }

  function _verifyAdapterCompatibility(bytes memory data) internal virtual {}

  function _setUpStrategy(bytes memory data) internal virtual {}

  function harvest() public virtual {}
}

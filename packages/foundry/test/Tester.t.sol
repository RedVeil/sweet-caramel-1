// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;
import { Test } from "forge-std/Test.sol";
import { Math } from "openzeppelin-contracts/utils/math/Math.sol";
import { MockERC20 } from "./utils/mocks/MockERC20.sol";
import { SafeCastLib } from "solmate/utils/SafeCastLib.sol";

contract Tester is Test {
  function calcDep(
    uint256 amount,
    uint256 totalAssets,
    uint256 totalSupply,
    bool roundUp
  ) internal view returns (uint256 share) {
    totalAssets++;
    totalSupply += 1e8;

    // Calculte the shares using te current amount to share ratio
    share = (amount * totalSupply) / totalAssets;

    // Default is to round down (Solidity), round up if required
    if (roundUp && (share * totalAssets) / totalSupply < amount) {
      share++;
    }
  }

  function setUp() public {}

  function test__yieldBox() public {
    uint256 share1 = calcDep(1, 0, 0, true);
    uint256 share2 = calcDep(1, 0, 0, false);
    emit log_named_uint("share1", share1);
    emit log_named_uint("share2", share2);
    uint256 share3 = calcDep(1e18, 0, 0, true);
    emit log_named_uint("share3", share3);
    uint256 share4 = calcDep(1e18, 1e18, 1e18, true);
    emit log_named_uint("share4", share4);
  }

  function test__max() public {
    emit log_uint(type(uint256).max);
    emit log_uint(type(uint256).max / 1e8);
  }
}

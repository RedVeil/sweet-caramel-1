// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import { YearnWrapper } from "../../../../contracts/core/defi/vault/wrapper/yearn/YearnWrapper.sol";
import { VaultAPI } from "../../../../contracts/externals/interfaces/yearn/IVaultAPI.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

address constant YEARN_VAULT = 0xE537B5cc158EB71037D4125BDD7538421981E6AA;
address constant YEARN_USDC_VAULT = 0xa354F35829Ae975e850e23e9615b11Da1B3dC4DE;
address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;

contract YearnWrapperTest is Test {
  function test__totalAssets() public {
    YearnWrapper yearnWrapper = new YearnWrapper();
    yearnWrapper.initialize(VaultAPI(YEARN_USDC_VAULT));
    deal(address(yearnWrapper.yVault().token()), address(this), 100e6);
    IERC20(yearnWrapper.yVault().token()).approve(address(yearnWrapper), 100e6);
    yearnWrapper.deposit(100e6, address(this));
    assertEq(
      (yearnWrapper.yVault().balanceOf(address(yearnWrapper))) * yearnWrapper.yVault().pricePerShare() * 1e6,
      yearnWrapper.totalAssets()
    );
  }

  function test__converToShares() public {
    YearnWrapper yearnWrapper = new YearnWrapper();
    yearnWrapper.initialize(VaultAPI(YEARN_USDC_VAULT));
    assertEq(yearnWrapper.convertToShares(100e6), (100e6 * 1e12) / (yearnWrapper.yVault().pricePerShare()));
  }
}

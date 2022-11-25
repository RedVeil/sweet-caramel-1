// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.10;

import { MidasERC4626 } from "./MidasERC4626.sol";
import { FixedPointMathLib } from "../../utils/FixedPointMathLib.sol";

import { ERC20Upgradeable } from "openzeppelin-contracts-upgradeable/contracts/token/ERC20/ERC20Upgradeable.sol";

interface IBeefyVault {
  function want() external view returns (ERC20Upgradeable);

  function deposit(uint256 _amount) external;

  function withdraw(uint256 _shares) external;

  function withdrawAll() external;

  function balanceOf(address _account) external view returns (uint256);

  //Returns total balance of underlying token in the vault and its strategies
  function balance() external view returns (uint256);

  function totalSupply() external view returns (uint256);

  function earn() external;

  function getPricePerFullShare() external view returns (uint256);

  function strategy() external view returns (address);
}

interface IBeefyBooster {
  function earned(address _account) external view returns (uint256);

  function balanceOf(address _account) external view returns (uint256);

  function stakedToken() external view returns (address);

  function rewardToken() external view returns (address);

  function periodFinish() external view returns (uint256);

  function stake(uint256 _amount) external;

  function withdraw(uint256 _shares) external;

  function exit() external;

  function getReward() external;
}

interface IBeefyBalanceCheck {
  function balanceOf(address _account) external view returns (uint256);
}

/**
 * @title Beefy ERC4626 Contract
 * @notice ERC4626 wrapper for beefy vaults
 * @author RedVeil
 *
 * Wraps https://github.com/beefyfinance/beefy-contracts/blob/master/contracts/BIFI/vaults/BeefyVaultV6.sol
 */
contract BeefyERC4626 is MidasERC4626 {
  using FixedPointMathLib for uint256;

  /* ========== STATE VARIABLES ========== */

  IBeefyVault public beefyVault;
  IBeefyBooster public beefyBooster;
  IBeefyBalanceCheck public beefyBalanceCheck;
  uint256 public withdrawalFee;

  uint256 BPS_DENOMINATOR;

  /* ========== INITIALIZER ========== */

  /**
     @notice Initializes the Vault.
     @param asset The ERC20 compliant token the Vault should accept.
     @param _beefyVault The Beefy Vault contract.
     @param _withdrawalFee of the beefyVault in BPS
    */
  function initialize(
    ERC20Upgradeable asset,
    IBeefyVault _beefyVault,
    IBeefyBooster _beefyBooster,
    uint256 _withdrawalFee
  ) public initializer {
    __MidasER4626_init(asset);

    BPS_DENOMINATOR = 10_000;
    performanceFee = 5e16;
    beefyVault = _beefyVault;
    beefyBooster = _beefyBooster;
    withdrawalFee = _withdrawalFee;

    beefyBalanceCheck = IBeefyBalanceCheck(address(_beefyBooster == address(0) ? _beefyVault : _beefyBooster));

    asset.approve(address(beefyVault), type(uint256).max);
  }

  /* ========== VIEWS ========== */

  /// @notice Calculates the total amount of underlying tokens the Vault holds.
  /// @return The total amount of underlying tokens the Vault holds.
  function totalAssets() public view override returns (uint256) {
    return
      paused()
        ? _asset().balanceOf(address(this))
        : beefyBalanceCheck.balanceOf(address(this)).mulDivUp(beefyVault.balance(), beefyVault.totalSupply());
  }

  /// @notice Calculates the total amount of underlying tokens the account holds.
  /// @return The total amount of underlying tokens the account holds.
  function balanceOfUnderlying(address account) public view returns (uint256) {
    return convertToAssets(balanceOf(account));
  }

  /* ========== INTERNAL FUNCTIONS ========== */

  function afterDeposit(uint256 amount, uint256) internal override {
    beefyVault.deposit(amount);
    if (beefyBooster != address(0)) beefyBooster.stake(beefyVault.balanceOf(address(this)));
  }

  // takes as argument the internal ERC4626 shares to redeem
  // returns the external BeefyVault shares to withdraw
  function convertToBeefyVaultShares(uint256 shares) public view returns (uint256) {
    uint256 supply = totalSupply();
    return supply == 0 ? shares : shares.mulDivUp(beefyBalanceCheck.balanceOf(address(this)), supply);
  }

  // takes as argument the internal ERC4626 shares to redeem
  function beforeWithdraw(uint256, uint256 shares) internal override {
    if (beefyBooster != address(0)) beefyBooster.withdraw(shares);
    beefyVault.withdraw(convertToBeefyVaultShares(shares));
  }

  /* ========== EMERGENCY FUNCTIONS ========== */

  function emergencyWithdrawAndPause() external override onlyOwner {
    beefyVault.withdraw(beefyVault.balanceOf(address(this)));
    _pause();
  }

  function unpause() external override onlyOwner {
    _unpause();
    beefyVault.deposit(_asset().balanceOf(address(this)));
  }
}

// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import { PopERC4626, ERC20, SafeERC20, Math } from "../../utils/PopERC4626.sol";

interface IBeefyVault {
  function want() external view returns (ERC20);

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

  function rewardPerToken() external view returns (uint256);

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
contract BeefyERC4626 is PopERC4626 {
  using SafeERC20 for ERC20;
  using Math for uint256;

  /*//////////////////////////////////////////////////////////////
                               IMMUTABLES
    //////////////////////////////////////////////////////////////*/

  IBeefyVault public beefyVault;
  IBeefyBooster public beefyBooster;
  IBeefyBalanceCheck public beefyBalanceCheck;

  uint256 public withdrawalFee;

  /**
     @notice Initializes the Vault.
     @param asset The ERC20 compliant token the Vault should accept.
     @param _beefyVault The Beefy Vault contract.
     @param _withdrawalFee of the beefyVault in BPS
    */
  function initialize(
    ERC20 asset,
    IBeefyVault _beefyVault,
    IBeefyBooster _beefyBooster,
    uint256 _withdrawalFee
  ) public {
    __PopERC4626_init(asset);

    beefyVault = _beefyVault;
    beefyBooster = _beefyBooster;
    withdrawalFee = _withdrawalFee;

    beefyBalanceCheck = IBeefyBalanceCheck(
      address(_beefyBooster) == address(0) ? address(_beefyVault) : address(_beefyBooster)
    );

    asset.approve(address(beefyVault), type(uint256).max);

    if (address(_beefyBooster) != address(0))
      ERC20(address(_beefyVault)).approve(address(_beefyBooster), type(uint256).max);
  }

  /*//////////////////////////////////////////////////////////////
                            ACCOUNTING LOGIC
    //////////////////////////////////////////////////////////////*/

  /// @notice Calculates the total amount of underlying tokens the Vault holds.
  /// @return The total amount of underlying tokens the Vault holds.
  function totalAssets() public view override returns (uint256) {
    return
      beefyBalanceCheck.balanceOf(address(this)).mulDiv(
        beefyVault.balance(),
        beefyVault.totalSupply(),
        Math.Rounding.Up
      );
  }

  // takes as argument the internal ERC4626 shares to redeem
  // returns the external BeefyVault shares to withdraw
  function convertToBeefyVaultShares(uint256 shares) public view returns (uint256) {
    uint256 supply = totalSupply();
    return supply == 0 ? shares : shares.mulDiv(beefyBalanceCheck.balanceOf(address(this)), supply, Math.Rounding.Up);
  }

  /*//////////////////////////////////////////////////////////////
                          INTERNAL HOOKS LOGIC
    //////////////////////////////////////////////////////////////*/

  function afterDeposit(uint256 amount, uint256) internal virtual override {
    beefyVault.deposit(amount);
    if (address(beefyBooster) != address(0)) beefyBooster.stake(beefyVault.balanceOf(address(this)));
  }

  // takes as argument the internal ERC4626 shares to redeem
  function beforeWithdraw(uint256, uint256 shares) internal virtual override {
    if (address(beefyBooster) != address(0)) beefyBooster.withdraw(shares);
    beefyVault.withdraw(convertToBeefyVaultShares(shares));
  }
}

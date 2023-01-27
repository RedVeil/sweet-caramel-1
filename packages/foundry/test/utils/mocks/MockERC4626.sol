// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15
pragma solidity ^0.8.15;

import { IERC4626, IERC20 } from "../../../src/interfaces/vault/IERC4626.sol";
import { ERC20 } from "openzeppelin-contracts/token/ERC20/ERC20.sol";
import { IERC20Metadata } from "openzeppelin-contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { SafeERC20Upgradeable as SafeERC20 } from "openzeppelin-contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { Math } from "openzeppelin-contracts/utils/math/Math.sol";

contract MockERC4626 is ERC20 {
  using SafeERC20 for IERC20;
  using Math for uint256;

  uint256 public beforeWithdrawHookCalledCounter = 0;
  uint256 public afterDepositHookCalledCounter = 0;

  uint8 internal _decimals;

  /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

  event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);

  event Withdraw(
    address indexed caller,
    address indexed receiver,
    address indexed owner,
    uint256 assets,
    uint256 shares
  );

  /*//////////////////////////////////////////////////////////////
                               IMMUTABLES
    //////////////////////////////////////////////////////////////*/

  IERC20 public immutable asset;

  constructor(
    IERC20 _asset,
    string memory _name,
    string memory _symbol
  ) ERC20(_name, _symbol) {
    asset = _asset;

    _decimals = IERC20Metadata(address(_asset)).decimals();
  }

  /*//////////////////////////////////////////////////////////////
                            GENERAL VIEWS
    //////////////////////////////////////////////////////////////*/

  function decimals() public view override returns (uint8) {
    return _decimals;
  }

  /*//////////////////////////////////////////////////////////////
                        DEPOSIT/WITHDRAWAL LOGIC
    //////////////////////////////////////////////////////////////*/

  function deposit(uint256 assets, address receiver) public virtual returns (uint256 shares) {
    // Check for rounding error since we round down in previewDeposit.
    require((shares = previewDeposit(assets)) != 0, "ZERO_SHARES");

    // Need to transfer before minting or ERC777s could reenter.
    asset.safeTransferFrom(msg.sender, address(this), assets);

    _mint(receiver, shares);

    emit Deposit(msg.sender, receiver, assets, shares);

    afterDeposit(assets, shares);
  }

  function mint(uint256 shares, address receiver) public virtual returns (uint256 assets) {
    assets = previewMint(shares); // No need to check for rounding error, previewMint rounds up.

    // Need to transfer before minting or ERC777s could reenter.
    asset.safeTransferFrom(msg.sender, address(this), assets);

    _mint(receiver, shares);

    emit Deposit(msg.sender, receiver, assets, shares);

    afterDeposit(assets, shares);
  }

  function withdraw(
    uint256 assets,
    address receiver,
    address owner
  ) public virtual returns (uint256 shares) {
    shares = previewWithdraw(assets); // No need to check for rounding error, previewWithdraw rounds up.

    if (msg.sender != owner) _approve(owner, msg.sender, allowance(owner, msg.sender) - shares);

    beforeWithdraw(assets, shares);

    _burn(owner, shares);

    emit Withdraw(msg.sender, receiver, owner, assets, shares);

    asset.safeTransfer(receiver, assets);
  }

  function redeem(
    uint256 shares,
    address receiver,
    address owner
  ) public virtual returns (uint256 assets) {
    if (msg.sender != owner) _approve(owner, msg.sender, allowance(owner, msg.sender) - shares);

    // Check for rounding error since we round down in previewRedeem.
    require((assets = previewRedeem(shares)) != 0, "ZERO_ASSETS");

    beforeWithdraw(assets, shares);

    _burn(owner, shares);

    emit Withdraw(msg.sender, receiver, owner, assets, shares);

    asset.safeTransfer(receiver, assets);
  }

  /*//////////////////////////////////////////////////////////////
                            ACCOUNTING LOGIC
    //////////////////////////////////////////////////////////////*/

  function totalAssets() public view returns (uint256) {
    return asset.balanceOf(address(this));
  }

  /// @notice See _previewDeposit natspec
  function previewDeposit(uint256 assets) public view returns (uint256) {
    return _previewDeposit(assets);
  }

  /**
   * @notice Simulate the effects of a deposit at the current block, given current on-chain conditions.
   * @dev Return 0 if paused since no further deposits are allowed.
   * @dev Override this function if the underlying protocol has a unique deposit logic and/or deposit fees.
   */
  function _previewDeposit(uint256 assets) internal view returns (uint256) {
    return _convertToShares(assets, Math.Rounding.Down);
  }

  /// @notice See _previewMint natspec
  function previewMint(uint256 shares) public view returns (uint256) {
    return _previewMint(shares);
  }

  /**
   * @notice Simulate the effects of a mint at the current block, given current on-chain conditions.
   * @dev Return 0 if paused since no further deposits are allowed.
   * @dev Override this function if the underlying protocol has a unique deposit logic and/or deposit fees.
   */
  function _previewMint(uint256 shares) internal view returns (uint256) {
    return _convertToAssets(shares, Math.Rounding.Up);
  }

  /// @notice See _previewWithdraw natspec
  function previewWithdraw(uint256 assets) public view returns (uint256) {
    return _previewWithdraw(assets);
  }

  /**
   * @notice Simulate the effects of a withdraw at the current block, given current on-chain conditions.
   * @dev Override this function if the underlying protocol has a unique withdrawal logic and/or withdraw fees.
   */
  function _previewWithdraw(uint256 assets) internal view returns (uint256) {
    return _convertToShares(assets, Math.Rounding.Up);
  }

  /// @notice See _previewRedeem natspec
  function previewRedeem(uint256 shares) public view returns (uint256) {
    return _previewRedeem(shares);
  }

  /**
   * @notice Simulate the effects of a redeem at the current block, given current on-chain conditions.
   * @dev Override this function if the underlying protocol has a unique redeem logic and/or redeem fees.
   */
  function _previewRedeem(uint256 shares) internal view returns (uint256) {
    return _convertToAssets(shares, Math.Rounding.Down);
  }

  function convertToShares(uint256 assets) public view returns (uint256) {
    return _convertToShares(assets, Math.Rounding.Down);
  }

  /**
   * @notice Amount of shares the vault would exchange for given amount of assets, in an ideal scenario.
   * @dev Added totalAssets() check to prevent division by zero in case of rounding issues. (off-by-one issue)
   */
  function _convertToShares(uint256 assets, Math.Rounding rounding) internal view returns (uint256 shares) {
    return assets.mulDiv(totalSupply() + 1e8, totalAssets() + 1, rounding);
  }

  function convertToAssets(uint256 shares) public view returns (uint256) {
    return _convertToAssets(shares, Math.Rounding.Down);
  }

  /**
   * @notice Amount of assets the vault would exchange for given amount of shares, in an ideal scenario.
   * @param shares Exact amount of shares
   * @return Exact amount of assets
   */
  function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view returns (uint256) {
    return shares.mulDiv(totalAssets() + 1, totalSupply() + 1e8, rounding);
  }

  /*//////////////////////////////////////////////////////////////
                     DEPOSIT/WITHDRAWAL LIMIT LOGIC
    //////////////////////////////////////////////////////////////*/

  function maxDeposit(address) public view virtual returns (uint256) {
    return type(uint256).max;
  }

  function maxMint(address) public view virtual returns (uint256) {
    return type(uint256).max;
  }

  function maxWithdraw(address owner) public view virtual returns (uint256) {
    return convertToAssets(this.balanceOf(owner));
  }

  function maxRedeem(address owner) public view virtual returns (uint256) {
    return this.balanceOf(owner);
  }

  /*//////////////////////////////////////////////////////////////
                          INTERNAL HOOKS LOGIC
    //////////////////////////////////////////////////////////////*/

  function beforeWithdraw(uint256, uint256) internal {
    beforeWithdrawHookCalledCounter++;
  }

  function afterDeposit(uint256, uint256) internal {
    afterDepositHookCalledCounter++;
  }
}

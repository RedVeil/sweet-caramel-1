// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;

import { AdapterBase, IERC20, IERC20Metadata, SafeERC20, ERC20, Math, IStrategy, IAdapter } from "../../abstracts/AdapterBase.sol";
import { WithRewards, IWithRewards } from "../../abstracts/WithRewards.sol";
import { ILendingPool, IAaveMining, IAToken } from "./IAaveV2.sol";

/**
 * @title   AaveV2 Adapter
 * @author  amatureApe
 * @notice  ERC4626 wrapper for AaveV2 Vaults.
 *
 * An ERC4626 compliant Wrapper for https://github.com/aave/protocol-v2/blob/master/contracts/protocol/lendingpool/LendingPool.sol.
 * Allows wrapping AaveV2 aTokens with or without an active Liquidity Mining.
 * Allows for additional strategies to use rewardsToken in case of an active Liquidity Mining.
 */

contract AaveV2Adapter is AdapterBase, WithRewards {
  using SafeERC20 for IERC20;
  using Math for uint256;

  string internal _name;
  string internal _symbol;

  // @notice The Aave aToken contract
  IAToken public aToken;

  // @notice The Aave liquidity mining contract
  IAaveMining public aaveMining;

  // @notice Check to see if Aave liquidity mining is active
  bool public isActiveMining;

  // @notice The Aave LendingPool contract
  ILendingPool public lendingPool;

  /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

  /**
   * @notice Initialize a new AaveV2 Adapter.
   * @param adapterInitData Encoded data for the base adapter initialization.
   * @param _aToken Aave wrapped asset. Can also be used to get lendingPool and aaveMining.
   * @dev `_aToken` - The underlying asset supplied to and wrapped by Aave.
   * @dev `_lendingPool` - The lending pool.
   * @dev `_aaveMining` - An optional liquidity mining contract to boost yield.
   * @dev This function is called by the factory contract when deploying a new vault.
   */
  function initialize(
    bytes memory adapterInitData,
    address,
    address _aToken
  ) public {
    __AdapterBase_init(adapterInitData);

    _name = string.concat("Popcorn AaveV2", IERC20Metadata(asset()).name(), " Adapter");
    _symbol = string.concat("popB-", IERC20Metadata(asset()).symbol());

    aToken = IAToken(_aToken);
    lendingPool = ILendingPool(aToken.POOL());
    aaveMining = IAaveMining(aToken.getIncentivesController());

    IERC20(asset()).approve(address(lendingPool), type(uint256).max);

    uint256 emission;
    if (address(aaveMining) != address(0)) {
      (, emission, ) = aaveMining.getAssetData(asset());
    }

    isActiveMining = emission > 0 ? true : false;
  }

  /*//////////////////////////////////////////////////////////////
                            ACCOUNTING LOGIC
  //////////////////////////////////////////////////////////////*/

  function totalAssets() public view override returns (uint256) {
    return paused() ? IERC20(asset()).balanceOf(address(this)) : aToken.balanceOf(address(this));
  }

  /// @notice The amount of aave shares to withdraw given an mount of adapter shares
  function convertToUnderlyingShares(uint256, uint256 shares) public view override returns (uint256) {
    uint256 supply = totalSupply();
    return supply == 0 ? shares : shares.mulDiv(aToken.balanceOf(address(this)), supply, Math.Rounding.Up);
  }

  /// @notice The token rewarded if the aave liquidity mining is active
  function rewardTokens() external view override returns (address[] memory) {
    address[] memory _rewardTokens = new address[](1);
    if (isActiveMining == false) return _rewardTokens;
    _rewardTokens[0] = aaveMining.REWARD_TOKEN();
    return _rewardTokens;
  }

  /*//////////////////////////////////////////////////////////////
                        ACCOUNTING LOGIC
    //////////////////////////////////////////////////////////////*/

  function previewWithdraw(uint256 assets) public view override returns (uint256) {
    return _convertToShares(assets, Math.Rounding.Down);
  }

  function previewRedeem(uint256 shares) public view override returns (uint256) {
    return _convertToAssets(shares, Math.Rounding.Down);
  }

  /*//////////////////////////////////////////////////////////////
                          INTERNAL HOOKS LOGIC
    //////////////////////////////////////////////////////////////*/

  /// @notice Deposit into aave lending pool
  function _protocolDeposit(uint256 amount, uint256) internal virtual override {
    lendingPool.deposit(asset(), amount, address(this), 0);
  }

  /// @notice Withdraw from lending pool
  function _protocolWithdraw(uint256, uint256 shares) internal virtual override {
    uint256 aaveShares = convertToUnderlyingShares(0, shares);
    lendingPool.withdraw(asset(), shares, address(this));
  }

  /*//////////////////////////////////////////////////////////////
                            STRATEGY LOGIC
    //////////////////////////////////////////////////////////////*/

  error MiningNotActive();

  /// @notice Claim liquidity mining rewards given that it's active
  function claim() public override onlyStrategy {
    address[] memory assets = new address[](1);
    assets[0] = address(aToken);
    if (isActiveMining == false) revert MiningNotActive();
    aaveMining.claimRewards(assets, type(uint256).max, address(this));
  }

  /*//////////////////////////////////////////////////////////////
                      EIP-165 LOGIC
  //////////////////////////////////////////////////////////////*/

  function supportsInterface(bytes4 interfaceId) public pure override(WithRewards, AdapterBase) returns (bool) {
    return interfaceId == type(IWithRewards).interfaceId || interfaceId == type(IAdapter).interfaceId;
  }
}

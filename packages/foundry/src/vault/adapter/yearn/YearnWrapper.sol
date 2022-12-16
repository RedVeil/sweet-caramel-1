// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.12;

import { AdapterBase, IERC20, IERC20Metadata, ERC20, SafeERC20, Math, IStrategy, IAdapter } from "../../utils/AdapterBase.sol";

interface VaultAPI is IERC20 {
  function deposit(uint256 amount) external returns (uint256);

  function withdraw(uint256 maxShares) external returns (uint256);

  function pricePerShare() external view returns (uint256);

  function totalAssets() external view returns (uint256);

  function depositLimit() external view returns (uint256);
}

interface IYearnRegistry {
  function latestVault(address token) external view returns (address);
}

contract YearnWrapper is AdapterBase {
  using SafeERC20 for IERC20;
  using Math for uint256;

  /*//////////////////////////////////////////////////////////////
                          IMMUTABLES
  //////////////////////////////////////////////////////////////*/

  string internal _name;
  string internal _symbol;

  VaultAPI public yVault;

  function initialize(
    bytes memory adapterInitData,
    address externalRegistry,
    bytes memory
  ) external {
    (address _asset, , , , , ) = abi.decode(adapterInitData, (address, address, address, uint256, bytes4[8], bytes));
    __AdapterBase_init(adapterInitData);

    yVault = VaultAPI(IYearnRegistry(externalRegistry).latestVault(_asset));

    _name = string.concat("Popcorn Yearn", IERC20Metadata(asset()).name(), " Adapter");
    _symbol = string.concat("popY-", IERC20Metadata(asset()).symbol());

    IERC20(_asset).approve(address(yVault), type(uint256).max);
  }

  function name() public view override(IERC20Metadata, ERC20) returns (string memory) {
    return _name;
  }

  function symbol() public view override(IERC20Metadata, ERC20) returns (string memory) {
    return _symbol;
  }

  /*//////////////////////////////////////////////////////////////
                          ACCOUNTING LOGIC
  //////////////////////////////////////////////////////////////*/

  function totalAssets() public view override returns (uint256) {
    return yVault.balanceOf(address(this)).mulDiv(yVault.pricePerShare(), 10**decimals(), Math.Rounding.Down);
  }

  function convertToShares(uint256 assets) public view override returns (uint256) {
    return assets.mulDiv(10**decimals(), yVault.pricePerShare(), Math.Rounding.Down);
  }

  function convertToAssets(uint256 shares) public view override returns (uint256) {
    return shares.mulDiv(yVault.pricePerShare(), 10**decimals(), Math.Rounding.Down);
  }

  function previewDeposit(uint256 assets) public view override returns (uint256) {
    return convertToShares(assets).mulDiv(9999, 10_000, Math.Rounding.Down); // return less
  }

  function previewMint(uint256 shares) public view override returns (uint256) {
    return
      shares.mulDiv(yVault.pricePerShare(), 10**decimals(), Math.Rounding.Up).mulDiv(9999, 10_000, Math.Rounding.Down); // return less
  }

  function previewWithdraw(uint256 assets) public view override returns (uint256) {
    return
      assets.mulDiv(10**decimals(), yVault.pricePerShare(), Math.Rounding.Up).mulDiv(10_000, 9999, Math.Rounding.Down); // return more
  }

  function previewRedeem(uint256 shares) public view override returns (uint256) {
    return convertToAssets(shares).mulDiv(10_000, 9999, Math.Rounding.Down); // return more
  }

  /*//////////////////////////////////////////////////////////////
                    DEPOSIT/WITHDRAWAL LIMIT LOGIC
  //////////////////////////////////////////////////////////////*/

  function maxDeposit(address) public view override returns (uint256) {
    VaultAPI _bestVault = yVault;
    uint256 _totalAssets = _bestVault.totalAssets();
    uint256 _depositLimit = _bestVault.depositLimit();
    if (_totalAssets >= _depositLimit) return 0;
    return _depositLimit - _totalAssets;
  }

  /*//////////////////////////////////////////////////////////////
                          INTERNAL HOOKS LOGIC
    //////////////////////////////////////////////////////////////*/

  function _protocolDeposit(uint256 amount, uint256) internal virtual override {
    yVault.deposit(amount);
  }

  function _protocolWithdraw(uint256 amount, uint256) internal virtual override {
    yVault.withdraw(amount);
  }
}

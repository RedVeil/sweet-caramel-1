// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../utils/ACLAuth.sol";
import "../utils/ContractRegistryAccess.sol";
import "../interfaces/IEIP4626.sol";
import "../interfaces/IVaultFeeController.sol";

import "hardhat/console.sol";

interface IZapIn {
  function ZapIn(
    address fromTokenAddress,
    address toTokenAddress,
    address swapAddress,
    uint256 incomingTokenQty,
    uint256 minPoolTokens,
    address swapTarget,
    bytes calldata swapData,
    address affiliate
  ) external payable returns (uint256);
}

interface IZapOut {
  function ZapOut(
    address swapAddress,
    uint256 incomingCrv,
    address intermediateToken,
    address toToken,
    uint256 minToTokens,
    address _swapTarget,
    bytes calldata _swapCallData,
    address affiliate,
    bool shouldSellEntireBalance
  ) external returns (uint256);
}

interface IVault is IEIP4626 {
  function deposit(uint256 assets, address receiver) external returns (uint256);

  function redeem(
    uint256 assets,
    address receiver,
    address owner
  ) external returns (uint256);

  function asset() external view returns (address);
}

interface ICurve {
  function calc_withdraw_one_coin(uint256 amount, int128 i) external view returns (uint256);

  function remove_liquidity_one_coin(
    uint256 burn_amount,
    int128 i,
    uint256 min_amount
  ) external;
}

contract ZeroXZapper is ACLAuth, ContractRegistryAccess {
  using SafeERC20 for IERC20;

  struct VaultConfig {
    address vault;
    address zapper;
  }

  struct GlobalFee {
    uint256 inBps;
    uint256 outBps;
  }

  struct Fee {
    bool useAssetFee;
    uint256 accumulated;
    uint256 inBps;
    uint256 outBps;
  }

  /* ========== STATE VARIABLES ========== */

  IZapIn constant zapperIn = IZapIn(0x5Ce9b49B7A1bE9f2c3DC2B2A5BaCEA56fa21FBeE);
  IZapOut constant zapperOut = IZapOut(0xE03A338d5c305613AfC3877389DD3B0617233387);

  bytes32 constant FEE_CONTROLLER_ID = keccak256("VaultFeeController");

  mapping(address => address) internal vaults;
  mapping(address => Fee) public fees;
  GlobalFee public globalFee;

  /* ========== EVENTS ========== */

  event FeeUpdated(address indexed vaultAsset, bool useAssetFee, uint256 inBps, uint256 outBps);
  event GlobalFeeUpdated(uint256 inBps, uint256 outBps);
  event UpdatedVault(address indexed vaultAsset, address vault);
  event RemovedVault(address indexed vaultAsset, address vault);

  /* ========== CONSTRUCTOR ========== */

  constructor(IContractRegistry contractRegistry_) ContractRegistryAccess(contractRegistry_) {}

  /* ========== VIEW FUNCTIONS ========== */

  function previewZapOutTokenAmount(
    address vaultAsset,
    address stableSwap,
    uint256 amount,
    int128 i
  ) public view returns (uint256) {
    address vault = vaults[vaultAsset];
    require(vault != address(0), "Invalid vault");

    uint256 redeemAmount = IVault(vault).previewRedeem(amount);

    Fee memory assetfee = fees[vaultAsset];
    redeemAmount -= (redeemAmount * (assetfee.useAssetFee ? assetfee.outBps : globalFee.outBps)) / 10_000;

    return ICurve(stableSwap).calc_withdraw_one_coin(redeemAmount, i);
  }

  /* ========== ADMIN FUNCTIONS ========== */

  function updateVault(address underlyingToken, address vault) external onlyRole(DAO_ROLE) {
    vaults[underlyingToken] = vault;
    emit UpdatedVault(underlyingToken, vault);
  }

  function removeVault(address underlyingToken) external onlyRole(DAO_ROLE) {
    emit RemovedVault(underlyingToken, vaults[underlyingToken]);
    delete vaults[underlyingToken];
  }

  /**
   * @notice Changes the fee for a certain vault asset
   * @param inBps DepositFee in BPS
   * @param outBps WithdrawlFee in BPS
   * @dev Per default both of these values are not set. Therefore a fee has to be explicitly be set with this function
   */
  function setGlobalFee(uint256 inBps, uint256 outBps) external onlyRole(DAO_ROLE) {
    require(inBps <= 100 && outBps <= 100, "dont be greedy");

    globalFee.inBps = inBps;
    globalFee.outBps = outBps;

    emit GlobalFeeUpdated(inBps, outBps);
  }

  /**
   * @notice Changes the fee for a certain vault asset
   * @param vaultAsset Addres of the underlying asset of a vault
   * @param useAssetFee Switch to toggle an asset specific fee on or off
   * @param inBps DepositFee in BPS
   * @param outBps WithdrawlFee in BPS
   * @dev Per default both of these values are not set. Therefore a fee has to be explicitly be set with this function
   */
  function setFee(
    address vaultAsset,
    bool useAssetFee,
    uint256 inBps,
    uint256 outBps
  ) external onlyRole(DAO_ROLE) {
    require(inBps <= 100 && outBps <= 100, "dont be greedy");

    fees[vaultAsset].useAssetFee = useAssetFee;
    fees[vaultAsset].inBps = inBps;
    fees[vaultAsset].outBps = outBps;

    emit FeeUpdated(vaultAsset, useAssetFee, inBps, outBps);
  }

  function withdrawFees(
    address vaultAsset,
    address pool,
    address intermediateToken,
    address toToken,
    uint256 minToTokens,
    address swapTarget,
    bytes calldata swapCallData
  ) public onlyRole(DAO_ROLE) {
    uint256 feeBal = fees[vaultAsset].accumulated;
    fees[vaultAsset].accumulated = 0;

    IERC20(vaultAsset).approve(address(zapperOut), feeBal);

    uint256 amountOut = zapperOut.ZapOut(
      pool,
      feeBal,
      intermediateToken,
      toToken,
      minToTokens,
      swapTarget,
      swapCallData,
      address(this),
      false
    );

    IERC20(toToken).safeTransfer(IVaultFeeController(_getContract(FEE_CONTROLLER_ID)).feeRecipient(), amountOut);
  }

  /* ========== MAIN FUNCTIONS ========== */

  receive() external payable {}

  function zapIn(
    address fromTokenAddress,
    address toTokenAddress,
    address pool,
    address vaultAsset,
    uint256 incomingTokenQty,
    uint256 minPoolTokens,
    address swapTarget,
    bytes memory swapData
  ) public payable {
    address vault = vaults[vaultAsset];
    require(vault != address(0), "Invalid vault");
    uint256 amountReceived;

    if (fromTokenAddress != address(0)) {
      require(msg.value == 0, "msg.value != 0");
      IERC20 fromToken = IERC20(fromTokenAddress);

      uint256 balanceBefore = fromToken.balanceOf(address(this));
      fromToken.safeTransferFrom(msg.sender, address(this), incomingTokenQty);
      uint256 balanceAfter = fromToken.balanceOf(address(this));

      amountReceived = balanceAfter - balanceBefore;
      fromToken.safeApprove(address(zapperIn), amountReceived);
    }

    uint256 amountOut = zapperIn.ZapIn{ value: msg.value }(
      fromTokenAddress,
      toTokenAddress,
      pool,
      amountReceived,
      minPoolTokens,
      swapTarget,
      swapData,
      address(this)
    );

    Fee memory assetfee = fees[vaultAsset];
    uint256 amountOutAfterFees = _takeFee(
      vaultAsset,
      amountOut,
      assetfee.useAssetFee ? assetfee.inBps : globalFee.inBps
    );

    IERC20(vaultAsset).safeApprove(address(vault), amountOutAfterFees);

    IVault(vault).deposit(amountOutAfterFees, msg.sender);
  }

  function zapOut(
    address vaultAsset,
    address pool,
    uint256 amount,
    address intermediateToken,
    address toToken,
    uint256 minToTokens,
    address swapTarget,
    bytes calldata swapCallData
  ) public {
    address vault = vaults[vaultAsset];
    require(vault != address(0), "Invalid vault");

    IVault(vault).redeem(amount, address(this), msg.sender);

    uint256 withdrawn = IERC20(vaultAsset).balanceOf(address(this));

    Fee memory assetfee = fees[vaultAsset];
    withdrawn = _takeFee(vaultAsset, withdrawn, assetfee.useAssetFee ? assetfee.outBps : globalFee.outBps);

    IERC20(vaultAsset).safeApprove(address(zapperOut), withdrawn);

    uint256 amountOut = zapperOut.ZapOut(
      pool,
      withdrawn,
      intermediateToken,
      toToken,
      minToTokens,
      swapTarget,
      swapCallData,
      address(this),
      false
    );

    if (toToken == address(0)) {
      payable(msg.sender).transfer(amountOut);
    } else {
      IERC20(toToken).safeTransfer(msg.sender, amountOut);
    }
  }

  /* ========== INTERNAL FUNCTIONS ========== */

  function _takeFee(
    address vaultAsset,
    uint256 amountOut,
    uint256 feeBps
  ) internal returns (uint256) {
    uint256 fee = (amountOut * feeBps) / 10_000;

    fees[vaultAsset].accumulated += fee;

    return amountOut - fee;
  }

  function _getContract(bytes32 _name) internal view override(ACLAuth, ContractRegistryAccess) returns (address) {
    return super._getContract(_name);
  }
}

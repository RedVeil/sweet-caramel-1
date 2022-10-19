// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../../utils/ACLAuth.sol";
import "../../utils/ContractRegistryAccess.sol";
import "../../utils/KeeperIncentivized.sol";
import "../../interfaces/IVaultFeeController.sol";
import "../../interfaces/IVaultsV1.sol";
import "../../interfaces/IVaultsV1Zapper.sol";
import "../../interfaces/IZapIn.sol";
import "../../interfaces/IZapOut.sol";
import "../../interfaces/IWETH.sol";
import { VaultMetadata } from "../vault/VaultsV1Registry.sol";

interface IVault is IERC4626 {
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

  function calc_withdraw_one_coin(uint256 amount, uint256 i) external view returns (uint256);

  function remove_liquidity_one_coin(
    uint256 burn_amount,
    int128 i,
    uint256 min_amount
  ) external;

  function remove_liquidity_one_coin(
    uint256 burn_amount,
    uint256 i,
    uint256 min_amount
  ) external;
}

interface IVaultsV1Registry {
  function getVault(address _vaultAddress) external view returns (VaultMetadata memory);
}

contract VaultsV1Zapper is IVaultsV1Zapper, ACLAuth, ContractRegistryAccess, KeeperIncentivized {
  using SafeERC20 for IERC20;

  struct Zaps {
    address zapIn;
    address zapOut;
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

  bytes32 constant FEE_CONTROLLER_ID = keccak256("VaultFeeController");
  bytes32 constant VAULTS_V1_REGISTRY = keccak256("VaultsV1Registry");
  bytes32 constant VAULTS_CONTROLLER = keccak256("VaultsController");

  mapping(address => address) public vaults;
  mapping(address => Zaps) public zaps;
  mapping(address => Fee) public fees;
  mapping(address => KeeperConfig) public keeperConfigs;

  GlobalFee public globalFee;

  /* ========== EVENTS ========== */

  event FeeUpdated(address indexed vaultAsset, bool useAssetFee, uint256 inBps, uint256 outBps);
  event GlobalFeeUpdated(uint256 inBps, uint256 outBps);
  event UpdatedVault(address vaultAsset, address vault);
  event RemovedVault(address vaultAsset, address vault);
  event ZapsUpdated(address zapIn, address zapOut);
  event log(uint256 amount);

  /* ========== CONSTRUCTOR ========== */

  constructor(IContractRegistry contractRegistry_) ContractRegistryAccess(contractRegistry_) {}

  /* ========== VIEW FUNCTIONS ========== */

  function previewZapOutTokenAmount(
    address vaultAsset,
    address stableSwap,
    uint256 amount,
    int128 i
  ) public view override returns (uint256) {
    return ICurve(stableSwap).calc_withdraw_one_coin(_getRedeemAmountForPreview(vaultAsset, amount), i);
  }

  function previewZapOutTokenAmount(
    address vaultAsset,
    address stableSwap,
    uint256 amount,
    uint256 i
  ) public view override returns (uint256) {
    return ICurve(stableSwap).calc_withdraw_one_coin(_getRedeemAmountForPreview(vaultAsset, amount), i);
  }

  function previewRedeemFees(address vaultAsset, uint256 amount) public view override returns (uint256) {
    Fee memory assetfee = fees[vaultAsset];
    return amount - (amount * (assetfee.useAssetFee ? assetfee.outBps : globalFee.outBps)) / 10_000;
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
    bytes memory swapData,
    bool stake
  ) public payable override {
    address vault = vaults[vaultAsset];
    require(vault != address(0), "Invalid vault");
    uint256 amountReceived;

    address zapIn = zaps[vaultAsset].zapIn;

    if (fromTokenAddress != address(0)) {
      require(msg.value == 0, "msg.value != 0");
      IERC20 fromToken = IERC20(fromTokenAddress);

      uint256 balanceBefore = fromToken.balanceOf(address(this));
      fromToken.safeTransferFrom(msg.sender, address(this), incomingTokenQty);
      uint256 balanceAfter = fromToken.balanceOf(address(this));

      amountReceived = balanceAfter - balanceBefore;
      fromToken.safeApprove(zapIn, amountReceived);
    }

    uint256 amountOut = IZapIn(zapIn).ZapIn{ value: msg.value }(
      fromTokenAddress,
      toTokenAddress,
      pool,
      amountReceived,
      minPoolTokens,
      swapTarget,
      swapData,
      address(this)
    );
    emit log(amountOut);
    Fee memory assetfee = fees[vaultAsset];
    uint256 amountOutAfterFees = _takeFee(
      vaultAsset,
      amountOut,
      assetfee.useAssetFee ? assetfee.inBps : globalFee.inBps
    );

    IERC20(vaultAsset).safeApprove(address(vault), amountOutAfterFees);

    if (stake) {
      IVaultsV1(vault).depositAndStakeFor(amountOutAfterFees, msg.sender);
    } else {
      IVaultsV1(vault).deposit(amountOutAfterFees, msg.sender);
    }
  }

  function zapOut(
    address vaultAsset,
    address pool,
    uint256 amount,
    address intermediateToken,
    address toToken,
    uint256 minToTokens,
    address swapTarget,
    bytes calldata swapCallData,
    bool unstake
  ) public override {
    address vault = vaults[vaultAsset];
    require(vault != address(0), "Invalid vault");

    if (unstake) {
      IVaultsV1(vault).unstakeAndRedeemFor(amount, address(this), msg.sender);
    } else {
      IVaultsV1(vault).redeem(amount, address(this), msg.sender);
    }
    // For some reason the value returned of redeem is sometimes a few WEI off which is why i opted for this solution
    uint256 withdrawn = IERC20(vaultAsset).balanceOf(address(this));

    Fee memory assetfee = fees[vaultAsset];
    withdrawn = _takeFee(vaultAsset, withdrawn, assetfee.useAssetFee ? assetfee.outBps : globalFee.outBps);

    IERC20(vaultAsset).safeApprove(zaps[vaultAsset].zapOut, withdrawn);

    uint256 amountOut = IZapOut(zaps[vaultAsset].zapOut).ZapOut(
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

  /* ========== ADMIN FUNCTIONS ========== */
  /**
   * @notice Updates the vault used for a certain asset
   * @param vaultAsset Address of the underlying asset of a vault
   * @param vault Address of the vault that should be used for the asset
   * @dev This function must be called before the VaultZapper can be used for a vault
   **/
  function updateVault(address vaultAsset, address vault) external override onlyRole(VAULTS_CONTROLLER) {
    vaults[vaultAsset] = vault;
    emit UpdatedVault(vaultAsset, vault);
  }

  /**
   * @notice Removes the vault used for a certain asset
   * @param vaultAsset Address of the underlying asset of a vault
   **/
  function removeVault(address vaultAsset) external override onlyRole(VAULTS_CONTROLLER) {
    emit RemovedVault(vaultAsset, vaults[vaultAsset]);
    delete vaults[vaultAsset];
  }

  /**
   * @notice Updates the ZapIn and ZapOut contract used for a certain asset
   * @param vaultAsset Address of the underlying asset of a vault
   * @param zapIn Address for the ZapIn contract
   * @param zapOut Address for the ZapOut contract
   * @dev Per default both of these values are not set. Therefore a fee has to be explicitly be set with this function
   * @dev Since there can only be one vault per asset we can simply configure these zaps also based on assets
   */
  function updateZaps(
    address vaultAsset,
    address zapIn,
    address zapOut
  ) external override onlyRole(VAULTS_CONTROLLER) {
    zaps[vaultAsset] = Zaps({ zapIn: zapIn, zapOut: zapOut });
    emit ZapsUpdated(zapIn, zapOut);
  }

  /**
   * @notice Changes the fee for a certain vault asset
   * @param inBps DepositFee in BPS
   * @param outBps WithdrawlFee in BPS
   * @dev Per default both of these values are not set. Therefore a fee has to be explicitly be set with this function
   */
  function setGlobalFee(uint256 inBps, uint256 outBps) external override onlyRole(VAULTS_CONTROLLER) {
    require(inBps <= 100 && outBps <= 100, "dont be greedy");

    globalFee.inBps = inBps;
    globalFee.outBps = outBps;

    emit GlobalFeeUpdated(inBps, outBps);
  }

  /**
   * @notice Changes the fee for a certain vault asset
   * @param vaultAsset Address of the underlying asset of a vault
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
  ) external override onlyRole(VAULTS_CONTROLLER) {
    require(inBps <= 100 && outBps <= 100, "dont be greedy");

    fees[vaultAsset].useAssetFee = useAssetFee;
    fees[vaultAsset].inBps = inBps;
    fees[vaultAsset].outBps = outBps;

    emit FeeUpdated(vaultAsset, useAssetFee, inBps, outBps);
  }

  /**
   * @notice Change keeper config. Caller must have VAULTS_CONTROLLER from ACLRegistry.
   */
  function setKeeperConfig(address _asset, KeeperConfig memory _config) external override onlyRole(VAULTS_CONTROLLER) {
    require(_config.incentiveVigBps < 1e18, "invalid vig");
    require(_config.minWithdrawalAmount > 0, "invalid min withdrawal");
    emit KeeperConfigUpdated(keeperConfigs[_asset], _config);

    keeperConfigs[_asset] = _config;
  }

  function withdrawFees(address vaultAsset) public override keeperIncentive(0) {
    KeeperConfig memory keeperConfig = keeperConfigs[vaultAsset];

    uint256 feeBal = fees[vaultAsset].accumulated;

    require(feeBal >= keeperConfig.minWithdrawalAmount, "insufficient withdrawal amount");

    fees[vaultAsset].accumulated = 0;

    uint256 tipAmount = (feeBal * keeperConfig.incentiveVigBps) / 1e18;

    IERC20(vaultAsset).safeTransfer(
      IVaultFeeController(_getContract(FEE_CONTROLLER_ID)).feeRecipient(),
      feeBal - tipAmount
    );

    IKeeperIncentiveV2 keeperIncentive = IKeeperIncentiveV2(_getContract(KEEPER_INCENTIVE));

    IERC20(vaultAsset).approve(address(keeperIncentive), tipAmount);

    keeperIncentive.tip(address(vaultAsset), msg.sender, 0, tipAmount);
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

  function _getContract(bytes32 _name)
    internal
    view
    override(ACLAuth, ContractRegistryAccess, KeeperIncentivized)
    returns (address)
  {
    return super._getContract(_name);
  }

  function _getRedeemAmountForPreview(address vaultAsset, uint256 amount) internal view returns (uint256 redeemAmount) {
    address vault = vaults[vaultAsset];
    require(vault != address(0), "Invalid vault");
    redeemAmount = IVault(vault).previewRedeem(amount);

    redeemAmount = previewRedeemFees(vaultAsset, redeemAmount);
  }
}

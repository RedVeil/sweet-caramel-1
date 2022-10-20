// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "openzeppelin-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "openzeppelin-upgradeable/security/PausableUpgradeable.sol";
import "openzeppelin-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../../utils/ACLAuth.sol";
import "../../utils/ContractRegistryAccessUpgradeable.sol";
import "../../utils/KeeperIncentivized.sol";
import "../../interfaces/IERC4626.sol";
import "../../interfaces/IContractRegistry.sol";
import "../../interfaces/IKeeperIncentiveV2.sol";
import "../../interfaces/IVaultsV1.sol";

contract Vault is
  ERC20Upgradeable,
  ReentrancyGuardUpgradeable,
  PausableUpgradeable,
  ACLAuth,
  KeeperIncentivized,
  ContractRegistryAccessUpgradeable
{
  // Fees are set in 1e18 for 100% (1 BPS = 1e14)
  // Raise Fees in BPS by 1e14 to get an accurate value
  struct FeeStructure {
    uint256 deposit;
    uint256 withdrawal;
    uint256 management;
    uint256 performance;
  }

  bytes32 public contractName;

  uint256 constant MINUTES_PER_YEAR = 525_600;
  bytes32 constant VAULTS_CONTROLLER = keccak256("VaultsController");

  /* ========== STATE VARIABLES ========== */
  ERC20 public asset;
  IERC4626 public strategy;
  FeeStructure public feeStructure;
  uint256 public vaultShareHWM = 1e18;
  uint256 public assetsCheckpoint;
  uint256 public feesUpdatedAt;
  KeeperConfig public keeperConfig;

  /* ========== EVENTS ========== */
  event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);
  event Withdraw(
    address indexed caller,
    address indexed receiver,
    address indexed owner,
    uint256 assets,
    uint256 shares
  );
  event WithdrawalFee(address indexed to, uint256 amount);
  event PerformanceFee(uint256 amount);
  event ManagementFee(uint256 amount);
  event FeesUpdated(FeeStructure previousFees, FeeStructure newFees);
  event UnstakedAndWithdrawn(uint256 amount, address owner, address receiver);
  event ChangedStrategy(IERC4626 oldStrategy, IERC4626 newStrategy);

  /* ========== INITIALIZE ========== */

  function initialize(
    ERC20 asset_,
    IERC4626 strategy_,
    IContractRegistry contractRegistry_,
    FeeStructure memory feeStructure_,
    KeeperConfig memory keeperConfig_
  ) external initializer {
    __ERC20_init(
      string(abi.encodePacked("Popcorn ", asset_.name(), " Vault")),
      string(abi.encodePacked("pop-", asset_.symbol()))
    );
    __ContractRegistryAccess_init(contractRegistry_);

    asset = asset_;
    strategy = strategy_;

    asset.approve(address(strategy_), type(uint256).max);
    strategy_.approve(address(strategy_), type(uint256).max);

    feesUpdatedAt = block.timestamp;
    feeStructure = feeStructure_;
    contractName = keccak256(abi.encodePacked("Popcorn ", asset_.name(), " Vault"));
    keeperConfig = keeperConfig_;
  }

  /* ========== VIEWS ========== */

  /**
   * @return Total amount of underlying `asset` token managed by vault.
   */
  function totalAssets() public view returns (uint256) {
    return strategy.totalAssets();
  }

  /**
   * @notice Amount of assets the vault would exchange for given amount of shares, in an ideal scenario.
   * @param shares Exact amount of shares
   * @return Exact amount of assets
   */
  function convertToAssets(uint256 shares) public view returns (uint256) {
    return strategy.convertToAssets(shares);
  }

  /**
   * @notice Amount of shares the vault would exchange for given amount of assets, in an ideal scenario.
   * @param assets Exact amount of assets
   * @return Exact amount of shares
   */
  function convertToShares(uint256 assets) public view returns (uint256) {
    return strategy.convertToShares(assets);
  }

  /* ========== VIEWS ( PREVIEWS ) ========== */

  /**
   * @notice Simulate the effects of a deposit at the current block, given current on-chain conditions.
   * @param assets Exact amount of underlying `asset` token to deposit
   * @return shares of the vault issued in exchange to the user for `assets`
   * @dev This method accounts for issuance of accrued fee shares.
   */
  function previewDeposit(uint256 assets) public view returns (uint256 shares) {
    shares = convertToShares(assets - ((assets * feeStructure.deposit) / 1e18));
  }

  /**
   * @notice Simulate the effects of a mint at the current block, given current on-chain conditions.
   * @param shares Exact amount of vault shares to mint.
   * @return assets quantity of underlying needed in exchange to mint `shares`.
   * @dev This method accounts for issuance of accrued fee shares.
   */
  function previewMint(uint256 shares) public view returns (uint256 assets) {
    uint256 depositFee = feeStructure.deposit;

    shares += (shares * depositFee) / (1e18 - depositFee);

    assets = convertToAssets(shares);
  }

  /**
   * @notice Simulate the effects of a withdrawal at the current block, given current on-chain conditions.
   * @param assets Exact amount of `assets` to withdraw
   * @return shares to be burned in exchange for `assets`
   * @dev This method accounts for both issuance of fee shares and withdrawal fee.
   */
  function previewWithdraw(uint256 assets) external view returns (uint256 shares) {
    uint256 withdrawalFee = feeStructure.withdrawal;

    assets += (assets * withdrawalFee) / (1e18 - withdrawalFee);

    shares = convertToShares(assets);
  }

  /**
   * @notice Simulate the effects of a redemption at the current block, given current on-chain conditions.
   * @param shares Exact amount of `shares` to redeem
   * @return assets quantity of underlying returned in exchange for `shares`.
   * @dev This method accounts for both issuance of fee shares and withdrawal fee.
   */
  function previewRedeem(uint256 shares) public view returns (uint256 assets) {
    assets = convertToAssets(shares);

    assets -= (assets * feeStructure.withdrawal) / 1e18;
  }

  /* ========== VIEWS ( FEES ) ========== */

  /**
   * @notice Management fee that has accrued since last fee harvest.
   * @return Accrued management fee in underlying `asset` token.
   * @dev Management fee is annualized per minute, based on 525,600 minutes per year. Total assets are calculated using
   *  the average of their current value and the value at the previous fee harvest checkpoint. This method is similar to
   *  calculating a definite integral using the trapezoid rule.
   */
  function accruedManagementFee() public view returns (uint256) {
    uint256 area = (totalAssets() + assetsCheckpoint) * ((block.timestamp - feesUpdatedAt) / 1 minutes);
    return (((feeStructure.management * area) / 2) / MINUTES_PER_YEAR) / 1e18;
  }

  /**
   * @notice Performance fee that has accrued since last fee harvest.
   * @return Accrued performance fee in underlying `asset` token.
   * @dev Performance fee is based on a vault share high water mark value. If vault share value has increased above the
   *   HWM in a fee period, issue fee shares to the vault equal to the performance fee.
   */
  function accruedPerformanceFee() public view returns (uint256) {
    uint256 shareValue = convertToAssets(1 ether);

    if (shareValue > vaultShareHWM) {
      return (feeStructure.performance * (shareValue - vaultShareHWM) * totalSupply()) / 1e36;
    } else {
      return 0;
    }
  }

  /* ========== VIEWS ( MAX ) ========== */

  /**
   * @return Maximum amount of underlying `asset` token that may be deposited for a given address.
   */
  function maxDeposit(address caller) public view returns (uint256) {
    return strategy.maxDeposit(caller);
  }

  /**
   * @return Maximum amount of vault shares that may be minted to given address.
   */
  function maxMint(address caller) external view returns (uint256) {
    return strategy.maxMint(caller);
  }

  /**
   * @return Maximum amount of underlying `asset` token that can be withdrawn by `caller` address.
   */
  function maxWithdraw(address caller) external view returns (uint256) {
    return strategy.maxWithdraw(caller);
  }

  /**
   * @return Maximum amount of shares that may be redeemed by `caller` address.
   */
  function maxRedeem(address caller) external view returns (uint256) {
    return strategy.maxRedeem(caller);
  }

  /* ========== MUTATIVE FUNCTIONS ========== */

  /**
   * @notice Deposit exactly `assets` amount of tokens, issuing vault shares to caller.
   * @param assets Quantity of tokens to deposit.
   * @return Quantity of vault shares issued to caller.
   * @dev This s `deposit(uint256)` from the parent `AffiliateToken` contract. It therefore needs to be public since the `AffiliateToken` function is public
   */
  function deposit(uint256 assets) public returns (uint256) {
    return deposit(assets, msg.sender);
  }

  /**
   * @notice Deposit exactly `assets` amount of tokens, issuing vault shares to `receiver`.
   * @param assets Quantity of tokens to deposit.
   * @param receiver Receiver of issued vault shares.
   * @return shares of the vault issued to `receiver`.
   */
  function deposit(uint256 assets, address receiver) public nonReentrant whenNotPaused returns (uint256 shares) {
    require(receiver != address(0), "Invalid receiver");

    uint256 feeShares = convertToShares((assets * feeStructure.deposit) / 1e18);

    shares = convertToShares(assets) - feeShares;

    asset.transferFrom(msg.sender, address(this), assets);

    strategy.deposit(assets, address(this));

    _mint(receiver, shares);

    _mint(address(this), feeShares);

    emit Deposit(msg.sender, receiver, assets, shares);
  }

  /**
   * @notice Mint exactly `shares` vault shares to `msg.sender`. Caller must approve a sufficient number of underlying
   *   `asset` tokens to mint the requested quantity of vault shares.
   * @param shares Quantity of shares to mint.
   * @return assets of underlying that have been deposited.
   */
  function mint(uint256 shares) external returns (uint256) {
    return mint(shares, msg.sender);
  }

  /**
   * @notice Mint exactly `shares` vault shares to `receiver`. Caller must approve a sufficient number of underlying
   *   `asset` tokens to mint the requested quantity of vault shares.
   * @param shares Quantity of shares to mint.
   * @param receiver Receiver of issued vault shares.
   * @return assets of underlying that have been deposited.
   */
  function mint(uint256 shares, address receiver) public nonReentrant whenNotPaused returns (uint256 assets) {
    require(receiver != address(0), "Invalid receiver");

    uint256 depositFee = feeStructure.deposit;

    uint256 feeShares = (shares * depositFee) / (1e18 - depositFee);

    assets = convertToAssets(shares + feeShares);

    asset.transferFrom(msg.sender, address(this), assets);

    strategy.deposit(assets, address(this));

    _mint(receiver, shares);

    _mint(address(this), feeShares);

    emit Deposit(msg.sender, receiver, assets, shares);
  }

  /**
   * @notice Burn shares from caller in exchange for exactly `assets` amount of underlying token.
   * @param assets Quantity of underlying `asset` token to withdraw.
   * @return shares of vault burned in exchange for underlying `asset` tokens.
   * @dev This s `withdraw(uint256)` from the parent `AffiliateToken` contract.
   */
  function withdraw(uint256 assets) public returns (uint256) {
    return withdraw(assets, msg.sender, msg.sender);
  }

  /**
   * @notice Burn shares from caller in exchange for `assets` amount of underlying token. Send underlying to caller.
   * @param assets Quantity of underlying `asset` token to withdraw.
   * @param receiver Receiver of underlying token.
   * @param owner Owner of burned vault shares.
   * @return shares of vault burned in exchange for underlying `asset` tokens.
   */
  function withdraw(
    uint256 assets,
    address receiver,
    address owner
  ) public nonReentrant returns (uint256 shares) {
    require(receiver != address(0), "Invalid receiver");

    shares = convertToShares(assets);

    uint256 withdrawalFee = feeStructure.withdrawal;

    uint256 feeShares = (shares * withdrawalFee) / (1e18 - withdrawalFee);

    if (msg.sender != owner) _approve(owner, msg.sender, allowance(owner, msg.sender) - (shares + feeShares));

    _transfer(owner, address(this), (shares + feeShares));

    _burn(address(this), shares);

    strategy.withdraw(assets, receiver, owner);

    emit Withdraw(msg.sender, receiver, owner, assets, shares);
  }

  /**
   * @notice Burn exactly `shares` vault shares from owner and send underlying `asset` tokens to `receiver`.
   * @param shares Quantity of vault shares to exchange for underlying tokens.
   * @return assets of underlying sent to `receiver`.
   */
  function redeem(uint256 shares) external returns (uint256) {
    return redeem(shares, msg.sender, msg.sender);
  }

  /**
   * @notice Burn exactly `shares` vault shares from owner and send underlying `asset` tokens to `receiver`.
   * @param shares Quantity of vault shares to exchange for underlying tokens.
   * @param receiver Receiver of underlying tokens.
   * @param owner Owner of burned vault shares.
   * @return assets of underlying sent to `receiver`.
   */
  function redeem(
    uint256 shares,
    address receiver,
    address owner
  ) public nonReentrant returns (uint256 assets) {
    require(receiver != address(0), "Invalid receiver");

    if (msg.sender != owner) _approve(owner, msg.sender, allowance(owner, msg.sender) - shares);

    _transfer(owner, address(this), shares);

    uint256 feeShares = (shares * feeStructure.withdrawal) / 1e18;

    assets = convertToAssets(shares - feeShares);

    _burn(address(this), shares - feeShares);

    strategy.withdraw(assets, receiver, owner);

    emit Withdraw(msg.sender, receiver, owner, assets, shares);
  }

  /**
   * @notice Collect management and performance fees and update vault share high water mark.
   */
  function takeManagementAndPerformanceFees() external nonReentrant takeFees {}

  /* ========== RESTRICTED FUNCTIONS ========== */

  /**
   * @notice Set a new Strategy for this Vault.
   * @param newStrategy A new ERC4626 that should be used as a yield strategy for this asset.
   * @dev This migration function will remove all assets from the old Vault and move them into the new vault
   * @dev Additionally it will zero old allowances and set new ones
   * @dev Last we update HWM and assetsCheckpoint for fees to make sure they adjust to the new strategy
   */
  function changeStrategy(IERC4626 newStrategy) external onlyRole(VAULTS_CONTROLLER) {
    strategy.redeem(strategy.balanceOf(address(this)), address(this), address(this));

    asset.approve(address(strategy), 0);
    strategy.approve(address(strategy), 0);

    emit ChangedStrategy(strategy, newStrategy);
    strategy = newStrategy;

    asset.approve(address(strategy), type(uint256).max);
    strategy.approve(address(strategy), type(uint256).max);

    strategy.deposit(asset.balanceOf(address(this)), address(this));

    vaultShareHWM = convertToAssets(1 ether);
    assetsCheckpoint = totalAssets();
  }

  /**
   * @notice Set fees in BPS. Caller must have DAO_ROLE or VAULTS_CONTROlLER from ACLRegistry.
   * @param newFees New `feeStructure`.
   * @dev Value is in 1e18, e.g. 100% = 1e18 - 1 BPS = 1e12
   */
  function setFees(FeeStructure memory newFees) external onlyRole(VAULTS_CONTROLLER) {
    // prettier-ignore
    require(
      newFees.deposit < 1e18 &&
      newFees.withdrawal < 1e18 &&
      newFees.management < 1e18 &&
      newFees.performance < 1e18,
      "Invalid FeeStructure"
    );
    emit FeesUpdated(feeStructure, newFees);
    feeStructure = newFees;
  }

  /**
   * @notice Change keeper config. Caller must have VAULTS_CONTROLLER from ACLRegistry.
   */
  function setKeeperConfig(KeeperConfig memory _config) external onlyRole(VAULTS_CONTROLLER) {
    require(_config.incentiveVigBps < 1e18, "invalid vig");
    require(_config.minWithdrawalAmount > 0, "invalid min withdrawal");
    emit KeeperConfigUpdated(keeperConfig, _config);

    keeperConfig = _config;
  }

  /**
   * @notice Pause deposits. Caller must have VAULTS_CONTROLLER from ACLRegistry.
   */
  function pauseContract() external onlyRole(VAULTS_CONTROLLER) {
    _pause();
  }

  /**
   * @notice Unpause deposits. Caller must have VAULTS_CONTROLLER from ACLRegistry.
   */
  function unpauseContract() external onlyRole(VAULTS_CONTROLLER) {
    _unpause();
  }

  /**
   * @notice Transfer accrued fees to rewards manager contract. Caller must be a registered keeper.
   * @dev we send funds now to the feeRecipient which is set on in the contract registry. We must make sure that this is not address(0) before withdrawing fees
   */
  function withdrawAccruedFees() external keeperIncentive(0) takeFees nonReentrant {
    uint256 balance = balanceOf(address(this));
    uint256 accruedFees = convertToAssets(balance);
    uint256 minWithdrawalAmount = keeperConfig.minWithdrawalAmount;
    uint256 incentiveVig = keeperConfig.incentiveVigBps;

    require(accruedFees >= minWithdrawalAmount, "insufficient withdrawal amount");

    IERC20 assetToken = IERC20(IERC4626(address(this)).asset());

    uint256 preBal = assetToken.balanceOf(address(this));
    uint256 tipAmount = (accruedFees * incentiveVig) / 1e18;

    //TODO check this calculation
    strategy.withdraw(
      (accruedFees * 1e18 - incentiveVig) / 1e18,
      _getContract(keccak256("FeeRecipient")),
      address(this)
    );
    strategy.withdraw(tipAmount, address(this), address(this));

    uint256 postBal = assetToken.balanceOf(address(this));

    require(postBal >= preBal, "insufficient tip balance");

    IKeeperIncentiveV2 keeperIncentive = IKeeperIncentiveV2(_getContract(keccak256("KeeperIncentive")));

    assetToken.approve(address(keeperIncentive), postBal);

    keeperIncentive.tip(address(assetToken), msg.sender, 0, postBal);

    _burn(address(this), balance);
  }

  /* ========== INTERNAL FUNCTIONS ========== */

  /**
   * @notice Override for ACLAuth and ContractRegistryAccess.
   */
  function _getContract(bytes32 _name)
    internal
    view
    override(ACLAuth, KeeperIncentivized, ContractRegistryAccessUpgradeable)
    returns (address)
  {
    return super._getContract(_name);
  }

  /* ========== MODIFIERS ========== */

  modifier takeFees() {
    uint256 managementFee = accruedManagementFee();
    uint256 totalFee = managementFee + accruedPerformanceFee();
    uint256 currentAssets = totalAssets();
    uint256 shareValue = convertToAssets(1 ether);

    if (shareValue > vaultShareHWM) vaultShareHWM = shareValue;

    if (totalFee > 0 && currentAssets > 0) {
      _mint(address(this), convertToShares(totalFee));
    }

    if (managementFee > 0 || currentAssets == 0) {
      feesUpdatedAt = block.timestamp;
    }
    _;
    assetsCheckpoint = totalAssets();
  }
}

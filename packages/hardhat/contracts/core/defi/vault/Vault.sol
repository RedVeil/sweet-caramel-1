// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./AffiliateToken.sol";
import "../../utils/ACLAuth.sol";
import "../../utils/ContractRegistryAccess.sol";
import "../../utils/KeeperIncentivized.sol";
import "../../interfaces/IEIP4626.sol";
import "../../interfaces/IContractRegistry.sol";
import "../../interfaces/IVaultFeeController.sol";
import "../../interfaces/IStaking.sol";
import "../../interfaces/IKeeperIncentive.sol";

contract Vault is
  IEIP4626,
  AffiliateToken,
  ReentrancyGuard,
  Pausable,
  ACLAuth,
  KeeperIncentivized,
  ContractRegistryAccess
{
  // Fees are set in 1e18 for 100% (1 BPS = 1e14)
  // Raise Fees in BPS by 1e14 to get an accurate value
  struct FeeStructure {
    uint256 deposit;
    uint256 withdrawal;
    uint256 management;
    uint256 performance;
  }

  address public staking;

  bytes32 public immutable contractName;

  uint256 constant MINUTES_PER_YEAR = 525_600;
  bytes32 constant FEE_CONTROLLER_ID = keccak256("VaultFeeController");

  /* ========== STATE VARIABLES ========== */

  FeeStructure public feeStructure;
  bool public useLocalFees;
  uint256 public vaultShareHWM = 1e18;
  uint256 public assetsCheckpoint;
  uint256 public feesUpdatedAt;

  /* ========== EVENTS ========== */

  event WithdrawalFee(address indexed to, uint256 amount);
  event PerformanceFee(uint256 amount);
  event ManagementFee(uint256 amount);
  event FeesUpdated(FeeStructure previousFees, FeeStructure newFees);
  event StakingUpdated(address beforeAddress, address afterAddress);
  event RegistryUpdated(address beforeAddress, address afterAddress);
  event UseLocalFees(bool useLocalFees);

  /* ========== CONSTRUCTOR ========== */

  constructor(
    address token_,
    address yearnRegistry_,
    IContractRegistry contractRegistry_,
    address staking_,
    FeeStructure memory feeStructure_
  )
    AffiliateToken(
      token_,
      yearnRegistry_,
      string(abi.encodePacked("Popcorn ", IERC20Metadata(token_).name(), " Vault")),
      string(abi.encodePacked("pop-", IERC20Metadata(token_).symbol()))
    )
    ContractRegistryAccess(contractRegistry_)
  {
    require(address(yearnRegistry_) != address(0), "Zero address");

    if (staking_ != address(0)) {
      staking = staking_;
      _approve(address(this), staking_, type(uint256).max);
    }

    feesUpdatedAt = block.timestamp;
    feeStructure = feeStructure_;
    contractName = keccak256(abi.encodePacked("Popcorn ", IERC20Metadata(token_).name(), " Vault"));
  }

  /* ========== VIEWS ========== */

  /**
   * @notice Returns amount of underlying `asset` token represented by 1 vault share.
   * @return Price per vault share in underlying token.
   * @dev Vault shares are denominated with 18 decimals. Return value units are defined by underlying `asset` token.
   */
  function assetsPerShare() public view returns (uint256) {
    return _shareValue(1e18);
  }

  /**
   * @notice Underlying token managed by the vault.
   * @return Address of the underlying token used by the vault for accounting, depositing, and withdrawing.
   */
  function asset() external view override returns (address) {
    return address(token);
  }

  /**
   * @return Total amount of underlying `asset` token managed by vault.
   * @dev This function overrides the parent Yearn vault's `totalAssets` to return only assets managed by the vault
   *   wrapper, rather than the parent Yearn vault.
   */
  function totalAssets() public view override(IEIP4626, BaseWrapper) returns (uint256) {
    return totalVaultBalance(address(this));
  }

  /**
   * @notice Return vault balance of `owner` address, denominated in underlying `asset` token.
   * @param owner Address of owner.
   * @return Balance of `owner` address, denominated in underlying `asset` token.
   */
  function assetsOf(address owner) public view returns (uint256) {
    return (balanceOf(owner) * assetsPerShare()) / 1e18;
  }

  /**
   * @notice Amount of assets the vault would exchange for given amount of shares, in an ideal scenario.
   * @param shares Exact amount of shares
   * @return Exact amount of assets
   */
  function convertToAssets(uint256 shares) external view override returns (uint256) {
    return _convertToAssets(shares, 0);
  }

  /**
   * @notice Amount of shares the vault would exchange for given amount of assets, in an ideal scenario.
   * @param assets Exact amount of assets
   * @return Exact amount of shares
   */
  function convertToShares(uint256 assets) external view override returns (uint256) {
    return _convertToShares(assets, 0);
  }

  /* ========== VIEWS ( PREVIEWS ) ========== */

  /**
   * @notice Simulate the effects of a deposit at the current block, given current on-chain conditions.
   * @param assets Exact amount of underlying `asset` token to deposit
   * @return shares of the vault issued in exchange to the user for `assets`
   * @dev This method accounts for issuance of accrued fee shares.
   */
  function previewDeposit(uint256 assets) public view override returns (uint256 shares) {
    shares = _convertToShares(
      assets - ((assets * getDepositFee()) / 1e18),
      accruedManagementFee() + accruedPerformanceFee()
    );
  }

  /**
   * @notice Simulate the effects of a mint at the current block, given current on-chain conditions.
   * @param shares Exact amount of vault shares to mint.
   * @return assets quantity of underlying needed in exchange to mint `shares`.
   * @dev This method accounts for issuance of accrued fee shares.
   */
  function previewMint(uint256 shares) public view override returns (uint256 assets) {
    uint256 depositFee = getDepositFee();

    shares += (shares * depositFee) / (1e18 - depositFee);

    assets = _convertToAssets(shares, accruedManagementFee() + accruedPerformanceFee());
  }

  /**
   * @notice Simulate the effects of a withdrawal at the current block, given current on-chain conditions.
   * @param assets Exact amount of `assets` to withdraw
   * @return shares to be burned in exchange for `assets`
   * @dev This method accounts for both issuance of fee shares and withdrawal fee.
   */
  function previewWithdraw(uint256 assets) external view override returns (uint256 shares) {
    uint256 withdrawalFee = getWithdrawalFee();

    assets += (assets * withdrawalFee) / (1e18 - withdrawalFee);

    shares = _convertToShares(assets, accruedManagementFee() + accruedPerformanceFee());
  }

  /**
   * @notice Simulate the effects of a redemption at the current block, given current on-chain conditions.
   * @param shares Exact amount of `shares` to redeem
   * @return assets quantity of underlying returned in exchange for `shares`.
   * @dev This method accounts for both issuance of fee shares and withdrawal fee.
   */
  function previewRedeem(uint256 shares) public view override returns (uint256 assets) {
    assets = _convertToAssets(shares, accruedManagementFee() + accruedPerformanceFee());

    assets -= (assets * getWithdrawalFee()) / 1e18;
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
    uint256 managementFee = useLocalFees ? feeStructure.management : _feeController().getManagementFee();

    uint256 area = (totalAssets() + assetsCheckpoint) * ((block.timestamp - feesUpdatedAt) / 1 minutes);
    return (((managementFee * area) / 2) / MINUTES_PER_YEAR) / 1e18;
  }

  /**
   * @notice Performance fee that has accrued since last fee harvest.
   * @return Accrued performance fee in underlying `asset` token.
   * @dev Performance fee is based on a vault share high water mark value. If vault share value has increased above the
   *   HWM in a fee period, issue fee shares to the vault equal to the performance fee.
   */
  function accruedPerformanceFee() public view returns (uint256) {
    uint256 shareValue = assetsPerShare();

    if (shareValue > vaultShareHWM) {
      uint256 performanceFee = useLocalFees ? feeStructure.performance : _feeController().getPerformanceFee();

      return (performanceFee * (shareValue - vaultShareHWM) * totalSupply()) / 1e36;
    } else {
      return 0;
    }
  }

  function getDepositFee() internal view returns (uint256) {
    return useLocalFees ? feeStructure.deposit : _feeController().getDepositFee();
  }

  function getWithdrawalFee() internal view returns (uint256) {
    return useLocalFees ? feeStructure.withdrawal : _feeController().getWithdrawalFee();
  }

  /* ========== VIEWS ( MAX ) ========== */

  /**
   * @return Maximum amount of underlying `asset` token that may be deposited for a given address.
   */
  function maxDeposit(address) public view override returns (uint256) {
    VaultAPI _bestVault = bestVault();
    uint256 _totalAssets = _bestVault.totalAssets();
    uint256 _depositLimit = _bestVault.depositLimit();
    if (_totalAssets >= _depositLimit) return 0;
    return _depositLimit - _totalAssets;
  }

  /**
   * @return Maximum amount of vault shares that may be minted to given address.
   */
  function maxMint(address) external view override returns (uint256) {
    return previewDeposit(maxDeposit(address(0)));
  }

  /**
   * @return Maximum amount of underlying `asset` token that can be withdrawn by `caller` address.
   */
  function maxWithdraw(address caller) external view override returns (uint256) {
    return previewRedeem(balanceOf(caller));
  }

  /**
   * @return Maximum amount of shares that may be redeemed by `caller` address.
   */
  function maxRedeem(address caller) external view override returns (uint256) {
    return balanceOf(caller);
  }

  /* ========== MUTATIVE FUNCTIONS ========== */

  /**
   * @notice Deposit exactly `assets` amount of tokens, issuing vault shares to caller.
   * @param assets Quantity of tokens to deposit.
   * @return Quantity of vault shares issued to caller.
   * @dev This overrides `deposit(uint256)` from the parent `AffiliateToken` contract. It therefore needs to be public since the `AffiliateToken` function is public
   */
  function deposit(uint256 assets) public override returns (uint256) {
    return deposit(assets, msg.sender);
  }

  /**
   * @notice Deposit exactly `assets` amount of tokens, issuing vault shares to `receiver`.
   * @param assets Quantity of tokens to deposit.
   * @param receiver Receiver of issued vault shares.
   * @return shares of the vault issued to `receiver`.
   */
  function deposit(uint256 assets, address receiver)
    public
    override
    nonReentrant
    whenNotPaused
    onlyApprovedContractOrEOA
    takeFees
    returns (uint256 shares)
  {
    require(receiver != address(0), "Invalid receiver");

    uint256 feeShares = _convertToShares((assets * getDepositFee()) / 1e18, 0);

    shares = _convertToShares(assets, 0) - feeShares;

    _deposit(msg.sender, address(this), assets, true);

    _mint(receiver, shares);

    _mint(address(this), feeShares);

    emit Deposit(msg.sender, receiver, assets, shares);
  }

  /**
   * @notice Deposit exactly `assets` amount of tokens, issuing vault shares to caller and staking in the staking contract.
   * @param assets Quantity of tokens to deposit.
   * @return shares of the vault issued to `receiver`.
   */
  function depositAndStake(uint256 assets) external returns (uint256) {
    return depositAndStakeFor(assets, msg.sender);
  }

  /**
   * @notice Deposit exactly `assets` amount of tokens, issuing vault shares to `receiver` and staking in the staking contract.
   * @param assets Quantity of tokens to deposit.
   * @return shares of the vault issued to `receiver`.
   */
  function depositAndStakeFor(uint256 assets, address receiver) public returns (uint256 shares) {
    require(staking != address(0), "staking is disabled");
    shares = deposit(assets, address(this));
    IStaking(staking).stakeFor(shares, receiver);
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
  function mint(uint256 shares, address receiver)
    public
    override
    nonReentrant
    whenNotPaused
    onlyApprovedContractOrEOA
    takeFees
    returns (uint256 assets)
  {
    require(receiver != address(0), "Invalid receiver");

    uint256 depositFee = getDepositFee();

    uint256 feeShares = (shares * depositFee) / (1e18 - depositFee);

    assets = _convertToAssets(shares + feeShares, 0);

    _deposit(msg.sender, address(this), assets, true);

    _mint(receiver, shares);

    _mint(address(this), feeShares);

    emit Deposit(msg.sender, receiver, assets, shares);
  }

  /**
   * @notice Mint exactly `shares` vault shares to `msg.sender` and sends to the staking contract.
   * Caller must approve a sufficient number of underlying `asset` tokens to mint the
   * requested quantity of vault shares.
   * @param shares Quantity of shares to mint.
   * @return assets of underlying that have been deposited.
   */
  function mintAndStake(uint256 shares) external returns (uint256) {
    return mintAndStakeFor(shares, msg.sender);
  }

  /**
   * @notice Mint exactly `shares` vault shares to `receiver` and sends to the staking contract.
   * Caller must approve a sufficient number of underlying `asset` tokens to mint the
   * requested quantity of vault shares.
   * @param shares Quantity of shares to mint.
   * @return assets of underlying that have been deposited.
   */
  function mintAndStakeFor(uint256 shares, address receiver) public returns (uint256 assets) {
    require(staking != address(0), "staking is disabled");
    assets = mint(shares, address(this));
    IStaking(staking).stakeFor(shares, receiver);
    return assets;
  }

  /**
   * @notice Burn shares from caller in exchange for exactly `assets` amount of underlying token.
   * @param assets Quantity of underlying `asset` token to withdraw.
   * @return shares of vault burned in exchange for underlying `asset` tokens.
   * @dev This overrides `withdraw(uint256)` from the parent `AffiliateToken` contract.
   */
  function withdraw(uint256 assets) public override returns (uint256) {
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
  ) public override nonReentrant onlyApprovedContractOrEOA takeFees returns (uint256 shares) {
    require(receiver != address(0), "Invalid receiver");

    shares = _convertToShares(assets, 0);

    uint256 withdrawalFee = getWithdrawalFee();

    uint256 feeShares = (shares * withdrawalFee) / (1e18 - withdrawalFee);

    if (msg.sender != owner) _approve(owner, msg.sender, allowance(owner, msg.sender) - (shares + feeShares));

    _transfer(owner, address(this), (shares + feeShares));

    _burn(address(this), shares);

    _withdraw(address(this), receiver, assets, true);

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
  ) public override nonReentrant onlyApprovedContractOrEOA takeFees returns (uint256 assets) {
    require(receiver != address(0), "Invalid receiver");

    if (msg.sender != owner) _approve(owner, msg.sender, allowance(owner, msg.sender) - shares);

    _transfer(owner, address(this), shares);

    uint256 feeShares = (shares * getWithdrawalFee()) / 1e18;

    assets = _convertToAssets(shares - feeShares, 0);

    _burn(address(this), shares - feeShares);

    _withdraw(address(this), receiver, assets, true);

    emit Withdraw(msg.sender, receiver, owner, assets, shares);
  }

  /**
   * @notice Collect management and performance fees and update vault share high water mark.
   */
  function takeManagementAndPerformanceFees() external nonReentrant takeFees {}

  /* ========== RESTRICTED FUNCTIONS ========== */

  /**
   * @notice Set fees in BPS. Caller must have DAO_ROLE from ACLRegistry.
   * @param newFees New `feeStructure`.
   * @dev Value is in 1e18, e.g. 100% = 1e18 - 1 BPS = 1e12
   */
  function setFees(FeeStructure memory newFees) external onlyRole(DAO_ROLE) {
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
   * @notice Set whether to use locally configured fees. Caller must have DAO_ROLE from ACLRegistry.
   * @param _useLocalFees `true` to use local fees, `false` to use the VaultFeeController contract.
   */
  function setUseLocalFees(bool _useLocalFees) external onlyRole(DAO_ROLE) {
    emit UseLocalFees(_useLocalFees);
    useLocalFees = _useLocalFees;
  }

  /**
   * @notice Set staking contract for this vault.
   * @param _staking Address of the staking contract.
   */
  function setStaking(address _staking) external onlyRole(DAO_ROLE) {
    emit StakingUpdated(staking, _staking);

    if (staking != address(0)) _approve(address(this), staking, 0);
    staking = _staking;

    if (_staking != address(0)) _approve(address(this), _staking, type(uint256).max);
  }

  /**
   * @notice Used to update the yearn registry.
   * @param _registry The new _registry address.
   */
  function setRegistry(address _registry) external onlyRole(DAO_ROLE) {
    emit RegistryUpdated(address(registry), _registry);

    _setRegistry(_registry);
  }

  /**
   * @notice Transfer accrued fees to rewards manager contract. Caller must be a registered keeper.
   * @dev we send funds now to the feeRecipient which is set on the feeController. We must make sure that this is not address(0) before withdrawing fees
   */
  function withdrawAccruedFees() external keeperIncentive(contractName, 0) takeFees nonReentrant {
    uint256 balance = balanceOf(address(this));

    _withdraw(address(this), _feeController().feeRecipient(), _convertToAssets(balance, 0), true);

    _burn(address(this), balance);
  }

  /**
   * @notice Pause deposits. Caller must have DAO_ROLE from ACLRegistry.
   */
  function pauseContract() external onlyRole(DAO_ROLE) {
    _pause();
  }

  /**
   * @notice Unpause deposits. Caller must have DAO_ROLE from ACLRegistry.
   */
  function unpauseContract() external onlyRole(DAO_ROLE) {
    _unpause();
  }

  /* ========== INTERNAL FUNCTIONS ========== */

  function _convertToShares(uint256 assets, uint256 fees) internal view returns (uint256) {
    uint256 supply = totalSupply(); // Saves an extra SLOAD if totalSupply is non-zero.
    uint256 currentAssets = totalAssets();
    if (fees >= currentAssets && currentAssets != 0) {
      fees = currentAssets - 1;
    }
    return supply == 0 ? assets : (assets * supply) / (currentAssets - fees);
  }

  function _convertToAssets(uint256 shares, uint256 fees) internal view returns (uint256) {
    uint256 currentAssets = totalAssets();
    if (currentAssets == 0) {
      fees = 0;
    }
    if (fees >= currentAssets && currentAssets != 0) {
      fees = currentAssets - 1;
    }
    uint256 supply = totalSupply(); // Saves an extra SLOAD if totalSupply is non-zero.
    return supply == 0 ? shares : (shares * (currentAssets - fees)) / supply;
  }

  /**
   * @notice Return current fee controller.
   * @return Current fee controller registered in contract registry.
   */
  function _feeController() internal view returns (IVaultFeeController) {
    return IVaultFeeController(_getContract(FEE_CONTROLLER_ID));
  }

  /**
   * @notice Override for ACLAuth and ContractRegistryAccess.
   */
  function _getContract(bytes32 _name)
    internal
    view
    override(ACLAuth, KeeperIncentivized, ContractRegistryAccess)
    returns (address)
  {
    return super._getContract(_name);
  }

  /* ========== MODIFIERS ========== */

  modifier takeFees() {
    uint256 managementFee = accruedManagementFee();
    uint256 totalFee = managementFee + accruedPerformanceFee();
    uint256 currentAssets = totalAssets();
    uint256 shareValue = assetsPerShare();

    if (shareValue > vaultShareHWM) vaultShareHWM = shareValue;

    if (totalFee > 0 && currentAssets > 0) {
      uint256 supply = totalSupply();
      if (totalFee >= currentAssets) {
        totalFee = currentAssets - 1;
      }
      _mint(address(this), supply == 0 ? totalFee : (totalFee * supply) / (currentAssets - totalFee));
    }

    if (managementFee > 0 || currentAssets == 0) {
      feesUpdatedAt = block.timestamp;
    }
    _;
    assetsCheckpoint = totalAssets();
  }
}

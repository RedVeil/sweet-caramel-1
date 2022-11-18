// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.15;

import "openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "openzeppelin-contracts-upgradeable/security/PausableUpgradeable.sol";
import "openzeppelin-contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "openzeppelin-contracts/token/ERC20/ERC20.sol";
import "../utils/ACLAuth.sol";
import "../utils/ContractRegistryAccessUpgradeable.sol";
import "../utils/KeeperIncentivized.sol";
import "../interfaces/IERC4626.sol";
import "../interfaces/IContractRegistry.sol";
import "../interfaces/IKeeperIncentiveV2.sol";
import { FixedPointMathLib } from "solmate/utils/FixedPointMathLib.sol";

contract Vault is
  ERC20Upgradeable,
  ReentrancyGuardUpgradeable,
  PausableUpgradeable,
  ACLAuth,
  KeeperIncentivized,
  ContractRegistryAccessUpgradeable
{
  /* ========== CUSTOM ERRORS ========== */

  error PermitDeadlineExpired(uint256 deadline);
  error InvalidSigner(address signer);
  error InvalidReceiver();
  error VaultAssetMismatchNewStrategyAsset();
  error InvalidQuitPeriod();
  error NotPassedQuitPeriod(uint256 quitPeriod);
  error InvalidFeeStructure();
  error InvalidFeeRecipient();
  error InvalidVig();
  error InvalidMinWithdrawal();
  error InsufficientWithdrawalAmount(uint256 amount);

  using SafeERC20 for ERC20;
  using FixedPointMathLib for uint256;

  // Fees are set in 1e18 for 100% (1 BPS = 1e14)
  // Raise Fees in BPS by 1e14 to get an accurate value
  struct FeeStructure {
    uint256 deposit;
    uint256 withdrawal;
    uint256 management;
    uint256 performance;
  }

  bytes32 public contractName;

  uint256 constant SECONDS_PER_YEAR = 365.25 days;
  bytes32 constant VAULTS_CONTROLLER = keccak256("VaultsController");

  /* ========== STATE VARIABLES ========== */

  ERC20 public asset;
  IERC4626 public strategy;
  FeeStructure public feeStructure;
  uint256 public vaultShareHWM;
  uint256 public assetsCheckpoint;
  uint256 public feesUpdatedAt;
  KeeperConfig public keeperConfig;
  address feeRecipient;

  // Proposing new strategy and feeStructure
  IERC4626 public proposedStrategy;
  uint256 public proposalTimeStamp;
  uint256 public quitPeriod; // default is 3 days
  FeeStructure public proposedFees;
  uint256 proposedFeeTimeStamp;

  //  EIP-2612 STORAGE
  uint256 internal INITIAL_CHAIN_ID;
  bytes32 internal INITIAL_DOMAIN_SEPARATOR;
  mapping(address => uint256) public nonces;

  uint8 internal _decimals;

  /* ========== EVENTS ========== */
  event VaultInitialized(bytes32 contractName, address indexed asset);
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
  event FeeRecipientUpdated(address indexed previousFeeRecipient, address indexed newFeeRecipient);
  event UnstakedAndWithdrawn(uint256 amount, address owner, address receiver);
  event ChangedStrategy(IERC4626 oldStrategy, IERC4626 newStrategy);
  event NewStrategyProposed(IERC4626 newStrategy, uint256 timestamp);
  event QuitPeriodSet(uint256 quitPeriod);
  event NewFeesProposed(FeeStructure newFees);

  /* ========== INITIALIZE ========== */

  function initialize(
    ERC20 asset_,
    IERC4626 strategy_,
    IContractRegistry contractRegistry_,
    FeeStructure memory feeStructure_,
    address feeRecipient_,
    KeeperConfig memory keeperConfig_
  ) external initializer {
    if (feeRecipient_ == address(0)) revert InvalidFeeRecipient();

    __ERC20_init(string.concat("Popcorn ", asset_.name(), " Vault"), string.concat("pop-", asset_.symbol()));
    __ContractRegistryAccess_init(contractRegistry_);

    asset = asset_;
    strategy = strategy_;
    quitPeriod = 3 days;
    vaultShareHWM = 10**(asset_.decimals());

    _decimals = asset_.decimals();

    INITIAL_CHAIN_ID = block.chainid;
    INITIAL_DOMAIN_SEPARATOR = computeDomainSeparator();

    asset.approve(address(strategy_), type(uint256).max);

    feesUpdatedAt = block.timestamp;
    feeStructure = feeStructure_;
    feeRecipient = feeRecipient_;

    // Note: contractNames used to access them via contractRegistry should be defined in state instead of hashed on call --> must be defined here because asset is not set until init
    contractName = keccak256(abi.encodePacked("Popcorn", asset_.name(), block.timestamp, "Vault"));
    keeperConfig = keeperConfig_;

    emit VaultInitialized(contractName, address(asset));
  }

  /* ========== VIEWS ========== */

  function decimals() public view override returns (uint8) {
    return _decimals;
  }

  function DOMAIN_SEPARATOR() public view returns (bytes32) {
    return block.chainid == INITIAL_CHAIN_ID ? INITIAL_DOMAIN_SEPARATOR : computeDomainSeparator();
  }

  /**
   * @return Total amount of underlying `asset` token managed by vault.
   */
  function totalAssets() public view returns (uint256) {
    return strategy.convertToAssets(strategy.balanceOf(address(this)));
  }

  /**
   * @notice Amount of shares the vault would exchange for given amount of assets, in an ideal scenario.
   * @param assets Exact amount of assets
   * @return Exact amount of shares
   */
  function convertToShares(uint256 assets) public view returns (uint256) {
    uint256 supply = totalSupply(); // Saves an extra SLOAD if totalSupply is non-zero.

    return supply == 0 ? assets : assets.mulDivDown(supply, totalAssets());
  }

  /**
   * @notice Amount of assets the vault would exchange for given amount of shares, in an ideal scenario.
   * @param shares Exact amount of shares
   * @return Exact amount of assets
   */
  function convertToAssets(uint256 shares) public view returns (uint256) {
    uint256 supply = totalSupply(); // Saves an extra SLOAD if totalSupply is non-zero.

    return supply == 0 ? shares : shares.mulDivDown(totalAssets(), supply);
  }

  /* ========== VIEWS ( PREVIEWS ) ========== */

  /**
   * @notice Simulate the effects of a deposit at the current block, given current on-chain conditions.
   * @param assets Exact amount of underlying `asset` token to deposit
   * @return shares of the vault issued in exchange to the user for `assets`
   * @dev This method accounts for issuance of accrued fee shares.
   */
  function previewDeposit(uint256 assets) public view returns (uint256 shares) {
    shares = convertToShares(assets - assets.mulDivDown(feeStructure.deposit, 1e18));
  }

  /**
   * @notice Simulate the effects of a mint at the current block, given current on-chain conditions.
   * @param shares Exact amount of vault shares to mint.
   * @return assets quantity of underlying needed in exchange to mint `shares`.
   * @dev This method accounts for issuance of accrued fee shares.
   */
  function previewMint(uint256 shares) public view returns (uint256 assets) {
    uint256 depositFee = feeStructure.deposit;

    shares += shares.mulDivUp(depositFee, 1e18 - depositFee);

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

    assets += assets.mulDivUp(withdrawalFee, 1e18 - withdrawalFee);

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

    assets -= assets.mulDivDown(feeStructure.withdrawal, 1e18);
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
    uint256 area = (totalAssets() + assetsCheckpoint) * (block.timestamp - feesUpdatedAt);

    return (feeStructure.management.mulDivDown(area, 2) / SECONDS_PER_YEAR) / 1e18;
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
      return feeStructure.performance.mulDivDown((shareValue - vaultShareHWM) * totalSupply(), 1e36);
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

  function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public virtual {
    if (deadline <= block.timestamp) revert PermitDeadlineExpired(deadline);

    // Unchecked because the only math done is incrementing
    // the owner's nonce which cannot realistically overflow.
    unchecked {
      address recoveredAddress = ecrecover(
        keccak256(
          abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR(),
            keccak256(
              abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                owner,
                spender,
                value,
                nonces[owner]++,
                deadline
              )
            )
          )
        ),
        v,
        r,
        s
      );

      if (recoveredAddress == address(0) || recoveredAddress != owner) revert InvalidSigner(recoveredAddress);

      _approve(recoveredAddress, spender, value);
    }
  }

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
    if (receiver == address(0)) revert InvalidReceiver();

    uint256 feeShares = convertToShares(assets.mulDivDown(feeStructure.deposit, 1e18));

    shares = convertToShares(assets) - feeShares;

    if (feeShares > 0) _mint(address(this), feeShares);

    _mint(receiver, shares);

    asset.safeTransferFrom(msg.sender, address(this), assets);

    strategy.deposit(assets, address(this));

    emit Deposit(msg.sender, receiver, assets, shares);

    vaultShareHWM = convertToAssets(1 ether);
    assetsCheckpoint = totalAssets();
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
    if (receiver == address(0)) revert InvalidReceiver();

    uint256 depositFee = feeStructure.deposit;

    uint256 feeShares = shares.mulDivDown(depositFee, 1e18 - depositFee);

    assets = convertToAssets(shares + feeShares);

    if (feeShares > 0) _mint(address(this), feeShares);

    _mint(receiver, shares);

    asset.safeTransferFrom(msg.sender, address(this), assets);

    strategy.deposit(assets, address(this));

    emit Deposit(msg.sender, receiver, assets, shares);

    vaultShareHWM = convertToAssets(1 ether);
    assetsCheckpoint = totalAssets();
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
    if (receiver == address(0)) revert InvalidReceiver();

    shares = convertToShares(assets);

    uint256 withdrawalFee = feeStructure.withdrawal;

    uint256 feeShares = shares.mulDivDown(withdrawalFee, 1e18 - withdrawalFee);

    shares += feeShares;

    if (msg.sender != owner) _approve(owner, msg.sender, allowance(owner, msg.sender) - shares);

    _burn(owner, shares);

    _mint(address(this), feeShares);

    strategy.withdraw(assets, receiver, address(this));

    emit Withdraw(msg.sender, receiver, owner, assets, shares);

    vaultShareHWM = convertToAssets(1 ether);
    assetsCheckpoint = totalAssets();
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
    if (receiver == address(0)) revert InvalidReceiver();

    if (msg.sender != owner) _approve(owner, msg.sender, allowance(owner, msg.sender) - shares);

    uint256 feeShares = shares.mulDivDown(feeStructure.withdrawal, 1e18);

    assets = convertToAssets(shares - feeShares);

    _burn(owner, shares);

    _mint(address(this), feeShares);

    strategy.withdraw(assets, receiver, address(this));

    emit Withdraw(msg.sender, receiver, owner, assets, shares);
  }

  /**
   * @notice Collect management and performance fees and update vault share high water mark.
   */
  function takeManagementAndPerformanceFees() external nonReentrant takeFees {}

  /* ========== RESTRICTED FUNCTIONS ========== */

  /**
   * @notice Propose a new strategy for this vault. Caller must have VAULTS_CONTROlLER from ACLRegistry.
   * @param newStrategy A new ERC4626 that should be used as a yield strategy for this asset.
   * @dev The new strategy can be active 3 Days by default after proposal. This allows user to rage quit.
   */
  function proposeNewStrategy(IERC4626 newStrategy) external onlyRole(VAULTS_CONTROLLER) {
    // Note:`ProposeStrategy`-ragequit time shouldnt be configurable since that defeats the purpose

    if (newStrategy.asset() != address(asset)) revert VaultAssetMismatchNewStrategyAsset();

    proposedStrategy = newStrategy;
    proposalTimeStamp = block.timestamp;

    emit NewStrategyProposed(newStrategy, block.timestamp);
  }

  /**
   * @notice Set a quitPeriod for rage quitting after new strategy or fees are proposed. Caller must have VAULTS_CONTROlLER from ACLRegistry.
   * @param _quitPeriod time to rage quit after proposal, if not set defaults to 3 days
   * @dev The new strategy can be active 3 Days by default after proposal. This allows user to rage quit.
   */
  function setQuitPeriod(uint256 _quitPeriod) external onlyRole(VAULTS_CONTROLLER) {
    if (_quitPeriod < 1 days || _quitPeriod > 7 days) revert InvalidQuitPeriod();

    quitPeriod = _quitPeriod;

    emit QuitPeriodSet(quitPeriod);
  }

  /**
   * @notice Set a new Strategy for this Vault.
   * @dev This migration function will remove all assets from the old Vault and move them into the new vault
   * @dev Additionally it will zero old allowances and set new ones
   * @dev Last we update HWM and assetsCheckpoint for fees to make sure they adjust to the new strategy
   */
  function changeStrategy() external takeFees {
    if (block.timestamp < proposalTimeStamp + quitPeriod) revert NotPassedQuitPeriod(quitPeriod);

    strategy.redeem(strategy.balanceOf(address(this)), address(this), address(this));

    asset.approve(address(strategy), 0);

    emit ChangedStrategy(strategy, proposedStrategy);
    strategy = proposedStrategy;

    asset.approve(address(strategy), type(uint256).max);

    strategy.deposit(asset.balanceOf(address(this)), address(this));

    vaultShareHWM = convertToAssets(1 ether);
  }

  /**
   * @notice Propose a new feeStructure for this vault. Caller must have VAULTS_CONTROlLER from ACLRegistry.
   * @param newFees New `feeStructure`.
   * @dev Value is in 1e18, e.g. 100% = 1e18 - 1 BPS = 1e12
   */
  function proposeNewFees(FeeStructure memory newFees) external onlyRole(VAULTS_CONTROLLER) {
    if (
      newFees.deposit >= 1e18 || newFees.withdrawal >= 1e18 || newFees.management >= 1e18 || newFees.performance >= 1e18
    ) revert InvalidFeeStructure();

    proposedFees = newFees;
    proposedFeeTimeStamp = block.timestamp;

    emit NewFeesProposed(newFees);
  }

  /**
   * @notice Set fees in BPS to proposed fees from proposeNewFees function
   */
  function setFees() external {
    if (block.timestamp < proposedFeeTimeStamp + quitPeriod) revert NotPassedQuitPeriod(quitPeriod);

    emit FeesUpdated(feeStructure, proposedFees);
    feeStructure = proposedFees;
  }

  /**
   * @notice Change keeper config. Caller must have VAULTS_CONTROLLER from ACLRegistry.
   */
  function setKeeperConfig(KeeperConfig memory _config) external onlyRole(VAULTS_CONTROLLER) {
    if (_config.incentiveVigBps > 1e18) revert InvalidVig();
    if (_config.minWithdrawalAmount < 0) revert InvalidMinWithdrawal();

    emit KeeperConfigUpdated(keeperConfig, _config);

    keeperConfig = _config;
  }

  /**
   * @notice Change feeRecipient. Caller must have VAULTS_CONTROLLER from ACLRegistry.
   */
  function setFeeRecipient(address _feeRecipient) external onlyRole(VAULTS_CONTROLLER) {
    if (_feeRecipient == address(0)) revert InvalidFeeRecipient();

    emit FeeRecipientUpdated(feeRecipient, _feeRecipient);

    feeRecipient = _feeRecipient;
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
    uint256 accruedFees = balanceOf(address(this));
    uint256 incentiveVig = keeperConfig.incentiveVigBps;

    if (accruedFees < keeperConfig.minWithdrawalAmount) revert InsufficientWithdrawalAmount(accruedFees);

    uint256 tipAmount = (accruedFees * incentiveVig) / 1e18;

    accruedFees -= tipAmount;

    _burn(address(this), accruedFees);

    _mint(_getContract(keccak256("FeeRecipient")), accruedFees);

    IKeeperIncentiveV2 keeperIncentive = IKeeperIncentiveV2(_getContract(keccak256("KeeperIncentive")));

    _approve(address(this), address(keeperIncentive), tipAmount);

    keeperIncentive.tip(address(this), msg.sender, 0, tipAmount);
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

  function computeDomainSeparator() internal view virtual returns (bytes32) {
    return
      keccak256(
        abi.encode(
          keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
          keccak256(bytes(name())),
          keccak256("1"),
          block.chainid,
          address(this)
        )
      );
  }

  /* ========== MODIFIERS ========== */

  modifier takeFees() {
    uint256 managementFee = accruedManagementFee();
    uint256 totalFee = managementFee + accruedPerformanceFee();
    uint256 currentAssets = totalAssets();

    uint256 shareValue = convertToAssets(1 ether);

    if (shareValue > vaultShareHWM) vaultShareHWM = shareValue;

    if (managementFee > 0 || currentAssets == 0) {
      feesUpdatedAt = block.timestamp;
    }

    if (totalFee > 0 && currentAssets > 0) {
      _mint(address(this), convertToShares(totalFee));
    }

    _;
    assetsCheckpoint = totalAssets();
  }
}
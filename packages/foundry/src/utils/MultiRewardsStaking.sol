/// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.10

pragma solidity ^0.8.10;

import "openzeppelin-contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { ERC4626Upgradeable, ERC20Upgradeable, IERC20MetadataUpgradeable } from "openzeppelin-contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import { MathUpgradeable } from "openzeppelin-contracts-upgradeable/utils/math/MathUpgradeable.sol";
import { SafeCastLib } from "solmate/utils/SafeCastLib.sol";
import "./OwnedUpgradeable.sol";
import "./ContractRegistryAccessUpgradeable.sol";
import "../interfaces/IContractRegistry.sol";
import "../interfaces/IRewardsEscrow.sol";

contract MultiRewardsStaking is ERC4626Upgradeable, OwnedUpgradeable, ContractRegistryAccessUpgradeable {
  using SafeERC20 for IERC20;
  using SafeCastLib for uint256;
  using MathUpgradeable for uint256;

  /*//////////////////////////////////////////////////////////////
                            IMMUTABLES
    //////////////////////////////////////////////////////////////*/

  string private _name;
  string private _symbol;
  uint8 private _decimals;

  function initialize(IERC20 _stakingToken, IContractRegistry _contractRegistry) external initializer {
    __ERC4626_init(IERC20MetadataUpgradeable(address(_stakingToken)));
    __ContractRegistryAccess_init(_contractRegistry);
    __Owned_init(msg.sender);

    _name = string(abi.encodePacked("Staked ", IERC20MetadataUpgradeable(address(_stakingToken)).name()));
    _symbol = string(abi.encodePacked("pst-", IERC20MetadataUpgradeable(address(_stakingToken)).symbol()));
    _decimals = IERC20MetadataUpgradeable(address(_stakingToken)).decimals();

    INITIAL_CHAIN_ID = block.chainid;
    INITIAL_DOMAIN_SEPARATOR = computeDomainSeparator();
  }

  /**
   * @dev Returns the name of the token.
   */
  function name() public view override(ERC20Upgradeable, IERC20MetadataUpgradeable) returns (string memory) {
    return _name;
  }

  /**
   * @dev Returns the symbol of the token, usually a shorter version of the
   * name.
   */
  function symbol() public view override(ERC20Upgradeable, IERC20MetadataUpgradeable) returns (string memory) {
    return _symbol;
  }

  /**
   * @dev Returns the symbol of the token, usually a shorter version of the
   * name.
   */
  function decimals() public view override(ERC20Upgradeable, IERC20MetadataUpgradeable) returns (uint8) {
    return _decimals;
  }

  /*//////////////////////////////////////////////////////////////
                    ERC4626 MUTATIVE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

  function deposit(uint256 _amount) external returns (uint256) {
    return deposit(_amount, msg.sender);
  }

  function mint(uint256 _amount) external returns (uint256) {
    return mint(_amount, msg.sender);
  }

  function withdraw(uint256 _amount) external returns (uint256) {
    return withdraw(_amount, msg.sender, msg.sender);
  }

  function redeem(uint256 _amount) external returns (uint256) {
    return redeem(_amount, msg.sender, msg.sender);
  }

  /*//////////////////////////////////////////////////////////////
                        ERC4626 OVERRIDES
    //////////////////////////////////////////////////////////////*/

  error ZeroAddressTransfer(address from, address to);
  error InsufficentBalance();

  function _convertToShares(uint256 assets, MathUpgradeable.Rounding) internal view override returns (uint256) {
    return assets;
  }

  function _convertToAssets(uint256 shares, MathUpgradeable.Rounding) internal view override returns (uint256) {
    return shares;
  }

  function _deposit(
    address caller,
    address receiver,
    uint256 assets,
    uint256 shares
  ) internal override accrueRewards(caller, receiver) {
    IERC20(asset()).safeTransferFrom(caller, address(this), assets);

    _mint(receiver, shares);

    emit Deposit(caller, receiver, assets, shares);
  }

  function _withdraw(
    address caller,
    address receiver,
    address owner,
    uint256 assets,
    uint256 shares
  ) internal override accrueRewards(caller, receiver) {
    if (caller != owner) _approve(owner, msg.sender, allowance(owner, msg.sender) - shares);

    _burn(owner, shares);
    IERC20(asset()).safeTransfer(receiver, assets);

    emit Withdraw(caller, receiver, owner, assets, shares);
  }

  function _transfer(
    address from,
    address to,
    uint256 amount
  ) internal override accrueRewards(from, to) {
    if (from == address(0) || to == address(0)) revert ZeroAddressTransfer(from, to);

    uint256 fromBalance = balanceOf(from);
    if (fromBalance < amount) revert InsufficentBalance();

    _burn(from, amount);
    _mint(to, amount);

    emit Transfer(from, to, amount);
  }

  /*//////////////////////////////////////////////////////////////
                            CLAIM LOGIC
    //////////////////////////////////////////////////////////////*/

  event RewardsClaimed(address indexed user, IERC20 rewardsToken, uint256 amount, bool escrowed);

  error ZeroRewards(IERC20 rewardsToken);

  function claimRewards(address user, IERC20[] memory rewardsToken) external accrueRewards(msg.sender, user) {
    for (uint8 i; i < rewardsToken.length; i++) {
      uint256 rewardAmount = rewardsAccrued[user][rewardsToken[i]];

      if (rewardAmount == 0) revert ZeroRewards(rewardsToken[i]);

      EscrowInfo memory escrowInfo = escrowInfos[rewardsToken[i]];

      if (escrowInfo.useEscrow) {
        _lockToken(user, rewardsToken[i], rewardAmount, escrowInfo);
        emit RewardsClaimed(user, rewardsToken[i], rewardAmount, true);
      } else {
        rewardsToken[i].transfer(user, rewardAmount);
        emit RewardsClaimed(user, rewardsToken[i], rewardAmount, false);
      }

      rewardsAccrued[user][rewardsToken[i]] = 0;
    }
  }

  function _lockToken(
    address user,
    IERC20 rewardsToken,
    uint256 rewardAmount,
    EscrowInfo memory escrowInfo
  ) internal {
    uint256 escrowed = rewardAmount.mulDiv(uint256(escrowInfo.escrowPercentage), 1e8, MathUpgradeable.Rounding.Down);
    uint256 payout = rewardAmount - escrowed;

    rewardsToken.safeTransfer(user, payout);
    IRewardsEscrow(_getContract(VAULT_REWARDS_ESCROW_ID)).lock(
      rewardsToken,
      user,
      escrowed,
      uint256(escrowInfo.escrowDuration),
      escrowInfo.offset
    );
  }

  /*//////////////////////////////////////////////////////////////
                    REWARDS MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  /// https://github.com/fei-protocol/flywheel-v2/blob/main/src/rewards/FlywheelStaticRewards.sol
  /// https://github.com/fei-protocol/flywheel-v2/blob/main/src/FlywheelCore.sol
  struct RewardsInfo {
    /// @notice scalar for the rewardsToken
    uint64 ONE;
    /// @notice Rewards per second
    uint160 rewardsPerSecond;
    /// @notice The timestamp the rewards end at
    /// @dev use 0 to specify no end
    uint32 rewardsEndTimestamp;
    /// @notice The strategy's last updated index
    uint224 index;
    /// @notice The timestamp the index was last updated at
    uint32 lastUpdatedTimestamp;
    /// @notice submitter of the rewards (is authorized to change rewardsSpeed later)
    address submitter;
  }

  struct EscrowInfo {
    /// @notice useEscrow
    bool useEscrow;
    /// @notice Rewards per second
    uint224 escrowDuration;
    /// @notice Percentage of reward that gets escrowed (in 1e8)
    uint24 escrowPercentage;
    /// @notice Let the Escrow start later
    uint256 offset;
  }

  IERC20[] public rewardsTokens;

  // rewardsToken -> RewardsInfo
  mapping(IERC20 => RewardsInfo) public rewardsInfos;
  // rewardsToken -> EscrowInfo
  mapping(IERC20 => EscrowInfo) public escrowInfos;

  // user => rewardsToken -> rewardsIndex
  mapping(address => mapping(IERC20 => uint256)) public userIndex;
  // user => rewardsToken -> rewardsAccrued
  mapping(address => mapping(IERC20 => uint256)) public rewardsAccrued;

  event RewardsInfoUpdate(IERC20 rewardsToken, uint160 rewardsPerSecond, uint32 rewardsEndTimestamp);

  error RewardTokenAlreadyExist(IERC20 rewardsToken);
  error RewardTokenDoesntExist(IERC20 rewardsToken);
  error RewardTokenCantBeStakingToken();
  error ZeroAmount();
  error NotSubmitter(address submitter);

  /**
     @notice Adds or updates rewards of a particular staked vault.
     @param rewardsToken The address of the rewardsToken which will be paid out to staker of this vault
     @param rewardsPerSecond The rate of how many reawrdsToken will be paid out to all staker of this vault
     @param amount The amount of rewardsToken that will fund this reward
     @param useEscrow The rate of how many reawrdsToken will be paid out to all staker of this vault
     @dev If this rewardsInfo doesnt exist yet it will be added to the array of rewardsToken of the vault
     @dev If the rewardsInfo already exist it will accrue rewards and adds the leftover to `amount`
     @dev The new `rewardsEndTimestamp` gets calculated based on `rewardsPerSecond` and `amount`
  */
  function addRewardsToken(
    IERC20 rewardsToken,
    uint160 rewardsPerSecond,
    uint256 amount,
    address submitter,
    bool useEscrow,
    uint224 escrowDuration,
    uint24 escrowPercentage,
    uint256 offset
  ) external onlyOwner {
    if (asset() == address(rewardsToken)) revert RewardTokenCantBeStakingToken();

    RewardsInfo memory rewards = rewardsInfos[rewardsToken];
    if (rewards.lastUpdatedTimestamp > 0) revert RewardTokenAlreadyExist(rewardsToken);

    // Transfer additional rewardsToken to fund rewards of this vault
    rewardsToken.safeTransferFrom(msg.sender, address(this), amount);

    // Add the rewardsToken to all existing rewardsToken
    rewardsTokens.push(rewardsToken);

    escrowInfos[rewardsToken] = EscrowInfo({
      useEscrow: useEscrow,
      escrowDuration: escrowDuration,
      escrowPercentage: escrowPercentage,
      offset: offset
    });
    if (useEscrow) rewardsToken.safeApprove(_getContract(VAULT_REWARDS_ESCROW_ID), type(uint256).max);

    uint64 ONE = (10**IERC20Metadata(address(rewardsToken)).decimals()).safeCastTo64();
    uint32 rewardsEndTimestamp = _calcRewardsEnd(0, rewardsPerSecond, amount);

    rewardsInfos[rewardsToken] = RewardsInfo({
      ONE: ONE,
      rewardsPerSecond: rewardsPerSecond,
      rewardsEndTimestamp: rewardsEndTimestamp,
      index: ONE,
      lastUpdatedTimestamp: block.timestamp.safeCastTo32(),
      submitter: submitter
    });

    emit RewardsInfoUpdate(rewardsToken, rewardsPerSecond, rewardsEndTimestamp);
  }

  function changeRewardSpeed(
    IERC20 rewardsToken,
    uint160 rewardsPerSecond,
    address submitter
  ) external onlyOwner {
    RewardsInfo memory rewards = rewardsInfos[rewardsToken];

    if (rewards.lastUpdatedTimestamp == 0) revert RewardTokenDoesntExist(rewardsToken);
    if (rewards.submitter != submitter) revert NotSubmitter(submitter);
    _accrueRewards(rewardsToken);

    uint256 remainder = rewards.balanceOnf(address(this));

    uint256 prevEndTime = rewards.rewardsEndTimestamp;
    uint256 rewardsEndTimestamp = _calcRewardsEnd(
      prevEndTime > block.timestamp ? prevEndTime : block.timestamp,
      rewardsPerSecond,
      remainder
    );
    rewardsInfos[rewardsToken].rewardsPerSecond = rewardsPerSecond;
    rewardsInfos[rewardsToken].rewardsEndTimestamp = rewardsEndTimestamp;
  }

  /**
     @notice Funds rewards of a vault staking program
     @param rewardsToken The address of the rewardsToken which will be paid out to staker of this vault
     @param amount The amount of rewardsToken that will fund this reward
     @dev Will revert if there is no rewardsInfo for this vault/rewardsToken combination
     @dev The new `rewardsEndTimestamp` gets calculated based on `rewardsPerSecond` and `amount`
  */
  function fundReward(IERC20 rewardsToken, uint256 amount) external {
    if (amount == 0) revert ZeroAmount();

    // Cache RewardsInfo
    RewardsInfo memory rewards = rewardsInfos[rewardsToken];

    // Make sure that the reward exists
    if (rewards.lastUpdatedTimestamp == 0) revert RewardTokenDoesntExist(rewardsToken);

    // Transfer additional rewardsToken to fund rewards of this vault
    rewardsToken.safeTransferFrom(msg.sender, address(this), amount);

    // Update the index of rewardsInfo before updating the rewardsInfo
    _accrueRewards(rewardsToken);

    uint32 rewardsEndTimestamp = _calcRewardsEnd(rewards.rewardsEndTimestamp, rewards.rewardsPerSecond, amount);

    rewardsInfos[rewardsToken].rewardsEndTimestamp = rewardsEndTimestamp;
    rewardsInfos[rewardsToken].lastUpdatedTimestamp = block.timestamp.safeCastTo32();

    emit RewardsInfoUpdate(rewardsToken, rewards.rewardsPerSecond, rewardsEndTimestamp);
  }

  function _calcRewardsEnd(
    uint32 rewardsEndTimestamp,
    uint160 rewardsPerSecond,
    uint256 amount
  ) internal view returns (uint32) {
    if (rewardsEndTimestamp > block.timestamp) amount += rewardsPerSecond * (rewardsEndTimestamp - block.timestamp);

    return (block.timestamp + (amount / rewardsPerSecond)).safeCastTo32();
  }

  function getAllRewardsTokens() external view returns (IERC20[] memory) {
    return rewardsTokens;
  }

  /*//////////////////////////////////////////////////////////////
                      REWARDS ACCRUAL LOGIC
    //////////////////////////////////////////////////////////////*/

  /// https://github.com/fei-protocol/flywheel-v2/blob/main/src/rewards/FlywheelStaticRewards.sol
  modifier accrueRewards(address _caller, address _receiver) {
    IERC20[] memory _rewardsTokens = rewardsTokens;
    for (uint8 i; i < _rewardsTokens.length; i++) {
      IERC20 rewardToken = _rewardsTokens[i];
      _accrueRewards(rewardToken);
      _accrueUser(_receiver, rewardToken);

      // If a deposit/withdraw operation gets called for another user we should accrue for both of them to avoid potential issues like in the Convex-Vulnerability
      // Gas cost for a comparison is currently 3. Therefore its much cheaper to check this every loop than checking it once and running a second loop. <-- is that true?
      if (_receiver != _caller) _accrueUser(_caller, rewardToken);
    }
    _;
  }

  function _accrueRewards(IERC20 _rewardsToken) internal {
    RewardsInfo memory rewards = rewardsInfos[_rewardsToken];

    uint256 elapsed;
    if (rewards.rewardsEndTimestamp > block.timestamp) {
      elapsed = block.timestamp - rewards.lastUpdatedTimestamp;
    } else if (rewards.rewardsEndTimestamp > rewards.lastUpdatedTimestamp) {
      elapsed = rewards.rewardsEndTimestamp - rewards.lastUpdatedTimestamp;
    }

    uint256 supplyTokens = totalSupply();
    uint224 deltaIndex;
    if (supplyTokens != 0)
      deltaIndex = uint256(rewards.rewardsPerSecond * elapsed)
        .mulDiv(uint256(10**decimals()), supplyTokens, MathUpgradeable.Rounding.Down)
        .safeCastTo224();

    rewardsInfos[_rewardsToken].index += deltaIndex;
    rewardsInfos[_rewardsToken].lastUpdatedTimestamp = block.timestamp.safeCastTo32();
  }

  function _accrueUser(address _user, IERC20 _rewardsToken) internal {
    RewardsInfo memory rewards = rewardsInfos[_rewardsToken];

    uint256 oldIndex = userIndex[_user][_rewardsToken];

    // if user hasn't yet accrued rewards, grant them interest from the strategy beginning if they have a balance
    // zero balances will have no effect other than syncing to global index
    if (oldIndex == 0) {
      oldIndex = rewards.ONE;
    }

    uint256 deltaIndex = rewards.index - oldIndex;

    // accumulate rewards by multiplying user tokens by rewardsPerToken index and adding on unclaimed
    uint256 supplierDelta = balanceOf(_user).mulDiv(deltaIndex, uint256(rewards.ONE), MathUpgradeable.Rounding.Down);

    userIndex[_user][_rewardsToken] = rewards.index;

    rewardsAccrued[_user][_rewardsToken] += supplierDelta;
  }

  /*//////////////////////////////////////////////////////////////
                            PERMIT LOGC
    //////////////////////////////////////////////////////////////*/

  uint256 internal INITIAL_CHAIN_ID;
  bytes32 internal INITIAL_DOMAIN_SEPARATOR;
  mapping(address => uint256) public nonces;

  error PermitDeadlineExpired(uint256 deadline);
  error InvalidSigner(address signer);

  function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public virtual {
    if (deadline < block.timestamp) revert PermitDeadlineExpired(deadline);

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

  function DOMAIN_SEPARATOR() public view returns (bytes32) {
    return block.chainid == INITIAL_CHAIN_ID ? INITIAL_DOMAIN_SEPARATOR : computeDomainSeparator();
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

  /*//////////////////////////////////////////////////////////////
                    CONTRACT REGISTRY ACCESS LOGIC
    //////////////////////////////////////////////////////////////*/

  bytes32 constant VAULT_REWARDS_ESCROW_ID = keccak256("VaultRewardsEscrow");

  /**
   * @notice Override for ACLAuth and ContractRegistryAccess.
   */
  function _getContract(bytes32 _name) internal view override(ContractRegistryAccessUpgradeable) returns (address) {
    return super._getContract(_name);
  }
}

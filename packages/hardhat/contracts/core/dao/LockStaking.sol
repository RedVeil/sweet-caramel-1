// SPDX-License-Identifier: MIT

// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IStaking.sol";
import "../interfaces/IRewardsManager.sol";
import "../interfaces/IRewardsEscrow.sol";

contract LockStaking is IStaking, Ownable, ReentrancyGuard, Pausable {
  using SafeERC20 for IERC20;

  struct LockedBalance {
    uint256 balance;
    uint256 end;
  }

  /* ========== STATE VARIABLES ========== */

  IERC20 public immutable token;
  IRewardsEscrow public rewardsEscrow;

  uint256 public periodFinish = 0;
  uint256 public rewardRate = 0;
  uint256 public rewardsDuration = 7 days;
  uint256 public lastUpdateTime;
  uint256 public rewardPerTokenStored;
  uint256 public totalLocked;
  uint256 public totalVoiceCredits;

  // duration in seconds for rewards to be held in escrow
  uint256 public escrowDuration;

  mapping(address => uint256) public voiceCredits;
  mapping(address => uint256) public userRewardPerTokenPaid;
  mapping(address => uint256) public rewards;
  mapping(address => LockedBalance) public lockedBalances;

  /* ========== EVENTS ========== */

  event StakingDeposited(address _address, uint256 amount);
  event StakingWithdrawn(address _address, uint256 amount);
  event RewardPaid(address _address, uint256 reward);
  event RewardAdded(uint256 reward);
  event EscrowDurationUpdated(uint256 _previousDuration, uint256 _newDuration);

  /* ========== CONSTRUCTOR ========== */

  constructor(IERC20 _token, IRewardsEscrow _rewardsEscrow) {
    token = _token;
    rewardsEscrow = _rewardsEscrow;

    _token.safeIncreaseAllowance(address(_rewardsEscrow), type(uint256).max);
  }

  /* ========== VIEWS ========== */

  /**
   * @notice this returns the current voice credit balance of an address. voice credits decays over time. the amount returned is up to date, whereas the amount stored in `public voiceCredits` is saved only during some checkpoints.
   * @dev todo - check if multiplier is needed for calculating square root of smaller balances
   * @param _address address to get voice credits for
   */
  function getVoiceCredits(address _address) public view override returns (uint256) {
    uint256 lockEndTime = lockedBalances[_address].end;
    uint256 balance = lockedBalances[_address].balance;
    uint256 currentTime = block.timestamp;

    if (lockEndTime == 0 || lockEndTime < currentTime || balance == 0) {
      return 0;
    }

    uint256 timeTillEnd = ((lockEndTime - currentTime) / 1 hours) * 1 hours;
    return (balance * timeTillEnd) / (4 * 365 days);
  }

  function getWithdrawableBalance(address _address) public view override returns (uint256) {
    uint256 withdrawable = 0;
    if (lockedBalances[_address].end <= block.timestamp) {
      withdrawable = lockedBalances[_address].balance;
    }
    return withdrawable;
  }

  function balanceOf(address _address) external view override returns (uint256) {
    return lockedBalances[_address].balance;
  }

  function lastTimeRewardApplicable() public view returns (uint256) {
    return Math.min(block.timestamp, periodFinish);
  }

  function rewardPerToken() public view returns (uint256) {
    if (totalLocked == 0) {
      return rewardPerTokenStored;
    }
    return rewardPerTokenStored + (((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18) / totalLocked);
  }

  function earned(address _account) public view returns (uint256) {
    return
      (lockedBalances[_account].balance * (rewardPerToken() - userRewardPerTokenPaid[_account])) /
      1e18 +
      rewards[_account];
  }

  function getRewardForDuration() external view returns (uint256) {
    return rewardRate * rewardsDuration;
  }

  function totalSupply() external view returns (uint256) {
    return totalLocked;
  }

  /* ========== MUTATIVE FUNCTIONS ========== */

  function stake(uint256 _amount, uint256 _lengthOfTime) external override nonReentrant {
    _stake(msg.sender, msg.sender, _amount, _lengthOfTime);
  }

  function stakeFor(
    address _account,
    uint256 _amount,
    uint256 _lengthOfTime
  ) external override nonReentrant {
    _stake(_account, msg.sender, _amount, _lengthOfTime);
  }

  function increaseLock(uint256 _lengthOfTime) external {
    require(_lengthOfTime >= 7 days, "must lock tokens for at least 1 week");
    require(_lengthOfTime <= 365 * 4 days, "must lock tokens for less than/equal to  4 year");
    require(lockedBalances[msg.sender].balance > 0, "no lockedBalance exists");
    require(lockedBalances[msg.sender].end > block.timestamp, "withdraw balance first");
    lockedBalances[msg.sender].end = lockedBalances[msg.sender].end + _lengthOfTime;
    recalculateVoiceCredits(msg.sender);
  }

  function increaseStake(uint256 _amount) external {
    require(_amount > 0, "amount must be greater than 0");
    require(token.balanceOf(msg.sender) >= _amount, "insufficient balance");
    require(lockedBalances[msg.sender].balance > 0, "no lockedBalance exists");
    require(lockedBalances[msg.sender].end > block.timestamp, "withdraw balance first");
    token.safeTransferFrom(msg.sender, address(this), _amount);
    totalLocked = totalLocked + _amount;
    lockedBalances[msg.sender].balance = lockedBalances[msg.sender].balance + _amount;
    recalculateVoiceCredits(msg.sender);
  }

  function withdraw(uint256 _amount) public override nonReentrant updateReward(msg.sender) {
    require(_amount > 0, "amount must be greater than 0");
    require(lockedBalances[msg.sender].balance > 0, "insufficient balance");
    require(_amount <= getWithdrawableBalance(msg.sender));

    token.safeTransfer(msg.sender, _amount);

    totalLocked = totalLocked - _amount;
    _clearWithdrawnFromLocked(_amount);
    recalculateVoiceCredits(msg.sender);
    emit StakingWithdrawn(msg.sender, _amount);
  }

  function getReward() public nonReentrant updateReward(msg.sender) {
    uint256 reward = rewards[msg.sender];
    if (reward > 0) {
      rewards[msg.sender] = 0;
      uint256 payout = reward / uint256(10);
      uint256 escrowed = payout * uint256(9);

      token.safeTransfer(msg.sender, payout);
      rewardsEscrow.lock(msg.sender, escrowed, escrowDuration);

      emit RewardPaid(msg.sender, payout);
    }
  }

  function exit() external {
    withdraw(getWithdrawableBalance(msg.sender));
    getReward();
  }

  /* ========== RESTRICTED FUNCTIONS ========== */

  function recalculateVoiceCredits(address _address) public {
    uint256 previousVoiceCredits = voiceCredits[_address];
    totalVoiceCredits = totalVoiceCredits - previousVoiceCredits;
    voiceCredits[_address] = getVoiceCredits(_address);
    totalVoiceCredits = totalVoiceCredits + voiceCredits[_address];
  }

  function setEscrowDuration(uint256 duration) external onlyOwner {
    emit EscrowDurationUpdated(escrowDuration, duration);
    escrowDuration = duration;
  }

  function _stake(
    address _account,
    address _tokensFrom,
    uint256 _amount,
    uint256 _lengthOfTime
  ) internal updateReward(_account) {
    require(_amount > 0, "amount must be greater than 0");
    require(_lengthOfTime >= 12 weeks, "must lock tokens for at least 12 weeks");
    require(_lengthOfTime <= 365 * 4 days, "must lock tokens for less than/equal to  4 year");
    require(token.balanceOf(_tokensFrom) >= _amount, "insufficient balance");
    require(lockedBalances[_account].balance == 0, "withdraw balance first");

    token.safeTransferFrom(_tokensFrom, address(this), _amount);

    totalLocked = totalLocked + _amount;
    _lockTokens(_account, _amount, _lengthOfTime);
    recalculateVoiceCredits(_account);
    emit StakingDeposited(_account, _amount);
  }

  function _lockTokens(
    address _account,
    uint256 _amount,
    uint256 _lengthOfTime
  ) internal {
    uint256 currentTime = block.timestamp;
    if (currentTime > lockedBalances[_account].end) {
      lockedBalances[_account] = LockedBalance({
        balance: lockedBalances[_account].balance + _amount,
        end: currentTime + _lengthOfTime
      });
    } else {
      lockedBalances[_account] = LockedBalance({
        balance: lockedBalances[_account].balance + _amount,
        end: lockedBalances[_account].end + _lengthOfTime
      });
    }
  }

  function _clearWithdrawnFromLocked(uint256 _amount) internal {
    if (lockedBalances[msg.sender].end <= block.timestamp) {
      if (_amount == lockedBalances[msg.sender].balance) {
        delete lockedBalances[msg.sender];
      } else {
        lockedBalances[msg.sender].balance = lockedBalances[msg.sender].balance - _amount;
      }
    }
  }

  function notifyRewardAmount(uint256 _reward) external override onlyOwner updateReward(address(0)) {
    if (block.timestamp >= periodFinish) {
      rewardRate = _reward / rewardsDuration;
    } else {
      uint256 remaining = periodFinish - block.timestamp;
      uint256 leftover = remaining * rewardRate;
      rewardRate = (_reward + leftover) / rewardsDuration;
    }

    // Ensure the provided reward amount is not more than the balance in the contract.
    // This keeps the reward rate in the right range, preventing overflows due to
    // very high values of rewardRate in the earned and rewardsPerToken functions;
    // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
    uint256 balance = token.balanceOf(address(this));
    require(rewardRate <= (balance / rewardsDuration), "Provided reward too high");

    lastUpdateTime = block.timestamp;
    periodFinish = block.timestamp + rewardsDuration;
    emit RewardAdded(_reward);
  }

  // End rewards emission earlier
  function updatePeriodFinish(uint256 _timestamp) external onlyOwner updateReward(address(0)) {
    require(_timestamp > block.timestamp, "timestamp cant be in the past");
    periodFinish = _timestamp;
  }

  /* ========== MODIFIERS ========== */

  modifier updateReward(address _account) {
    rewardPerTokenStored = rewardPerToken();
    lastUpdateTime = lastTimeRewardApplicable();
    if (_account != address(0)) {
      rewards[_account] = earned(_account);
      userRewardPerTokenPaid[_account] = rewardPerTokenStored;
    }
    _;
  }
}

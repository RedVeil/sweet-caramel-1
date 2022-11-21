/// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0

pragma solidity ^0.8.0;

import "openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import { ERC20Upgradeable } from "openzeppelin-contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "openzeppelin-contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "openzeppelin-contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "openzeppelin-contracts-upgradeable/security/PausableUpgradeable.sol";

import "./Vault.sol";
import "../utils/ACLAuth.sol";
import "../utils/ContractRegistryAccessUpgradeable.sol";

import "../interfaces/IStaking.sol";
import "../interfaces/IRewardsEscrow.sol";

// https://docs.synthetix.io/contracts/source/contracts/stakingrewards
contract VaultStaking is
  IStaking,
  ACLAuth,
  ContractRegistryAccessUpgradeable,
  ReentrancyGuardUpgradeable,
  PausableUpgradeable,
  ERC20Upgradeable
{
  using SafeERC20 for IERC20;

  /* ========== STATE VARIABLES ========== */

  bytes32 constant REWARDS_ESCROW_ID = keccak256("RewardsEscrow");
  bytes32 constant REWARDS_DISTRIBUTION_ID = keccak256("RewardsDistribution");
  bytes32 constant VAULTS_CONTROLLER = keccak256("VaultsController");

  // TODO: replace in initialize and make generic e.g. rewardTokens
  IERC20 internal constant pop = IERC20(0xD0Cd466b34A24fcB2f87676278AF2005Ca8A78c4);
  IERC20 public stakingToken;

  uint256 public periodFinish = 0;
  uint256 public rewardRate = 0;
  uint256 public rewardsDuration = 7 days;
  uint256 public lastUpdateTime;
  uint256 public rewardPerTokenStored;

  // duration in seconds for rewards to be held in escrow
  uint256 public escrowDuration;

  mapping(address => uint256) public userRewardPerTokenPaid;
  mapping(address => uint256) public rewards;

  /* ========== CONSTRUCTOR ========== */

  function initialize(IERC20 _stakingToken, IContractRegistry contractRegistry_) external initializer {
    __ERC20_init(
      string(abi.encodePacked("Staked ", IERC20Metadata(address(_stakingToken)).name())),
      string(abi.encodePacked("st-", IERC20Metadata(address(_stakingToken)).symbol()))
    );
    __ContractRegistryAccess_init(contractRegistry_);

    stakingToken = _stakingToken;
    escrowDuration = 365 days;

    pop.safeIncreaseAllowance(contractRegistry_.getContract(REWARDS_ESCROW_ID), type(uint256).max);
  }

  /* ========== VIEWS ========== */

  function balanceOf(address account) public view override(IStaking, ERC20Upgradeable) returns (uint256) {
    return super.balanceOf(account);
  }

  function rewardsToken() public pure returns (IERC20) {
    return pop;
  }

  function lastTimeRewardApplicable() public view override returns (uint256) {
    return block.timestamp < periodFinish ? block.timestamp : periodFinish;
  }

  function rewardPerToken() public view override returns (uint256) {
    if (totalSupply() == 0) {
      return rewardPerTokenStored;
    }
    return rewardPerTokenStored + (((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18) / totalSupply());
  }

  function earned(address account) public view override returns (uint256) {
    return (balanceOf(account) * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18 + rewards[account];
  }

  function getRewardForDuration() external view override returns (uint256) {
    return rewardRate * rewardsDuration;
  }

  function paused() public view override(IStaking, PausableUpgradeable) returns (bool) {
    return super.paused();
  }

  /* ========== MUTATIVE FUNCTIONS ========== */

  function stakeFor(uint256 amount, address account) external {
    _stake(amount, account);
  }

  function stake(uint256 amount) external override {
    _stake(amount, msg.sender);
  }

  function _stake(uint256 amount, address account) internal nonReentrant whenNotPaused updateReward(account) {
    require(amount > 0, "Cannot stake 0");
    _mint(account, amount);
    stakingToken.safeTransferFrom(msg.sender, address(this), amount);
    emit Staked(account, amount);
  }

  function withdrawFor(
    uint256 amount,
    address owner,
    address receiver
  ) external {
    _approve(owner, msg.sender, allowance(owner, msg.sender) - amount);
    _withdraw(amount, owner, receiver);
  }

  function withdraw(uint256 amount) external override {
    _withdraw(amount, msg.sender, msg.sender);
  }

  function _withdraw(
    uint256 amount,
    address owner,
    address receiver
  ) internal nonReentrant whenNotPaused updateReward(owner) {
    require(amount > 0, "Cannot withdraw 0");
    if (owner != receiver) _updateReward(receiver);

    _burn(owner, amount);
    stakingToken.safeTransfer(receiver, amount);
    emit Withdrawn(owner, amount);
  }

  function getReward() public override nonReentrant updateReward(msg.sender) {
    uint256 reward = rewards[msg.sender];
    if (reward > 0) {
      rewards[msg.sender] = 0;
      uint256 payout = reward / uint256(10);
      uint256 escrowed = payout * uint256(9);

      pop.safeTransfer(msg.sender, payout);
      IRewardsEscrow(_getContract(REWARDS_ESCROW_ID)).lock(msg.sender, escrowed, escrowDuration);
      emit RewardPaid(msg.sender, reward);
    }
  }

  function exit() external override {
    _withdraw(balanceOf(msg.sender), msg.sender, msg.sender);
    getReward();
  }

  /* ========== RESTRICTED FUNCTIONS ========== */

  function notifyRewardAmount(uint256 reward) external override updateReward(address(0)) {
    require(msg.sender == _getContract(REWARDS_DISTRIBUTION_ID), "only rewardsDistribution");

    if (block.timestamp >= periodFinish) {
      rewardRate = reward / rewardsDuration;
    } else {
      uint256 remaining = periodFinish - block.timestamp;
      uint256 leftover = remaining * rewardRate;
      rewardRate = (reward + leftover) / rewardsDuration;
    }

    // handle the transfer of reward tokens via `transferFrom` to reduce the number
    // of transactions required and ensure correctness of the reward amount
    IERC20(pop).safeTransferFrom(msg.sender, address(this), reward);

    // Ensure the provided reward amount is not more than the balance in the contract.
    // This keeps the reward rate in the right range, preventing overflows due to
    // very high values of rewardRate in the earned and rewardsPerToken functions;
    // Reward + leftover must be less than 2^256 / 10^18 to avoid overflow.
    uint256 balance = pop.balanceOf(address(this));
    require(rewardRate <= balance / rewardsDuration, "Provided reward too high");

    lastUpdateTime = block.timestamp;
    periodFinish = block.timestamp + rewardsDuration;

    emit RewardAdded(reward);
  }

  function setEscrowDuration(uint256 duration) external onlyRole(VAULTS_CONTROLLER) {
    emit EscrowDurationUpdated(escrowDuration, duration);
    escrowDuration = duration;
  }

  function setRewardsDuration(uint256 _rewardsDuration) external onlyRole(VAULTS_CONTROLLER) {
    require(
      block.timestamp > periodFinish,
      "Previous rewards period must be complete before changing the duration for the new period"
    );
    rewardsDuration = _rewardsDuration;
    emit RewardsDurationUpdated(rewardsDuration);
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

  /* ========== ERC20 OVERRIDE ========== */

  function _transfer(
    address, /* from */
    address, /* to */
    uint256 /* amount */
  ) internal pure override(ERC20Upgradeable) {
    revert("Token is nontransferable");
  }

  /* ========== MODIFIERS ========== */

  modifier updateReward(address account) {
    _updateReward(account);
    _;
  }

  /* ========== INTERNAL FUNCTIONS ========== */

  function _updateReward(address account) internal {
    rewardPerTokenStored = rewardPerToken();
    lastUpdateTime = lastTimeRewardApplicable();
    if (account != address(0)) {
      rewards[account] = earned(account);
      userRewardPerTokenPaid[account] = rewardPerTokenStored;
    }
  }

  function _getContract(bytes32 _name)
    internal
    view
    override(ACLAuth, ContractRegistryAccessUpgradeable)
    returns (address)
  {
    return super._getContract(_name);
  }
}

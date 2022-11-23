// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";

import "../src/utils/ACLRegistry.sol";
import "../src/utils/ContractRegistry.sol";
import "../src/utils/KeeperIncentiveV2.sol";
import "./utils/mocks/KeeperIncentivizedHelper.sol";
import "./utils/mocks/KeeperIncentiveHelper.sol";
import "./utils/mocks/MockERC20.sol";

contract KeeperIncentiveTest is Test {
  // Contracts
  MockERC20 internal mockPop;
  MockERC20 internal rewardToken;
  ContractRegistry internal contractRegistry;
  ACLRegistry internal aclRegistry;
  KeeperIncentiveV2 internal keeperIncentive;
  KeeperIncentiveHelper internal helper;
  KeeperIncentivizedHelper internal keeperIncentivizedHelper;
  MockStaking internal staking;

  bytes32[] claimArgument;
  bytes32[] claimArgumentReward;

  // Roles
  bytes32 constant KEEPER_ROLE = keccak256("Keeper");
  bytes32 constant DAO_ROLE = keccak256("DAO");

  // Permissions
  bytes32 constant TEST_PERMISSION = keccak256("Test Permission");

  // Accounts
  address internal keeper = makeAddr("keeper");
  address internal manager = makeAddr("manager");
  address internal random = makeAddr("random");

  uint256 INCENTIVE = 10 ether;

  function setUp() public virtual {
    // Set up contracts
    mockPop = new MockERC20("TestPOP", "TPOP", 18);
    rewardToken = new MockERC20("RewardToken", "RT", 18);

    vm.startPrank(manager);
    aclRegistry = new ACLRegistry();
    contractRegistry = new ContractRegistry(aclRegistry);
    keeperIncentive = new KeeperIncentiveV2(contractRegistry, 0.25e18, 2000e18);
    staking = new MockStaking();
    helper = new KeeperIncentiveHelper(keeperIncentive);
    keeperIncentivizedHelper = new KeeperIncentivizedHelper(contractRegistry);

    // Grant roles
    aclRegistry.grantRole(DAO_ROLE, manager);
    aclRegistry.grantRole(INCENTIVE_MANAGER_ROLE, manager);
    aclRegistry.grantRole(KEEPER_ROLE, keeper);

    // Register contracts
    contractRegistry.addContract(keccak256("PopLocker"), address(staking), keccak256("1"));
    contractRegistry.addContract(keccak256("POP"), address(mockPop), ("1"));
    contractRegistry.addContract(keccak256("KeeperIncentive"), address(keeperIncentive), ("1"));

    // Create incentives
    keeperIncentive.createIncentive(address(helper), INCENTIVE, true, false, address(mockPop), 1, 0);

    // Mint tokens
    mockPop.mint(keeper, 2100 ether);
    mockPop.mint(manager, 100 ether);

    rewardToken.mint(keeper, 2100 ether);
    rewardToken.mint(manager, 100 ether);

    // Approve tokens
    mockPop.approve(address(keeperIncentive), 100000 ether);
    mockPop.approve(address(helper), 100000 ether);
    rewardToken.approve(address(keeperIncentive), 100000 ether);
    rewardToken.approve(address(helper), 100000 ether);
    vm.stopPrank();

    vm.warp(block.timestamp + 7 days);
  }

  function createIncentive(uint256 amount, uint256 cooldown) internal {
    vm.prank(manager);
    keeperIncentive.createIncentive(address(helper), amount, true, false, address(mockPop), cooldown, 0);
  }

  function fundIncentive(uint256 i, uint256 amount) internal {
    vm.startPrank(manager);
    mockPop.approve(address(keeperIncentive), amount);
    keeperIncentive.fundIncentive(address(helper), i, amount);
    vm.stopPrank();
  }

  function runJob(uint8 i) internal {
    vm.prank(keeper);
    helper.incentivisedFunction(i);
  }

  function accountId(
    address _contract,
    uint256 index,
    address _rewardToken
  ) internal pure returns (bytes32) {
    return keccak256(abi.encode(_contract, index, _rewardToken));
  }

  function getKeeperClaimableTokenBalance(address keeperAddress, address _rewardToken)
    public
    view
    returns (uint256 balance)
  {
    IKeeperIncentiveV2.Account[] memory accounts = keeperIncentive.getAccounts(keeperAddress);
    for (uint256 i; i < accounts.length; ++i) {
      if (address(accounts[i].token) == _rewardToken) {
        balance += balance + accounts[i].balance;
      }
    }
    return balance;
  }

  function claim(bytes32 _accountId) public {
    claimArgument.push(_accountId);
    vm.prank(keeper);
    keeperIncentive.claim(claimArgument);
  }
}

contract TestViews is KeeperIncentiveTest {
  function setUp() public override {
    super.setUp();
    uint256 smallIncentive = 5 ether;

    createIncentive(smallIncentive, 1);
    createIncentive(smallIncentive, 1);
    createIncentive(smallIncentive, 1);
    createIncentive(smallIncentive - 1, 1);
    createIncentive(smallIncentive, 1);

    fundIncentive(0, 10 ether);
    fundIncentive(1, 10 ether);
    fundIncentive(2, 10 ether);
    fundIncentive(3, 10 ether);
    fundIncentive(4, 10 ether);
    fundIncentive(5, 5 ether);

    runJob(0);
    runJob(1);
    runJob(2);
    runJob(3);
    runJob(4);
    runJob(5);
  }

  function test__returnsKeeperIncentivesAccountBalances() public {
    IKeeperIncentiveV2.Account[] memory accounts = keeperIncentive.getAccounts(keeper);
    IKeeperIncentiveV2.Account[] memory popAccounts = new IKeeperIncentiveV2.Account[](6);

    uint256 popCount;
    for (uint256 i; i < accounts.length; ++i) {
      if (accounts[i].token == address(mockPop)) {
        popAccounts[popCount] = accounts[i];
        ++popCount;
      }
    }

    assertEq(popAccounts[0].token, address(mockPop));
    assertEq(popAccounts[1].token, address(mockPop));
    assertEq(popAccounts[2].token, address(mockPop));
    assertEq(popAccounts[3].token, address(mockPop));
    assertEq(popAccounts[4].token, address(mockPop));
    assertEq(popAccounts[5].token, address(mockPop));

    assertEq(popAccounts[0].balance, 7.5 ether);
    assertEq(popAccounts[1].balance, 3.75 ether);
    assertEq(popAccounts[2].balance, 3.75 ether);
    assertEq(popAccounts[3].balance, 3.75 ether);
    assertEq(popAccounts[4].balance, 3.75 ether);
    assertEq(popAccounts[5].balance, 3.75 ether);

    assertEq(popAccounts[0].accountId, accountId(address(helper), 0, address(mockPop)));
    assertEq(popAccounts[1].accountId, accountId(address(helper), 1, address(mockPop)));
    assertEq(popAccounts[2].accountId, accountId(address(helper), 2, address(mockPop)));
    assertEq(popAccounts[3].accountId, accountId(address(helper), 3, address(mockPop)));
    assertEq(popAccounts[4].accountId, accountId(address(helper), 4, address(mockPop)));
    assertEq(popAccounts[5].accountId, accountId(address(helper), 5, address(mockPop)));
  }

  function test__returnsKeeperAccounts() public {
    IKeeperIncentiveV2.Account[] memory accounts = keeperIncentive.getAccounts(keeper);

    assertEq(accounts.length, 6);

    for (uint256 i; i < 6; ++i) {
      bytes32 id = accountId(address(helper), i, address(mockPop));
      assertEq(keeperIncentive.keeperAccounts(keeper, i), id);
    }
  }

  function test__returnsClaimableKeeperBalance() public {
    IKeeperIncentiveV2.Account[] memory accounts = keeperIncentive.getAccounts(keeper);

    assertEq(accounts.length, 6);

    for (uint256 i; i < 6; ++i) {
      bytes32 id = accountId(address(helper), i, address(mockPop));
      assertEq(keeperIncentive.keeperAccounts(keeper, i), id);
    }
  }
}

contract TestAuth is KeeperIncentiveTest {
  function test__createincentiveAuth() public {
    vm.expectRevert("you dont have the right role");
    keeperIncentive.createIncentive(address(helper), INCENTIVE, true, false, address(mockPop), 1, 0);
  }

  function test__updateIncentiveAuth() public {
    vm.expectRevert("you dont have the right role");
    keeperIncentive.updateIncentive(address(helper), 0, INCENTIVE, true, false, address(mockPop), 1, 0);
  }

  function test__toggleApprovalAuth() public {
    vm.expectRevert("you dont have the right role");
    keeperIncentive.toggleApproval(address(helper), 0);
  }

  function test__toggleIncentiveAuth() public {
    vm.expectRevert("you dont have the right role");
    keeperIncentive.toggleIncentive(address(helper), 0);
  }
}

contract TestParameters is KeeperIncentiveTest {
  event BurnPercentageChanged(uint256 oldRate, uint256 newRate);
  event RequiredKeeperStakeChanged(uint256 oldRequirement, uint256 newRequirement);

  function test__revertsIfBurnPercentageTooHigh() public {
    uint256 defaultBurn = keeperIncentive.defaultBurnPercentage();
    vm.expectRevert("burn percentage too high");
    vm.prank(manager);
    keeperIncentive.updateBurnPercentage(2e18);

    assertEq(keeperIncentive.defaultBurnPercentage(), defaultBurn);
  }

  function test__updatesBurnPercentage() public {
    vm.expectEmit(false, false, false, true);
    emit BurnPercentageChanged(0.25e18, 0.1e18);
    vm.prank(manager);
    keeperIncentive.updateBurnPercentage(0.1e18);

    assertEq(keeperIncentive.defaultBurnPercentage(), 0.1e18);
  }

  function test__updatesRequiredKeeperStake() public {
    vm.expectEmit(false, false, false, true);
    emit RequiredKeeperStakeChanged(2000 ether, 100 ether);
    vm.prank(manager);
    keeperIncentive.updateRequiredKeeperStake(100 ether);

    assertEq(keeperIncentive.requiredKeeperStake(), 100 ether);
  }
}

contract TestCreateIncentive is KeeperIncentiveTest {
  event IncentiveCreated(address indexed contractAddress, uint256 reward, bool openToEveryone, uint256 index);

  function test__createsIncentive() public {
    vm.expectEmit(true, false, false, true);
    emit IncentiveCreated(address(helper), INCENTIVE, false, 1);
    vm.prank(manager);
    keeperIncentive.createIncentive(address(helper), INCENTIVE, true, false, address(mockPop), 1, 0);

    (
      uint256 reward,
      bool enabled,
      bool openToEveryone,
      address rewardToken_,
      uint256 cooldown,
      uint256 burnPercentage,
      uint256 id,
      uint256 lastInvocation
    ) = keeperIncentive.incentivesByController(address(helper), 1);

    assertEq(reward, INCENTIVE);
    assertEq(enabled, true);
    assertEq(openToEveryone, false);
    assertEq(rewardToken_, address(mockPop));
    assertEq(cooldown, 1);
    assertEq(burnPercentage, 0.25e18);
    assertEq(id, 1);
    assertEq(lastInvocation, 0);

    address[] memory controllerContracts = keeperIncentive.getControllerContracts();
    assertEq(controllerContracts.length, 2);
    assertEq(controllerContracts[1], address(helper));
  }

  function test__revertsCooldownNotSet() public {
    vm.expectRevert("must set cooldown");
    vm.prank(manager);
    keeperIncentive.createIncentive(address(helper), INCENTIVE, true, false, address(mockPop), 0, 0);
  }

  function test__revertsNoRewardsToken() public {
    vm.expectRevert("must set reward token");
    vm.prank(manager);
    keeperIncentive.createIncentive(address(helper), INCENTIVE, true, false, address(0), 1, 0);
  }

  function test__revertsBurnPercentageTooHigh() public {
    vm.expectRevert("burn percentage too high");
    vm.prank(manager);
    keeperIncentive.createIncentive(address(helper), INCENTIVE, true, false, address(mockPop), 1, 2e18);
  }
}

contract TestCooldown is KeeperIncentiveTest {
  function test__waitForCooldown() public {
    createIncentive(1 ether, 2 days);
    fundIncentive(1, 5 ether);
    runJob(1);
    vm.warp(block.timestamp + 1 days);

    vm.expectRevert("wait for cooldown period");
    runJob(1);
  }

  function test__cannotDrainContractWithCooldown() public {
    vm.prank(manager);
    keeperIncentive.updateBurnPercentage(0);

    createIncentive(1 ether, 2 days);
    fundIncentive(1, 5 ether);
    runJob(1);
    vm.warp(block.timestamp + 1 days);

    vm.expectRevert("wait for cooldown period");
    runJob(1);

    IKeeperIncentiveV2.Account[] memory accounts = keeperIncentive.getAccounts(keeper);
    IKeeperIncentiveV2.Account memory account = accounts[0];
    assertEq(account.balance, 1 ether);
  }
}

contract TestChangeIncentive is KeeperIncentiveTest {
  event IncentiveChanged(
    address indexed contractAddress,
    uint256 oldReward,
    uint256 newReward,
    bool oldOpenToEveryone,
    bool newOpenToEveryone,
    address oldRewardToken,
    address newRewardToken,
    uint256 oldCooldown,
    uint256 newCooldown,
    uint256 oldBurnPercentage,
    uint256 newBurnPercentage,
    uint256 index
  );

  function test__updatesIncentive() public {
    vm.expectEmit(true, false, false, true);
    emit IncentiveChanged(
      address(helper),
      INCENTIVE,
      100 ether,
      false,
      true,
      address(mockPop),
      address(mockPop),
      1,
      1,
      0.25e18,
      0.25e18,
      0
    );
    vm.prank(manager);
    keeperIncentive.updateIncentive(address(helper), 0, 100 ether, false, true, address(mockPop), 1, 0);

    (
      uint256 reward,
      bool enabled,
      bool openToEveryone,
      address rewardToken_,
      uint256 cooldown,
      uint256 burnPercentage,
      uint256 id,
      uint256 lastInvocation
    ) = keeperIncentive.incentivesByController(address(helper), 0);

    assertEq(reward, 100 ether);
    assertEq(enabled, false);
    assertEq(openToEveryone, true);
    assertEq(rewardToken_, address(mockPop));
    assertEq(cooldown, 1);
    assertEq(burnPercentage, 0.25e18);
    assertEq(id, 0);
    assertEq(lastInvocation, 0);
  }

  function test__revertsCooldownNotSet() public {
    vm.expectRevert("must set cooldown");
    vm.prank(manager);
    keeperIncentive.updateIncentive(address(helper), 0, 100 ether, false, true, address(mockPop), 0, 0);
  }

  function test__revertsNoRewardsToken() public {
    vm.expectRevert("must set reward token");
    vm.prank(manager);
    keeperIncentive.updateIncentive(address(helper), 0, 100 ether, false, true, address(0), 1, 0);
  }

  function test__revertsBurnPercentageTooHigh() public {
    vm.expectRevert("burn percentage too high");
    vm.prank(manager);
    keeperIncentive.updateIncentive(address(helper), 0, 100 ether, false, true, address(mockPop), 1, 2e18);
  }
}

contract TestToggles is KeeperIncentiveTest {
  event IncentiveToggled(address indexed contractAddress, bool enabled);
  event ApprovalToggled(address indexed contractAddress, bool openToEveryone);

  function test__approveDisapprove() public {
    vm.expectEmit(true, false, false, true);
    emit ApprovalToggled(address(helper), true);
    vm.prank(manager);
    keeperIncentive.toggleApproval(address(helper), 0);

    (
      uint256 reward,
      bool enabled,
      bool openToEveryone,
      address rewardToken_,
      uint256 cooldown,
      uint256 burnPercentage,
      uint256 id,
      uint256 lastInvocation
    ) = keeperIncentive.incentivesByController(address(helper), 0);

    assertEq(reward, INCENTIVE);
    assertEq(enabled, true);
    assertEq(openToEveryone, true);
    assertEq(rewardToken_, address(mockPop));
    assertEq(cooldown, 1);
    assertEq(burnPercentage, 0.25e18);
    assertEq(id, 0);
    assertEq(lastInvocation, 0);

    vm.expectEmit(true, false, false, true);
    emit ApprovalToggled(address(helper), false);
    vm.prank(manager);
    keeperIncentive.toggleApproval(address(helper), 0);

    (reward, enabled, openToEveryone, rewardToken_, cooldown, burnPercentage, id, lastInvocation) = keeperIncentive
      .incentivesByController(address(helper), 0);

    assertEq(reward, INCENTIVE);
    assertEq(enabled, true);
    assertEq(openToEveryone, false);
    assertEq(rewardToken_, address(mockPop));
    assertEq(cooldown, 1);
    assertEq(burnPercentage, 0.25e18);
    assertEq(id, 0);
    assertEq(lastInvocation, 0);
  }

  function test__enableDisable() public {
    vm.expectEmit(true, false, false, true);
    emit IncentiveToggled(address(helper), false);
    vm.prank(manager);
    keeperIncentive.toggleIncentive(address(helper), 0);

    (
      uint256 reward,
      bool enabled,
      bool openToEveryone,
      address rewardToken_,
      uint256 cooldown,
      uint256 burnPercentage,
      uint256 id,
      uint256 lastInvocation
    ) = keeperIncentive.incentivesByController(address(helper), 0);

    assertEq(reward, INCENTIVE);
    assertEq(enabled, false);
    assertEq(openToEveryone, false);
    assertEq(rewardToken_, address(mockPop));
    assertEq(cooldown, 1);
    assertEq(burnPercentage, 0.25e18);
    assertEq(id, 0);
    assertEq(lastInvocation, 0);

    vm.expectEmit(true, false, false, true);
    emit IncentiveToggled(address(helper), true);
    vm.prank(manager);
    keeperIncentive.toggleIncentive(address(helper), 0);

    (reward, enabled, openToEveryone, rewardToken_, cooldown, burnPercentage, id, lastInvocation) = keeperIncentive
      .incentivesByController(address(helper), 0);

    assertEq(reward, INCENTIVE);
    assertEq(enabled, true);
    assertEq(openToEveryone, false);
    assertEq(rewardToken_, address(mockPop));
    assertEq(cooldown, 1);
    assertEq(burnPercentage, 0.25e18);
    assertEq(id, 0);
    assertEq(lastInvocation, 0);
  }
}

contract TestFundIncentive is KeeperIncentiveTest {
  event IncentiveFunded(uint256 amount, address indexed rewardToken, uint256 incentiveBalance);
  event FunctionCalled(address account);
  event Tipped(address account);
  uint256 tipAmount = 15 ether;

  function test__FundIncentive() public {
    vm.expectEmit(false, true, false, true);
    emit IncentiveFunded(INCENTIVE, address(mockPop), INCENTIVE);
    fundIncentive(0, INCENTIVE);

    vm.expectEmit(false, false, false, true);
    emit FunctionCalled(address(keeper));
    runJob(0);

    bool hasClaimableBalance = keeperIncentive.hasClaimableBalance(keeper);
    assertEq(hasClaimableBalance, true);

    (uint256 balance, , ) = keeperIncentive.accounts(accountId(address(helper), 0, address(mockPop)), address(keeper));

    assertEq(balance, (INCENTIVE * 3) / 4);
  }

  function test__payoutKeeperIncentiveTips() public {
    bool claimableBalance = keeperIncentive.hasClaimableBalance(keeper);
    assertEq(claimableBalance, false);

    vm.expectEmit(false, false, false, true);
    emit FunctionCalled(address(keeper));
    runJob(0);

    vm.expectEmit(false, false, false, true);
    emit Tipped(address(manager));
    vm.prank(address(manager));
    helper.tipIncentive(address(mockPop), address(keeper), 0, tipAmount);

    claimableBalance = keeperIncentive.hasClaimableBalance(keeper);
    assertEq(claimableBalance, true);

    (uint256 balance, , ) = keeperIncentive.accounts(accountId(address(helper), 0, address(mockPop)), address(keeper));

    assertEq(balance, tipAmount);
  }

  function test__revertTipNoControllerContract() public {
    vm.startPrank(random);
    mockPop.approve(address(keeper), tipAmount);
    vm.expectRevert("must be controller contract");
    keeperIncentive.tip(address(mockPop), address(keeper), 0, tipAmount);
  }

  function test__revertTipIfNoAmountSet() public {
    vm.prank(manager);
    vm.expectRevert("must send amount");
    keeperIncentive.tip(address(mockPop), address(keeper), 0, 0);
  }

  function test__revertNoAmount() public {
    vm.expectRevert("must send amount");
    vm.prank(manager);
    keeperIncentive.fundIncentive(address(helper), 0, 0);
  }

  function test__payoutRewardsAndTips() public {
    uint256 fundAmount = 100 ether;
    uint256 rewardAmount = 10 ether;

    mockPop.mint(manager, fundAmount + tipAmount);
    vm.prank(manager);
    keeperIncentive.updateBurnPercentage(0);

    createIncentive(rewardAmount, 1);
    fundIncentive(1, fundAmount);

    bool hasClaimableBalance = keeperIncentive.hasClaimableBalance(keeper);
    assertEq(hasClaimableBalance, false);

    vm.expectEmit(false, false, false, true);
    emit FunctionCalled(address(keeper));
    runJob(1);

    vm.expectEmit(false, false, false, true);
    emit Tipped(address(manager));
    vm.prank(address(manager));
    helper.tipIncentive(address(mockPop), address(keeper), 1, tipAmount);

    hasClaimableBalance = keeperIncentive.hasClaimableBalance(keeper);
    assertEq(hasClaimableBalance, true);

    (uint256 balance, , ) = keeperIncentive.accounts(accountId(address(helper), 1, address(mockPop)), address(keeper));

    assertEq(balance, rewardAmount + tipAmount);
  }

  function test__payoutKeeperRewardsAndTipsInDifferentTokens() public {
    uint256 fundAmount = 100 ether;
    uint256 rewardAmount = 10 ether;

    vm.prank(manager);
    keeperIncentive.updateBurnPercentage(0);
    createIncentive(rewardAmount, 1);
    fundIncentive(1, fundAmount);

    bool hasClaimableBalance = keeperIncentive.hasClaimableBalance(keeper);
    assertEq(hasClaimableBalance, false);

    vm.expectEmit(false, false, false, true);
    emit FunctionCalled(address(keeper));
    runJob(1);

    vm.expectEmit(false, false, false, true);
    emit Tipped(address(manager));
    vm.prank(address(manager));
    helper.tipIncentive(address(rewardToken), address(keeper), 1, tipAmount);

    hasClaimableBalance = keeperIncentive.hasClaimableBalance(keeper);
    assertEq(hasClaimableBalance, true);

    (uint256 balancePop, , ) = keeperIncentive.accounts(
      accountId(address(helper), 1, address(mockPop)),
      address(keeper)
    );

    (uint256 balanceRewardToken, , ) = keeperIncentive.accounts(
      accountId(address(helper), 1, address(rewardToken)),
      address(keeper)
    );

    assertEq(balancePop, rewardAmount);
    assertEq(balanceRewardToken, tipAmount);
  }

  function test__payoutKeeperRewardsForMultipleRewardTokens() public {
    uint256 fundAmount = 100 ether;

    fundIncentive(0, fundAmount);

    vm.startPrank(manager);
    bool hasClaimableBalance = keeperIncentive.hasClaimableBalance(keeper);
    assertEq(hasClaimableBalance, false);
    vm.stopPrank();

    vm.expectEmit(false, false, false, true);
    emit FunctionCalled(address(keeper));
    runJob(0);

    hasClaimableBalance = keeperIncentive.hasClaimableBalance(keeper);
    assertEq(hasClaimableBalance, true);

    (uint256 balance, , ) = keeperIncentive.accounts(accountId(address(helper), 0, address(mockPop)), address(keeper));

    assertEq(balance, (fundAmount * 3) / (4 * 10));

    // create and fund incentive with different reward token
    uint256 newRewardAmount = 10 ether;
    vm.startPrank(manager);
    rewardToken.approve(address(helper), fundAmount);
    keeperIncentive.createIncentive(address(helper), newRewardAmount, true, false, address(rewardToken), 1, 0);
    keeperIncentive.fundIncentive(address(helper), 1, fundAmount);
    vm.stopPrank();

    vm.expectEmit(false, false, false, true);
    emit FunctionCalled(address(keeper));
    runJob(1);

    hasClaimableBalance = keeperIncentive.hasClaimableBalance(keeper);
    assertEq(hasClaimableBalance, true);

    (uint256 balanceR, , ) = keeperIncentive.accounts(
      accountId(address(helper), 1, address(rewardToken)),
      address(keeper)
    );

    assertEq(balanceR, newRewardAmount);
  }

  function test__shouldWorkWithLegacyFunction() public {
    uint256 fundAmount = 100 ether;

    fundIncentive(0, fundAmount);

    vm.startPrank(manager);
    bool hasClaimableBalance = keeperIncentive.hasClaimableBalance(keeper);
    assertEq(hasClaimableBalance, false);
    vm.stopPrank();

    vm.expectEmit(false, false, false, true);
    emit FunctionCalled(address(keeper));
    vm.prank(address(keeper));
    helper.incentivisedFunctionLegacy();

    hasClaimableBalance = keeperIncentive.hasClaimableBalance(keeper);
    assertEq(hasClaimableBalance, true);

    (uint256 balance, , ) = keeperIncentive.accounts(accountId(address(helper), 0, address(mockPop)), address(keeper));

    assertEq(balance, (fundAmount * 3) / (4 * 10));
  }
}

contract ClaimableBalances is KeeperIncentiveTest {
  event FunctionCalled(address account);

  function test__shouldReturnClaimableBalance() public {
    uint256 fundAmount = 100 ether;
    fundIncentive(0, fundAmount);

    runJob(0);

    IKeeperIncentiveV2.Account[] memory accounts = keeperIncentive.getAccounts(keeper);
    IKeeperIncentiveV2.Account[] memory popAccounts = new IKeeperIncentiveV2.Account[](6);

    uint256 popCount;
    for (uint256 i; i < accounts.length; ++i) {
      if (accounts[i].token == address(mockPop)) {
        popAccounts[popCount] = accounts[i];
        ++popCount;
      }
    }

    assertEq(accounts.length, 1);
    assertEq(accounts[0].token, address(mockPop));
    assertEq(accounts[0].balance, (10 ether * 3) / 4);
    assertEq(accounts[0].accountId, accountId(address(helper), 0, address(mockPop)));
  }

  function test__returnClaimableBalanceForMultipleRewardTokens() public {
    uint256 fundAmount = 100 ether;

    fundIncentive(0, fundAmount);
    runJob(0);

    vm.startPrank(manager);
    keeperIncentive.createIncentive(address(helper), 10 ether, true, false, address(rewardToken), 1, 0);
    keeperIncentive.fundIncentive(address(helper), 1, fundAmount);
    vm.stopPrank();

    runJob(1);

    IKeeperIncentiveV2.Account[] memory accounts = keeperIncentive.getAccounts(keeper);
    assertEq(accounts.length, 2);

    assertEq(accounts[0].token, address(mockPop));
    assertEq(accounts[0].balance, (10 ether * 3) / 4);
    assertEq(accounts[0].accountId, accountId(address(helper), 0, address(mockPop)));

    assertEq(accounts[1].token, address(rewardToken));
    assertEq(accounts[1].balance, 10 ether);
    assertEq(accounts[1].accountId, accountId(address(helper), 1, address(rewardToken)));
  }

  function test__returnAllClaimableBalancesForDifferentIncentives() public {
    uint256 fundAmount = 50 ether;

    createIncentive(10 ether, 1);
    fundIncentive(0, fundAmount);
    createIncentive(10 ether, 1);
    fundIncentive(1, fundAmount);
    runJob(0);
    runJob(1);

    IKeeperIncentiveV2.Account[] memory accounts = keeperIncentive.getAccounts(keeper);
    assertEq(accounts.length, 2);

    assertEq(accounts[0].token, address(mockPop));
    assertEq(accounts[0].balance, (10 ether * 3) / 4);
    assertEq(accounts[0].accountId, accountId(address(helper), 0, address(mockPop)));

    assertEq(accounts[1].token, address(mockPop));
    assertEq(accounts[1].balance, (10 ether * 3) / 4);
    assertEq(accounts[1].accountId, accountId(address(helper), 1, address(mockPop)));
  }

  function test__addEarnedBalancesToUnclaimedAccounts() public {
    uint256 fundAmount = 10 ether;
    uint256 rewardAmount = 1 ether;

    vm.prank(manager);
    keeperIncentive.updateBurnPercentage(0);

    createIncentive(rewardAmount, 1);
    fundIncentive(1, fundAmount);

    uint256 balance = getKeeperClaimableTokenBalance(keeper, address(mockPop));
    assertEq(balance, 0 ether);

    runJob(1);
    vm.warp(block.timestamp + 2);
    runJob(1);
    vm.warp(block.timestamp + 2);
    runJob(1);
    vm.warp(block.timestamp + 2);
    runJob(1);
    vm.warp(block.timestamp + 2);

    uint256 balanceAfter = getKeeperClaimableTokenBalance(keeper, address(mockPop));
    assertEq(balanceAfter, 4 ether);

    claimArgument.push(accountId(address(helper), 1, address(mockPop)));
    vm.prank(keeper);
    keeperIncentive.claim(claimArgument);

    uint256 balanceAfterClaim = getKeeperClaimableTokenBalance(keeper, address(mockPop));
    assertEq(balanceAfterClaim, 0 ether);
  }

  function test__payoutRewardWithNewTokenAfterIncentiveIsUpdatedWithNewToken() public {
    uint256 fundAmount = 10 ether;
    uint256 rewardAmount = 1 ether;

    vm.prank(manager);
    keeperIncentive.updateBurnPercentage(0);
    createIncentive(rewardAmount, 1);
    fundIncentive(1, fundAmount);

    IKeeperIncentiveV2.Account[] memory accounts = keeperIncentive.getAccounts(keeper);
    assertEq(accounts.length, 0);

    runJob(1);
    vm.warp(block.timestamp + 2);
    runJob(1);
    vm.warp(block.timestamp + 2);
    runJob(1);
    vm.warp(block.timestamp + 2);
    runJob(1);
    vm.warp(block.timestamp + 2);

    uint256 balanceAfter = getKeeperClaimableTokenBalance(keeper, address(mockPop));
    assertEq(balanceAfter, 4 ether);

    claimArgument.push(accountId(address(helper), 1, address(mockPop)));
    vm.prank(keeper);
    keeperIncentive.claim(claimArgument);

    uint256 balanceAfterClaim = getKeeperClaimableTokenBalance(keeper, address(mockPop));
    assertEq(balanceAfterClaim, 0 ether);

    vm.prank(manager);
    keeperIncentive.updateIncentive(address(helper), 1, rewardAmount, true, true, address(rewardToken), 1, 0);
    fundIncentive(1, fundAmount);

    uint256 balanceRewardTokenBefore = getKeeperClaimableTokenBalance(keeper, address(rewardToken));
    assertEq(balanceRewardTokenBefore, 0 ether);

    runJob(1);
    vm.warp(block.timestamp + 2);
    runJob(1);
    vm.warp(block.timestamp + 2);
    runJob(1);
    vm.warp(block.timestamp + 2);
    runJob(1);
    vm.warp(block.timestamp + 2);

    uint256 balanceRewardTokenAfter = getKeeperClaimableTokenBalance(keeper, address(rewardToken));
    assertEq(balanceRewardTokenAfter, 4 ether);

    claimArgumentReward.push(accountId(address(helper), 1, address(rewardToken)));
    vm.prank(keeper);
    keeperIncentive.claim(claimArgumentReward);

    uint256 balanceRewardTokenAfterClaim = getKeeperClaimableTokenBalance(keeper, address(rewardToken));
    assertEq(balanceRewardTokenAfterClaim, 0 ether);
  }

  function test__burnTokens() public {
    uint256 fundAmount = 10 ether;
    uint256 rewardAmount = 1 ether;
    uint256 burnPercentage = 0.25 ether;
    uint256 amountBurned = (rewardAmount * burnPercentage) / 1 ether;

    createIncentive(rewardAmount, 1);
    fundIncentive(1, fundAmount);

    uint256 balance = getKeeperClaimableTokenBalance(keeper, address(mockPop));
    assertEq(balance, 0);

    runJob(1);

    uint256 balanceAfter = getKeeperClaimableTokenBalance(keeper, address(mockPop));
    assertEq(balanceAfter, rewardAmount - amountBurned);

    claimArgument.push(accountId(address(helper), 1, address(mockPop)));
    vm.prank(keeper);
    keeperIncentive.claim(claimArgument);

    uint256 balanceAfterClaim = getKeeperClaimableTokenBalance(keeper, address(mockPop));
    assertEq(balanceAfterClaim, 0 ether);

    uint256 burnBalanceBefore = keeperIncentive.burnBalancesByToken(address(mockPop));
    assertEq(burnBalanceBefore, amountBurned);
    keeperIncentive.burn(address(mockPop));

    uint256 burnBalanceAfter = keeperIncentive.burnBalancesByToken(address(mockPop));
    assertEq(burnBalanceAfter, 0);

    vm.expectRevert("no burn balance");
    keeperIncentive.burn(address(mockPop));
  }

  function test__doesntReturnEmptyClaimableBalancesAfterClaimIsMade() public {
    uint256 fundAmount = 10 ether;
    uint256 rewardAmount = 5 ether;

    createIncentive(rewardAmount, 1);
    fundIncentive(1, fundAmount);

    createIncentive(rewardAmount, 1);
    fundIncentive(2, fundAmount);

    createIncentive(rewardAmount, 1);
    fundIncentive(3, fundAmount);

    runJob(1);
    runJob(2);
    runJob(3);

    IKeeperIncentiveV2.Account[] memory accounts = keeperIncentive.getAccounts(keeper);
    assertEq(accounts.length, 3);

    claimArgument.push(accountId(address(helper), 2, address(mockPop)));
    vm.prank(keeper);
    keeperIncentive.claim(claimArgument);

    IKeeperIncentiveV2.Account[] memory accountsAfter = keeperIncentive.getAccounts(keeper);

    assertEq(accountsAfter.length, 3);
    assertEq(accountsAfter[0].balance, accounts[0].balance);
    assertEq(accountsAfter[1].balance, 0);
    assertEq(accountsAfter[2].balance, accounts[2].balance);
  }

  function test__returnBalanceSubtractedAmountAfterClaimIsMade() public {
    uint256 fundAmount = 10 ether;
    uint256 rewardAmount = 5 ether;

    createIncentive(rewardAmount, 1);
    fundIncentive(0, fundAmount);

    createIncentive(rewardAmount, 1);
    fundIncentive(1, fundAmount);

    createIncentive(rewardAmount, 1);
    fundIncentive(2, fundAmount);

    runJob(0);
    vm.warp(block.timestamp + 2);
    runJob(1);
    vm.warp(block.timestamp + 2);
    runJob(2);
    vm.warp(block.timestamp + 2);

    IKeeperIncentiveV2.Account[] memory accounts = keeperIncentive.getAccounts(keeper);
    assertEq(accounts.length, 3);

    claimArgument.push(accountId(address(helper), 1, address(mockPop)));
    vm.prank(keeper);
    keeperIncentive.claim(claimArgument);

    IKeeperIncentiveV2.Account[] memory accountsAfter = keeperIncentive.getAccounts(keeper);
    assertEq(accountsAfter.length, 3);

    assertEq(accountsAfter[0].token, address(mockPop));
    assertEq(accountsAfter[1].token, address(mockPop));
    assertEq(accountsAfter[2].token, address(mockPop));

    assertEq(accountsAfter[0].balance, accounts[0].balance);
    assertEq(accountsAfter[1].balance, 0);
    assertEq(accountsAfter[2].balance, accounts[2].balance);
  }

  function test__shouldDeductIncentiveRewardFromIncentiveBalance() public {
    uint256 bundAmount = 100 ether;

    fundIncentive(0, bundAmount);

    vm.expectEmit(false, false, false, true);
    emit FunctionCalled(address(keeper));
    runJob(0);
    vm.warp(block.timestamp + 5);

    (uint256 balance, , ) = keeperIncentive.accounts(
      accountId(address(helper), 0, address(mockPop)),
      address(keeperIncentive)
    );

    assertEq(balance, bundAmount - INCENTIVE);
  }

  function test__notPayoutRewardsIfIncentiveBudgetIsNotHighEnough() public {
    uint256 oldBalance = getKeeperClaimableTokenBalance(keeper, address(mockPop));
    runJob(0);
    uint256 newBalance = getKeeperClaimableTokenBalance(keeper, address(mockPop));
    assertEq(newBalance, oldBalance);
  }

  function test__revertIfKeeperDidntStakeEnoughPop() public {
    vm.prank(manager);
    keeperIncentive.updateRequiredKeeperStake(3000 ether);
    vm.expectRevert("not enough pop staked");
    runJob(0);
  }
}

contract ApprovalTests is KeeperIncentiveTest {
  event FunctionCalled(address account);

  function test__shouldNotBeCallableForNonApprovedAddresses() public {
    vm.prank(manager);
    mockPop.mint(address(keeper), 1990 ether);
    vm.prank(keeper);
    mockPop.approve(address(staking), 2000 ether);
    // lock is mocked
    vm.warp(block.timestamp + 7 days);
    vm.expectRevert("you dont have the right role");
    vm.prank(manager);
    helper.incentivisedFunction(0);
  }

  function test__shouldBeCallableForNonApprovedAddressesIfIncentiveIsOpenToEveryone() public {
    vm.prank(manager);
    mockPop.mint(address(keeper), 1990 ether);
    vm.prank(random);
    mockPop.approve(address(staking), 2000 ether);
    // lock is mocked
    vm.warp(block.timestamp + 7 days);
    vm.prank(manager);
    keeperIncentive.toggleApproval(address(helper), 0);
    fundIncentive(0, 11 ether);

    uint256 oldBalance = getKeeperClaimableTokenBalance(random, address(mockPop));

    vm.prank(random);
    helper.incentivisedFunction(0);

    uint256 newBalance = getKeeperClaimableTokenBalance(random, address(mockPop));
    assertEq(newBalance, oldBalance + (INCENTIVE * 3) / 4);
  }

  function test__shouldNotDoAnythingIfIncentiveWasntSet() public {
    keeperIncentive = new KeeperIncentiveV2(contractRegistry, 0.25 ether, 2000 ether);
    helper = new KeeperIncentiveHelper(keeperIncentive);

    vm.prank(manager);
    mockPop.approve(keeper, INCENTIVE);

    uint256 oldBalance = getKeeperClaimableTokenBalance(keeper, address(rewardToken));

    vm.expectEmit(false, false, false, true);
    emit FunctionCalled(address(keeper));
    runJob(0);

    vm.expectEmit(false, false, false, true);
    emit FunctionCalled(address(keeper));
    runJob(1);

    uint256 newBalance = getKeeperClaimableTokenBalance(keeper, address(rewardToken));

    assertEq(newBalance, oldBalance);
  }
}

contract KeeperIncentivizedTest is KeeperIncentiveTest {
  uint256 INCENTIVE_BURN_RATE;

  function setUp() public override {
    super.setUp();
    INCENTIVE_BURN_RATE = 0.25 ether;
    vm.startPrank(manager);
    keeperIncentive.createIncentive(address(keeperIncentivizedHelper), INCENTIVE, true, true, address(mockPop), 1, 0);
    keeperIncentive.fundIncentive(address(keeperIncentivizedHelper), 0, INCENTIVE);
    vm.stopPrank();
    vm.warp(block.timestamp + 7 days);
  }

  function test__callingHandleKeeperIncentiveDirectlyProcessesKeeperIncentive() public {
    uint256 balanceBeforeIncentive = getKeeperClaimableTokenBalance(keeper, address(mockPop));
    vm.prank(keeper);
    keeperIncentivizedHelper.handleKeeperIncentiveDirectCall();

    uint256 expectedIncentivePaid = INCENTIVE - ((INCENTIVE * INCENTIVE_BURN_RATE) / 1 ether);
    uint256 expectedPopBalanceAfterIncentive = balanceBeforeIncentive + expectedIncentivePaid;

    uint256 balanceAfterIncentive = getKeeperClaimableTokenBalance(keeper, address(mockPop));

    assertEq(balanceAfterIncentive, expectedPopBalanceAfterIncentive);
  }

  function test__callingAFunctionWithKeeperIncentiveModifierAppliedProcesses() public {
    uint256 balanceBeforeIncentive = getKeeperClaimableTokenBalance(keeper, address(mockPop));
    vm.prank(keeper);
    keeperIncentivizedHelper.handleKeeperIncentiveModifierCall();

    uint256 expectedIncentivePaid = INCENTIVE - ((INCENTIVE * INCENTIVE_BURN_RATE) / 1 ether);
    uint256 expectedPopBalanceAfterIncentive = balanceBeforeIncentive + expectedIncentivePaid;

    uint256 balanceAfterIncentive = getKeeperClaimableTokenBalance(keeper, address(mockPop));

    assertEq(balanceAfterIncentive, expectedPopBalanceAfterIncentive);
  }

  function test__shouldTipAnIncentive() public {
    uint256 tipAmount = 15 ether;
    vm.startPrank(manager);
    mockPop.mint(manager, tipAmount);
    mockPop.approve(address(keeperIncentivizedHelper), tipAmount);

    bool hasClaimableBalance = keeperIncentive.hasClaimableBalance(keeper);
    assertEq(hasClaimableBalance, false);

    keeperIncentivizedHelper.tipIncentiveDirectCall(address(mockPop), keeper, 0, tipAmount);

    hasClaimableBalance = keeperIncentive.hasClaimableBalance(keeper);
    assertEq(hasClaimableBalance, true);

    (uint256 balance, , ) = keeperIncentive.accounts(
      accountId(address(keeperIncentivizedHelper), 0, address(mockPop)),
      address(keeper)
    );

    assertEq(balance, tipAmount);
  }
}

contract MockStaking {
  function balanceOf(address) external pure returns (uint256) {
    return 2000 ether;
  }
}

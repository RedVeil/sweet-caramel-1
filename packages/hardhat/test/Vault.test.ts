import { expect } from "chai";
import { deployMockContract, MockContract } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers, waffle } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import yearnRegistryABI from "../contracts/mocks/abis/yearnRegistry.json";
import { ADDRESS_ZERO, MAX_UINT_256 } from "../lib/external/SetToken/utils/constants";
import { expectBigNumberCloseTo, expectEvent, expectRevert, expectValue } from "../lib/utils/expectValue";
import { timeTravel } from "../lib/utils/test";
import {
  ACLRegistry,
  ContractRegistry,
  KeeperIncentiveV2,
  MockERC20,
  MockYearnV2Vault,
  RewardsEscrow,
  Staking,
  Vault,
  VaultBlockLockHelper,
  VaultFeeController,
} from "../typechain";

interface Contracts {
  depositToken: MockERC20;
  rewardsToken: MockERC20;
  yearnVault: MockYearnV2Vault;
  yearnRegistry: MockContract;
  staking: Staking;
  vault: Vault;
  keeperIncentive: KeeperIncentiveV2;
  aclRegistry: ACLRegistry;
  contractRegistry: ContractRegistry;
  blockLockHelper: VaultBlockLockHelper;
  vaultFeeController: VaultFeeController;
  rewardsEscrow: RewardsEscrow;
}

const MINUTE = 60;
const DAY = 60 * 60 * 24;
const DEPOSIT_AMOUNT = parseEther("1000");
const FEE_MULTIPLIER = parseEther("0.0001"); // 1e14

let owner: SignerWithAddress,
  depositor: SignerWithAddress,
  depositor2: SignerWithAddress,
  receiver: SignerWithAddress,
  rewardsManager: SignerWithAddress;
let contracts: Contracts;

async function deployContracts(): Promise<Contracts> {
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const depositToken = await (await MockERC20.deploy("Token", "TOKEN", 18)).deployed();
  const rewardsToken = await (await MockERC20.deploy("RToken", "RTOKEN", 18)).deployed();

  const MockYearnV2Vault = await ethers.getContractFactory("MockYearnV2Vault");
  const yearnVault = await (await MockYearnV2Vault.deploy(depositToken.address)).deployed();

  const RewardsEscrow = await ethers.getContractFactory("RewardsEscrow");
  const rewardsEscrow = await (await RewardsEscrow.deploy(rewardsToken.address)).deployed();

  const yearnRegistry = await deployMockContract(owner, yearnRegistryABI);
  await yearnRegistry.mock.latestVault.returns(yearnVault.address);
  await yearnRegistry.mock.numVaults.returns(1);
  await yearnRegistry.mock.vaults.returns(yearnVault.address);

  const aclRegistry = await (await (await ethers.getContractFactory("ACLRegistry")).deploy()).deployed();

  const contractRegistry = await (
    await (await ethers.getContractFactory("ContractRegistry")).deploy(aclRegistry.address)
  ).deployed();

  const keeperIncentive = await (
    await (await ethers.getContractFactory("KeeperIncentiveV2")).deploy(contractRegistry.address, 0, 0)
  ).deployed();

  const Vault = await ethers.getContractFactory("Vault");
  const vault = await (
    await Vault.deploy(depositToken.address, yearnRegistry.address, contractRegistry.address, ADDRESS_ZERO, 1, {
      deposit: 0,
      withdrawal: FEE_MULTIPLIER.mul(50),
      management: FEE_MULTIPLIER.mul(200),
      performance: FEE_MULTIPLIER.mul(2000),
    })
  ).deployed();

  const Staking = await ethers.getContractFactory("Staking");
  const staking = await (await Staking.deploy(rewardsToken.address, vault.address, rewardsEscrow.address)).deployed();

  const vaultFeeController = await (
    await (
      await ethers.getContractFactory("VaultFeeController")
    ).deploy(
      {
        deposit: 0,
        withdrawal: FEE_MULTIPLIER.mul(50),
        management: FEE_MULTIPLIER.mul(200),
        performance: FEE_MULTIPLIER.mul(2000),
      },
      contractRegistry.address
    )
  ).deployed();

  const VaultBlockLockHelper = await ethers.getContractFactory("VaultBlockLockHelper");
  const blockLockHelper = await (await VaultBlockLockHelper.deploy(vault.address, depositToken.address)).deployed();

  await aclRegistry.grantRole(ethers.utils.id("DAO"), owner.address);
  await aclRegistry.grantRole(ethers.utils.id("INCENTIVE_MANAGER_ROLE"), owner.address);
  await aclRegistry.grantRole(ethers.utils.id("ApprovedContract"), blockLockHelper.address);
  await contractRegistry
    .connect(owner)
    .addContract(ethers.utils.id("RewardsManager"), rewardsManager.address, ethers.utils.id("1"));
  await contractRegistry
    .connect(owner)
    .addContract(ethers.utils.id("KeeperIncentive"), keeperIncentive.address, ethers.utils.id("1"));
  await contractRegistry
    .connect(owner)
    .addContract(ethers.utils.id("PopLocker"), staking.address, ethers.utils.id("1"));
  await contractRegistry
    .connect(owner)
    .addContract(ethers.utils.id("VaultFeeController"), vaultFeeController.address, ethers.utils.id("1"));

  await vault.setStaking(staking.address);

  const mockERC20Factory = await ethers.getContractFactory("MockERC20");
  const mockPop = (await (await mockERC20Factory.deploy("TestPOP", "TPOP", 18)).deployed()) as MockERC20;

  await keeperIncentive
    .connect(owner)
    .createIncentive(vault.address, parseEther("10"), true, true, mockPop.address, 1, 0);

  await vaultFeeController.setFeeRecipient(rewardsManager.address);

  return {
    depositToken,
    rewardsToken,
    yearnVault,
    yearnRegistry,
    staking,
    vault,
    keeperIncentive,
    aclRegistry,
    contractRegistry,
    blockLockHelper,
    vaultFeeController,
    rewardsEscrow,
  };
}

describe("Vault", function () {
  beforeEach(async function () {
    [owner, depositor, depositor2, receiver, rewardsManager] = await ethers.getSigners();
    contracts = await deployContracts();
  });

  describe("constructor", async function () {
    it("reverts if yearn registry address is zero", async function () {
      const Vault = await ethers.getContractFactory("Vault");
      await expectRevert(
        Vault.deploy(
          contracts.depositToken.address,
          ethers.constants.AddressZero,
          contracts.contractRegistry.address,
          contracts.staking.address,
          1,
          {
            deposit: 0,
            withdrawal: FEE_MULTIPLIER.mul(50),
            management: FEE_MULTIPLIER.mul(200),
            performance: FEE_MULTIPLIER.mul(2000),
          }
        ),
        "Zero address"
      );
    });

    it("approves staking when staking address is nonzero", async function () {
      const Vault = await ethers.getContractFactory("Vault");
      const vault = await Vault.deploy(
        contracts.depositToken.address,
        contracts.yearnRegistry.address,
        contracts.contractRegistry.address,
        contracts.staking.address,
        1,
        {
          deposit: 0,
          withdrawal: FEE_MULTIPLIER.mul(50),
          management: FEE_MULTIPLIER.mul(200),
          performance: FEE_MULTIPLIER.mul(2000),
        }
      );
      await vault.deployed();
      expectValue(await vault.allowance(vault.address, contracts.staking.address), ethers.constants.MaxUint256);
    });

    it("reverts if contract registry address is zero", async function () {
      const Vault = await ethers.getContractFactory("Vault");
      await expectRevert(
        Vault.deploy(
          contracts.depositToken.address,
          contracts.yearnRegistry.address,
          ethers.constants.AddressZero,
          contracts.staking.address,
          1,
          {
            deposit: 0,
            withdrawal: FEE_MULTIPLIER.mul(50),
            management: FEE_MULTIPLIER.mul(200),
            performance: FEE_MULTIPLIER.mul(2000),
          }
        ),
        "Zero address"
      );
    });

    it("approves vault for staking", async () => {
      expectValue(await contracts.vault.allowance(contracts.vault.address, contracts.staking.address), MAX_UINT_256);
    });

    it("sets feesUpdatedAt to deployment block timestamp", async function () {
      let deployBlock = await waffle.provider.getBlock(contracts.vault.deployTransaction.blockNumber);
      let deployTimestamp = deployBlock.timestamp;
      expectValue(await contracts.vault.feesUpdatedAt(), deployTimestamp);
    });
  });

  describe("defaults", async function () {
    const DEFAULT_HIGH_WATER_MARK = parseEther("1");

    it("withdrawal fee is 50bps", async function () {
      expectValue((await contracts.vault.feeStructure()).withdrawal, FEE_MULTIPLIER.mul(50));
    });

    it("management fee is 200bps", async function () {
      expectValue((await contracts.vault.feeStructure()).management, FEE_MULTIPLIER.mul(200));
    });

    it("performance fee is 2000bps", async function () {
      expectValue((await contracts.vault.feeStructure()).performance, FEE_MULTIPLIER.mul(2000));
    });

    it("vault share high water mark is 1e18", async function () {
      expectValue(await contracts.vault.vaultShareHWM(), DEFAULT_HIGH_WATER_MARK);
    });

    it("assets checkpoint is 0", async function () {
      expectValue(await contracts.vault.assetsCheckpoint(), 0);
    });
  });

  describe("pool token", async function () {
    it("generates token name from underlying", async function () {
      expectValue(await contracts.vault.name(), "Popcorn Token Vault");
    });

    it("generates token symbol from underlying", async function () {
      expectValue(await contracts.vault.symbol(), "pop-TOKEN");
    });

    it("uses 18 decimals", async function () {
      expectValue(await contracts.vault.decimals(), 18);
    });
  });

  describe("asset", async function () {
    it("stores the underlying token address", async function () {
      expectValue(await contracts.vault.token(), await contracts.vault.asset());
    });
  });

  describe("assetsOf", async function () {
    beforeEach(async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
    });

    it("returns the balance of tokens held by address", async function () {
      expectValue(await contracts.vault.assetsOf(depositor.address), DEPOSIT_AMOUNT);
    });

    it("returns the balance of tokens when the vault value increases", async function () {
      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));
      expectValue(await contracts.vault.assetsOf(depositor.address), DEPOSIT_AMOUNT.mul(2));
    });
  });

  describe("totalAssets", async function () {
    beforeEach(async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
    });

    it("returns zero for empty vault", async function () {
      expectValue(await contracts.vault.totalAssets(), 0);
    });

    it("returns total assets after a deposit is made", async function () {
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.vault.totalAssets(), DEPOSIT_AMOUNT);
    });

    it("increases as vault value increases", async function () {
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));

      expectValue(await contracts.vault.totalAssets(), DEPOSIT_AMOUNT.mul(2));
    });
  });

  describe("previewDeposit and previewMint", async function () {
    it("previews deposit and mint correctly", async () => {
      await contracts.vault.setFees({
        deposit: FEE_MULTIPLIER.mul(100),
        withdrawal: FEE_MULTIPLIER.mul(100),
        management: FEE_MULTIPLIER.mul(200),
        performance: FEE_MULTIPLIER.mul(2000),
      });
      await contracts.vault.setUseLocalFees(true);
      await contracts.depositToken.mint(owner.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.approve(contracts.vault.address, MAX_UINT_256);

      let expectedAmount = parseEther("990");

      // Input 1000 Assets expect 990 Shares returned ( 1000 - 10 DepositFee ).
      let previewDepositAmount = await contracts.vault.previewDeposit(DEPOSIT_AMOUNT);
      await expectBigNumberCloseTo(previewDepositAmount, expectedAmount);

      // Input 990 Shares expect 1000 assets required ( 990 + 10 DepositFee ).
      let previewMintAmount = await contracts.vault.previewMint(previewDepositAmount);
      await expectBigNumberCloseTo(previewMintAmount, DEPOSIT_AMOUNT);

      await contracts.vault["deposit(uint256)"](DEPOSIT_AMOUNT);

      // Double pricePerShare
      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));

      expectedAmount = parseEther("550");

      // Input 1000 Assets expect 550 Shares returned ( 500 + 55.55555 from globalFee dillution - 5.55555 DepositFee).
      previewDepositAmount = await contracts.vault.previewDeposit(DEPOSIT_AMOUNT);
      await expectBigNumberCloseTo(previewDepositAmount, expectedAmount);

      // Input 550 Shares expect 1000 Assets required ( 550 shares * 1.8 pricePerShare + 10 DepositFee).
      previewMintAmount = await contracts.vault.previewMint(previewDepositAmount);
      await expectBigNumberCloseTo(previewMintAmount, DEPOSIT_AMOUNT);
    });
  });

  describe("previewWithdraw and previewRedeem", async function () {
    it("previews withdraw and redeem correctly", async () => {
      await contracts.vault.setFees({
        deposit: 0,
        withdrawal: FEE_MULTIPLIER.mul(100),
        management: 0,
        performance: FEE_MULTIPLIER.mul(2000),
      });
      await contracts.vault.setUseLocalFees(true);
      await contracts.depositToken.mint(owner.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.approve(contracts.vault.address, MAX_UINT_256);

      await contracts.vault["mint(uint256)"](DEPOSIT_AMOUNT);

      // No price increase (Supply == Assets => PricePerShare = 1)

      // assets + (assets * (withdrawalFee / (1 - withdrawalFee)) == 1000 + (1000 * (0.01 / (1- 0.01))) = 1010.10101010101010
      let expectedAmount = parseEther("1010.10101010101010");

      // Want to withdraw 1000 assets which requires 1010.101 shares.
      let previewWithdrawAmount = await contracts.vault.previewWithdraw(DEPOSIT_AMOUNT);
      await expectBigNumberCloseTo(previewWithdrawAmount, expectedAmount);

      // Want to redeem 1010.101 shares which returns 1000 assets.
      let previewRedeemAmount = await contracts.vault.previewRedeem(previewWithdrawAmount);
      await expectBigNumberCloseTo(previewRedeemAmount, DEPOSIT_AMOUNT);

      // Double pricePerShare
      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));

      expectedAmount = parseEther("561.167227833894");

      // Want to withdraw 1000 assets which requires 561.167 shares.
      previewWithdrawAmount = await contracts.vault.previewWithdraw(DEPOSIT_AMOUNT);
      await expectBigNumberCloseTo(previewWithdrawAmount, expectedAmount);

      // Want to redeem 561.167 shares which rerturns 1000 assets.
      previewRedeemAmount = await contracts.vault.previewRedeem(previewWithdrawAmount);
      await expectBigNumberCloseTo(previewRedeemAmount, DEPOSIT_AMOUNT);
    });
  });

  describe("previewDeposit", async function () {
    beforeEach(async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT.mul(3));
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT.mul(3));
    });

    it("returns the amount of vault shares minted given the amount of assets deposited (no fee)", async function () {
      await contracts.vault.setFees({ deposit: 0, withdrawal: 0, management: 0, performance: 0 });
      await contracts.vault.setUseLocalFees(true);

      // Initial deposit mints 1 for 1
      expectValue(await contracts.vault.previewDeposit(DEPOSIT_AMOUNT), DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      // Subsequent deposits mint 1 for 1 until share value changes
      expectValue(await contracts.vault.previewDeposit(DEPOSIT_AMOUNT), DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));
      const expectedShares = parseEther("500");
      expectValue(await contracts.vault.previewDeposit(DEPOSIT_AMOUNT), expectedShares);
    });

    it("returns the amount of vault shares minted given the amount of assets deposited (depFee)", async function () {
      await contracts.vault.setFees({
        deposit: FEE_MULTIPLIER.mul(100),
        withdrawal: 0,
        management: 0,
        performance: 0,
      });
      await contracts.vault.setUseLocalFees(true);

      // (depositAmount / pricePerShare) - depositFee
      // (1000 / 1) - ((1000 / 1) * 0.01)
      let expectedShares = DEPOSIT_AMOUNT.sub(parseEther("10"));

      expectValue(await contracts.vault.previewDeposit(DEPOSIT_AMOUNT), expectedShares);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.vault.previewDeposit(DEPOSIT_AMOUNT), expectedShares);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));

      // (1000 / 2) - ((1000 / 2) * 0.01)
      expectedShares = parseEther("495");
      expectValue(await contracts.vault.previewDeposit(DEPOSIT_AMOUNT), expectedShares);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      expectValue(await contracts.vault.pricePerShare(), parseEther("2"));

      // (990 * 2) + 495 = 2475 shares
      expectValue(await contracts.vault.balanceOf(depositor.address), parseEther("2475"));

      // (10 * 2) + 5 = 25 shares
      expectValue(await contracts.vault.balanceOf(contracts.vault.address), parseEther("25"));

      // depositorShares + feeShares = 2500 shares
      expectValue(await contracts.vault.totalSupply(), parseEther("2500"));
    });

    it("returns the amount of vault shares minted given the amount of assets deposited (perfFee)", async function () {
      await contracts.vault.setFees({
        deposit: 0,
        withdrawal: 0,
        management: 0,
        performance: FEE_MULTIPLIER.mul(2000),
      });
      await contracts.vault.setUseLocalFees(true);

      let expectedShares = DEPOSIT_AMOUNT;

      // Initial deposit mints 1 for 1
      expectValue(await contracts.vault.previewDeposit(DEPOSIT_AMOUNT), expectedShares);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      // Subsequent deposits mint 1 for 1 until share value changes
      expectValue(await contracts.vault.previewDeposit(DEPOSIT_AMOUNT), expectedShares);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));

      // (1000 / 1.8)
      expectedShares = parseEther("555.555555555555555555");
      expectValue(await contracts.vault.previewDeposit(DEPOSIT_AMOUNT), expectedShares);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      // PerformanceFee dilluted the amount of shares by ~20%
      expectValue(await contracts.vault.pricePerShare(), parseEther("1.8"));

      // (1000 * 2) + 555.555555555555555555
      expectValue(await contracts.vault.balanceOf(depositor.address), parseEther("2555.555555555555555555"));

      // 400 / 1.8
      const expectedFeeShares = parseEther("222.222222222222222222");
      expectValue(await contracts.vault.balanceOf(contracts.vault.address), expectedFeeShares);

      // userShares + feeShares
      expectValue(await contracts.vault.totalSupply(), parseEther("2777.777777777777777777"));
    });

    it("returns the amount of vault shares minted given the amount of assets deposited (depFee + perfFee)", async function () {
      await contracts.vault.setFees({
        deposit: FEE_MULTIPLIER.mul(100),
        withdrawal: 0,
        management: 0,
        performance: FEE_MULTIPLIER.mul(2000),
      });
      await contracts.vault.setUseLocalFees(true);

      // (depositAmount / pricePerShare) - depositFee
      // (1000 / 1) - ((1000 / 1) * 0.01)
      let expectedShares = parseEther("990");
      expectValue(await contracts.vault.previewDeposit(DEPOSIT_AMOUNT), expectedShares);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      let totalSupply = await contracts.vault.totalSupply();
      let totalAssets = await contracts.vault.totalAssets();
      let userBal = await contracts.vault.balanceOf(depositor.address);
      let feeBal = await contracts.vault.balanceOf(contracts.vault.address);
      expectValue(totalSupply, DEPOSIT_AMOUNT);
      expectValue(totalAssets, DEPOSIT_AMOUNT);
      expectValue(userBal, expectedShares);
      expectValue(feeBal, parseEther("10"));

      expectValue(await contracts.vault.previewDeposit(DEPOSIT_AMOUNT), expectedShares);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      totalSupply = await contracts.vault.totalSupply();
      totalAssets = await contracts.vault.totalAssets();
      userBal = await contracts.vault.balanceOf(depositor.address);
      feeBal = await contracts.vault.balanceOf(contracts.vault.address);
      expectValue(totalSupply, parseEther("2000"));
      expectValue(totalAssets, DEPOSIT_AMOUNT.mul(2));
      expectValue(userBal, expectedShares.mul(2));
      expectValue(feeBal, parseEther("20"));

      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));

      // (1000 / 1.8) - ((1000 / 1.8) * 0.01)
      expectedShares = parseEther("550");
      expectValue(await contracts.vault.previewDeposit(DEPOSIT_AMOUNT), parseEther("550"));
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      // PerformanceFee dilluted the amount of shares by ~20%
      expectValue(await contracts.vault.pricePerShare(), parseEther("1.8"));

      // (990 * 2) + 550
      expectedShares = parseEther("2530");
      expectValue(await contracts.vault.balanceOf(depositor.address), expectedShares);

      // (10 * 2) + (10 / 1.8) + (400 / 1.8)
      const expectedFeeShares = parseEther("247.777777777777777777");
      expectValue(await contracts.vault.balanceOf(contracts.vault.address), expectedFeeShares);

      // userShares + feeShares
      expectValue(await contracts.vault.totalSupply(), parseEther("2777.777777777777777777"));
    });

    it("returns the amount of vault shares minted given the amount of assets deposited (manfFee)", async function () {
      await contracts.vault.setFees({
        deposit: 0,
        withdrawal: 0,
        management: FEE_MULTIPLIER.mul(100),
        performance: 0,
      });
      await contracts.vault.setUseLocalFees(true);

      let expectedShares = DEPOSIT_AMOUNT;
      expectValue(await contracts.vault.previewDeposit(DEPOSIT_AMOUNT), expectedShares);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      await timeTravel(365 * DAY);
      expectValue(await contracts.vault.accruedManagementFee(), parseEther("10"));

      // (1000 * 1000) / (1000-10)
      expectedShares = parseEther("1010.101010101010101010");
      expectValue(await contracts.vault.previewDeposit(DEPOSIT_AMOUNT), expectedShares);
    });

    it("prevents underflow on fee", async function () {
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      await timeTravel(365 * DAY);
      await contracts.yearnVault.stubAccountBalance(contracts.vault.address, parseEther("1"));
      await contracts.yearnVault.setPricePerFullShare(parseEther("1"));
      expectValue(await contracts.vault.accruedManagementFee(), parseEther("10.01"));
      expectValue(await contracts.vault.totalAssets(), parseEther("1"));
      expectValue(await contracts.vault.previewDeposit(parseEther("1")), parseEther("1000000000000000000000"));
    });
  });

  describe("previewMint", async function () {
    beforeEach(async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT.mul(5));
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT.mul(5));
    });

    it("returns the amount of assets required given the amount of shares wanted (no fee)", async function () {
      await contracts.vault.setFees({ deposit: 0, withdrawal: 0, management: 0, performance: 0 });
      await contracts.vault.setUseLocalFees(true);

      // Initial deposit mints 1 for 1
      expectValue(await contracts.vault.previewMint(DEPOSIT_AMOUNT), DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["mint(uint256)"](DEPOSIT_AMOUNT);

      // Subsequent deposits mint 1 for 1 until share value changes
      expectValue(await contracts.vault.previewMint(DEPOSIT_AMOUNT), DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["mint(uint256)"](DEPOSIT_AMOUNT);

      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));

      // 1000 / 2
      const requiredShares = parseEther("500");
      expectValue(await contracts.vault.previewMint(requiredShares), DEPOSIT_AMOUNT);
    });

    it("returns the amount of assets required given the amount of shares wanted (depFee)", async function () {
      await contracts.vault.setFees({
        deposit: FEE_MULTIPLIER.mul(100),
        withdrawal: 0,
        management: 0,
        performance: 0,
      });
      await contracts.vault.setUseLocalFees(true);

      // (depositAmount / pricePerShare) - mintFee
      // (1000 / 1) - ((1000 / 1) * 0.010101010101)
      let inputShares = DEPOSIT_AMOUNT.sub(parseEther("10"));
      let expectedAssetsRequired = DEPOSIT_AMOUNT;
      expectValue(await contracts.vault.previewMint(inputShares), expectedAssetsRequired);
      await contracts.vault.connect(depositor)["mint(uint256)"](inputShares);

      expectValue(await contracts.vault.previewMint(inputShares), expectedAssetsRequired);
      await contracts.vault.connect(depositor)["mint(uint256)"](inputShares);

      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));

      // (1000 / 2) - ((1000 / 2) * 0.010101010101)
      inputShares = parseEther("495");
      expectValue(await contracts.vault.previewMint(inputShares), expectedAssetsRequired);
      await contracts.vault.connect(depositor)["mint(uint256)"](inputShares);
      expectValue(await contracts.vault.pricePerShare(), parseEther("2"));

      // (990 * 2) + 495 = 2475 shares
      expectValue(await contracts.vault.balanceOf(depositor.address), parseEther("2475"));

      // (10 * 2) + 5 = 25 shares
      expectValue(await contracts.vault.balanceOf(contracts.vault.address), parseEther("25"));

      // depositorShares + feeShares = 2500 shares
      expectValue(await contracts.vault.totalSupply(), parseEther("2500"));
    });

    it("returns the amount of assets required given the amount of shares wanted (perfFee)", async function () {
      await contracts.vault.setFees({
        deposit: 0,
        withdrawal: 0,
        management: 0,
        performance: FEE_MULTIPLIER.mul(2000),
      });
      await contracts.vault.setUseLocalFees(true);

      let inputShares = DEPOSIT_AMOUNT;
      let expectedAssetsRequired = DEPOSIT_AMOUNT;

      // Initial deposit mints 1 for 1
      expectValue(await contracts.vault.previewMint(inputShares), expectedAssetsRequired);
      await contracts.vault.connect(depositor)["mint(uint256)"](inputShares);

      // Subsequent deposits mint 1 for 1 until share value changes
      expectValue(await contracts.vault.previewMint(inputShares), expectedAssetsRequired);
      await contracts.vault.connect(depositor)["mint(uint256)"](inputShares);

      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));

      // (1000 / 1.8)
      inputShares = parseEther("555.555555555555555555");
      expectValue(await contracts.vault.previewMint(inputShares), expectedAssetsRequired.sub(1));
      await contracts.vault.connect(depositor)["mint(uint256)"](inputShares);

      // PerformanceFee dilluted the amount of shares by ~20%
      await expectBigNumberCloseTo(await contracts.vault.pricePerShare(), parseEther("1.8"));

      // (1000 * 2) + 555.555555555555555555
      expectValue(await contracts.vault.balanceOf(depositor.address), parseEther("2555.555555555555555555"));

      // 400 / 1.8
      const expectedFeeShares = parseEther("222.222222222222222222");
      expectValue(await contracts.vault.balanceOf(contracts.vault.address), expectedFeeShares);

      // userShares + feeShares
      expectValue(await contracts.vault.totalSupply(), parseEther("2777.777777777777777777"));
    });

    it("returns the amount of assets required given the amount of shares wanted (depFee + perfFee)", async function () {
      await contracts.vault.setFees({
        deposit: FEE_MULTIPLIER.mul(100),
        withdrawal: 0,
        management: 0,
        performance: FEE_MULTIPLIER.mul(2000),
      });
      await contracts.vault.setUseLocalFees(true);

      // (depositAmount / pricePerShare) - depositFee
      // (1000 / 1) - ((1000 / 1) * 0.01)
      let inputShares = DEPOSIT_AMOUNT.sub(parseEther("10"));
      let expectedAssetsRequired = DEPOSIT_AMOUNT;

      expectValue(await contracts.vault.previewMint(inputShares), expectedAssetsRequired);
      await contracts.vault.connect(depositor)["mint(uint256)"](inputShares);

      let totalSupply = await contracts.vault.totalSupply();
      let totalAssets = await contracts.vault.totalAssets();
      let userBal = await contracts.vault.balanceOf(depositor.address);
      let feeBal = await contracts.vault.balanceOf(contracts.vault.address);
      expectValue(totalSupply, expectedAssetsRequired);
      expectValue(totalAssets, expectedAssetsRequired);
      expectValue(userBal, inputShares);
      expectValue(feeBal, parseEther("10"));

      expectValue(await contracts.vault.previewMint(inputShares), expectedAssetsRequired);
      await contracts.vault.connect(depositor)["mint(uint256)"](inputShares);
      totalSupply = await contracts.vault.totalSupply();
      totalAssets = await contracts.vault.totalAssets();
      userBal = await contracts.vault.balanceOf(depositor.address);
      feeBal = await contracts.vault.balanceOf(contracts.vault.address);
      expectValue(totalSupply, parseEther("2000"));
      expectValue(totalAssets, expectedAssetsRequired.mul(2));
      expectValue(userBal, inputShares.mul(2));
      expectValue(feeBal, parseEther("20"));

      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));

      // (1000 / 1.8) - ((1000 / 1.8) * 0.01)
      inputShares = parseEther("550");
      await expectBigNumberCloseTo(await contracts.vault.previewMint(inputShares), expectedAssetsRequired);
      await contracts.vault.connect(depositor)["mint(uint256)"](inputShares);

      // PerformanceFee dilluted the amount of shares by ~20%
      await expectBigNumberCloseTo(await contracts.vault.pricePerShare(), parseEther("1.8"));

      // (990 * 2) + 550
      inputShares = parseEther("2530");
      expectValue(await contracts.vault.balanceOf(depositor.address), inputShares);

      // (10 * 2) + (10 / 1.8) + (400 / 1.8)
      const expectedFeeShares = parseEther("247.777777777777777777");
      await expectBigNumberCloseTo(await contracts.vault.balanceOf(contracts.vault.address), expectedFeeShares);

      // userShares + feeShares
      await expectBigNumberCloseTo(await contracts.vault.totalSupply(), parseEther("2777.777777777777777777"));
    });

    it("returns the amount of assets required given the amount of shares wanted (manfFee)", async function () {
      await contracts.vault.setFees({
        deposit: 0,
        withdrawal: 0,
        management: FEE_MULTIPLIER.mul(100),
        performance: 0,
      });
      await contracts.vault.setUseLocalFees(true);

      let inputShares = DEPOSIT_AMOUNT;
      let expectedAssetsRequired = DEPOSIT_AMOUNT;

      expectValue(await contracts.vault.previewMint(inputShares), expectedAssetsRequired);
      await contracts.vault.connect(depositor)["mint(uint256)"](inputShares);

      await timeTravel(365 * DAY);
      expectValue(await contracts.vault.accruedManagementFee(), parseEther("10"));

      // (1000 * 1000) / (1000-10)
      inputShares = parseEther("1010.101010101010101010");
      expectValue(await contracts.vault.previewMint(inputShares), expectedAssetsRequired.sub(1));
    });

    it("prevents underflow on fee", async function () {
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      await timeTravel(365 * DAY);
      await contracts.yearnVault.stubAccountBalance(contracts.vault.address, parseEther("1"));
      await contracts.yearnVault.setPricePerFullShare(parseEther("1"));
      expectValue(await contracts.vault.accruedManagementFee(), parseEther("10.01"));
      expectValue(await contracts.vault.totalAssets(), parseEther("1"));
      expectValue(await contracts.vault.previewMint(parseEther("1")), 0);
    });
  });

  describe("previewWithdraw", async function () {
    beforeEach(async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
    });

    it("returns the amount of shares needed to receive given amount of vaulted assets (no fee)", async function () {
      await contracts.vault.setFees({ deposit: 0, withdrawal: 0, management: 0, performance: 0 });
      await contracts.vault.setUseLocalFees(true);

      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      const amount = DEPOSIT_AMOUNT;
      await expectValue(await contracts.vault.previewWithdraw(amount), amount.add(10));
      await contracts.vault.connect(depositor)["withdraw(uint256)"](amount);

      await expectValue(await contracts.vault.totalSupply(), 0);
      await expectValue(await contracts.vault.totalAssets(), 0);
    });

    it("returns the amount of shares needed to receive given amount of vaulted assets (withFee)", async function () {
      await contracts.vault.setFees({
        deposit: 0,
        withdrawal: FEE_MULTIPLIER.mul(100),
        management: 0,
        performance: 0,
      });
      await contracts.vault.setUseLocalFees(true);

      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      let withdrawAmount = parseEther("495");
      let expectedFeeInShares = parseEther("5");
      let expectedSharesRequired = parseEther("500");
      await expectBigNumberCloseTo(await contracts.vault.previewWithdraw(withdrawAmount), expectedSharesRequired);
      await contracts.vault.connect(depositor)["withdraw(uint256)"](withdrawAmount);

      expectValue(await contracts.vault.totalAssets(), parseEther("505"));
      await expectBigNumberCloseTo(await contracts.vault.balanceOf(contracts.vault.address), expectedFeeInShares);
      expectValue(await contracts.vault.pricePerShare(), parseEther("1"));
      await expectBigNumberCloseTo(await contracts.vault.balanceOf(depositor.address), expectedSharesRequired);
      await expectBigNumberCloseTo(
        await contracts.vault.totalSupply(),
        expectedSharesRequired.add(expectedFeeInShares)
      );
    });

    it("returns the amount of shares needed to receive given amount of vaulted assets (perfFee)", async function () {
      await contracts.vault.setFees({
        deposit: 0,
        withdrawal: 0,
        management: 0,
        performance: FEE_MULTIPLIER.mul(2000),
      });
      await contracts.vault.setUseLocalFees(true);

      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));

      const expectedSharesRequired = parseEther("555.555555555555555561");
      const expectedFeeInShares = parseEther("111.111111111111111111");
      expectValue(await contracts.vault.previewWithdraw(DEPOSIT_AMOUNT), expectedSharesRequired);
      await contracts.vault.connect(depositor)["withdraw(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.vault.totalAssets(), DEPOSIT_AMOUNT);
      expectValue(await contracts.vault.balanceOf(contracts.vault.address), expectedFeeInShares);
      await expectBigNumberCloseTo(await contracts.vault.pricePerShare(), parseEther("1.8"));
      await expectValue(await contracts.vault.balanceOf(depositor.address), parseEther("444.444444444444444445"));
      await expectValue(
        await contracts.vault.totalSupply(),
        parseEther("555.555555555555555556")
      );
    });

    it("returns the amount of shares needed to receive given amount of vaulted assets (withdrawalFee + perfFee)", async function () {
      await contracts.vault.setFees({
        deposit: 0,
        withdrawal: FEE_MULTIPLIER.mul(100),
        management: 0,
        performance: FEE_MULTIPLIER.mul(2000),
      });
      await contracts.vault.setUseLocalFees(true);

      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));

      let withdrawAmount = parseEther("495");
      let expectedSharesRequired = parseEther("277.777777777777777783");

      expectValue(await contracts.vault.previewWithdraw(withdrawAmount), expectedSharesRequired);
      await contracts.vault.connect(depositor)["withdraw(uint256)"](withdrawAmount);

      // (DEPOSIT_AMOUNT * 2) - withdrawalAmount
      expectValue(await contracts.vault.totalAssets(), parseEther("1505"));
      await expectBigNumberCloseTo(
        await contracts.vault.balanceOf(contracts.vault.address),
        parseEther("113.888888888888888888")
      );
      await expectBigNumberCloseTo(await contracts.vault.pricePerShare(), parseEther("1.8"));
      await expectBigNumberCloseTo(
        await contracts.vault.balanceOf(depositor.address),
        DEPOSIT_AMOUNT.sub(expectedSharesRequired)
      );
      await expectBigNumberCloseTo(
        await contracts.vault.totalSupply(),
        DEPOSIT_AMOUNT.sub(expectedSharesRequired).add(parseEther("113.888888888888888888"))
      );
    });

    it("returns the amount of vault shares minted given the amount of assets deposited (manfFee)", async function () {
      await contracts.vault.setFees({
        deposit: 0,
        withdrawal: 0,
        management: FEE_MULTIPLIER.mul(100),
        performance: 0,
      });
      await contracts.vault.setUseLocalFees(true);

      let expectedShares = DEPOSIT_AMOUNT;
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      await timeTravel(365 * DAY);
      expectValue(await contracts.vault.accruedManagementFee(), parseEther("10"));

      // (1000 * 1000) / (1000-10)
      expectedShares = parseEther("1010.101010101010101020");
      await expectValue(await contracts.vault.previewWithdraw(DEPOSIT_AMOUNT), expectedShares);
    });
  });

  describe("previewMint", async function () {
    beforeEach(async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT.mul(5));
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT.mul(5));
    });

    it("returns the amount of assets required given the amount of shares wanted (no fee)", async function () {
      await contracts.vault.setFees({ deposit: 0, withdrawal: 0, management: 0, performance: 0 });
      await contracts.vault.setUseLocalFees(true);

      // Initial deposit mints 1 for 1
      expectValue(await contracts.vault.previewMint(DEPOSIT_AMOUNT), DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["mint(uint256)"](DEPOSIT_AMOUNT);

      // Subsequent deposits mint 1 for 1 until share value changes
      expectValue(await contracts.vault.previewMint(DEPOSIT_AMOUNT), DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["mint(uint256)"](DEPOSIT_AMOUNT);

      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));

      // 1000 / 2
      const requiredShares = parseEther("500");
      await expectValue(await contracts.vault.previewMint(requiredShares), DEPOSIT_AMOUNT);
    });

    it("returns the amount of assets given an amount of shares (withFee)", async function () {
      await contracts.vault.setFees({
        deposit: 0,
        withdrawal: FEE_MULTIPLIER.mul(100),
        management: 0,
        performance: 0,
      });

      await contracts.vault.setUseLocalFees(true);

      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      let withdrawAmount = parseEther("500");
      let expectedAssetsReturned = parseEther("495").sub(10);
      let feeBalance = parseEther("5");
      expectValue(await contracts.vault.previewRedeem(withdrawAmount), expectedAssetsReturned);
      await contracts.vault.connect(depositor)["redeem(uint256)"](withdrawAmount);

      expectValue(await contracts.vault.totalAssets(), withdrawAmount.add(feeBalance));
      expectValue(await contracts.vault.balanceOf(contracts.vault.address), feeBalance);
      expectValue(await contracts.vault.pricePerShare(), parseEther("1"));
      expectValue(await contracts.vault.balanceOf(depositor.address), withdrawAmount);
      expectValue(await contracts.vault.totalSupply(), withdrawAmount.add(feeBalance));
    });

    it("returns the amount of assets given an amount of shares (perfFee)", async function () {
      await contracts.vault.setFees({
        deposit: 0,
        withdrawal: 0,
        management: 0,
        performance: FEE_MULTIPLIER.mul(2000),
      });
      await contracts.vault.setUseLocalFees(true);

      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));

      let withdrawAmount = DEPOSIT_AMOUNT.div(2);
      let expectedFeeInShares = parseEther("111.111111111111111111");
      let expectedAssetsReturned = parseEther("900")
      await expectValue(await contracts.vault.previewRedeem(withdrawAmount), expectedAssetsReturned.sub(10));
      await contracts.vault.connect(depositor)["redeem(uint256)"](withdrawAmount);

      expectValue(await contracts.vault.totalAssets(), DEPOSIT_AMOUNT.mul(2).sub(expectedAssetsReturned));
      expectValue(await contracts.vault.balanceOf(contracts.vault.address), expectedFeeInShares);
      expectValue(await contracts.vault.pricePerShare(), parseEther("1.8"));
      expectValue(await contracts.vault.balanceOf(depositor.address), withdrawAmount);
      expectValue(await contracts.vault.totalSupply(), withdrawAmount.add(expectedFeeInShares));
    });

    it("returns the amount of assets given an amount of shares (withdrawalFee + perfFee)", async function () {
      await contracts.vault.setFees({
        deposit: 0,
        withdrawal: FEE_MULTIPLIER.mul(100),
        management: 0,
        performance: FEE_MULTIPLIER.mul(2000),
      });
      await contracts.vault.setUseLocalFees(true);

      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));

      let withdrawAmount = DEPOSIT_AMOUNT.div(2);
      let expectedFeeInShares = parseEther("116.111111111111111111");
      let expectedAssetsReturned = parseEther("891").sub(10);
      await expectValue(await contracts.vault.previewRedeem(withdrawAmount), expectedAssetsReturned);
      await contracts.vault.connect(depositor)["redeem(uint256)"](withdrawAmount);

      expectValue(await contracts.vault.totalAssets(), parseEther("1109"));
      expectValue(await contracts.vault.balanceOf(contracts.vault.address), expectedFeeInShares);
      expectValue(await contracts.vault.pricePerShare(), parseEther("1.8"));
      expectValue(await contracts.vault.balanceOf(depositor.address), withdrawAmount);
      expectValue(await contracts.vault.totalSupply(), withdrawAmount.add(expectedFeeInShares));
    });

    it("returns the amount of assets given an amount of shares (manfFee)", async function () {
      await contracts.vault.setFees({
        deposit: 0,
        withdrawal: 0,
        management: FEE_MULTIPLIER.mul(100),
        performance: 0,
      });
      await contracts.vault.setUseLocalFees(true);

      let inputShares = DEPOSIT_AMOUNT;
      let expectedAssetsRequired = DEPOSIT_AMOUNT;

      await contracts.vault.connect(depositor)["mint(uint256)"](inputShares);

      await timeTravel(365 * DAY);
      expectValue(await contracts.vault.accruedManagementFee(), parseEther("10"));

      // (1000 * 1000) / (1000-10)
      inputShares = parseEther("1010.101010101010101010");
      await expectValue(await contracts.vault.previewRedeem(inputShares), expectedAssetsRequired.sub(1).sub(10));
    });
  });

  describe("assetsPerShare", async () => {
    it("returns the same value as `convertToAssets`", async () => {
      expectValue(await contracts.vault.assetsPerShare(), await contracts.vault.convertToAssets(parseEther("1")));
      await contracts.depositToken.mint(contracts.yearnVault.address, DEPOSIT_AMOUNT);
      expectValue(await contracts.vault.assetsPerShare(), await contracts.vault.convertToAssets(parseEther("1")));
    });
  });

  describe("maxDeposit", async function () {
    it("returns max number of underlying assets that may be deposited", async function () {
      expectValue(await contracts.vault.maxDeposit(depositor.address), ethers.constants.MaxUint256);
    });

    it("respects the underlying vault deposit limit", async function () {
      const depositLimit = parseEther("100000");
      await contracts.yearnVault.setDepositLimit(depositLimit);
      expectValue(await contracts.vault.maxDeposit(depositor.address), depositLimit);
    });

    it("decreases as deposits increase", async function () {
      const depositLimit = parseEther("100000");
      await contracts.yearnVault.setDepositLimit(depositLimit);

      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.vault.maxDeposit(depositor.address), depositLimit.sub(DEPOSIT_AMOUNT));
    });

    it("returns zero when deposit limit is reached", async function () {
      await contracts.yearnVault.setDepositLimit(DEPOSIT_AMOUNT);

      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.vault.maxDeposit(depositor.address), 0);
    });
  });

  describe("maxMint", async function () {
    it("returns total number of share the caller can mint", async function () {
      expectValue(await contracts.vault.maxMint(depositor.address), ethers.constants.MaxUint256);
    });

    it("respects the underlying vault deposit limit", async function () {
      const depositLimit = parseEther("100000");
      await contracts.yearnVault.setDepositLimit(depositLimit);
      expectValue(await contracts.vault.maxMint(depositor.address), depositLimit);
    });

    it("decreases as deposits increase", async function () {
      const depositLimit = parseEther("100000");
      await contracts.yearnVault.setDepositLimit(depositLimit);

      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.vault.maxMint(depositor.address), depositLimit.sub(DEPOSIT_AMOUNT));
    });

    it("returns zero when deposit limit is reached", async function () {
      await contracts.yearnVault.setDepositLimit(DEPOSIT_AMOUNT);

      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.vault.maxMint(depositor.address), 0);
    });
  });

  describe("maxRedeem", async function () {
    it("returns max number of underlying shares that may be redeemed", async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      expectValue(
        await contracts.vault.maxRedeem(depositor.address),
        await contracts.vault.balanceOf(depositor.address)
      );
    });
  });

  describe("maxWithdraw", async function () {
    it("returns max number of underlying asset that may be redeemed", async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      expectValue(
        await contracts.vault.maxWithdraw(depositor.address),
        (await contracts.vault.assetsOf(depositor.address)).sub(parseEther("5")).sub(10)
      );
    });
  });

  describe("convertToShares/convertToAssets", async function () {
    beforeEach(async () => {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));
    });

    it("convertToShares returns value of underlying asset in shares", async function () {
      expectValue(await contracts.vault.convertToShares(parseEther("20")), parseEther("10"));
    });

    it("convertToAssets returns value of shares in amount of underlying asset", async function () {
      expectValue(await contracts.vault.convertToAssets(parseEther("10")), parseEther("20"));
    });
  });

  describe("deposit", async function () {
    beforeEach(async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
    });

    it("transfers tokens from depositor", async function () {
      expectValue(await contracts.depositToken.balanceOf(depositor.address), DEPOSIT_AMOUNT);

      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.depositToken.balanceOf(depositor.address), 0);
    });

    it("reverts on insufficient balance", async function () {
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT.add(1));

      await expectRevert(
        contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT.add(1)),
        "ERC20: transfer amount exceeds balance"
      );
    });

    it("updates feesUpdatedAt", async function () {
      const depositTx = await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      const depositTxBlock = await waffle.provider.getBlock(depositTx.blockNumber);

      expectValue(await contracts.vault.feesUpdatedAt(), depositTxBlock.timestamp);
    });

    it("issues accrued fee shares", async function () {
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      await timeTravel(365 * DAY); // Full annualized management fee on average of 1500 tokens = 30 tokens.
      await contracts.yearnVault.setPricePerFullShare(parseEther("2")); // Take performance fee on 2x increase = 200 tokens.
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);

      expectValue(await contracts.vault.balanceOf(contracts.vault.address), 0);
      const accruedManagementFee = await contracts.vault.accruedManagementFee();
      const accruedPerformanceFee = await contracts.vault.accruedPerformanceFee();

      expectValue(accruedManagementFee, parseEther("30"));
      expectValue(accruedPerformanceFee, parseEther("200"));

      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      const feeShareBalance = await contracts.vault.balanceOf(contracts.vault.address);
      expectValue(feeShareBalance, parseEther("129.943502824858757062"));
      await expectBigNumberCloseTo(
        await contracts.vault.convertToAssets(feeShareBalance),
        parseEther("229.999999999999999999")
      );
    });

    it("deposits (uint256) into the yearn vault", async function () {
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.yearnVault.balance(), DEPOSIT_AMOUNT);

      expectValue(await contracts.depositToken.balanceOf(depositor.address), 0);
    });

    it("deposits (uint256,address) into the yearn vault", async function () {
      await contracts.vault.connect(depositor)["deposit(uint256,address)"](DEPOSIT_AMOUNT, depositor.address);

      expectValue(await contracts.yearnVault.balance(), DEPOSIT_AMOUNT);

      expectValue(await contracts.depositToken.balanceOf(depositor.address), 0);
    });

    it("pool receives yearn shares in exchange for deposit", async function () {
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.yearnVault.balanceOf(contracts.vault.address), DEPOSIT_AMOUNT);
    });

    it("pool transfers vault shares to depositor", async function () {
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.vault.connect(depositor).balanceOf(depositor.address), DEPOSIT_AMOUNT);
    });

    it("deposit emits a Deposit event when sender and receiver are the same", async function () {
      const POOL_SHARES = DEPOSIT_AMOUNT;
      await expectEvent(
        await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT),
        contracts.vault,
        "Deposit",
        [depositor.address, depositor.address, DEPOSIT_AMOUNT, POOL_SHARES]
      );
    });

    it("deposits and sends shares to address", async function () {
      await contracts.vault.connect(depositor)["deposit(uint256,address)"](DEPOSIT_AMOUNT, receiver.address);

      expectValue(await contracts.vault.connect(receiver).balanceOf(receiver.address), DEPOSIT_AMOUNT);
    });

    it("deposit reverts on insufficient balance", async function () {
      let amount = parseEther("10000000");
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, amount);
      await expectRevert(
        contracts.vault.connect(depositor)["deposit(uint256,address)"](amount, depositor.address),
        "ERC20: transfer amount exceeds balance"
      );
    });

    it("staking contract emits a TokenStaked event on depositAndStake", async function () {
      await expectEvent(
        await contracts.vault.connect(depositor)["depositAndStake(uint256)"](DEPOSIT_AMOUNT),
        contracts.staking,
        "Staked",
        [depositor.address, DEPOSIT_AMOUNT]
      );
    });

    it("delegated depositAndStake emits a TokenStaked event", async function () {
      await expectEvent(
        await contracts.vault
          .connect(depositor)
        ["depositAndStakeFor(uint256,address)"](DEPOSIT_AMOUNT, receiver.address),
        contracts.staking,
        "Staked",
        [receiver.address, DEPOSIT_AMOUNT]
      );
    });

    it("depositAndStake reverts when no staking is set", async function () {
      await contracts.vault.setStaking(ADDRESS_ZERO);
      await expectRevert(
        contracts.vault.connect(depositor)["depositAndStake(uint256)"](DEPOSIT_AMOUNT),
        "staking is disabled"
      );
    });

    it("deposit reverts on invalid receiver", async function () {
      await expectRevert(
        contracts.vault.connect(depositor)["deposit(uint256,address)"](DEPOSIT_AMOUNT, ethers.constants.AddressZero),
        "Invalid receiver"
      );
    });

    it("deposit emits a Deposit event when sender and receiver are different", async function () {
      const POOL_SHARES = DEPOSIT_AMOUNT;
      await expectEvent(
        await contracts.vault.connect(depositor)["deposit(uint256,address)"](DEPOSIT_AMOUNT, receiver.address),
        contracts.vault,
        "Deposit",
        [depositor.address, receiver.address, DEPOSIT_AMOUNT, POOL_SHARES]
      );
    });

    it("does not change the high water mark if share value is unchanged", async function () {
      expectValue(await contracts.vault.vaultShareHWM(), parseEther("1"));

      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.vault.vaultShareHWM(), parseEther("1"));
    });

    it("updates the high water mark if share value has increased", async function () {
      expectValue(await contracts.vault.vaultShareHWM(), parseEther("1"));
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.vault.vaultShareHWM(), parseEther("2"));
    });

    it("checkpoints assets on initial deposit", async function () {
      expectValue(await contracts.vault.assetsCheckpoint(), 0);

      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.vault.assetsCheckpoint(), DEPOSIT_AMOUNT);
    });

    it("caps fees to prevent underflow", async function () {
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      await timeTravel(365 * DAY);
      await contracts.yearnVault.stubAccountBalance(contracts.vault.address, parseEther("1"));
      await contracts.yearnVault.setPricePerFullShare(parseEther("1"));
      expectValue(await contracts.vault.accruedManagementFee(), parseEther("10.01"));
      expectValue(await contracts.vault.totalAssets(), parseEther("1"));

      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      expectValue(await contracts.vault.balanceOf(depositor.address), parseEther("1000000000000000000001000"));
    });
  });

  describe("mint", async function () {
    beforeEach(async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
    });

    it("transfers tokens from depositor", async function () {
      expectValue(await contracts.depositToken.balanceOf(depositor.address), DEPOSIT_AMOUNT);

      await contracts.vault.connect(depositor)["mint(uint256,address)"](DEPOSIT_AMOUNT, depositor.address);

      expectValue(await contracts.depositToken.balanceOf(depositor.address), 0);
    });

    it("mints (uint256) into the yearn vault", async function () {
      await contracts.vault.connect(depositor)["mint(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.yearnVault.balance(), DEPOSIT_AMOUNT);

      expectValue(await contracts.depositToken.balanceOf(depositor.address), 0);
    });

    it("mints (uint256,address) into the yearn vault", async function () {
      await contracts.vault.connect(depositor)["mint(uint256,address)"](DEPOSIT_AMOUNT, depositor.address);

      expectValue(await contracts.yearnVault.balance(), DEPOSIT_AMOUNT);

      expectValue(await contracts.depositToken.balanceOf(depositor.address), 0);
    });

    it("staking contract emits a TokenStaked event on mintAndStake", async function () {
      await contracts.vault.setFees({ deposit: 0, withdrawal: 0, management: 0, performance: 0 });
      await contracts.vault.setUseLocalFees(true);
      await expectEvent(
        await contracts.vault.connect(depositor)["mintAndStake(uint256)"](DEPOSIT_AMOUNT),
        contracts.staking,
        "Staked",
        [depositor.address, DEPOSIT_AMOUNT]
      );
    });

    it("delegated mintAndStake emits a TokenStaked event", async function () {
      await contracts.vault.setFees({ deposit: 0, withdrawal: 0, management: 0, performance: 0 });
      await contracts.vault.setUseLocalFees(true);
      await expectEvent(
        await contracts.vault.connect(depositor)["mintAndStakeFor(uint256,address)"](DEPOSIT_AMOUNT, receiver.address),
        contracts.staking,
        "Staked",
        [receiver.address, DEPOSIT_AMOUNT]
      );
    });

    it("mintAndStake reverts when no staking is set", async function () {
      await contracts.vault.setStaking(ADDRESS_ZERO);
      await expectRevert(
        contracts.vault.connect(depositor)["mintAndStake(uint256)"](DEPOSIT_AMOUNT),
        "staking is disabled"
      );
    });

    it("reverts on insufficient balance", async function () {
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT.add(1));

      await expectRevert(
        contracts.vault.connect(depositor)["mint(uint256,address)"](DEPOSIT_AMOUNT.add(1), depositor.address),
        "ERC20: transfer amount exceeds balance"
      );
    });

    it("updates feesUpdatedAt", async function () {
      const depositTx = await contracts.vault
        .connect(depositor)
      ["mint(uint256,address)"](DEPOSIT_AMOUNT, depositor.address);
      const depositTxBlock = await waffle.provider.getBlock(depositTx.blockNumber);

      expectValue(await contracts.vault.feesUpdatedAt(), depositTxBlock.timestamp);
    });

    it("deposits into the yearn vault", async function () {
      await contracts.vault.connect(depositor)["mint(uint256,address)"](DEPOSIT_AMOUNT, depositor.address);

      expectValue(await contracts.yearnVault.balance(), DEPOSIT_AMOUNT);

      expectValue(await contracts.depositToken.balanceOf(depositor.address), 0);
    });

    it("deposits into the yearn vault without the receiver address", async function () {
      await contracts.vault.connect(depositor)["mint(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.yearnVault.balance(), DEPOSIT_AMOUNT);

      expectValue(await contracts.depositToken.balanceOf(depositor.address), 0);
    });

    it("pool receives yearn shares in exchange for deposit", async function () {
      await contracts.vault.connect(depositor)["mint(uint256,address)"](DEPOSIT_AMOUNT, depositor.address);

      expectValue(await contracts.yearnVault.balanceOf(contracts.vault.address), DEPOSIT_AMOUNT);
    });

    it("pool transfers shares to depositor", async function () {
      await contracts.vault.connect(depositor)["mint(uint256,address)"](DEPOSIT_AMOUNT, depositor.address);

      expectValue(await contracts.vault.connect(depositor).balanceOf(depositor.address), DEPOSIT_AMOUNT);
    });

    it("pool emits a Deposit event when sender and receiver are the same", async function () {
      const POOL_SHARES = DEPOSIT_AMOUNT;
      await expectEvent(
        await contracts.vault.connect(depositor)["mint(uint256,address)"](DEPOSIT_AMOUNT, depositor.address),
        contracts.vault,
        "Deposit",
        [depositor.address, depositor.address, DEPOSIT_AMOUNT, POOL_SHARES]
      );
    });

    it("deposits and sends shares to address", async function () {
      await contracts.vault.connect(depositor)["mint(uint256,address)"](DEPOSIT_AMOUNT, receiver.address);

      expectValue(await contracts.vault.connect(receiver).balanceOf(receiver.address), DEPOSIT_AMOUNT);
    });

    it("reverts on insufficient balance", async function () {
      let amount = parseEther("10000000");
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, amount);
      await expectRevert(
        contracts.vault.connect(depositor)["mint(uint256,address)"](amount, depositor.address),
        "ERC20: transfer amount exceeds balance"
      );
    });

    it("pool emits a Deposit event when sender and receiver are different", async function () {
      const POOL_SHARES = DEPOSIT_AMOUNT;
      await expectEvent(
        await contracts.vault.connect(depositor)["mint(uint256,address)"](DEPOSIT_AMOUNT, receiver.address),
        contracts.vault,
        "Deposit",
        [depositor.address, receiver.address, DEPOSIT_AMOUNT, POOL_SHARES]
      );
    });

    it("does not change the high water mark on initial deposit", async function () {
      expectValue(await contracts.vault.vaultShareHWM(), parseEther("1"));

      await contracts.vault.connect(depositor)["mint(uint256,address)"](DEPOSIT_AMOUNT, depositor.address);

      expectValue(await contracts.vault.vaultShareHWM(), parseEther("1"));
    });

    it("reverts on invalid receiver", async function () {
      await expectRevert(
        contracts.vault.connect(depositor)["mint(uint256,address)"](DEPOSIT_AMOUNT, ethers.constants.AddressZero),
        "Invalid receiver"
      );
    });

    it("updates the high water mark if share value has increased", async function () {
      expectValue(await contracts.vault.vaultShareHWM(), parseEther("1"));
      await contracts.vault.connect(depositor)["mint(uint256,address)"](DEPOSIT_AMOUNT, depositor.address);

      await contracts.yearnVault.setPricePerFullShare(parseEther("2"));
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT.mul(2));
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT.mul(2));
      await contracts.vault.connect(depositor)["mint(uint256,address)"](DEPOSIT_AMOUNT, depositor.address);

      expectValue(await contracts.vault.vaultShareHWM(), parseEther("2"));
    });

    it("checkpoints assets on initial mint", async function () {
      expectValue(await contracts.vault.assetsCheckpoint(), 0);

      await contracts.vault.connect(depositor)["mint(uint256,address)"](DEPOSIT_AMOUNT, depositor.address);

      expectValue(await contracts.vault.assetsCheckpoint(), DEPOSIT_AMOUNT);
    });
  });

  describe("transfers", async function () {
    const TRANSFER_AMOUNT = parseEther("1000");

    beforeEach(async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.mint(receiver.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(receiver).approve(contracts.vault.address, DEPOSIT_AMOUNT);
    });

    it("pool tokens are transferable with transfer", async function () {
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, TRANSFER_AMOUNT);
      await contracts.vault.connect(depositor)["deposit(uint256)"](TRANSFER_AMOUNT);
      const balance = await contracts.vault.balanceOf(depositor.address);
      await contracts.vault.connect(depositor).transfer(receiver.address, balance);
      expect(await contracts.vault.balanceOf(receiver.address)).to.equal(balance);
    });

    it("pool tokens are transferable with transferFrom", async function () {
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, TRANSFER_AMOUNT);
      await contracts.vault.connect(depositor)["deposit(uint256)"](TRANSFER_AMOUNT);
      const balance = await contracts.vault.balanceOf(depositor.address);
      await contracts.vault.connect(depositor).approve(receiver.address, balance);
      await contracts.vault.connect(receiver).transferFrom(depositor.address, receiver.address, balance);
      expect(await contracts.vault.balanceOf(receiver.address)).to.equal(balance);
    });
  });

  describe("redeem", async function () {
    beforeEach(async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);

      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
    });

    it("reverts on insufficient balance", async function () {
      await expectRevert(
        contracts.vault
          .connect(depositor)
        ["redeem(uint256,address,address)"](DEPOSIT_AMOUNT.add(1), depositor.address, depositor.address),
        "ERC20: transfer amount exceeds balance"
      );
    });

    it("reverts on zero receiver", async function () {
      await expectRevert(
        contracts.vault
          .connect(depositor)
        ["redeem(uint256,address,address)"](DEPOSIT_AMOUNT, ethers.constants.AddressZero, depositor.address),
        "Invalid receiver"
      );
    });

    it("redeems (uint256,address,address) shares for specified token amount", async function () {
      await contracts.vault
        .connect(depositor)
      ["redeem(uint256,address,address)"](DEPOSIT_AMOUNT, depositor.address, depositor.address);

      expectValue(await contracts.depositToken.balanceOf(depositor.address), DEPOSIT_AMOUNT.sub(parseEther("5")));
    });

    it("redeems (uint256) shares for specified token amount", async function () {
      await contracts.vault.connect(depositor)["redeem(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.depositToken.balanceOf(depositor.address), DEPOSIT_AMOUNT.sub(parseEther("5")));
    });

    it("redeems (uint256,address,address) for someone else if they approved", async function () {
      await contracts.vault.connect(depositor).approve(receiver.address, DEPOSIT_AMOUNT);
      await contracts.vault
        .connect(receiver)
      ["redeem(uint256,address,address)"](DEPOSIT_AMOUNT.sub(parseEther("5")), receiver.address, depositor.address);

      expectValue(await contracts.depositToken.balanceOf(receiver.address), parseEther("990.025"));
      expectValue(await contracts.vault.allowance(depositor.address, receiver.address), parseEther("5"));
    });

    it("reverts redeem (uint256,address,address) for someone else if they didnt approve", async function () {
      await expectRevert(
        contracts.vault
          .connect(receiver)
        ["redeem(uint256,address,address)"](DEPOSIT_AMOUNT.sub(parseEther("5")), receiver.address, depositor.address),
        "reverted with panic code 0x11"
      );
    });

    describe("fees", async function () {
      describe("management fees", async function () {
        //Deposit amount 1000, annual management fee 200bps, no change in value
        it("takes a management fee when time passes", async function () {
          const expectedFee = parseEther("20");
          await timeTravel(365 * DAY);
          expectValue(await contracts.vault.accruedManagementFee(), expectedFee);
        });

        it("annualizes fee per day", async function () {
          const expectedFee = parseEther("2");
          await timeTravel(36.5 * DAY);
          expectValue(await contracts.vault.accruedManagementFee(), expectedFee);
        });

        it("doesn't take a management fee when no time passes", async function () {
          expectValue(await contracts.vault.accruedManagementFee(), 0);
        });
      });

      describe("performance fees", async function () {
        //Deposit amount 1000, performance fee 2000bps, value doubles
        it("takes a performance fee when value is more than HWM", async function () {
          const expectedFee = parseEther("200");
          await contracts.yearnVault.setPricePerFullShare(parseEther("2"));
          expectValue(await contracts.vault.accruedPerformanceFee(), expectedFee);
        });

        //Deposit amount 1000, performance fee 2000bps, value decreases
        it("doesn't take a performance fee when value is less than HWM", async function () {
          await contracts.yearnVault.setPricePerFullShare(parseEther("0.5"));
          expectValue(await contracts.vault.accruedPerformanceFee(), 0);
        });
      });

      describe("calculate fees", async function () {
        it("calculates the correct management fee", async function () {
          const expectedManagementFee = 1000 * 0.02;

          await timeTravel(365 * DAY);

          expectValue(await contracts.vault.accruedManagementFee(), parseEther(expectedManagementFee.toString()));
        });

        it("calculates the correct performance fee", async function () {
          const expectedPerformanceFee = 1000 * 0.2;

          await contracts.yearnVault.setPricePerFullShare(parseEther("2"));

          expectValue(await contracts.vault.accruedPerformanceFee(), parseEther(expectedPerformanceFee.toString()));
        });
      });
    });
  });

  describe("withdraw", async function () {
    beforeEach(async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
    });

    it("withdraws (uint256,address,address) shares for specified token amount", async function () {
      await contracts.vault
        .connect(depositor)
      ["withdraw(uint256,address,address)"](
        DEPOSIT_AMOUNT.sub(parseEther("5")),
        depositor.address,
        depositor.address
      );
      await expectValue(await contracts.depositToken.balanceOf(depositor.address), parseEther("995"));
    });

    it("reverts on zero receiver", async function () {
      await expectRevert(
        contracts.vault
          .connect(depositor)
        ["withdraw(uint256,address,address)"](
          DEPOSIT_AMOUNT.sub(parseEther("5")),
          ethers.constants.AddressZero,
          depositor.address
        ),
        "Invalid receiver"
      );
    });

    it("withdraw (uint256) shares for specified token amount", async function () {
      await contracts.vault.connect(depositor)["withdraw(uint256)"](DEPOSIT_AMOUNT.sub(parseEther("5")));

      expectValue(await contracts.depositToken.balanceOf(depositor.address), parseEther("995"));
    });

    it("withdraw (uint256,address,address) for someone else if they approved", async function () {
      await contracts.vault.connect(depositor).approve(receiver.address, DEPOSIT_AMOUNT);
      await contracts.vault
        .connect(receiver)
      ["withdraw(uint256,address,address)"](DEPOSIT_AMOUNT.sub(parseEther("5")), receiver.address, depositor.address);

      expectValue(await contracts.depositToken.balanceOf(receiver.address), parseEther("995"));
      await expectBigNumberCloseTo(
        await contracts.vault.allowance(depositor.address, receiver.address),
        parseEther("0")
      );
    });

    it("reverts withdraw (uint256,address,address) for someone else if they didnt approve", async function () {
      await expectRevert(
        contracts.vault
          .connect(receiver)
        ["withdraw(uint256,address,address)"](
          DEPOSIT_AMOUNT.sub(parseEther("5")),
          receiver.address,
          depositor.address
        ),
        "reverted with panic code 0x11"
      );
    });

    it("reverts on insufficient balance", async function () {
      await expectRevert(
        contracts.vault
          .connect(depositor)
        ["withdraw(uint256,address,address)"](DEPOSIT_AMOUNT.add(1), depositor.address, depositor.address),
        "ERC20: transfer amount exceeds balance"
      );
    });
  });

  describe("takeManagementAndPerformanceFees", async function () {
    context("useLocalFees", () => {
      beforeEach(async function () {
        await contracts.vault.setFees({
          deposit: 0,
          withdrawal: FEE_MULTIPLIER.mul(100),
          management: FEE_MULTIPLIER.mul(100),
          performance: FEE_MULTIPLIER.mul(100),
        });
        await contracts.vault.setUseLocalFees(true);
        await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
        await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
        await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      });

      it("harvests performance fee", async function () {
        await contracts.depositToken.mint(contracts.yearnVault.address, parseEther("100000"));
        expectValue(await contracts.vault.accruedPerformanceFee(), parseEther("1000"));
        await contracts.vault.takeManagementAndPerformanceFees();
        expectValue(await contracts.vault.accruedPerformanceFee(), 0);
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("1000"),
          parseEther("0.0000000000000001")
        );
      });

      it("harvests management fee", async function () {
        await timeTravel(365 * DAY);
        expectValue(await contracts.vault.accruedManagementFee(), parseEther("10"));
        await contracts.vault.takeManagementAndPerformanceFees();
        expectValue(await contracts.vault.accruedManagementFee(), 0);
        await expectBigNumberCloseTo(await contracts.vault.assetsOf(contracts.vault.address), parseEther("10"));
      });
    });
    context("use poolFeeController", () => {
      beforeEach(async function () {
        await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
        await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
        await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      });

      it("harvests performance fee", async function () {
        await contracts.depositToken.mint(contracts.yearnVault.address, parseEther("100000"));
        expectValue(await contracts.vault.accruedPerformanceFee(), parseEther("20000"));
        await contracts.vault.takeManagementAndPerformanceFees();
        expectValue(await contracts.vault.accruedPerformanceFee(), 0);
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("20000"),
          parseEther("0.0000000000000001")
        );
      });

      it("harvests management fee", async function () {
        await timeTravel(365 * DAY);
        expectValue(await contracts.vault.accruedManagementFee(), parseEther("20"));
        await contracts.vault.takeManagementAndPerformanceFees();
        expectValue(await contracts.vault.accruedManagementFee(), 0);
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("20"),
          parseEther("0.0000000000000001")
        );
      });

      it("updates vault share HWM", async function () {
        expectValue(await contracts.vault.vaultShareHWM(), parseEther("1"));
        await contracts.depositToken.mint(contracts.yearnVault.address, parseEther("10000"));
        await contracts.vault.takeManagementAndPerformanceFees();
        expectValue(await contracts.vault.vaultShareHWM(), parseEther("11"));
      });

      it("saves totalAssets checkpoint", async function () {
        expectValue(await contracts.vault.assetsCheckpoint(), parseEther("1000"));
        await contracts.depositToken.mint(contracts.yearnVault.address, parseEther("10000"));
        await timeTravel(60);
        expectValue(await contracts.vault.accruedManagementFee(), parseEther("0.000228310502283105"));
        await contracts.vault.takeManagementAndPerformanceFees();
        expectValue(await contracts.vault.assetsCheckpoint(), parseEther("11000"));
      });
    });

    context("frequent calls", () => {
      beforeEach(async function () {
        await contracts.vault.setFees({
          deposit: 0,
          withdrawal: FEE_MULTIPLIER.mul(100),
          management: FEE_MULTIPLIER.mul(100),
          performance: FEE_MULTIPLIER.mul(100),
        });
        await contracts.vault.setUseLocalFees(true);
        await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
        await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
        await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      });

      it("annual harvest", async function () {
        await timeTravel(365 * DAY);
        expectValue(await contracts.vault.accruedPerformanceFee(), 0);
        expectValue(await contracts.vault.accruedManagementFee(), parseEther("10"));
        await contracts.vault.takeManagementAndPerformanceFees();
        expectValue(await contracts.vault.accruedPerformanceFee(), 0);
        expectValue(await contracts.vault.accruedManagementFee(), 0);
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("10"),
          parseEther("0.0000000000000001")
        );
      });

      it("daily harvests", async function () {
        for (let i = 0; i < 365; i++) {
          await timeTravel(1 * DAY);
          expectValue(await contracts.vault.accruedPerformanceFee(), 0);
          expectValue(await contracts.vault.accruedManagementFee(), parseEther("0.027397260273972602"));
          await contracts.vault.takeManagementAndPerformanceFees();
          expectValue(await contracts.vault.accruedPerformanceFee(), 0);
          expectValue(await contracts.vault.accruedManagementFee(), 0);
        }
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("9.950301876564741678"),
          parseEther("0.0000000000000001")
        );
      });

      xit("twice-daily harvests", async function () {
        for (let i = 0; i < 2 * 365; i++) {
          await timeTravel(0.5 * DAY);
          expectValue(await contracts.vault.accruedPerformanceFee(), 0);
          expectValue(await contracts.vault.accruedManagementFee(), parseEther("0.013698630136986301"));
          await contracts.vault.takeManagementAndPerformanceFees();
          expectValue(await contracts.vault.accruedPerformanceFee(), 0);
          expectValue(await contracts.vault.accruedManagementFee(), 0);
        }
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("9.950234063081362682"),
          parseEther("0.0000000000000001")
        );
      });

      it("one ten minute harvest", async function () {
        await timeTravel(10 * MINUTE);
        expectValue(await contracts.vault.accruedPerformanceFee(), 0);
        expectValue(await contracts.vault.accruedManagementFee(), parseEther(".000190258751902587"));
        await contracts.vault.takeManagementAndPerformanceFees();
        expectValue(await contracts.vault.accruedPerformanceFee(), 0);
        expectValue(await contracts.vault.accruedManagementFee(), 0);
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("0.000190258751902586"),
          parseEther("0.0000000000000001")
        );
      });

      it("five two-minute harvests", async function () {
        for (let i = 0; i < 5; i++) {
          await timeTravel(2 * MINUTE);
          expectValue(await contracts.vault.accruedPerformanceFee(), 0);
          expectValue(await contracts.vault.accruedManagementFee(), parseEther("0.000038051750380517"));
          await contracts.vault.takeManagementAndPerformanceFees();
          expectValue(await contracts.vault.accruedPerformanceFee(), 0);
          expectValue(await contracts.vault.accruedManagementFee(), 0);
        }
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("0.000190258737423225"),
          parseEther("0.0000000000000001")
        );
      });

      it("ten one-minute harvests", async function () {
        for (let i = 0; i < 10; i++) {
          await timeTravel(1 * MINUTE);
          expectValue(await contracts.vault.accruedPerformanceFee(), 0);
          expectValue(await contracts.vault.accruedManagementFee(), parseEther("0.000019025875190258"));
          await contracts.vault.takeManagementAndPerformanceFees();
          expectValue(await contracts.vault.accruedPerformanceFee(), 0);
          expectValue(await contracts.vault.accruedManagementFee(), 0);
        }
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("0.000190258735613296"),
          parseEther("0.0000000000000001")
        );
      });

      it("12 50-second harvests", async function () {
        for (let i = 0; i < 12; i++) {
          await timeTravel(50);
          await contracts.vault.takeManagementAndPerformanceFees();
        }
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("0.000114155245711784"),
          parseEther("0.0000000000000001")
        );
      });

      it("15 40-second harvests", async function () {
        for (let i = 0; i < 15; i++) {
          await timeTravel(40);
          await contracts.vault.takeManagementAndPerformanceFees();
        }
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("0.000133181118730138"),
          parseEther("0.0000000000000001")
        );
      });

      it("twenty 30-second harvests", async function () {
        for (let i = 0; i < 20; i++) {
          await timeTravel(0.5 * MINUTE);
          await contracts.vault.takeManagementAndPerformanceFees();
        }
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("0"),
          parseEther("0.000190258735613296")
        );
      });

      it("30 20-second harvests", async function () {
        for (let i = 0; i < 30; i++) {
          await timeTravel(20);
          await contracts.vault.takeManagementAndPerformanceFees();
        }
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("0"),
          parseEther("0.000190258735613296")
        );
      });

      it("60 10-second harvests", async function () {
        for (let i = 0; i < 60; i++) {
          await timeTravel(10);
          await contracts.vault.takeManagementAndPerformanceFees();
        }
        await expectBigNumberCloseTo(
          await contracts.vault.assetsOf(contracts.vault.address),
          parseEther("0"),
          parseEther("0.000190258735613296")
        );
      });
    });
  });

  describe("governance", async function () {
    beforeEach(async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
    });
    it("owner can set staking", async function () {
      const Staking = await ethers.getContractFactory("Staking");
      const newStaking = await (
        await Staking.deploy(contracts.rewardsToken.address, contracts.vault.address, contracts.rewardsEscrow.address)
      ).deployed();
      await contracts.vault.connect(owner).setStaking(newStaking.address);
      expectValue(await contracts.vault.staking(), newStaking.address);
      expectValue(await contracts.vault.allowance(contracts.vault.address, newStaking.address), MAX_UINT_256);
      expectValue(await contracts.vault.allowance(contracts.vault.address, contracts.staking.address), 0);
    });
    it("non-owner cannot set new staking", async function () {
      await expectRevert(contracts.vault.connect(depositor).setStaking(ADDRESS_ZERO), "you dont have the right role");
    });
    it("owner can set yearnRegistry", async function () {
      await contracts.vault.connect(owner).setRegistry(ADDRESS_ZERO);
      expectValue(await contracts.vault.registry(), ADDRESS_ZERO);
    });

    it("non-owner cannot set new yearnRegistry", async function () {
      await expectRevert(contracts.vault.connect(depositor).setRegistry(ADDRESS_ZERO), "you dont have the right role");
    });

    it("owner can set fees", async function () {
      await contracts.vault.connect(owner).setFees({
        deposit: 0,
        withdrawal: FEE_MULTIPLIER.mul(20),
        management: FEE_MULTIPLIER.mul(1000),
        performance: FEE_MULTIPLIER.mul(10),
      });
      const newFees = await contracts.vault.feeStructure();
      expectValue(newFees.withdrawal, FEE_MULTIPLIER.mul(20));
      expectValue(newFees.management, FEE_MULTIPLIER.mul(1000));
      expectValue(newFees.performance, FEE_MULTIPLIER.mul(10));
    });

    it("non-owner cannot set new fees", async function () {
      await expectRevert(
        contracts.vault.connect(depositor).setFees({
          deposit: 0,
          withdrawal: FEE_MULTIPLIER.mul(20),
          management: FEE_MULTIPLIER.mul(1000),
          performance: FEE_MULTIPLIER.mul(10),
        }),
        "you dont have the right role"
      );
    });

    describe("fee validation", async function () {
      const FEES = {
        deposit: FEE_MULTIPLIER.mul(0),
        withdrawal: FEE_MULTIPLIER.mul(20),
        management: FEE_MULTIPLIER.mul(1000),
        performance: FEE_MULTIPLIER.mul(10),
      };

      it("reverts on invalid deposit fee", async function () {
        FEES.deposit = parseEther("1");
        await expectRevert(contracts.vault.connect(owner).setFees(FEES), "Invalid FeeStructure");
      });

      it("reverts on invalid withdrawal fee", async function () {
        FEES.withdrawal = parseEther("1");
        await expectRevert(contracts.vault.connect(owner).setFees(FEES), "Invalid FeeStructure");
      });

      it("reverts on invalid performance fee", async function () {
        FEES.performance = parseEther("1");
        await expectRevert(contracts.vault.connect(owner).setFees(FEES), "Invalid FeeStructure");
      });

      it("reverts on invalid management fee", async function () {
        FEES.management = parseEther("1");
        await expectRevert(contracts.vault.connect(owner).setFees(FEES), "Invalid FeeStructure");
      });
    });

    it("owner can pause the contract", async function () {
      await expectEvent(await contracts.vault.connect(owner).pauseContract(), contracts.vault, "Paused", [
        owner.address,
      ]);
    });

    it("non-owner cannot pause the contract", async function () {
      await expectRevert(contracts.vault.connect(depositor).pauseContract(), "you dont have the right role");
    });

    it("deposits to the pool should not be allowed when paused", async function () {
      await contracts.vault.connect(owner).pauseContract();

      await expectRevert(contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT), "Pausable: paused");
    });

    it("deposits to the pool can resume when paused and unpaused", async function () {
      await contracts.vault.connect(owner).pauseContract();

      await contracts.vault.connect(owner).unpauseContract();
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

      expectValue(await contracts.vault.totalAssets(), DEPOSIT_AMOUNT);
    });

    it("withdrawals are allowed when the pool is paused", async function () {
      await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);
      await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);
      await contracts.vault.connect(owner).pauseContract();

      // Must withdraw less than deposit amount to account for withdrawal fee
      const withdrawalAmount = DEPOSIT_AMOUNT.mul(9).div(10);
      await expect(contracts.vault.connect(depositor)["withdraw(uint256)"](withdrawalAmount)).not.to.be.reverted;
    });

    describe("sending accrued fees to rewards manager", async function () {
      beforeEach(async function () {
        await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
        await contracts.depositToken.connect(depositor).approve(contracts.vault.address, DEPOSIT_AMOUNT);

        await contracts.depositToken.mint(depositor2.address, DEPOSIT_AMOUNT);
        await contracts.depositToken.connect(depositor2).approve(contracts.vault.address, DEPOSIT_AMOUNT);
      });

      it("owner can withdraw accrued fees", async function () {
        await contracts.vault.connect(depositor)["deposit(uint256)"](DEPOSIT_AMOUNT);

        const yearnTokenBalance = await contracts.depositToken.balanceOf(contracts.yearnVault.address);
        await contracts.depositToken.mint(contracts.yearnVault.address, yearnTokenBalance);

        await timeTravel(365 * DAY);
        await contracts.vault
          .connect(depositor)
        ["redeem(uint256,address,address)"](
          await contracts.vault.connect(depositor).balanceOf(depositor.address),
          depositor.address,
          depositor.address
        );

        await expectBigNumberCloseTo(
          await contracts.vault.balanceOf(contracts.vault.address),
          parseEther("134.943502824858757062")
        );

        // 8.85 withdrawal fee sent to RewardsManager
        expectValue(await contracts.depositToken.balanceOf(rewardsManager.address), 0);
        await contracts.vault.connect(owner).withdrawAccruedFees();
        expectValue(await contracts.vault.balanceOf(contracts.vault.address), 0);

        // 230 in management/performance fees + 8.85 withdrawal fee.
        // 200 performance fee = 20% of 1000
        // 30 management fee = 2% of 1500
        await expectBigNumberCloseTo(
          await contracts.depositToken.balanceOf(rewardsManager.address),
          parseEther("238.85"),
          parseEther("0.00015")
        );
      });
    });
  });
});

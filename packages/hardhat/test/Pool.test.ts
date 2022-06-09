import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployMockContract, MockContract } from "ethereum-waffle";
import { parseEther } from "ethers/lib/utils";
import { ethers, waffle } from "hardhat";
import yearnRegistryABI from "../contracts/mocks/abis/yearnRegistry.json";
import {
  expectBigNumberCloseTo,
  expectEvent,
  expectNoEvent,
  expectRevert,
  expectValue,
} from "../lib/utils/expectValue";
import { timeTravel } from "../lib/utils/test";
import { ACLRegistry, ContractRegistry, MockERC20, MockYearnV2Vault, Pool } from "../typechain";

interface Contracts {
  depositToken: MockERC20;
  yearnVault: MockYearnV2Vault;
  yearnRegistry: MockContract;
  pool: Pool;
  aclRegistry: ACLRegistry;
  contractRegistry: ContractRegistry;
}

const DAY = 60 * 60 * 24;
const DEPOSIT_AMOUNT = parseEther("1000");

let owner: SignerWithAddress,
  depositor: SignerWithAddress,
  depositor2: SignerWithAddress,
  rewardsManager: SignerWithAddress;
let contracts: Contracts;

async function deployContracts(): Promise<Contracts> {
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const depositToken = await (await MockERC20.deploy("Token", "TOKEN", 18)).deployed();

  const MockYearnV2Vault = await ethers.getContractFactory("MockYearnV2Vault");
  const yearnVault = await (await MockYearnV2Vault.deploy(depositToken.address)).deployed();

  const yearnRegistry = await deployMockContract(owner, yearnRegistryABI);
  await yearnRegistry.mock.latestVault.returns(yearnVault.address);
  await yearnRegistry.mock.numVaults.returns(1);
  await yearnRegistry.mock.vaults.returns(yearnVault.address);

  const aclRegistry = await (await (await ethers.getContractFactory("ACLRegistry")).deploy()).deployed();

  const contractRegistry = await (
    await (await ethers.getContractFactory("ContractRegistry")).deploy(aclRegistry.address)
  ).deployed();

  const Pool = await ethers.getContractFactory("Pool");
  const pool = await (
    await Pool.deploy(depositToken.address, yearnRegistry.address, contractRegistry.address)
  ).deployed();

  await aclRegistry.grantRole(ethers.utils.id("DAO"), owner.address);
  await contractRegistry
    .connect(owner)
    .addContract(ethers.utils.id("RewardsManager"), rewardsManager.address, ethers.utils.id("1"));

  return {
    depositToken,
    yearnVault,
    yearnRegistry,
    pool,
    aclRegistry,
    contractRegistry,
  };
}

describe("Pool", function () {
  beforeEach(async function () {
    [owner, depositor, depositor2, rewardsManager] = await ethers.getSigners();
    contracts = await deployContracts();
  });

  describe("constructor", async function () {
    it("reverts if yearn registry address is zero", async function () {
      const Pool = await ethers.getContractFactory("Pool");
      await expectRevert(
        Pool.deploy(contracts.depositToken.address, ethers.constants.AddressZero, contracts.contractRegistry.address),
        "Zero address"
      );
    });

    it("reverts if contract registry address is zero", async function () {
      const Pool = await ethers.getContractFactory("Pool");
      await expectRevert(
        Pool.deploy(contracts.depositToken.address, contracts.yearnRegistry.address, ethers.constants.AddressZero),
        "Zero address"
      );
    });

    it("stores contract registry address", async function () {
      const Pool = await ethers.getContractFactory("Pool");
      Pool.deploy(contracts.depositToken.address, contracts.yearnRegistry.address, contracts.contractRegistry.address);

      expectValue(await contracts.pool.contractRegistry(), contracts.contractRegistry.address);
    });

    it("sets feesUpdatedAt to deployment block timestamp", async function () {
      let deployBlock = await waffle.provider.getBlock(contracts.pool.deployTransaction.blockNumber);
      let deployTimestamp = deployBlock.timestamp;
      expectValue(await contracts.pool.feesUpdatedAt(), deployTimestamp);
    });
  });

  describe("defaults", async function () {
    const DEFAULT_HIGH_WATER_MARK = parseEther("1");

    it("withdrawal fee is 50bps", async function () {
      await expectValue(await contracts.pool.withdrawalFee(), 50);
    });

    it("management fee is 200bps", async function () {
      await expectValue(await contracts.pool.managementFee(), 200);
    });

    it("performance fee is 2000bps", async function () {
      await expectValue(await contracts.pool.performanceFee(), 2000);
    });

    it("token high water mark is 1e18", async function () {
      await expectValue(await contracts.pool.poolTokenHWM(), DEFAULT_HIGH_WATER_MARK);
    });
  });

  describe("pool token", async function () {
    it("generates token name from underlying", async function () {
      await expectValue(await contracts.pool.name(), "Popcorn Token Pool");
    });

    it("generates token symbol from underlying", async function () {
      await expectValue(await contracts.pool.symbol(), "popTOKEN");
    });

    it("uses 18 decimals", async function () {
      await expectValue(await contracts.pool.decimals(), 18);
    });
  });

  describe("deposit", async function () {
    beforeEach(async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.pool.address, DEPOSIT_AMOUNT);
    });

    it("transfers tokens from depositor", async function () {
      await expectValue(await contracts.depositToken.balanceOf(depositor.address), DEPOSIT_AMOUNT);

      await contracts.pool.connect(depositor).deposit(DEPOSIT_AMOUNT);

      await expectValue(await contracts.depositToken.balanceOf(depositor.address), 0);
    });

    it("reverts on insufficient balance", async function () {
      await expectRevert(contracts.pool.connect(depositor).deposit(DEPOSIT_AMOUNT.add(1)), "Insufficient balance");
    });

    it("creates a block lock", async function () {
      const depositTx = await contracts.pool.connect(depositor).deposit(DEPOSIT_AMOUNT);

      await expectValue(await contracts.pool.blockLocks(depositor.address), depositTx.blockNumber);
    });

    it("updates feesUpdatedAt", async function () {
      const depositTx = await contracts.pool.connect(depositor).deposit(DEPOSIT_AMOUNT);
      const depositTxBlock = await waffle.provider.getBlock(depositTx.blockNumber);

      await expectValue(await contracts.pool.feesUpdatedAt(), depositTxBlock.timestamp);
    });

    it("deposits into the yearn vault", async function () {
      await contracts.pool.connect(depositor).deposit(DEPOSIT_AMOUNT);

      await expectValue(await contracts.yearnVault.balance(), DEPOSIT_AMOUNT);

      await expectValue(await contracts.depositToken.balanceOf(depositor.address), 0);
    });

    it("pool receives yearn shares in exchange for deposit", async function () {
      await contracts.pool.connect(depositor).deposit(DEPOSIT_AMOUNT);

      await expectValue(await contracts.yearnVault.balanceOf(contracts.pool.address), DEPOSIT_AMOUNT);
    });

    it("pool transfers shares to depositor", async function () {
      await contracts.pool.connect(depositor).deposit(DEPOSIT_AMOUNT);

      await expectValue(await contracts.pool.connect(depositor).balanceOf(depositor.address), DEPOSIT_AMOUNT);
    });

    it("pool emits a Deposit event", async function () {
      await expectEvent(await contracts.pool.connect(depositor).deposit(DEPOSIT_AMOUNT), contracts.pool, "Deposit", [
        depositor.address,
        DEPOSIT_AMOUNT,
        DEPOSIT_AMOUNT,
      ]);
    });

    it("depositFor deposits and sends shares to address", async function () {
      await contracts.pool.connect(depositor).depositFor(DEPOSIT_AMOUNT, depositor2.address);

      expectValue(await contracts.pool.connect(depositor2).balanceOf(depositor2.address), DEPOSIT_AMOUNT);
    });

    it("depositFor reverts on insufficient balance", async function () {
      let amount = parseEther("10000000");
      await contracts.depositToken.connect(depositor).approve(contracts.pool.address, amount);
      await expectRevert(
        contracts.pool.connect(depositor).depositFor(amount, depositor2.address),
        "Insufficient balance"
      );
    });

    it("does not change the high water mark on initial deposit", async function () {
      await expectValue(await contracts.pool.poolTokenHWM(), parseEther("1"));

      await contracts.pool.connect(depositor).deposit(DEPOSIT_AMOUNT);

      await expectValue(await contracts.pool.poolTokenHWM(), parseEther("1"));
    });
  });

  describe("transfers", async function () {
    const TRANSFER_AMOUNT = parseEther("1000");
    beforeEach(async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.mint(depositor2.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.pool.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor2).approve(contracts.pool.address, DEPOSIT_AMOUNT);
    });

    it("pool tokens are transferable with transfer", async function () {
      await contracts.depositToken.connect(depositor).approve(contracts.pool.address, TRANSFER_AMOUNT);
      await contracts.pool.connect(depositor).deposit(TRANSFER_AMOUNT);
      const balance = await contracts.pool.balanceOf(depositor.address);
      await contracts.pool.connect(depositor).transfer(depositor2.address, balance);
      expect(await contracts.pool.balanceOf(depositor2.address)).to.equal(balance);
    });

    it("pool tokens are transferable with transferFrom", async function () {
      await contracts.depositToken.connect(depositor).approve(contracts.pool.address, TRANSFER_AMOUNT);
      await contracts.pool.connect(depositor).deposit(TRANSFER_AMOUNT);
      const balance = await contracts.pool.balanceOf(depositor.address);
      await contracts.pool.connect(depositor).approve(depositor2.address, balance);
      await contracts.pool.connect(depositor2).transferFrom(depositor.address, depositor2.address, balance);
      expect(await contracts.pool.balanceOf(depositor2.address)).to.equal(balance);
    });
  });

  describe("withdraw", async function () {
    beforeEach(async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.pool.address, DEPOSIT_AMOUNT);

      await contracts.pool.connect(depositor).deposit(DEPOSIT_AMOUNT);
    });

    it("reverts on insufficient balance", async function () {
      await expectRevert(
        contracts.pool.connect(depositor).withdraw(DEPOSIT_AMOUNT.add(1)),
        "Insufficient pool token balance"
      );
    });

    it("creates a block lock", async function () {
      const depositTx = await contracts.pool.connect(depositor).withdraw(DEPOSIT_AMOUNT);

      await expectValue(await contracts.pool.blockLocks(depositor.address), depositTx.blockNumber);
    });

    describe("fees", async function () {
      describe("management fees", async function () {
        //Deposit amount 1000, annual management fee 200bps, no change in value
        it("takes a management fee when time passes", async function () {
          const expectedFee = 1000 * 0.02;
          await timeTravel(365 * DAY);
          await expectEvent(
            await contracts.pool.connect(depositor).withdraw(DEPOSIT_AMOUNT),
            contracts.pool,
            "ManagementFee",
            [parseEther(expectedFee.toString())]
          );
        });

        it("doesn't take a management fee when no time passes", async function () {
          await expectNoEvent(
            await contracts.pool.connect(depositor).withdraw(DEPOSIT_AMOUNT),
            contracts.pool,
            "ManagementFee"
          );
        });
      });

      describe("performance fees", async function () {
        //Deposit amount 1000, performance fee 2000bps, value doubles
        it("takes a performance fee when value is more than HWM", async function () {
          const expectedFee = 1000 * 0.2;
          await contracts.yearnVault.setPricePerFullShare(parseEther("2"));
          await expectEvent(
            await contracts.pool.connect(depositor).withdraw(DEPOSIT_AMOUNT),
            contracts.pool,
            "PerformanceFee",
            [parseEther(expectedFee.toString())]
          );
        });

        //Deposit amount 1000, performance fee 2000bps, value decreases
        it("doesn't take a performance fee when value is less than HWM", async function () {
          await contracts.yearnVault.setPricePerFullShare(parseEther("0.5"));
          await expectNoEvent(
            await contracts.pool.connect(depositor).withdraw(DEPOSIT_AMOUNT),
            contracts.pool,
            "PerformanceFee"
          );
        });
      });
    });
  });

  describe("governance", async function () {
    beforeEach(async function () {
      await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
      await contracts.depositToken.connect(depositor).approve(contracts.pool.address, DEPOSIT_AMOUNT);
    });
    it("owner can set withdrawalFee", async function () {
      await contracts.pool.connect(owner).setWithdrawalFee(20);
      expectValue(await contracts.pool.withdrawalFee(), 20);
    });

    it("non-owner cannot set withdrawalFee", async function () {
      await expectRevert(contracts.pool.connect(depositor).setWithdrawalFee(20), "you dont have the right role");
    });

    it("reverts on same withdrawalFee", async function () {
      await expectRevert(contracts.pool.connect(owner).setWithdrawalFee(50), "Same withdrawalFee");
    });

    it("owner can set managementFee", async function () {
      await contracts.pool.connect(owner).setManagementFee(500);
      expectValue(await contracts.pool.managementFee(), 500);
    });

    it("non-owner cannot set managementFee", async function () {
      await expectRevert(contracts.pool.connect(depositor).setManagementFee(500), "you dont have the right role");
    });

    it("reverts on same managementFee", async function () {
      await expectRevert(contracts.pool.connect(owner).setManagementFee(200), "Same managementFee");
    });

    it("owner can set performanceFee", async function () {
      await contracts.pool.connect(owner).setPerformanceFee(5000);
      expectValue(await contracts.pool.performanceFee(), 5000);
    });

    it("non-owner cannot set performanceFee", async function () {
      await expectRevert(contracts.pool.connect(depositor).setPerformanceFee(500), "you dont have the right role");
    });

    it("reverts on same performanceFee", async function () {
      await expectRevert(contracts.pool.connect(owner).setPerformanceFee(2000), "Same performanceFee");
    });

    it("owner can pause the contract", async function () {
      await expectEvent(await contracts.pool.connect(owner).pauseContract(), contracts.pool, "Paused", [owner.address]);
    });

    it("non-owner cannot pause the contract", async function () {
      await expectRevert(contracts.pool.connect(depositor).pauseContract(), "you dont have the right role");
    });

    it("deposits to the pool should not be allowed when paused", async function () {
      await contracts.pool.connect(owner).pauseContract();

      await expectRevert(contracts.pool.connect(depositor).deposit(DEPOSIT_AMOUNT), "Pausable: paused");
    });

    it("deposits to the pool can resume when paused and unpaused", async function () {
      await contracts.pool.connect(owner).pauseContract();

      await contracts.pool.connect(owner).unpauseContract();
      await contracts.pool.connect(depositor).deposit(DEPOSIT_AMOUNT);

      await expectValue(await contracts.pool.totalValue(), DEPOSIT_AMOUNT);
    });

    it("withdrawals are allowed when the pool is paused", async function () {
      await contracts.depositToken.connect(depositor).approve(contracts.pool.address, DEPOSIT_AMOUNT);
      await contracts.pool.connect(depositor).deposit(DEPOSIT_AMOUNT);
      await contracts.pool.connect(owner).pauseContract();

      expect(contracts.pool.connect(depositor).withdraw(DEPOSIT_AMOUNT)).not.to.be.reverted;
    });

    describe("sending accrued fees to rewards manager", async function () {
      beforeEach(async function () {
        await contracts.depositToken.mint(depositor.address, DEPOSIT_AMOUNT);
        await contracts.depositToken.connect(depositor).approve(contracts.pool.address, DEPOSIT_AMOUNT);
      });
      it("owner can withdraw accrued fees", async function () {
        await contracts.depositToken.connect(depositor).approve(contracts.pool.address, DEPOSIT_AMOUNT);
        await contracts.pool.connect(depositor).deposit(DEPOSIT_AMOUNT);
        await contracts.yearnVault.setPricePerFullShare(parseEther("2"));
        await timeTravel(365 * DAY);
        await contracts.pool.takeFees();

        await expectBigNumberCloseTo(
          await contracts.pool.balanceOf(contracts.pool.address),
          parseEther("131.221719457013574659"),
          parseEther("0.00015")
        );

        await contracts.pool.connect(owner).withdrawAccruedFees();

        await expectValue(await contracts.pool.balanceOf(contracts.pool.address), 0);

        await expectBigNumberCloseTo(
          await contracts.depositToken.balanceOf(rewardsManager.address),
          parseEther("262.4434389140271493180"),
          parseEther("0.00015")
        );
      });
    });
  });
});

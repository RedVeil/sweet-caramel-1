import { BlockWithTransactions } from "@ethersproject/abstract-provider";
import { Block } from "@ethersproject/providers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import bluebird from "bluebird";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers, waffle } from "hardhat";
import {
  expectBigNumberCloseTo,
  expectDeepValue,
  expectRevert,
  expectValue,
} from "../lib/utils/expectValue";
import { MockERC20 } from "../typechain";
import { LockStaking } from "../typechain/LockStaking";
import { RewardsEscrow } from "../typechain/RewardsEscrow";

interface Contracts {
  mockPop: MockERC20;
  mockToken: MockERC20;
  staking: LockStaking;
  rewardsEscrow: RewardsEscrow;
}

type Escrow = [BigNumber, BigNumber, BigNumber, string] & {
  start: BigNumber;
  end: BigNumber;
  balance: BigNumber;
  account: string;
};

let owner: SignerWithAddress,
  rewarder: SignerWithAddress,
  nonOwner: SignerWithAddress,
  staking1: SignerWithAddress,
  staking2: SignerWithAddress;

let contracts: Contracts;
const STAKING_FUND = parseEther("10");
const DAY = 86400;
const WEEK = 7 * DAY;
const LOCKED_AMOUNT = parseEther("4.500014880952235511");

async function increaseTime(seconds: number) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

async function deployContracts(): Promise<Contracts> {
  const mockPop = (await (
    await (
      await ethers.getContractFactory("MockERC20")
    ).deploy("TestPOP", "TPOP", 18)
  ).deployed()) as MockERC20;
  await mockPop.mint(owner.address, parseEther("500"));
  await mockPop.mint(nonOwner.address, parseEther("10"));

  const mockToken = (await (
    await (
      await ethers.getContractFactory("MockERC20")
    ).deploy("Test Token", "TEST", 18)
  ).deployed()) as MockERC20;
  await mockToken.mint(owner.address, parseEther("100"));
  await mockToken.mint(nonOwner.address, parseEther("5"));

  const rewardsEscrow = (await (
    await (
      await ethers.getContractFactory("RewardsEscrow")
    ).deploy(mockPop.address)
  ).deployed()) as RewardsEscrow;

  const staking = (await (
    await (
      await ethers.getContractFactory("LockStaking")
    ).deploy(mockPop.address, rewardsEscrow.address)
  ).deployed()) as LockStaking;

  await rewardsEscrow.addStakingContract(staking.address);

  await mockPop.transfer(staking.address, STAKING_FUND);
  await mockPop.connect(owner).approve(staking.address, parseEther("100000"));

  await staking.notifyRewardAmount(STAKING_FUND);
  await staking.connect(owner).stake(parseEther("1"), 12 * WEEK);

  return { mockPop, mockToken, staking, rewardsEscrow };
}

describe("RewardsEscrow", function () {
  beforeEach(async function () {
    [owner, rewarder, nonOwner, staking1, staking2] = await ethers.getSigners();
    contracts = await deployContracts();
  });

  describe("constructor", function () {
    it("stores POP token address", async function () {
      await expectValue(
        await contracts.rewardsEscrow.POP(),
        contracts.mockPop.address
      );
    });
  });

  describe("isClaimable", function () {
    it("escrow is not claimable if start is zero", async function () {
      await expectValue(
        await contracts.rewardsEscrow.isClaimable(
          ethers.utils.formatBytes32String("some nonexistent escrow ID")
        ),
        false
      );
    });
  });

  describe("getEscrowIdsByUser", function () {
    it("returns no escrow IDs when none exist", async function () {
      await expectDeepValue(
        await contracts.rewardsEscrow.getEscrowIdsByUser(owner.address),
        []
      );
    });

    it("returns escrow IDs when they exist", async function () {
      await contracts.staking.connect(owner).getReward();
      await expectValue(
        (
          await contracts.rewardsEscrow.getEscrowIdsByUser(owner.address)
        ).length,
        1
      );
    });
  });

  describe("getEscrows", function () {
    it("returns array of Escrows for provided ids", async function () {
      await contracts.staking.connect(owner).getReward();
      await contracts.staking.connect(owner).getReward();
      await contracts.staking.connect(owner).getReward();
      let escrowIds = await contracts.rewardsEscrow.getEscrowIdsByUser(
        owner.address
      );
      let escrows = await contracts.rewardsEscrow.getEscrows(escrowIds);
      await expectValue(escrows.length, 3);
    });
  });

  describe("lock", function () {
    beforeEach(async function () {
      await increaseTime(3.5 * DAY);
    });

    describe("require statements", () => {
      it("Reverts on unset staking address", async function () {
        await contracts.rewardsEscrow
          .connect(owner)
          .addStakingContract(ethers.constants.AddressZero);
        await expectRevert(
          contracts.rewardsEscrow
            .connect(owner)
            .lock(owner.address, parseEther("1")),
          "unauthorized"
        );
      });

      it("Reverts on unauthorized caller address", async function () {
        await contracts.rewardsEscrow
          .connect(owner)
          .addStakingContract(nonOwner.address);
        await expectRevert(
          contracts.rewardsEscrow
            .connect(owner)
            .lock(owner.address, parseEther("1")),
          "unauthorized"
        );
      });

      it("Reverts on zero amount", async function () {
        await contracts.rewardsEscrow
          .connect(owner)
          .addStakingContract(owner.address);
        await expectRevert(
          contracts.rewardsEscrow.connect(owner).lock(owner.address, 0),
          "amount must be greater than 0"
        );
      });

      it("Reverts on insufficient balance from caller", async function () {
        await contracts.rewardsEscrow
          .connect(owner)
          .addStakingContract(owner.address);
        await expectRevert(
          contracts.rewardsEscrow
            .connect(owner)
            .lock(owner.address, parseEther("1000000000")),
          "insufficient balance"
        );
      });
    });

    describe("Escrows", () => {
      let escrow: Escrow;
      let currentBlock: Block | BlockWithTransactions;

      beforeEach(async function () {
        const currentBlockNumber = await ethers.provider.getBlockNumber();
        currentBlock = await ethers.provider._getBlock(currentBlockNumber);
        await contracts.staking.connect(owner).getReward();

        const escrowId = await contracts.rewardsEscrow.getEscrowIdsByUser(
          owner.address
        );
        escrow = await contracts.rewardsEscrow.escrows(escrowId[0]);
      });

      it("stores escrow start", async function () {
        await expectValue(escrow.start, currentBlock.timestamp + 1);
      });

      it("stores escrow end", async function () {
        await expectValue(escrow.end, escrow.start.add(365 * DAY));
      });

      it("stores escrow balance", async function () {
        await expectValue(escrow.balance, LOCKED_AMOUNT);
      });

      it("stores escrow account", async function () {
        await expectValue(escrow.account, owner.address);
      });
    });

    it("transfers funds on lock", async function () {
      expect(
        await contracts.mockPop.balanceOf(contracts.rewardsEscrow.address)
      ).to.equal(0);
      expect(
        await contracts.mockPop.balanceOf(contracts.staking.address)
      ).to.equal(parseEther("11"));

      await contracts.staking.connect(owner).getReward();

      await expectBigNumberCloseTo(
        await contracts.mockPop.balanceOf(contracts.rewardsEscrow.address),
        LOCKED_AMOUNT,
        parseEther("0.00015")
      );
      await expectBigNumberCloseTo(
        await contracts.mockPop.balanceOf(contracts.staking.address),
        parseEther("5.999983465608627210"),
        parseEther("0.00015")
      );
    });

    it("emits event on lock", async function () {
      const result = await contracts.staking.connect(owner).getReward();
      expect(result)
        .to.emit(contracts.rewardsEscrow, "Locked")
        .withArgs(owner.address, LOCKED_AMOUNT);
    });

    it("creates new Escrow when locking again", async function () {
      await contracts.staking.connect(owner).getReward();
      await increaseTime(3.5 * DAY);
      await contracts.staking.connect(owner).getReward();

      const escrowIds = await contracts.rewardsEscrow.getEscrowIdsByUser(
        owner.address
      );

      expect(escrowIds.length).to.equal(2);

      const escrow1 = await contracts.rewardsEscrow.escrows(escrowIds[0]);
      const escrow2 = await contracts.rewardsEscrow.escrows(escrowIds[1]);
      await expectBigNumberCloseTo(
        escrow1.balance,
        LOCKED_AMOUNT,
        parseEther("0.00015")
      );
      await expectBigNumberCloseTo(
        escrow2.balance,
        parseEther("4.499970238095092649"),
        parseEther("0.00015")
      );
    });
  });

  describe("claim rewards", function () {
    context("claim single escrow", function () {
      let escrow: Escrow;
      let escrowIds: string[];
      beforeEach(async function () {
        await increaseTime(304800);
        await contracts.staking.connect(owner).getReward();
        escrowIds = await contracts.rewardsEscrow.getEscrowIdsByUser(
          owner.address
        );
        escrow = await contracts.rewardsEscrow.escrows(escrowIds[0]);
      });

      it("claims full rewards successfully", async function () {
        await increaseTime(366 * DAY);
        const oldBalance = await contracts.mockPop.balanceOf(owner.address);

        await expect(
          contracts.rewardsEscrow.connect(owner).claimReward(escrowIds[0])
        )
          .to.emit(contracts.rewardsEscrow, "RewardsClaimed")
          .withArgs(owner.address, escrow.balance);

        const newBalance = await contracts.mockPop.balanceOf(owner.address);
        expect(newBalance).to.equal(oldBalance.add(escrow.balance));
      });

      it("deducts full amount from escrow balance", async function () {
        await increaseTime(366 * DAY);
        await contracts.rewardsEscrow.connect(owner).claimReward(escrowIds[0]);
        const updatedEscrow = await contracts.rewardsEscrow.escrows(
          escrowIds[0]
        );

        await expectValue(updatedEscrow.balance, 0);
      });

      it("cannot claim escrow twice", async function () {
        await increaseTime(366 * DAY);
        await contracts.rewardsEscrow.connect(owner).claimReward(escrowIds[0]);
        await expectRevert(
          contracts.rewardsEscrow.connect(owner).claimReward(escrowIds[0]),
          "no rewards"
        );
      });

      it("claims partial rewards successfully during the vesting period", async function () {
        await increaseTime(183 * DAY);

        const oldBalance = await contracts.mockPop.balanceOf(owner.address);
        const currentBlock = await waffle.provider.getBlock("latest");
        const result = await contracts.rewardsEscrow
          .connect(owner)
          .claimReward(escrowIds[0]);

        const expectedReward = escrow.balance
          .mul(
            BigNumber.from(String(currentBlock.timestamp + 1)).sub(escrow.start)
          )
          .div(escrow.end.sub(escrow.start));

        expect(result)
          .to.emit(contracts.rewardsEscrow, "RewardsClaimed")
          .withArgs(owner.address, expectedReward);

        const newBalance = await contracts.mockPop.balanceOf(owner.address);
        expect(newBalance).to.equal(oldBalance.add(expectedReward));

        //Check if the escrowId got deleted
        expect(
          (await contracts.rewardsEscrow.getEscrowIdsByUser(owner.address))
            .length
        ).to.equal(1);
      });

      it("deducts partial amount from escrow balance", async function () {
        await increaseTime(183 * DAY);

        const currentBlock = await waffle.provider.getBlock("latest");
        await contracts.rewardsEscrow.connect(owner).claimReward(escrowIds[0]);

        const expectedReward = escrow.balance
          .mul(
            BigNumber.from(String(currentBlock.timestamp + 1)).sub(escrow.start)
          )
          .div(escrow.end.sub(escrow.start));

        const updatedEscrow = await contracts.rewardsEscrow.escrows(
          escrowIds[0]
        );

        await expectValue(
          updatedEscrow.balance,
          escrow.balance.sub(expectedReward)
        );
      });

      it("reverts if caller is not escrow account", async function () {
        await expectRevert(
          contracts.rewardsEscrow.connect(nonOwner).claimReward(escrowIds[0]),
          "unauthorized"
        );
      });

      it("claims successfully when multiple escrows are added", async function () {
        await bluebird.map(
          new Array(50).fill(0),
          async (_x, _i) => {
            await contracts.staking.connect(owner).getReward();
          },
          { concurrency: 1 }
        );
        await increaseTime(366 * DAY);
        escrowIds = await contracts.rewardsEscrow.getEscrowIdsByUser(
          owner.address
        );

        escrow = await contracts.rewardsEscrow.escrows(escrowIds[0]);
        const oldBalance = await contracts.mockPop.balanceOf(owner.address);

        await expect(
          contracts.rewardsEscrow.connect(owner).claimReward(escrowIds[0])
        )
          .to.emit(contracts.rewardsEscrow, "RewardsClaimed")
          .withArgs(owner.address, escrow.balance);

        const newBalance = await contracts.mockPop.balanceOf(owner.address);
        expect(newBalance).to.equal(oldBalance.add(escrow.balance));
      });
    });

    context("claim multiple escrows", function () {
      beforeEach(async function () {
        await increaseTime(304800);
      });

      it("cannot claim escrows twice", async function () {
        await bluebird.map(
          new Array(30).fill(0),
          async (_x, _i) => {
            await contracts.staking.connect(owner).getReward();
          },
          { concurrency: 1 }
        );
        await increaseTime(366 * DAY);
        const escrowIds = await contracts.rewardsEscrow.getEscrowIdsByUser(
          owner.address
        );
        await contracts.rewardsEscrow
          .connect(owner)
          .claimRewards(escrowIds.slice(0, 20));

        await expectRevert(
          contracts.rewardsEscrow
            .connect(owner)
            .claimRewards(escrowIds.slice(0, 20)),
          "no rewards"
        );
      });

      it("reverts if caller is not escrow account for any included escrow", async function () {
        await contracts.staking.connect(owner).getReward();
        const escrowIds = await contracts.rewardsEscrow.getEscrowIdsByUser(
          owner.address
        );
        await expectRevert(
          contracts.rewardsEscrow.connect(nonOwner).claimRewards(escrowIds),
          "unauthorized"
        );
      });

      it("claims full rewards successfully after vesting period", async function () {
        await contracts.staking.connect(owner).getReward();
        const escrowIds = await contracts.rewardsEscrow.getEscrowIdsByUser(
          owner.address
        );
        const escrow = await contracts.rewardsEscrow.escrows(escrowIds[0]);
        await increaseTime(366 * DAY);
        const oldBalance = await contracts.mockPop.balanceOf(owner.address);

        await expect(
          contracts.rewardsEscrow.connect(owner).claimRewards([escrowIds[0]])
        )
          .to.emit(contracts.rewardsEscrow, "RewardsClaimed")
          .withArgs(owner.address, escrow.balance);

        const newBalance = await contracts.mockPop.balanceOf(owner.address);
        expect(newBalance).to.equal(oldBalance.add(escrow.balance));
      });

      it("claims partial rewards successfully during the vesting period", async function () {
        await contracts.staking.connect(owner).getReward();
        const escrowIds = await contracts.rewardsEscrow.getEscrowIdsByUser(
          owner.address
        );
        const escrow = await contracts.rewardsEscrow.escrows(escrowIds[0]);

        await increaseTime(183 * DAY);

        const oldBalance = await contracts.mockPop.balanceOf(owner.address);
        const currentBlock = await waffle.provider.getBlock("latest");
        const result = await contracts.rewardsEscrow
          .connect(owner)
          .claimRewards([escrowIds[0]]);

        const expectedReward = escrow.balance
          .mul(
            BigNumber.from(String(currentBlock.timestamp + 1)).sub(escrow.start)
          )
          .div(escrow.end.sub(escrow.start));

        expect(result)
          .to.emit(contracts.rewardsEscrow, "RewardsClaimed")
          .withArgs(owner.address, expectedReward);

        const newBalance = await contracts.mockPop.balanceOf(owner.address);
        expect(newBalance).to.equal(oldBalance.add(expectedReward));
      });

      it("claims successfully when multiple escrows are added", async function () {
        await bluebird.map(
          new Array(50).fill(0),
          async (x, i) => {
            await contracts.staking.connect(owner).getReward();
          },
          { concurrency: 1 }
        );
        await increaseTime(366 * DAY);
        const escrowIds = await contracts.rewardsEscrow.getEscrowIdsByUser(
          owner.address
        );
        const escrow = await contracts.rewardsEscrow.escrows(escrowIds[0]);
        const oldBalance = await contracts.mockPop.balanceOf(owner.address);

        await expect(
          contracts.rewardsEscrow.connect(owner).claimReward(escrowIds[0])
        )
          .to.emit(contracts.rewardsEscrow, "RewardsClaimed")
          .withArgs(owner.address, escrow.balance);

        const newBalance = await contracts.mockPop.balanceOf(owner.address);
        expect(newBalance).to.equal(oldBalance.add(escrow.balance));
      });

      it("should allow to claim one escrow balance fully while claiming another one partially", async function () {
        await contracts.staking.connect(owner).getReward();
        await increaseTime(1 * DAY);
        await contracts.staking.connect(owner).getReward();
        const escrowIds = await contracts.rewardsEscrow.getEscrowIdsByUser(
          owner.address
        );
        const escrow1 = await contracts.rewardsEscrow.escrows(escrowIds[0]);
        const escrow2 = await contracts.rewardsEscrow.escrows(escrowIds[1]);
        const timestamp = (await waffle.provider.getBlock("latest")).timestamp;
        await increaseTime(escrow1.end.toNumber() - timestamp);
        const oldBalance = await contracts.mockPop.balanceOf(owner.address);
        const currentBlock = await waffle.provider.getBlock("latest");
        const result = await contracts.rewardsEscrow
          .connect(owner)
          .claimRewards([escrowIds[0], escrowIds[1]]);

        const escrow2ExpectedReward = escrow2.balance
          .mul(
            BigNumber.from(String(currentBlock.timestamp + 1)).sub(
              escrow2.start
            )
          )
          .div(escrow2.end.sub(escrow2.start));
        const expectedReward = escrow2ExpectedReward.add(escrow1.balance);

        await expectValue(
          (
            await contracts.rewardsEscrow.escrows(escrowIds[0])
          ).balance,
          0
        );
        await expectValue(
          (
            await contracts.rewardsEscrow.escrows(escrowIds[1])
          ).balance,
          escrow2.balance.sub(escrow2ExpectedReward)
        );

        expect(result)
          .to.emit(contracts.rewardsEscrow, "RewardsClaimed")
          .withArgs(owner.address, expectedReward);

        const newBalance = await contracts.mockPop.balanceOf(owner.address);
        expect(newBalance).to.equal(oldBalance.add(expectedReward));
      });
    });
  });

  describe("restricted functions", function () {
    it("should revert updateEscrowDuration if not owner", async function () {
      await expectRevert(
        contracts.rewardsEscrow.connect(nonOwner).updateEscrowDuration(0),
        "Ownable: caller is not the owner"
      );
    });

    it("owner can update escrow duration", async function () {
      await contracts.rewardsEscrow.connect(owner).updateEscrowDuration(604800);
      await expectValue(await contracts.rewardsEscrow.escrowDuration(), 604800);
    });

    it("updating duration emits an event", async function () {
      await expect(
        contracts.rewardsEscrow.connect(owner).updateEscrowDuration(604800)
      )
        .to.emit(contracts.rewardsEscrow, "EscrowDurationChanged")
        .withArgs(604800);
    });

    it("adds a staking contract address", async function () {
      await expectValue(
        await contracts.rewardsEscrow.staking(staking1.address),
        false
      );
      await contracts.rewardsEscrow
        .connect(owner)
        .addStakingContract(staking1.address);
      await expectValue(
        await contracts.rewardsEscrow.staking(staking1.address),
        true
      );
    });

    it("emits AddStaking when staking address is added", async function () {
      expect(
        contracts.rewardsEscrow
          .connect(owner)
          .addStakingContract(staking1.address)
      )
        .to.emit(contracts.rewardsEscrow, "AddStaking")
        .withArgs(staking1.address);
    });

    it("removes staking contract address", async function () {
      await expectValue(
        await contracts.rewardsEscrow.staking(staking1.address),
        false
      );
      await contracts.rewardsEscrow
        .connect(owner)
        .addStakingContract(staking1.address);
      await expectValue(
        await contracts.rewardsEscrow.staking(staking1.address),
        true
      );
      await contracts.rewardsEscrow
        .connect(owner)
        .removeStakingContract(staking1.address);
      await expectValue(
        await contracts.rewardsEscrow.staking(staking1.address),
        false
      );
    });

    it("emits RemoveStaking when staking address is removed", async function () {
      expect(
        contracts.rewardsEscrow
          .connect(owner)
          .removeStakingContract(staking1.address)
      )
        .to.emit(contracts.rewardsEscrow, "RemoveStaking")
        .withArgs(staking1.address);
    });

    it("should revert addStakingContract if not owner", async function () {
      await expectRevert(
        contracts.rewardsEscrow
          .connect(nonOwner)
          .addStakingContract(nonOwner.address),
        "Ownable: caller is not the owner"
      );
    });
  });
});

import { parseEther } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { expectEvent, expectRevert, expectValue } from "../lib/utils/expectValue";
import { MockERC20, PopLocker, RewardsEscrow, Staking } from "../typechain";
import { RewardsDistribution } from "../typechain/RewardsDistribution";

let owner: SignerWithAddress,
  nonOwner: SignerWithAddress,
  rewardsDistributor: SignerWithAddress,
  treasury: SignerWithAddress;

let mockPop: MockERC20;
let mockToken: MockERC20;
let staking: Staking;
let popLocker: PopLocker;
let rewardsEscrow: RewardsEscrow;
let rewardsDistribution: RewardsDistribution;

describe("RewardsDistribution", function () {
  beforeEach(async () => {
    [owner, nonOwner, treasury, rewardsDistributor] = await ethers.getSigners();
    const mockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockPop = (await mockERC20Factory.deploy("TestPOP", "TPOP", 18)) as MockERC20;
    mockToken = (await mockERC20Factory.deploy("Test Token", "TT", 18)) as MockERC20;
    await mockPop.mint(owner.address, parseEther("100"));

    rewardsEscrow = (await (
      await (await ethers.getContractFactory("RewardsEscrow")).deploy(mockPop.address)
    ).deployed()) as RewardsEscrow;

    staking = await (
      await (await ethers.getContractFactory("Staking")).deploy(mockPop.address, mockPop.address, rewardsEscrow.address)
    ).deployed();

    popLocker = await (
      await (await ethers.getContractFactory("PopLocker")).deploy(mockPop.address, rewardsEscrow.address)
    ).deployed();

    rewardsDistribution = (await (
      await (
        await ethers.getContractFactory("RewardsDistribution")
      ).deploy(owner.address, mockPop.address, treasury.address)
    ).deployed()) as RewardsDistribution;

    await staking.approveRewardDistributor(rewardsDistribution.address, true);
    await popLocker.addReward(mockPop.address, rewardsDistribution.address, true);
  });
  describe("constructor", () => {
    it("sets owner correctly", async () => {
      expect(await rewardsDistribution.owner()).to.equal(owner.address);
    });
    it("sets pop correctly", async () => {
      expect(await rewardsDistribution.pop()).to.equal(mockPop.address);
    });
    it("sets treasury correctly", async () => {
      expect(await rewardsDistribution.treasury()).to.equal(treasury.address);
    });
  });
  describe("setter", () => {
    it("sets a new pop address", async () => {
      await rewardsDistribution.setPop(mockToken.address);
      expect(await rewardsDistribution.pop()).to.equal(mockToken.address);
    });
    it("sets a new treasury address", async () => {
      await rewardsDistribution.setTreasury(owner.address);
      expect(await rewardsDistribution.treasury()).to.equal(owner.address);
    });
  });
  describe("approveRewardDistributor", async () => {
    it("should allow owner to add an address as an approved reward distributor", async () => {
      await rewardsDistribution.connect(owner).approveRewardDistributor(rewardsDistributor.address, true);
      await expectValue(await rewardsDistribution.rewardDistributors(rewardsDistributor.address), true);
    });
    it("should allow owner to remove an address as an approved reward distributor", async () => {
      await rewardsDistribution.connect(owner).approveRewardDistributor(rewardsDistributor.address, false);
      await expectValue(await rewardsDistribution.rewardDistributors(rewardsDistributor.address), false);
    });
    it("should emit RewardDistributorUpdated event", async () => {
      await expectEvent(
        await rewardsDistribution.connect(owner).approveRewardDistributor(rewardsDistributor.address, false),
        rewardsDistribution,
        "RewardDistributorUpdated",
        [rewardsDistributor.address, false]
      );
    });
  });
  describe("addRewardDistribution", () => {
    context("reverts", () => {
      it("reverts when destination = address(0)", async () => {
        expectRevert(
          rewardsDistribution.addRewardDistribution(
            "0x0000000000000000000000000000000000000000",
            parseEther("1"),
            false
          ),
          "Cant add a zero address"
        );
      });
      it("reverts when amount = 0", async () => {
        expectRevert(rewardsDistribution.addRewardDistribution(staking.address, 0, false), "Cant add a zero amount");
      });
    });
    context("success", async () => {
      let destAddr;
      const amount = parseEther("10");
      const isLocker = false;
      let result;
      beforeEach(async () => {
        destAddr = staking.address;
        result = await rewardsDistribution.addRewardDistribution(destAddr, amount, isLocker);
      });
      it("emits an event", async () => {
        expect(result).to.emit(rewardsDistribution, "RewardDistributionAdded").withArgs(0, destAddr, amount, isLocker);
      });
      it("adds the correct data to distributions", async () => {
        const distribution = await rewardsDistribution.distributions(0);
        expectValue(distribution.destination, destAddr);
        expectValue(distribution.amount, amount);
        expectValue(distribution.isLocker, isLocker);
      });
      it("increases destinations length", async () => {
        expect(await rewardsDistribution.distributionsLength()).to.eq(1);
      });
    });
  });
  describe("removeRewardDistribution", () => {
    beforeEach(async () => {
      await rewardsDistribution.addRewardDistribution(staking.address, parseEther("1"), false);
    });
    context("reverts", async () => {
      it("reverts when index out of bounds", async () => {
        expectRevert(rewardsDistribution.removeRewardDistribution(2), "index out of bounds");
      });
    });
    context("success", async () => {
      let result;
      beforeEach(async () => {
        result = await rewardsDistribution.removeRewardDistribution(0);
      });
      it("removes the distribution", async () => {
        const distribution = await rewardsDistribution.distributions(0);
        expectValue(distribution.destination, "0x0000000000000000000000000000000000000000");
        expectValue(distribution.amount, parseEther("0"));
        expectValue(distribution.isLocker, false);
      });
    });
  });
  describe("editRewardDistribution", () => {
    beforeEach(async () => {
      await rewardsDistribution.addRewardDistribution(staking.address, parseEther("1"), false);
    });
    context("reverts", () => {
      it("reverts when index out of bounds", async () => {
        expectRevert(
          rewardsDistribution.editRewardDistribution(1, staking.address, parseEther("1"), false),
          "index out of bounds"
        );
      });
    });
    context("success", async () => {
      let destAddr;
      const amount = parseEther("5");
      const isLocker = true;
      let result;
      beforeEach(async () => {
        destAddr = popLocker.address;
        result = await rewardsDistribution.editRewardDistribution(0, destAddr, amount, isLocker);
      });
      it("changes the correct data in distributions", async () => {
        const distribution = await rewardsDistribution.distributions(0);
        expectValue(distribution.destination, destAddr);
        expectValue(distribution.amount, amount);
        expectValue(distribution.isLocker, isLocker);
      });
    });
  });
  describe("distributeRewards", () => {
    context("reverts", () => {
      it("reverts when not called by a rewardsDistributor", async () => {
        expectRevert(rewardsDistribution.distributeRewards(parseEther("1")), "not authorized");
      });
      it("reverts when amount = 0", async () => {
        expectRevert(rewardsDistribution.connect(rewardsDistributor).distributeRewards(0), "Nothing to distribute");
      });
      it("reverts when pop is not set", async () => {
        await rewardsDistribution.approveRewardDistributor(rewardsDistributor.address, true);
        await rewardsDistribution.setPop("0x0000000000000000000000000000000000000000");
        expectRevert(
          rewardsDistribution.connect(rewardsDistributor).distributeRewards(parseEther("1")),
          "Pop is not set"
        );
      });
      it("reverts when treasury is not set", async () => {
        await rewardsDistribution.approveRewardDistributor(rewardsDistributor.address, true);
        await rewardsDistribution.setTreasury("0x0000000000000000000000000000000000000000");
        expectRevert(
          rewardsDistribution.connect(rewardsDistributor).distributeRewards(parseEther("1")),
          "Treasury is not set"
        );
      });
      it("reverts when rewardsDistribution contract doesnt have a sufficient pop balance", async () => {
        await rewardsDistribution.approveRewardDistributor(rewardsDistributor.address, true);
        expectRevert(
          rewardsDistribution.connect(rewardsDistributor).distributeRewards(parseEther("1")),
          "RewardsDistribution contract does not have enough tokens to distribute"
        );
      });
    });
    context("success", async () => {
      let result;
      beforeEach(async () => {
        await rewardsDistribution.approveRewardDistributor(rewardsDistributor.address, true);
        await rewardsDistribution.addRewardDistribution(staking.address, parseEther("10"), false);
        await rewardsDistribution.addRewardDistribution(popLocker.address, parseEther("10"), true);
        await mockPop.connect(owner).transfer(rewardsDistribution.address, parseEther("21"));
        result = await rewardsDistribution.connect(rewardsDistributor).distributeRewards(parseEther("21"));
      });
      it("emits an event", async () => {
        expect(result).to.emit(rewardsDistribution, "RewardsDistributed").withArgs(parseEther("21"));
      });
      it("calls notifyRewardAmount on each contract", async () => {
        expect(result).to.emit(staking, "RewardAdded").withArgs(parseEther("10"));
        expect(result).to.emit(popLocker, "RewardAdded").withArgs(mockPop.address, parseEther("10"));
        expect(await mockPop.balanceOf(staking.address)).to.eq(parseEther("10"));
        expect(await mockPop.balanceOf(popLocker.address)).to.eq(parseEther("10"));
      });
      it("sends the remainder to the treasury", async () => {
        expect(await mockPop.balanceOf(treasury.address)).to.eq(parseEther("1"));
      });
      it("skips deleted distributions", async () => {
        await rewardsDistribution.removeRewardDistribution(0);
        await mockPop.connect(owner).transfer(rewardsDistribution.address, parseEther("11"));

        result = await rewardsDistribution.connect(rewardsDistributor).distributeRewards(parseEther("10"));
        expect(result).to.emit(popLocker, "RewardAdded").withArgs(mockPop.address, parseEther("10"));
        expect(await mockPop.balanceOf(staking.address)).to.eq(parseEther("10"));
        expect(await mockPop.balanceOf(popLocker.address)).to.eq(parseEther("20"));
      });
    });
  });
  describe("only owner", () => {
    it("setPop() reverts when not called by owner", async () => {
      expectRevert(
        rewardsDistribution.connect(nonOwner).setPop(mockToken.address),
        "Only the contract owner may perform this action"
      );
    });
    it("setTreasury() reverts when not called by owner", async () => {
      expectRevert(
        rewardsDistribution.connect(nonOwner).setTreasury(owner.address),
        "Only the contract owner may perform this action"
      );
    });
    it("approveRewardDistributor() reverts when not called by owner", async () => {
      expectRevert(
        rewardsDistribution.connect(nonOwner).approveRewardDistributor(owner.address, true),
        "Only the contract owner may perform this action"
      );
    });
    it("addRewardDistribution() reverts when not called by owner", async () => {
      expectRevert(
        rewardsDistribution.connect(nonOwner).addRewardDistribution(staking.address, parseEther("1"), false),
        "Only the contract owner may perform this action"
      );
    });
    it("removeRewardDistribution() reverts when not called by owner", async () => {
      expectRevert(
        rewardsDistribution.connect(nonOwner).removeRewardDistribution(0),
        "Only the contract owner may perform this action"
      );
    });
    it("editRewardDistribution() reverts when not called by owner", async () => {
      expectRevert(
        rewardsDistribution.connect(nonOwner).editRewardDistribution(0, staking.address, parseEther("1"), false),
        "Only the contract owner may perform this action"
      );
    });
  });
});

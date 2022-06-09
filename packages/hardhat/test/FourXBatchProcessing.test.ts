import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import bluebird from "bluebird";
import { expect } from "chai";
import { BigNumber, utils } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers, waffle } from "hardhat";
import { expectBigNumberCloseTo, expectEvent, expectRevert, expectValue } from "../lib/utils/expectValue";
import { DAYS } from "../lib/utils/test/constants";
import {
  MockCurveMetapool,
  MockCurveMetapool__factory,
  MockCurveThreepool,
  MockERC20,
  RewardsEscrow,
  Staking,
} from "../typechain";
import { MockBasicIssuanceModule } from "../typechain/MockBasicIssuanceModule";
import { MockYearnV2Vault } from "../typechain/MockYearnV2Vault";
import { FourXBatchVault } from "../typechain/FourXBatchVault";
import FourXBatchAdapter from "../lib/adapters/FourXBatchAdapter";
import { MockCurveOraclePool } from "../typechain/MockCurveOraclePool";
import { FourXBatchProcessing } from "../typechain/FourXBatchProcessing";
import { constants } from "ethers";
import { MockCurveFactoryMetapool } from "../typechain/MockCurveFactoryMetapool";
import { MockBasePool } from "../typechain/MockBasePool";
import { MockAngleRouter } from "../typechain/MockAngleRouter";

const provider = waffle.provider;

interface Token {
  dai: MockERC20;
  usdc: MockERC20;
  usdt: MockERC20;
  pop: MockERC20;
  frax: MockERC20;
  agEur: MockERC20;
  threeCrv: MockERC20;
  setToken: MockERC20;
}
interface Contracts {
  token: Token;
  yearnVaultD3: MockYearnV2Vault;
  yearnVault3EUR: MockYearnV2Vault;
  curveMetapoolD3: MockBasePool;
  curveMetapool3EUR: MockBasePool;
  swapPoolFrax: MockCurveFactoryMetapool;
  swapPoolEurs: MockCurveFactoryMetapool;
  mockBasicIssuanceModule: MockBasicIssuanceModule;
  fourXBatchProcessing: FourXBatchProcessing;
  staking: Staking;
  fourXStorage: FourXBatchVault;
  angleRouter: MockAngleRouter;
}

enum BatchType {
  Mint,
  Redeem,
}

const DAY = 60 * 60 * 24;

const DepositorInitial = parseEther("100000");
let owner: SignerWithAddress,
  depositor: SignerWithAddress,
  depositor1: SignerWithAddress,
  depositor2: SignerWithAddress,
  depositor3: SignerWithAddress,
  zapper: SignerWithAddress;
let contracts: Contracts;

async function deployToken(): Promise<Token> {
  const MockERC20 = await ethers.getContractFactory("MockERC20");

  const dai = await (await MockERC20.deploy("DAI", "DAI", 18)).deployed();
  const usdc = await (await MockERC20.deploy("USDC", "USDC", 6)).deployed();
  const usdt = await (await MockERC20.deploy("USDT", "USDT", 18)).deployed();

  const pop = await (await MockERC20.deploy("POP", "POP", 18)).deployed();

  const frax = await (await MockERC20.deploy("FRAX", "FRAX", 18)).deployed();
  const agEur = await (await MockERC20.deploy("agEUR", "agEUR", 18)).deployed();
  const threeCrv = await (await MockERC20.deploy("3CRV", "3CRV", 18)).deployed();

  const setToken = await await MockERC20.deploy("setToken", "setToken", 18);
  return {
    dai,
    usdc,
    usdt,
    pop,
    frax,
    agEur,
    threeCrv,
    setToken,
  };
}

async function deployContracts(): Promise<Contracts> {
  const token = await deployToken();

  const MockCurveFactoryMetapool = await ethers.getContractFactory("MockCurveFactoryMetapool");
  const swapPoolFrax = (await (
    await MockCurveFactoryMetapool.deploy(
      token.frax.address,
      token.threeCrv.address,
      [token.dai.address, token.usdc.address, token.usdt.address],
      parseEther("1")
    )
  ).deployed()) as MockCurveFactoryMetapool;
  const swapPoolEurs = (await (
    await MockCurveFactoryMetapool.deploy(
      token.agEur.address,
      token.threeCrv.address,
      [token.dai.address, token.usdc.address, token.usdt.address],
      parseEther("1.06")
    )
  ).deployed()) as MockCurveFactoryMetapool;

  const MockBasePoolFactory = await ethers.getContractFactory("MockBasePool");
  const curveMetapoolD3 = await (
    await MockBasePoolFactory.deploy([token.frax.address, token.usdc.address, token.usdt.address], parseEther("1"))
  ).deployed();
  const curveMetapool3EUR = await (
    await MockBasePoolFactory.deploy([token.dai.address, token.agEur.address, token.usdt.address], parseEther("1.06"))
  ).deployed();

  const MockYearnV2Vault = await ethers.getContractFactory("MockYearnV2Vault");
  const yearnVaultD3 = await (await MockYearnV2Vault.deploy(curveMetapoolD3.address)).deployed();
  const yearnVault3EUR = await (await MockYearnV2Vault.deploy(curveMetapool3EUR.address)).deployed();

  const mockBasicIssuanceModule = await (
    await (
      await ethers.getContractFactory("MockBasicIssuanceModule")
    ).deploy([yearnVaultD3.address, yearnVault3EUR.address], [50, 50])
  ).deployed();

  const aclRegistry = await (await (await ethers.getContractFactory("ACLRegistry")).deploy()).deployed();

  const contractRegistry = await (
    await (await ethers.getContractFactory("ContractRegistry")).deploy(aclRegistry.address)
  ).deployed();

  const keeperIncentive = await (
    await (await ethers.getContractFactory("KeeperIncentive")).deploy(contractRegistry.address, 0, 0)
  ).deployed();

  const popStaking = await (
    await (await ethers.getContractFactory("PopLocker")).deploy(token.pop.address, token.pop.address)
  ).deployed();

  const rewardsEscrow = (await (
    await (await ethers.getContractFactory("RewardsEscrow")).deploy(token.pop.address)
  ).deployed()) as RewardsEscrow;

  const staking = await (
    await (
      await ethers.getContractFactory("Staking")
    ).deploy(token.pop.address, token.setToken.address, rewardsEscrow.address)
  ).deployed();

  const angleRouter = (await (
    await (
      await ethers.getContractFactory("MockAngleRouter")
    ).deploy(token.agEur.address, token.usdc.address, parseEther("1.06"))
  ).deployed()) as MockAngleRouter;

  const fourXBatchProcessing = await (
    await (
      await ethers.getContractFactory("FourXBatchProcessing")
    ).deploy(
      contractRegistry.address,
      staking.address,
      ethers.constants.AddressZero,
      { sourceToken: token.usdc.address, targetToken: token.setToken.address }, // mint batch
      { sourceToken: token.setToken.address, targetToken: token.usdc.address }, // redeem batch
      mockBasicIssuanceModule.address,
      [yearnVaultD3.address, yearnVault3EUR.address],
      [
        {
          swapPool: swapPoolFrax.address,
          curveMetaPool: curveMetapoolD3.address,
          angleRouter: ethers.constants.AddressZero,
        },
        {
          swapPool: swapPoolEurs.address,
          curveMetaPool: curveMetapool3EUR.address,
          angleRouter: angleRouter.address,
        },
      ],
      [token.frax.address, token.agEur.address],
      {
        batchCooldown: 1800,
        mintThreshold: parseEther("20000"),
        redeemThreshold: parseEther("200"),
      }
    )
  ).deployed();

  await aclRegistry.grantRole(ethers.utils.id("DAO"), owner.address);
  await aclRegistry.grantRole(ethers.utils.id("Keeper"), owner.address);

  await contractRegistry.connect(owner).addContract(ethers.utils.id("POP"), token.pop.address, ethers.utils.id("1"));
  await contractRegistry
    .connect(owner)
    .addContract(ethers.utils.id("KeeperIncentive"), keeperIncentive.address, ethers.utils.id("1"));
  await contractRegistry
    .connect(owner)
    .addContract(ethers.utils.id("PopLocker"), popStaking.address, ethers.utils.id("1"));

  await keeperIncentive
    .connect(owner)
    .createIncentive(utils.formatBytes32String("FourXBatchProcessing"), 0, true, false);

  await keeperIncentive
    .connect(owner)
    .createIncentive(utils.formatBytes32String("FourXBatchProcessing"), 0, true, false);

  await keeperIncentive
    .connect(owner)
    .addControllerContract(utils.formatBytes32String("FourXBatchProcessing"), fourXBatchProcessing.address);

  await fourXBatchProcessing.connect(owner).setSlippage(100, 100);

  const fourXStorage = (await ethers.getContractAt(
    "FourXBatchVault",
    await fourXBatchProcessing.batchStorage()
  )) as FourXBatchVault;

  return {
    token,
    yearnVaultD3,
    yearnVault3EUR,
    swapPoolFrax,
    swapPoolEurs,
    curveMetapoolD3,
    curveMetapool3EUR,
    mockBasicIssuanceModule,
    fourXBatchProcessing,
    staking,
    fourXStorage,
    angleRouter,
  };
}

const timeTravel = async (time: number) => {
  await provider.send("evm_increaseTime", [time]);
  await provider.send("evm_mine", []);
};

async function mintERC20(erc20: MockERC20): Promise<void> {
  await erc20.mint(depositor.address, DepositorInitial);
  await erc20.mint(depositor1.address, DepositorInitial);
  await erc20.mint(depositor2.address, DepositorInitial);
  await erc20.mint(depositor3.address, DepositorInitial);
}

const deployAndAssignContracts = async () => {
  [owner, depositor, depositor1, depositor2, depositor3, zapper] = await ethers.getSigners();
  contracts = await deployContracts();
  await mintERC20(contracts.token.usdc);
  await contracts.token.usdc
    .connect(depositor)
    .approve(contracts.fourXBatchProcessing.address, parseEther("100000000"));
};

describe("FourXBatchProcessing", function () {
  beforeEach(async function () {
    await deployAndAssignContracts();
  });
  describe("EOA only flash loan defender", () => {
    it("does not allow interaction from unapproved contracts on depositForMint", async () => {
      const defendedContract = await ethers.getContractFactory("ButterBatchProcessingDefendedHelper");
      const deployed = await defendedContract.deploy(contracts.fourXBatchProcessing.address);
      await expectRevert(deployed.connect(depositor).depositMint(), "Access denied for caller");
    });
    it("does not allow interaction from unapproved contracts on depositForRedeem", async () => {
      const defendedContract = await ethers.getContractFactory("ButterBatchProcessingDefendedHelper");
      const deployed = await defendedContract.deploy(contracts.fourXBatchProcessing.address);
      await expectRevert(deployed.connect(depositor).depositRedeem(), "Access denied for caller");
    });
  });
  context("setters and getters", () => {
    describe("set slippage", async () => {
      const SLIPPAGE = 54;
      let result;
      beforeEach(async () => {
        result = await contracts.fourXBatchProcessing.connect(owner).setSlippage(SLIPPAGE, SLIPPAGE);
      });
      it("sets slippage value with correct permissions", async () => {
        const slippage = await contracts.fourXBatchProcessing.slippage();
        expectValue(slippage.mintBps, SLIPPAGE);
        expectValue(slippage.redeemBps, SLIPPAGE);
      });
      it("emits event", async () => {
        await expectEvent(result, contracts.fourXBatchProcessing, "SlippageUpdated", [
          [100, 100],
          [SLIPPAGE, SLIPPAGE],
        ]);
      });
      it("does not allow unauthenticated address to set redeem slippage", async () => {
        await expectRevert(
          contracts.fourXBatchProcessing.connect(depositor).setSlippage(SLIPPAGE, SLIPPAGE),
          "you dont have the right role"
        );
      });
    });

    describe("setUnderlyingTokens", () => {
      const yToken = "0x55559783f812b3af3ABBf7De64C3CD7Cc7d15555";
      const curveMetaPool = "0x1C6a9783F812b3Af3aBbf7de64c3cD7CC7D1af44";
      const swapPool = "0x890f4e345B1dAED0367A877a1612f86A1f86985f";
      const angleRouter = "0xBB755240596530be0c1DE5DFD77ec6398471561d";
      let result;
      beforeEach(async () => {
        result = await contracts.fourXBatchProcessing.connect(owner).setComponents(
          [yToken],
          [
            {
              swapPool,
              curveMetaPool,
              angleRouter,
            },
          ]
        );
      });

      it("sets curve pool token pairs", async () => {
        expect(await contracts.fourXBatchProcessing.componentDependencies(yToken)).to.deep.eq([
          swapPool,
          curveMetaPool,
          angleRouter,
        ]);
      });
      it("emits an event", async () => {
        await expect(result).to.emit(contracts.fourXBatchProcessing, "ComponentDependenciesUpdated");
      });
      it("should revert if not owner", async function () {
        await expectRevert(
          contracts.fourXBatchProcessing.connect(depositor).setComponents(
            [yToken],
            [
              {
                swapPool,
                curveMetaPool,
                angleRouter,
              },
            ]
          ),
          "you dont have the right role"
        );
      });
    });
    describe("setProcessingThreshold", () => {
      const cooldown = 52414;
      const mintThreshold = parseEther("100");
      const redeemThreshold = parseEther("100");
      let result;
      beforeEach(async () => {
        result = await contracts.fourXBatchProcessing.setProcessingThreshold(cooldown, mintThreshold, redeemThreshold);
      });
      it("sets processing threshold", async () => {
        const processingThreshold = await contracts.fourXBatchProcessing.processingThreshold();
        expect(processingThreshold[0]).to.equal(BigNumber.from("52414"));
        expect(processingThreshold[1]).to.equal(mintThreshold);
        expect(processingThreshold[2]).to.equal(redeemThreshold);
      });
      it("emits an event", async () => {
        expectEvent(result, contracts.fourXBatchProcessing, "ProcessingThresholdUpdated", [
          [BigNumber.from("1800"), parseEther("20000"), parseEther("200")],
          [BigNumber.from("52414"), mintThreshold, redeemThreshold],
        ]);
      });
      it("should revert if not owner", async function () {
        await expectRevert(
          contracts.fourXBatchProcessing
            .connect(depositor)
            .setProcessingThreshold(cooldown, mintThreshold, redeemThreshold),
          "you dont have the right role"
        );
      });
    });
  });
  context("batch generation", () => {
    describe("mint batch generation", () => {
      it("should set a non-zero batchId when initialized", async () => {
        const batchId0 = await contracts.fourXStorage.batchIds(0);
        const adapter = new FourXBatchAdapter(contracts.fourXBatchProcessing);
        const batch = await adapter.getBatch(batchId0);
        expect(
          batch.batchId.match(/0x.+[^0x0000000000000000000000000000000000000000000000000000000000000000]/)?.length
        ).equal(1);
      });
      it("should set batch struct properties when the contract is deployed", async () => {
        const batchId0 = await contracts.fourXStorage.batchIds(0);
        const adapter = new FourXBatchAdapter(contracts.fourXBatchProcessing);
        const batch = await adapter.getBatch(batchId0);
        expect(batch).to.deep.contain({
          batchType: BatchType.Mint,
          claimable: false,
          claimableTokenAddress: contracts.token.setToken.address,
          suppliedTokenAddress: contracts.token.usdc.address,
        });
        expect(batch.claimableTokenBalance).to.equal(BigNumber.from(0));
        expect(batch.unclaimedShares).to.equal(BigNumber.from(0));
        expect(batch.suppliedTokenBalance).to.equal(BigNumber.from(0));
      });
    });
    describe("redeem batch generation", () => {
      it("should set a non-zero batchId when initialized", async () => {
        const batchId1 = await contracts.fourXStorage.batchIds(1);
        const adapter = new FourXBatchAdapter(contracts.fourXBatchProcessing);
        const batch = await adapter.getBatch(batchId1);
        expect(
          batch.batchId.match(/0x.+[^0x0000000000000000000000000000000000000000000000000000000000000000]/)?.length
        ).equal(1);
      });

      it("should set batch struct properties when the contract is deployed", async () => {
        const batchId1 = await contracts.fourXStorage.batchIds(1);
        const adapter = new FourXBatchAdapter(contracts.fourXBatchProcessing);
        const batch = await adapter.getBatch(batchId1);
        expect(batch).to.deep.contain({
          batchType: BatchType.Redeem,
          claimable: false,
          claimableTokenAddress: contracts.token.usdc.address,
          suppliedTokenAddress: contracts.token.setToken.address,
        });
        expect(batch.claimableTokenBalance).to.equal(BigNumber.from(0));
        expect(batch.unclaimedShares).to.equal(BigNumber.from(0));
        expect(batch.suppliedTokenBalance).to.equal(BigNumber.from(0));
      });
    });
  });
  describe("minting", function () {
    context("depositing", function () {
      describe("batch struct", () => {
        const deposit = async (amount?: number) => {
          await contracts.fourXBatchProcessing
            .connect(depositor)
            .depositForMint(parseEther(amount ? amount.toString() : "10"), depositor.address);
        };

        const subject = async (batchId) => {
          const adapter = new FourXBatchAdapter(contracts.fourXBatchProcessing);
          const batch = await adapter.getBatch(batchId);
          return batch;
        };

        it("increments suppliedTokenBalance and unclaimedShares with deposit", async () => {
          const batchId = await contracts.fourXBatchProcessing.currentMintBatchId();
          await deposit(10);
          const batch = await subject(batchId);
          expect(batch.suppliedTokenBalance).to.equal(parseEther("10"));
          expect(batch.unclaimedShares).to.equal(parseEther("10"));
        });
        it("depositing does not make a batch claimable", async () => {
          const batchId = await contracts.fourXBatchProcessing.currentMintBatchId();
          await deposit(10);
          expect(await subject(batchId)).to.deep.contain({
            claimable: false,
          });
        });
        it("increments suppliedTokenBalance and unclaimedShares when multiple deposits are made", async () => {
          const batchId = await contracts.fourXBatchProcessing.currentMintBatchId();
          await deposit(); // 10
          await deposit(); // 10
          await deposit(); // 10
          const batch = await subject(batchId);
          expect(batch.claimableTokenBalance).to.equal(parseEther("0"));
          expect(batch.suppliedTokenBalance).to.equal(parseEther("30"));
          expect(batch.unclaimedShares).to.equal(parseEther("30"));
        });
        it.only("increments claimableTokenBalance when batch is minted", async () => {
          const batchId = await contracts.fourXBatchProcessing.currentMintBatchId();
          await deposit(); // 10
          await timeTravel(1 * DAY); // wait enough time to mint batch
          await contracts.fourXBatchProcessing.batchMint();
          const batchButterOwned = await contracts.token.setToken.balanceOf(
            await contracts.fourXBatchProcessing.batchStorage()
          );
          const batch = await subject(batchId);
          expect(batch.claimableTokenBalance).to.equal(batchButterOwned);
          expect(batch.suppliedTokenBalance).to.equal(parseEther("10"));
          expect(batch.unclaimedShares).to.equal(parseEther("10"));
        });
        it("sets batch to claimable when batch is minted", async () => {
          const batchId = await contracts.fourXBatchProcessing.currentMintBatchId();
          await deposit(); // 10
          await timeTravel(1 * DAY); // wait enough time to mint batch
          await contracts.fourXBatchProcessing.batchMint();
          const batch = await subject(batchId);
          expect(batch.claimable).to.equal(true);
        });
        it("decrements unclaimedShares and claimable when claim is made", async () => {
          const batchId = await contracts.fourXBatchProcessing.currentMintBatchId();
          await deposit(); // 10
          await timeTravel(1 * DAY); // wait enough time to mint batch
          await contracts.fourXBatchProcessing.batchMint();
          await contracts.fourXBatchProcessing.connect(depositor).claim(batchId, depositor.address);
          const batch = await subject(batchId);
          expect(batch.claimable).to.equal(true);
          expect(batch.claimableTokenBalance).to.equal(parseEther("0"));
          expect(batch.unclaimedShares).to.equal(parseEther("0"));
        });
      });

      it("deposits usdc in the current mintBatch", async function () {
        const result = await contracts.fourXBatchProcessing
          .connect(depositor)
          .depositForMint(parseEther("10000"), depositor.address);
        await expect(result)
          .to.emit(contracts.fourXBatchProcessing, "Deposit")
          .withArgs(depositor.address, parseEther("10000"));
        expect(await contracts.token.usdc.balanceOf(await contracts.fourXBatchProcessing.batchStorage())).to.equal(
          parseEther("10000")
        );
        const currentMintBatchId = await contracts.fourXBatchProcessing.currentMintBatchId();
        const currentBatch = await contracts.fourXBatchProcessing.getBatch(currentMintBatchId);
        expect(currentBatch.sourceTokenBalance).to.equal(parseEther("10000"));
        expect(currentBatch.unclaimedShares).to.equal(parseEther("10000"));
      });
      it("adds the mintBatch to the users batches", async function () {
        await contracts.token.usdc
          .connect(depositor)
          .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
        await contracts.fourXBatchProcessing.connect(depositor).depositForMint(parseEther("10000"), depositor.address);

        const currentMintBatchId = await contracts.fourXBatchProcessing.currentMintBatchId();
        expect(await contracts.fourXStorage.accountBatches(depositor.address, 0)).to.equal(currentMintBatchId);
      });
      it("allows multiple deposits", async function () {
        await contracts.token.usdc
          .connect(depositor)
          .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
        await contracts.fourXBatchProcessing.connect(depositor).depositForMint(parseEther("10000"), depositor.address);
        await contracts.token.usdc
          .connect(depositor1)
          .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
        await contracts.fourXBatchProcessing
          .connect(depositor1)
          .depositForMint(parseEther("10000"), depositor1.address);
        await contracts.token.usdc
          .connect(depositor2)
          .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
        await contracts.fourXBatchProcessing.connect(depositor2).depositForMint(parseEther("5000"), depositor2.address);
        await contracts.fourXBatchProcessing.connect(depositor2).depositForMint(parseEther("5000"), depositor2.address);
        const currentMintBatchId = await contracts.fourXBatchProcessing.currentMintBatchId();
        const currentBatch = await contracts.fourXBatchProcessing.getBatch(currentMintBatchId);
        expect(currentBatch.sourceTokenBalance).to.equal(parseEther("30000"));
        expect(currentBatch.unclaimedShares).to.equal(parseEther("30000"));
        expect(await contracts.fourXStorage.accountBatches(depositor.address, 0)).to.equal(currentMintBatchId);
        expect(await contracts.fourXStorage.accountBatches(depositor1.address, 0)).to.equal(currentMintBatchId);
        expect(await contracts.fourXStorage.accountBatches(depositor2.address, 0)).to.equal(currentMintBatchId);
      });
    });
    context("batch minting", function () {
      context("reverts", function () {
        it("reverts when minting too early", async function () {
          await contracts.token.usdc
            .connect(depositor)
            .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
          await contracts.fourXBatchProcessing
            .connect(depositor)
            .depositForMint(parseEther("10000"), depositor.address);
          await expect(contracts.fourXBatchProcessing.connect(owner).batchMint()).to.be.revertedWith(
            "can not execute batch mint yet"
          );
        });
        it("reverts when called by someone other the keeper", async function () {
          await contracts.token.usdc
            .connect(depositor)
            .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
          await contracts.fourXBatchProcessing
            .connect(depositor)
            .depositForMint(parseEther("10000"), depositor.address);
          await provider.send("evm_increaseTime", [1800]);

          await expect(contracts.fourXBatchProcessing.connect(depositor).batchMint()).to.be.revertedWith(
            "you dont have the right role"
          );
        });
        it("reverts when slippage is too high", async () => {
          await contracts.fourXBatchProcessing.connect(owner).setSlippage(0, 0);
          await contracts.token.usdc
            .connect(depositor)
            .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
          await contracts.fourXBatchProcessing
            .connect(depositor)
            .depositForMint(parseEther("10000"), depositor.address);

          await timeTravel(1 * DAYS);

          await expect(contracts.fourXBatchProcessing.connect(owner).batchMint()).to.be.revertedWith(
            "slippage too high"
          );
        });
      });
      context("success", function () {
        it("batch mints", async function () {
          const batchId = await contracts.fourXBatchProcessing.currentMintBatchId();
          await contracts.token.usdc
            .connect(depositor)
            .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
          await contracts.fourXBatchProcessing
            .connect(depositor)
            .depositForMint(parseEther("10000"), depositor.address);
          await provider.send("evm_increaseTime", [1800]);
          const result = await contracts.fourXBatchProcessing.connect(owner).batchMint();
          await expect(result)
            .to.emit(contracts.fourXBatchProcessing, "BatchMinted")
            .withArgs(batchId, parseEther("10000"), parseEther("96.990291262135922398"));
          expect(
            await contracts.token.setToken.balanceOf(await contracts.fourXBatchProcessing.batchStorage())
          ).to.equal(parseEther("96.990291262135922398"));
        });
        it("mints early when mintThreshold is met", async function () {
          await contracts.token.usdc
            .connect(depositor)
            .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
          await contracts.fourXBatchProcessing
            .connect(depositor)
            .depositForMint(parseEther("10000"), depositor.address);
          await contracts.token.usdc
            .connect(depositor1)
            .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
          await contracts.fourXBatchProcessing
            .connect(depositor1)
            .depositForMint(parseEther("10000"), depositor1.address);
          await expect(contracts.fourXBatchProcessing.connect(owner).batchMint()).to.emit(
            contracts.fourXBatchProcessing,
            "BatchMinted"
          );
        });
        it("advances to the next batch", async function () {
          await contracts.token.usdc
            .connect(depositor)
            .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
          await contracts.fourXBatchProcessing
            .connect(depositor)
            .depositForMint(parseEther("10000"), depositor.address);
          await provider.send("evm_increaseTime", [1800]);

          const previousMintBatchId = await contracts.fourXBatchProcessing.currentMintBatchId();
          await contracts.fourXBatchProcessing.batchMint();

          const previousBatch = await contracts.fourXBatchProcessing.getBatch(previousMintBatchId);
          expect(previousBatch.claimable).to.equal(true);

          const currentMintBatchId = await contracts.fourXBatchProcessing.currentMintBatchId();
          expect(currentMintBatchId).to.not.equal(previousMintBatchId);
        });
      });
    });
    context("claiming", function () {
      beforeEach(async function () {
        await contracts.token.usdc
          .connect(depositor)
          .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
        await contracts.fourXBatchProcessing.connect(depositor).depositForMint(parseEther("10000"), depositor.address);
        await contracts.token.usdc
          .connect(depositor1)
          .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
        await contracts.fourXBatchProcessing
          .connect(depositor1)
          .depositForMint(parseEther("10000"), depositor1.address);
        await contracts.token.usdc
          .connect(depositor2)
          .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
        await contracts.fourXBatchProcessing
          .connect(depositor2)
          .depositForMint(parseEther("10000"), depositor2.address);
        await contracts.token.usdc
          .connect(depositor3)
          .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
        await contracts.fourXBatchProcessing
          .connect(depositor3)
          .depositForMint(parseEther("10000"), depositor3.address);
      });
      it("reverts when batch is not yet claimable", async function () {
        const batchId = await contracts.fourXStorage.accountBatches(depositor.address, 0);
        await expect(
          contracts.fourXBatchProcessing.connect(depositor).claim(batchId, depositor.address)
        ).to.be.revertedWith("not yet claimable");
      });
      it("claims batch successfully", async function () {
        await provider.send("evm_increaseTime", [1800]);
        await provider.send("evm_mine", []);
        await contracts.fourXBatchProcessing.connect(owner).batchMint();
        const batchId = await contracts.fourXStorage.accountBatches(depositor.address, 0);
        await expect(await contracts.fourXBatchProcessing.connect(depositor).claim(batchId, depositor.address))
          .to.emit(contracts.fourXBatchProcessing, "Claimed")
          .withArgs(depositor.address, BatchType.Mint, parseEther("10000"), parseEther("96.990291262135922397"));
        expect(await contracts.token.setToken.balanceOf(depositor.address)).to.equal(
          parseEther("96.990291262135922397")
        );
        const batch = await contracts.fourXBatchProcessing.getBatch(batchId);
        expect(batch.unclaimedShares).to.equal(parseEther("30000"));
        expect(batch.targetTokenBalance).to.equal(parseEther("290.970873786407767194"));
      });
      describe("claim and stake", () => {
        it("reverts when batch is not yet claimable", async function () {
          const batchId = await contracts.fourXStorage.accountBatches(depositor.address, 0);
          await expect(contracts.fourXBatchProcessing.connect(depositor).claimAndStake(batchId)).to.be.revertedWith(
            "not yet claimable"
          );
        });
        it("reverts when the batchType is Redeem", async function () {
          //Prepare claimable redeem batch
          await contracts.curveMetapoolD3.mint(contracts.yearnVaultD3.address, parseEther("20000"));
          await contracts.curveMetapool3EUR.mint(contracts.yearnVault3EUR.address, parseEther("20000"));
          await contracts.yearnVaultD3.mint(contracts.mockBasicIssuanceModule.address, parseEther("20000"));
          await contracts.yearnVault3EUR.mint(contracts.mockBasicIssuanceModule.address, parseEther("20000"));
          await contracts.token.setToken.mint(depositor.address, parseEther("10"));
          await contracts.token.setToken
            .connect(depositor)
            .approve(contracts.fourXBatchProcessing.address, parseEther("10"));
          await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("10"));
          await provider.send("evm_increaseTime", [1800]);
          const batchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();

          await contracts.fourXBatchProcessing.connect(owner).batchRedeem();

          //Actual Test
          await expect(contracts.fourXBatchProcessing.connect(depositor).claimAndStake(batchId)).to.be.revertedWith(
            "ERC20: transfer amount exceeds balance"
          );
        });
        it("claims and stakes batch successully", async function () {
          await provider.send("evm_increaseTime", [1800]);
          await provider.send("evm_mine", []);
          const batchId = await contracts.fourXBatchProcessing.currentMintBatchId();
          await contracts.fourXBatchProcessing.connect(owner).batchMint();

          await expect(await contracts.fourXBatchProcessing.connect(depositor).claimAndStake(batchId))
            .to.emit(contracts.fourXBatchProcessing, "Claimed")
            .withArgs(depositor.address, BatchType.Mint, parseEther("10000"), parseEther("96.990291262135922397"));
          expect(await contracts.staking.balanceOf(depositor.address)).to.equal(parseEther("96.990291262135922397"));
        });
      });
    });
  });

  describe("redeeming", function () {
    beforeEach(async function () {
      await contracts.token.setToken.mint(depositor.address, parseEther("100"));
      await contracts.token.setToken.mint(depositor1.address, parseEther("100"));
      await contracts.token.setToken.mint(depositor2.address, parseEther("100"));
      await contracts.token.setToken.mint(depositor3.address, parseEther("100"));
      await contracts.yearnVaultD3.mint(contracts.mockBasicIssuanceModule.address, parseEther("20000"));
      await contracts.yearnVault3EUR.mint(contracts.mockBasicIssuanceModule.address, parseEther("20000"));
      await contracts.token.setToken
        .connect(depositor)
        .increaseAllowance(contracts.fourXBatchProcessing.address, parseEther("10000000000"));
    });
    context("depositing", function () {
      describe("batch struct", () => {
        const deposit = async (amount?: number) => {
          await contracts.fourXBatchProcessing
            .connect(depositor)
            .depositForRedeem(parseEther(amount ? amount.toString() : "10"));
        };

        const subject = async (batchId) => {
          const adapter = new FourXBatchAdapter(contracts.fourXBatchProcessing);
          const batch = await adapter.getBatch(batchId);
          return batch;
        };

        it("increments suppliedTokenBalance and unclaimedShares when a redeem deposit is made", async () => {
          const batchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
          await deposit(10);
          const batch = await subject(batchId);
          expect(batch.suppliedTokenBalance).to.equal(parseEther("10"));
          expect(batch.claimable).to.equal(false);
          expect(batch.unclaimedShares).to.equal(parseEther("10"));
        });
        it("increments suppliedTokenBalance and unclaimedShares when multiple deposits are made", async () => {
          const batchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
          await deposit(); // 10
          await deposit(); // 10
          await deposit(); // 10
          const batch = await subject(batchId);
          expect(batch.claimableTokenBalance).to.equal(parseEther("0"));
          expect(batch.suppliedTokenBalance).to.equal(parseEther("30"));
          expect(batch.claimable).to.equal(false);
          expect(batch.unclaimedShares).to.equal(parseEther("30"));
        });
        it("updates struct when batch is minted", async () => {
          const batchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
          await deposit(); // 10
          await timeTravel(1 * DAY); // wait enough time to redeem batch
          await contracts.fourXBatchProcessing.batchRedeem();

          const batch = await subject(batchId);
          expect(batch.suppliedTokenBalance).to.equal(parseEther("10"));
          expect(batch.claimable).to.equal(true);
          expect(batch.unclaimedShares).to.equal(parseEther("10"));
        });
        it("decrements unclaimedShares and claimable when claim is made", async () => {
          const batchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
          await deposit(); // 10
          await timeTravel(1 * DAY); // wait enough time to redeem batch
          await contracts.fourXBatchProcessing.batchRedeem();
          await contracts.fourXBatchProcessing.connect(depositor).claim(batchId, depositor.address);

          const batch = await subject(batchId);
          expect(batch.claimableTokenBalance).to.equal(parseEther("0"));
          expect(batch.claimable).to.equal(true);
          expect(batch.unclaimedShares).to.equal(parseEther("0"));
        });
      });
      it("deposits setToken in the current redeemBatch", async function () {
        await contracts.token.setToken
          .connect(depositor)
          .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
        const result = await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("100"));
        await expect(result)
          .to.emit(contracts.fourXBatchProcessing, "Deposit")
          .withArgs(depositor.address, parseEther("100"));
        expect(await contracts.token.setToken.balanceOf(await contracts.fourXBatchProcessing.batchStorage())).to.equal(
          parseEther("100")
        );
        const currentRedeemBatchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
        const currentBatch = await contracts.fourXBatchProcessing.getBatch(currentRedeemBatchId);
        expect(currentBatch.sourceTokenBalance).to.equal(parseEther("100"));
        expect(currentBatch.unclaimedShares).to.equal(parseEther("100"));
      });
      it("adds the redeemBatch to the users batches", async function () {
        await contracts.token.setToken
          .connect(depositor)
          .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
        await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("100"));

        const currentRedeemBatchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
        expect(await contracts.fourXStorage.accountBatches(depositor.address, 0)).to.equal(currentRedeemBatchId);
      });
      it("allows multiple deposits", async function () {
        await contracts.token.setToken
          .connect(depositor)
          .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
        await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("100"));
        await contracts.token.setToken
          .connect(depositor1)
          .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
        await contracts.fourXBatchProcessing.connect(depositor1).depositForRedeem(parseEther("100"));
        await contracts.token.setToken
          .connect(depositor2)
          .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
        await contracts.fourXBatchProcessing.connect(depositor2).depositForRedeem(parseEther("50"));
        await contracts.fourXBatchProcessing.connect(depositor2).depositForRedeem(parseEther("50"));
        const currentRedeemBatchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
        const currentBatch = await contracts.fourXStorage.getBatch(currentRedeemBatchId);
        expect(currentBatch.sourceTokenBalance).to.equal(parseEther("300"));
        expect(currentBatch.unclaimedShares).to.equal(parseEther("300"));
        expect(await contracts.fourXStorage.accountBatches(depositor.address, 0)).to.equal(currentRedeemBatchId);
        expect(await contracts.fourXStorage.accountBatches(depositor1.address, 0)).to.equal(currentRedeemBatchId);
        expect(await contracts.fourXStorage.accountBatches(depositor2.address, 0)).to.equal(currentRedeemBatchId);
      });
    });
    context("batch redeeming", function () {
      beforeEach(async function () {
        await contracts.token.setToken.mint(depositor.address, parseEther("100"));
        await contracts.token.setToken.mint(depositor1.address, parseEther("100"));
        await contracts.token.setToken.mint(depositor2.address, parseEther("100"));
        await contracts.token.setToken.mint(depositor3.address, parseEther("100"));
        await contracts.curveMetapoolD3.mint(contracts.yearnVaultD3.address, parseEther("20000"));
        await contracts.curveMetapoolD3.mint(contracts.yearnVault3EUR.address, parseEther("20000"));
      });

      context("reverts", function () {
        it("reverts when redeeming too early", async function () {
          await contracts.token.setToken
            .connect(depositor)
            .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
          await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("100"));
          await expect(contracts.fourXBatchProcessing.connect(owner).batchRedeem()).to.be.revertedWith(
            "can not execute batch redeem yet"
          );
        });
        it("reverts when slippage too high", async function () {
          await contracts.fourXBatchProcessing.connect(owner).setSlippage(0, 0);

          await contracts.token.setToken
            .connect(depositor)
            .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
          await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("100"));

          await timeTravel(1 * DAYS);

          await expect(contracts.fourXBatchProcessing.connect(owner).batchRedeem()).to.be.revertedWith(
            "slippage too high"
          );
        });
        it("reverts when called by someone other the keeper", async function () {
          await contracts.token.setToken
            .connect(depositor)
            .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
          await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("100"));
          await provider.send("evm_increaseTime", [1800]);

          await expect(contracts.fourXBatchProcessing.connect(depositor).batchRedeem()).to.be.revertedWith(
            "you dont have the right role"
          );
        });
      });
      context("success", function () {
        it("batch redeems", async function () {
          const batchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();

          await contracts.token.setToken
            .connect(depositor)
            .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
          await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("100"));
          await provider.send("evm_increaseTime", [1800]);

          const result = await contracts.fourXBatchProcessing.connect(owner).batchRedeem();
          await expect(result)
            .to.emit(contracts.fourXBatchProcessing, "BatchRedeemed")
            .withArgs(batchId, parseEther("100"), parseEther("4995"));
          expect(await contracts.token.usdc.balanceOf(contracts.fourXStorage.address)).to.equal(parseEther("4995"));
        });
        it("redeems early when redeemThreshold is met", async function () {
          await contracts.token.setToken
            .connect(depositor)
            .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
          await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("100"));
          await contracts.token.setToken
            .connect(depositor1)
            .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
          await contracts.fourXBatchProcessing.connect(depositor1).depositForRedeem(parseEther("100"));
          const result = await contracts.fourXBatchProcessing.connect(owner).batchRedeem();
          await expect(result).to.emit(contracts.fourXBatchProcessing, "BatchRedeemed");
        });
        it("advances to the next batch", async function () {
          await contracts.token.setToken
            .connect(depositor)
            .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
          await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("100"));
          await provider.send("evm_increaseTime", [1800]);

          const previousRedeemBatchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
          await contracts.fourXBatchProcessing.batchRedeem();

          const previousBatch = await contracts.fourXBatchProcessing.getBatch(previousRedeemBatchId);
          expect(previousBatch.claimable).to.equal(true);

          const currentRedeemBatchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
          expect(currentRedeemBatchId).to.not.equal(previousRedeemBatchId);
        });
      });
    });
    context("claiming", function () {
      beforeEach(async function () {
        await contracts.token.setToken
          .connect(depositor)
          .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
        await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("100"));
        await contracts.token.setToken
          .connect(depositor1)
          .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
        await contracts.fourXBatchProcessing.connect(depositor1).depositForRedeem(parseEther("100"));
        await contracts.token.setToken
          .connect(depositor2)
          .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
        await contracts.fourXBatchProcessing.connect(depositor2).depositForRedeem(parseEther("100"));
        await contracts.token.setToken
          .connect(depositor3)
          .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
        await contracts.fourXBatchProcessing.connect(depositor3).depositForRedeem(parseEther("100"));
        await contracts.curveMetapoolD3.mint(contracts.yearnVaultD3.address, parseEther("20000"));
        await contracts.curveMetapool3EUR.mint(contracts.yearnVault3EUR.address, parseEther("20000"));
      });
      it("reverts when batch is not yet claimable", async function () {
        const batchId = await contracts.fourXStorage.accountBatches(depositor.address, 0);
        await expect(
          contracts.fourXBatchProcessing.connect(depositor).claim(batchId, depositor.address)
        ).to.be.revertedWith("not yet claimable");
      });
      it("claim batch successfully", async function () {
        await provider.send("evm_increaseTime", [1800]);
        const batchId = await contracts.fourXStorage.accountBatches(depositor.address, 0);
        await contracts.fourXBatchProcessing.connect(owner).batchRedeem();

        await expect(await contracts.fourXBatchProcessing.connect(depositor).claim(batchId, depositor.address))
          .to.emit(contracts.fourXBatchProcessing, "Claimed")
          .withArgs(depositor.address, BatchType.Redeem, parseEther("100"), parseEther("10289.7"));
        expect(await contracts.token.usdc.balanceOf(depositor.address)).to.equal(parseEther("110289.7"));
        const batch = await contracts.fourXBatchProcessing.getBatch(batchId);
        expect(batch.unclaimedShares).to.equal(parseEther("300"));
      });
    });
  });
  context("withdrawing from batch", function () {
    describe("batch struct", () => {
      const withdraw = async (batchId: string, amount?: BigNumber) => {
        return contracts.fourXBatchProcessing
          .connect(depositor)
          ["withdrawFromBatch(bytes32,uint256,address)"](
            batchId,
            amount ? amount : parseEther("10"),
            depositor.address
          );
      };
      const subject = async (batchId) => {
        const adapter = new FourXBatchAdapter(contracts.fourXBatchProcessing);
        const batch = await adapter.getBatch(batchId);
        return batch;
      };
      context("redeem batch withdrawal", () => {
        beforeEach(async function () {
          await contracts.token.setToken.mint(depositor.address, parseEther("100"));
          await contracts.token.setToken.mint(depositor1.address, parseEther("100"));
          await contracts.token.setToken.mint(depositor2.address, parseEther("100"));
          await contracts.token.setToken.mint(depositor3.address, parseEther("100"));
          await contracts.yearnVaultD3.mint(contracts.mockBasicIssuanceModule.address, parseEther("20000"));
          await contracts.yearnVault3EUR.mint(contracts.mockBasicIssuanceModule.address, parseEther("20000"));
          await contracts.curveMetapoolD3.mint(contracts.yearnVaultD3.address, parseEther("20000"));
          await contracts.curveMetapool3EUR.mint(contracts.yearnVault3EUR.address, parseEther("20000"));
          await contracts.token.setToken
            .connect(depositor)
            .increaseAllowance(contracts.fourXBatchProcessing.address, parseEther("10000000000"));
          await contracts.token.setToken.connect(owner).mint(depositor.address, parseEther("100"));
          await contracts.token.setToken
            .connect(depositor)
            .approve(contracts.fourXBatchProcessing.address, parseEther("100"));
          await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("100"));
        });

        it("prevents stealing funds", async () => {
          const batchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();

          await expectRevert(
            contracts.fourXBatchProcessing
              .connect(depositor)
              ["withdrawFromBatch(bytes32,uint256,address,address)"](
                batchId,
                parseEther("10"),
                depositor.address,
                owner.address
              ),
            "won't send"
          );
        });

        it("decrements suppliedTokenBalance and unclaimedShares when a withdrawal is made", async () => {
          const batchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
          const batchBefore = await subject(batchId);
          await withdraw(batchId);
          const batchAfter = await subject(batchId);
          expect(batchAfter.suppliedTokenBalance.lt(batchBefore.suppliedTokenBalance)).to.be.true;
          expect(batchAfter.unclaimedShares.lt(batchBefore.unclaimedShares)).to.be.true;
        });
        it("decrements suppliedTokenBalance and unclaimedShares when multiple deposits are made", async () => {
          const batchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
          const batchBefore = await subject(batchId);
          await withdraw(batchId, parseEther("10"));
          await withdraw(batchId, parseEther("10"));
          await withdraw(batchId, parseEther("10"));
          const batchAfter = await subject(batchId);
          expect(batchBefore.suppliedTokenBalance.sub(parseEther("30"))).to.equal(batchAfter.suppliedTokenBalance);
          expect(batchBefore.unclaimedShares.sub(parseEther("30"))).to.equal(batchAfter.unclaimedShares);
        });
        it("transfers set token to depositor after withdraw", async function () {
          const batchId = await contracts.fourXStorage.accountBatches(depositor.address, 0);
          await contracts.fourXBatchProcessing
            .connect(depositor)
            ["withdrawFromBatch(bytes32,uint256,address)"](batchId, parseEther("100"), depositor.address);
          expect(await contracts.token.setToken.balanceOf(depositor.address)).to.equal(parseEther("200"));
        });
        it("reverts when the batch was already redeemed", async function () {
          const batchId = await contracts.fourXStorage.accountBatches(depositor.address, 0);
          await timeTravel(1 * DAY);
          await contracts.fourXBatchProcessing.batchRedeem();
          await expect(withdraw(batchId)).to.be.revertedWith("already processed");
        });
      });
      context("mint batch withdrawal", () => {
        beforeEach(async function () {
          await contracts.fourXBatchProcessing.connect(depositor).depositForMint(parseEther("100"), depositor.address);
        });
        it("decrements suppliedTokenBalance and unclaimedShares when a withdrawal is made", async () => {
          const batchId = await contracts.fourXBatchProcessing.currentMintBatchId();
          const batchBefore = await subject(batchId);
          await withdraw(batchId, parseEther("10"));
          const batchAfter = await subject(batchId);
          expect(batchAfter.suppliedTokenBalance.lt(batchBefore.suppliedTokenBalance)).to.be.true;
          expect(batchAfter.unclaimedShares.lt(batchBefore.unclaimedShares)).to.be.true;
        });
        it("decrements suppliedTokenBalance and unclaimedShares when multiple deposits are made", async () => {
          const batchId = await contracts.fourXBatchProcessing.currentMintBatchId();
          const batchBefore = await subject(batchId);
          await withdraw(batchId, parseEther("10"));
          await withdraw(batchId, parseEther("10"));
          await withdraw(batchId, parseEther("10"));
          const batchAfter = await subject(batchId);
          expect(batchBefore.suppliedTokenBalance.sub(parseEther("30"))).to.equal(batchAfter.suppliedTokenBalance);
          expect(batchBefore.unclaimedShares.sub(parseEther("30"))).to.equal(batchAfter.unclaimedShares);
        });
        it("emits an event when withdrawn", async function () {
          const batchId = await contracts.fourXStorage.accountBatches(depositor.address, 0);
          await expect(await withdraw(batchId, parseEther("100")))
            .to.emit(contracts.fourXBatchProcessing, "WithdrawnFromBatch")
            .withArgs(batchId, parseEther("100"), depositor.address);
        });
        it("transfers usdc to depositor after withdraw", async function () {
          const batchId = await contracts.fourXStorage.accountBatches(depositor.address, 0);
          const balanceBefore = await contracts.token.usdc.balanceOf(depositor.address);
          await contracts.fourXBatchProcessing
            .connect(depositor)
            ["withdrawFromBatch(bytes32,uint256,address)"](batchId, parseEther("100"), depositor.address);
          const balanceAfter = await contracts.token.usdc.balanceOf(depositor.address);
          expect(balanceAfter.sub(balanceBefore)).to.equal(parseEther("100"));
        });
        it("reverts when the batch was already minted", async function () {
          const batchId = await contracts.fourXStorage.accountBatches(depositor.address, 0);
          await timeTravel(1 * DAY);
          await contracts.fourXBatchProcessing.batchMint();
          await expect(withdraw(batchId)).to.be.revertedWith("already processed");
        });
      });
    });
  });
  context("move unclaimed deposits into current batch", function () {
    context("error", function () {
      it("reverts when length of batchIds and shares are not matching", async function () {
        await expect(
          contracts.fourXBatchProcessing
            .connect(depositor)
            .moveUnclaimedIntoCurrentBatch(
              new Array(2).fill("0xa15f699e141c27ed0edace41ff8fa7b836e3ddb658b25c811a1674e9c7a75c5c"),
              new Array(3).fill(parseEther("10")),
              true
            )
        ).to.be.revertedWith("array lengths must match");
      });
      it("reverts if given a batch that is not from the correct batchType", async function () {
        //Prepare Test
        await contracts.yearnVaultD3.mint(contracts.mockBasicIssuanceModule.address, parseEther("20000"));
        await contracts.yearnVault3EUR.mint(contracts.mockBasicIssuanceModule.address, parseEther("20000"));
        await contracts.curveMetapoolD3.mint(contracts.yearnVaultD3.address, parseEther("20000"));
        await contracts.curveMetapool3EUR.mint(contracts.yearnVault3EUR.address, parseEther("20000"));
        await contracts.token.setToken.mint(depositor.address, parseEther("10"));
        await contracts.token.setToken
          .connect(depositor)
          .approve(contracts.fourXBatchProcessing.address, parseEther("10"));
        await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("10"));

        await provider.send("evm_increaseTime", [1800]);
        await provider.send("evm_mine", []);
        await contracts.fourXBatchProcessing.connect(owner).batchRedeem();

        //Actual Test
        const batchId = await contracts.fourXStorage.accountBatches(depositor.address, 0);
        await expect(
          contracts.fourXBatchProcessing.moveUnclaimedIntoCurrentBatch([batchId], [parseEther("10000")], false)
        ).to.be.revertedWith("incorrect batchType");
      });
      it("reverts on an unclaimable batch", async function () {
        await contracts.token.usdc
          .connect(depositor)
          .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
        await contracts.fourXBatchProcessing.connect(depositor).depositForMint(parseEther("10000"), depositor.address);
        const batchId = await contracts.fourXStorage.accountBatches(depositor.address, 0);
        await expect(
          contracts.fourXBatchProcessing.moveUnclaimedIntoCurrentBatch([batchId], [parseEther("10000")], false)
        ).to.be.revertedWith("not yet claimable");
      });
      it("reverts if the user has insufficient funds", async function () {
        await contracts.token.usdc
          .connect(depositor)
          .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
        await contracts.fourXBatchProcessing.connect(depositor).depositForMint(parseEther("10000"), depositor.address);
        const batchId = await contracts.fourXStorage.accountBatches(depositor.address, 0);
        await provider.send("evm_increaseTime", [2500]);
        await provider.send("evm_mine", []);
        await contracts.fourXBatchProcessing.batchMint();
        await expect(
          contracts.fourXBatchProcessing.moveUnclaimedIntoCurrentBatch([batchId], [parseEther("20000")], false)
        ).to.be.revertedWith("insufficient balance");
      });
    });
    context("success", function () {
      it("moves butter into current redeemBatch", async function () {
        await contracts.token.usdc
          .connect(depositor)
          .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
        await contracts.fourXBatchProcessing.connect(depositor).depositForMint(parseEther("10000"), depositor.address);
        const batchId = await contracts.fourXStorage.accountBatches(depositor.address, 0);
        await provider.send("evm_increaseTime", [1800]);
        await provider.send("evm_mine", []);
        await contracts.fourXBatchProcessing.connect(owner).batchMint();
        const mintedButter = await contracts.token.setToken.balanceOf(contracts.fourXStorage.address);
        expect(
          await contracts.fourXBatchProcessing
            .connect(depositor)
            .moveUnclaimedIntoCurrentBatch([batchId], [parseEther("10000")], false)
        )
          .to.emit(contracts.fourXBatchProcessing, "DepositedUnclaimedSetTokenForRedeem")
          .withArgs(mintedButter, depositor.address);
        const currentRedeemBatchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
        const redeemBatch = await contracts.fourXBatchProcessing.getBatch(currentRedeemBatchId);
        expect(redeemBatch.sourceTokenBalance).to.be.equal(mintedButter);
      });
      it("moves usdc into current mintBatch", async function () {
        await contracts.yearnVaultD3.mint(contracts.mockBasicIssuanceModule.address, parseEther("20000"));
        await contracts.yearnVault3EUR.mint(contracts.mockBasicIssuanceModule.address, parseEther("20000"));
        await contracts.curveMetapoolD3.mint(contracts.yearnVaultD3.address, parseEther("20000"));
        await contracts.curveMetapool3EUR.mint(contracts.yearnVault3EUR.address, parseEther("20000"));
        await contracts.token.setToken.mint(depositor.address, parseEther("10"));
        await contracts.token.setToken
          .connect(depositor)
          .approve(contracts.fourXBatchProcessing.address, parseEther("10"));
        await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("10"));

        await provider.send("evm_increaseTime", [1800]);
        await provider.send("evm_mine", []);
        await contracts.fourXBatchProcessing.connect(owner).batchRedeem();

        //Actual Test
        const batchId = await contracts.fourXStorage.accountBatches(depositor.address, 0);
        const redeemedUsdc = await contracts.token.usdc.balanceOf(contracts.fourXStorage.address);

        expect(
          await contracts.fourXBatchProcessing
            .connect(depositor)
            .moveUnclaimedIntoCurrentBatch([batchId], [parseEther("10")], true)
        )
          .to.emit(contracts.fourXBatchProcessing, "DepositedUnclaimedSetTokenForRedeem")
          .withArgs(redeemedUsdc, depositor.address);
        const currentMintBatchId = await contracts.fourXBatchProcessing.currentMintBatchId();
        const mintBatch = await contracts.fourXStorage.batches(currentMintBatchId);
        expect(mintBatch.sourceTokenBalance).to.be.equal(redeemedUsdc);
      });
      it("moves only parts of the funds in a batch", async function () {
        await contracts.token.usdc
          .connect(depositor)
          .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
        await contracts.fourXBatchProcessing.connect(depositor).depositForMint(parseEther("10000"), depositor.address);
        const batchId = await contracts.fourXStorage.accountBatches(depositor.address, 0);
        await provider.send("evm_increaseTime", [1800]);
        await provider.send("evm_mine", []);
        await contracts.fourXBatchProcessing.connect(owner).batchMint();
        const mintedButter = await contracts.token.setToken.balanceOf(contracts.fourXStorage.address);
        await expect(
          await contracts.fourXBatchProcessing
            .connect(depositor)
            .moveUnclaimedIntoCurrentBatch([batchId], [parseEther("5000")], false)
        )
          .to.emit(contracts.fourXBatchProcessing, "DepositedUnclaimedSetTokenForRedeem")
          .withArgs(mintedButter.div(2), depositor.address);
        const currentRedeemBatchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
        const redeemBatch = await contracts.fourXBatchProcessing.getBatch(currentRedeemBatchId);
        expectBigNumberCloseTo(redeemBatch.sourceTokenBalance, mintedButter.div(2), parseEther("0.00015"));
        const mintBatch = await contracts.fourXBatchProcessing.getBatch(batchId);
        expectBigNumberCloseTo(mintBatch.targetTokenBalance, mintedButter.div(2), parseEther("0.00015"));
      });
      it("moves funds from up to 20 batches", async function () {
        await contracts.curveMetapoolD3.mint(contracts.yearnVaultD3.address, parseEther("100000"));
        await contracts.curveMetapool3EUR.mint(contracts.yearnVault3EUR.address, parseEther("100000"));
        await contracts.yearnVaultD3.mint(contracts.mockBasicIssuanceModule.address, parseEther("100000"));
        await contracts.yearnVault3EUR.mint(contracts.mockBasicIssuanceModule.address, parseEther("100000"));

        await contracts.token.usdc.mint(depositor.address, parseEther("2000"));

        await contracts.token.usdc
          .connect(depositor)
          .approve(contracts.fourXBatchProcessing.address, parseEther("2000"));
        await bluebird.map(
          new Array(20).fill(0),
          async (i) => {
            await contracts.fourXBatchProcessing
              .connect(depositor)
              .depositForMint(parseEther("100"), depositor.address);
            await provider.send("evm_increaseTime", [1800]);
            await provider.send("evm_mine", []);
            await contracts.fourXBatchProcessing.connect(owner).batchMint();
          },
          { concurrency: 1 }
        );
        const batchIds = await contracts.fourXBatchProcessing.getAccountBatches(depositor.address);
        const mintedButter = await contracts.token.setToken.balanceOf(contracts.fourXStorage.address);
        expect(
          await contracts.fourXBatchProcessing
            .connect(depositor)
            .moveUnclaimedIntoCurrentBatch(batchIds, new Array(20).fill(parseEther("100")), false)
        )
          .to.emit(contracts.fourXBatchProcessing, "DepositedUnclaimedSetTokenForRedeem")
          .withArgs(mintedButter, depositor.address);
        const currentRedeemBatchId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
        const redeemBatch = await contracts.fourXBatchProcessing.getBatch(currentRedeemBatchId);
        expect(redeemBatch.sourceTokenBalance).to.be.equal(mintedButter);
      });
    });
  });
  context("paused", function () {
    let claimableMintId;
    let claimableRedeemId;
    let currentMintId;
    let currentRedeemId;

    beforeEach(async function () {
      //Prepare MintBatches
      claimableMintId = await contracts.fourXBatchProcessing.currentMintBatchId();
      await contracts.fourXBatchProcessing.connect(owner).setProcessingThreshold(0, 0, 0);
      await contracts.token.usdc.mint(depositor.address, parseEther("40000"));
      await contracts.fourXBatchProcessing.connect(depositor).depositForMint(parseEther("20000"), depositor.address);
      await contracts.fourXBatchProcessing.connect(owner).batchMint();
      currentMintId = await contracts.fourXBatchProcessing.currentMintBatchId();
      await contracts.fourXBatchProcessing.connect(depositor).depositForMint(parseEther("20000"), depositor.address);

      //Prepare RedeemBatches
      await contracts.yearnVaultD3.mint(contracts.mockBasicIssuanceModule.address, parseEther("200000"));
      await contracts.yearnVault3EUR.mint(contracts.mockBasicIssuanceModule.address, parseEther("200000"));
      await contracts.token.setToken.mint(depositor.address, parseEther("400"));
      await contracts.token.setToken
        .connect(depositor)
        .approve(contracts.fourXBatchProcessing.address, parseEther("10000"));
      claimableRedeemId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
      await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("100"));
      await contracts.fourXBatchProcessing.connect(owner).batchRedeem();
      currentRedeemId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
      await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("100"));

      //Pause Contract
      await contracts.fourXBatchProcessing.connect(owner).pause();
    });
    it("prevents deposit for mint", async function () {
      await expectRevert(
        contracts.fourXBatchProcessing.connect(depositor).depositForMint(parseEther("1"), depositor.address),
        "Pausable: paused"
      );
    });
    it("prevents deposit for redeem", async function () {
      await expectRevert(
        contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("1")),
        "Pausable: paused"
      );
    });
    it("prevents mint", async function () {
      await expectRevert(contracts.fourXBatchProcessing.connect(owner).batchMint(), "Pausable: paused");
    });
    it("prevents redeem", async function () {
      await expectRevert(contracts.fourXBatchProcessing.connect(owner).batchRedeem(), "Pausable: paused");
    });
    it("prevents to move unclaimed deposits into the current batch", async function () {
      const batchId = await contracts.fourXBatchProcessing.currentMintBatchId();
      await expectRevert(
        contracts.fourXBatchProcessing
          .connect(depositor)
          .moveUnclaimedIntoCurrentBatch([batchId], [parseEther("1")], true),
        "Pausable: paused"
      );
    });
    it("still allows to withdraw from mint batch", async function () {
      await expect(
        contracts.fourXBatchProcessing
          .connect(depositor)
          ["withdrawFromBatch(bytes32,uint256,address)"](currentMintId, parseEther("10"), depositor.address)
      )
        .to.emit(contracts.fourXBatchProcessing, "WithdrawnFromBatch")
        .withArgs(currentMintId, parseEther("10"), depositor.address);
    });
    it("still allows to withdraw from redeem batch", async function () {
      await expect(
        contracts.fourXBatchProcessing
          .connect(depositor)
          ["withdrawFromBatch(bytes32,uint256,address)"](currentRedeemId, parseEther("1"), depositor.address)
      )
        .to.emit(contracts.fourXBatchProcessing, "WithdrawnFromBatch")
        .withArgs(currentRedeemId, parseEther("1"), depositor.address);
    });
    it("still allows to claim minted butter", async function () {
      await expect(contracts.fourXBatchProcessing.connect(depositor).claim(claimableMintId, depositor.address))
        .to.emit(contracts.fourXBatchProcessing, "Claimed")
        .withArgs(depositor.address, BatchType.Mint, parseEther("20000"), parseEther("193.980582524271844795"));
    });
    it("still allows to claim redemeed usdc", async function () {
      await expect(contracts.fourXBatchProcessing.connect(depositor).claim(claimableRedeemId, depositor.address))
        .to.emit(contracts.fourXBatchProcessing, "Claimed")
        .withArgs(depositor.address, BatchType.Redeem, parseEther("100"), parseEther("520.024765059099363880"));
    });
    it("allows deposits for minting after unpausing", async function () {
      await contracts.fourXBatchProcessing.unpause();

      await expect(contracts.fourXBatchProcessing.connect(depositor).depositForMint(parseEther("1"), depositor.address))
        .to.emit(contracts.fourXBatchProcessing, "Deposit")
        .withArgs(depositor.address, parseEther("1"));
    });
    it("allows deposits for redeeming after unpausing", async function () {
      await contracts.fourXBatchProcessing.unpause();

      await expect(contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(parseEther("1")))
        .to.emit(contracts.fourXBatchProcessing, "Deposit")
        .withArgs(depositor.address, parseEther("1"));
    });
  });
  describe("allows only clients to interact with the storage contract", () => {
    const deposit = async (amount?: number) => {
      await contracts.fourXBatchProcessing
        .connect(depositor)
        .depositForMint(parseEther(amount ? amount.toString() : "10"), depositor.address);
    };
    it("reverts when a non client tries to deposit", async function () {
      const batchId = await contracts.fourXBatchProcessing.currentMintBatchId();
      await expect(
        contracts.fourXStorage.connect(depositor).deposit(batchId, depositor.address, parseEther("10"))
      ).to.be.revertedWith("!allowed");
    });
    it("reverts when a non client tries to claim", async function () {
      const batchId = await contracts.fourXBatchProcessing.currentMintBatchId();
      deposit();
      await expect(
        contracts.fourXStorage.connect(depositor).claim(batchId, depositor.address, parseEther("10"), depositor.address)
      ).to.be.revertedWith("!allowed");
    });
    it("reverts when a non client tries to withdraw", async function () {
      const batchId = await contracts.fourXBatchProcessing.currentMintBatchId();
      deposit();
      await expect(
        contracts.fourXStorage
          .connect(depositor)
          .withdraw(batchId, depositor.address, parseEther("10"), depositor.address)
      ).to.be.revertedWith("!allowed");
    });
    it("reverts when a non client tries to withdrawSourceTokenFromBatch", async function () {
      const batchId = await contracts.fourXBatchProcessing.currentMintBatchId();
      deposit();
      await expect(contracts.fourXStorage.connect(depositor).withdrawSourceTokenFromBatch(batchId)).to.be.revertedWith(
        "!allowed"
      );
    });
    it("reverts when a non client tries to moveUnclaimedIntoCurrentBatch", async function () {
      const batchId = await contracts.fourXBatchProcessing.currentMintBatchId();
      const redeemId = await contracts.fourXBatchProcessing.currentRedeemBatchId();
      deposit();
      await expect(
        contracts.fourXStorage
          .connect(depositor)
          .moveUnclaimedIntoCurrentBatch(batchId, redeemId, depositor.address, parseEther("1"))
      ).to.be.revertedWith("!allowed");
    });
  });
  describe("redemption fee", () => {
    context("sets RedemptionFee", () => {
      it("sets a redemptionRate when called with DAO role", async () => {
        await expect(await contracts.fourXBatchProcessing.setRedemptionFee(100, owner.address))
          .to.emit(contracts.fourXBatchProcessing, "RedemptionFeeUpdated")
          .withArgs(100, owner.address);

        const redemptionFee = await contracts.fourXBatchProcessing.redemptionFee();
        expect(redemptionFee[0]).to.equal(BigNumber.from("0"));
        expect(redemptionFee[1]).to.equal(BigNumber.from("100"));
        expect(redemptionFee[2]).to.equal(owner.address);
      });
      it("reverts when setting redemptionRate without DAO role", async () => {
        await expectRevert(
          contracts.fourXBatchProcessing.connect(depositor).setRedemptionFee(100, owner.address),
          "you dont have the right role"
        );
      });
      it("reverts when setting a feeRate higher than 1%", async () => {
        await expectRevert(contracts.fourXBatchProcessing.setRedemptionFee(1000, owner.address), "dont be greedy");
      });
    });
    context("with redemption fee", () => {
      let batchId;
      const depositAmount = parseEther("100");
      const feeRate = 100;
      beforeEach(async () => {
        await contracts.fourXBatchProcessing.setRedemptionFee(feeRate, owner.address);
        await contracts.token.setToken.mint(depositor.address, depositAmount);
        await contracts.token.setToken
          .connect(depositor)
          .approve(contracts.fourXBatchProcessing.address, depositAmount);
        await contracts.fourXBatchProcessing.connect(depositor).depositForRedeem(depositAmount);
        await contracts.yearnVaultD3.mint(contracts.mockBasicIssuanceModule.address, parseEther("20000"));
        await contracts.yearnVault3EUR.mint(contracts.mockBasicIssuanceModule.address, parseEther("20000"));
        await contracts.curveMetapoolD3.mint(contracts.yearnVaultD3.address, parseEther("20000"));
        await contracts.curveMetapool3EUR.mint(contracts.yearnVault3EUR.address, parseEther("20000"));
        await provider.send("evm_increaseTime", [1800]);
        await provider.send("evm_mine", []);
        batchId = contracts.fourXBatchProcessing.currentRedeemBatchId();
        await contracts.fourXBatchProcessing.connect(owner).batchRedeem();
      });
      it("takes the fee", async () => {
        const accountBalance = await contracts.fourXBatchProcessing.getAccountBalance(batchId, depositor.address);
        const batch = await contracts.fourXBatchProcessing.getBatch(batchId);
        const claimAmountWithoutFee = batch.targetTokenBalance.mul(accountBalance).div(batch.unclaimedShares);
        const fee = claimAmountWithoutFee.mul(feeRate).div(10000);
        const oldBal = await contracts.token.usdc.balanceOf(depositor.address);

        await expect(await contracts.fourXBatchProcessing.connect(depositor).claim(batchId, depositor.address))
          .to.emit(contracts.fourXBatchProcessing, "Claimed")
          .withArgs(depositor.address, BatchType.Redeem, depositAmount, claimAmountWithoutFee.sub(fee));

        const newBal = await contracts.token.usdc.balanceOf(depositor.address);
        expect(newBal).to.equal(oldBal.add(claimAmountWithoutFee.sub(fee)));

        expect((await contracts.fourXBatchProcessing.redemptionFee()).accumulated).to.equal(fee);
      });
    });
  });
});

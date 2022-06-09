import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, utils } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers, waffle } from "hardhat";
import { expectRevert } from "../lib/utils/expectValue";
import {
  ThreeXBatchProcessing,
  ThreeXZapper,
  MockCurveOraclePool,
  MockCurveThreepool,
  MockERC20,
  RewardsEscrow,
  Staking,
} from "../typechain";
import { ThreeXBatchVault } from "../typechain/ThreeXBatchVault";
import { MockBasicIssuanceModule } from "../typechain/MockBasicIssuanceModule";
import { MockYearnV2Vault } from "../typechain/MockYearnV2Vault";

const provider = waffle.provider;

interface Token {
  dai: MockERC20;
  usdc: MockERC20;
  usdt: MockERC20;
  threeCrv: MockERC20;
  pop: MockERC20;
  ibEur: MockERC20;
  ibGbp: MockERC20;
  setToken: MockERC20;
  lpTokenEur?: MockERC20;
  lpTokenGbp?: MockERC20;
}
interface Contracts {
  token: Token;
  yearnVaultEUR: MockYearnV2Vault;
  yearnVaultGBP: MockYearnV2Vault;
  curveMetapoolEUR: MockCurveOraclePool;
  curveMetapoolGBP: MockCurveOraclePool;
  mockBasicIssuanceModule: MockBasicIssuanceModule;
  threeXBatchProcessing: ThreeXBatchProcessing;
  threeXStorage: ThreeXBatchVault;
  staking: Staking;
  threePool: MockCurveThreepool;
  zapper: ThreeXZapper;
}

let owner: SignerWithAddress, depositor: SignerWithAddress;
let contracts: Contracts;

async function claimAndRedeem(mintId: string): Promise<string> {
  await contracts.threeXBatchProcessing.connect(depositor).claim(mintId, depositor.address);
  await contracts.token.setToken.connect(depositor).approve(contracts.threeXBatchProcessing.address, parseEther("10"));
  await contracts.threeXBatchProcessing.connect(depositor).depositForRedeem(parseEther("10"));
  const redeemId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
  await timeTravel(1800);
  await contracts.threeXBatchProcessing.batchRedeem();
  return redeemId;
}

async function deployToken(): Promise<Token> {
  const MockERC20 = await ethers.getContractFactory("MockERC20");

  const dai = await (await MockERC20.deploy("DAI", "DAI", 18)).deployed();
  const usdc = await (await MockERC20.deploy("USDC", "USDC", 6)).deployed();
  const usdt = await (await MockERC20.deploy("USDT", "USDT", 6)).deployed();
  const threeCrv = await (await MockERC20.deploy("3CRV", "3CRV", 18)).deployed();

  const pop = await (await MockERC20.deploy("POP", "POP", 18)).deployed();

  const ibEur = await (await MockERC20.deploy("ibEUR", "ibEUR", 18)).deployed();
  const ibGbp = await (await MockERC20.deploy("ibGBP", "ibGBP", 18)).deployed();

  const setToken = await await MockERC20.deploy("setToken", "setToken", 18);
  return {
    dai,
    usdc,
    usdt,
    threeCrv,
    pop,
    ibEur,
    ibGbp,
    setToken,
  };
}

async function deployContracts(): Promise<Contracts> {
  const token = await deployToken();

  const MockCurveFactoryMetapool = await ethers.getContractFactory("MockCurveOraclePool");
  const curveMetapoolEUR = await (
    await MockCurveFactoryMetapool.deploy(
      token.ibEur.address,
      token.usdc.address,
      parseEther("1.955911693892773173"),
      parseEther("0.950947256857470414")
    )
  ).deployed();
  const curveMetapoolGBP = await (
    await MockCurveFactoryMetapool.deploy(
      token.ibGbp.address,
      token.usdc.address,
      parseEther("1.785583346876913296"),
      parseEther("0.796596414405397467")
    )
  ).deployed();

  const MockYearnV2Vault = await ethers.getContractFactory("MockYearnV2Vault");
  const yearnVaultEUR = await (await MockYearnV2Vault.deploy(await curveMetapoolEUR.lpToken())).deployed();
  const yearnVaultGBP = await (await MockYearnV2Vault.deploy(await curveMetapoolGBP.lpToken())).deployed();

  const mockBasicIssuanceModule = await (
    await (
      await ethers.getContractFactory("MockBasicIssuanceModule")
    ).deploy([yearnVaultEUR.address, yearnVaultGBP.address], [50, 50])
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

  const threeXBatchProcessing = await (
    await (
      await ethers.getContractFactory("ThreeXBatchProcessing")
    ).deploy(
      contractRegistry.address,
      staking.address,
      ethers.constants.AddressZero,
      { sourceToken: token.usdc.address, targetToken: token.setToken.address }, // mint batch
      { sourceToken: token.setToken.address, targetToken: token.usdc.address }, // redeem batch
      mockBasicIssuanceModule.address,
      [yearnVaultEUR.address, yearnVaultGBP.address],
      [
        {
          curveMetaPool: curveMetapoolEUR.address,
          lpToken: await curveMetapoolEUR.lpToken(),
        },
        {
          curveMetaPool: curveMetapoolGBP.address,
          lpToken: await curveMetapoolGBP.lpToken(),
        },
      ],
      {
        batchCooldown: 1800,
        mintThreshold: parseEther("20000"),
        redeemThreshold: parseEther("200"),
      }
    )
  ).deployed();

  const threePool = await (
    await (
      await ethers.getContractFactory("MockCurveThreepool")
    ).deploy(token.threeCrv.address, token.dai.address, token.usdc.address, token.usdt.address)
  ).deployed();

  await aclRegistry.grantRole(ethers.utils.id("DAO"), owner.address);
  await contractRegistry
    .connect(owner)
    .addContract(ethers.utils.id("ThreeXBatchProcessing"), threeXBatchProcessing.address, ethers.utils.id("1"));

  const zapper = await (
    await (
      await ethers.getContractFactory("ThreeXZapper")
    ).deploy(contractRegistry.address, threePool.address, [token.dai.address, token.usdc.address, token.usdt.address])
  ).deployed();

  await aclRegistry.grantRole(ethers.utils.id("Keeper"), owner.address);
  await aclRegistry.grantRole(ethers.utils.id("ThreeXZapper"), zapper.address);
  await aclRegistry.grantRole(ethers.utils.id("ApprovedContract"), zapper.address);

  await contractRegistry.connect(owner).addContract(ethers.utils.id("POP"), token.pop.address, ethers.utils.id("1"));
  await contractRegistry
    .connect(owner)
    .addContract(ethers.utils.id("KeeperIncentive"), keeperIncentive.address, ethers.utils.id("1"));
  await contractRegistry
    .connect(owner)
    .addContract(ethers.utils.id("PopLocker"), popStaking.address, ethers.utils.id("1"));
  await contractRegistry
    .connect(owner)
    .addContract(ethers.utils.id("ThreeXZapper"), zapper.address, ethers.utils.id("1"));

  await keeperIncentive
    .connect(owner)
    .createIncentive(utils.formatBytes32String("ThreeXBatchProcessing"), 0, true, false);

  await keeperIncentive
    .connect(owner)
    .createIncentive(utils.formatBytes32String("ThreeXBatchProcessing"), 0, true, false);

  await keeperIncentive
    .connect(owner)
    .addControllerContract(utils.formatBytes32String("ThreeXBatchProcessing"), threeXBatchProcessing.address);

  const threeXStorage = (await ethers.getContractAt(
    "ThreeXBatchVault",
    await threeXBatchProcessing.batchStorage()
  )) as ThreeXBatchVault;

  const MockERC20 = await ethers.getContractFactory("MockERC20");

  return {
    token: {
      ...token,
      lpTokenEur: MockERC20.attach(await curveMetapoolEUR.lpToken()),
      lpTokenGbp: MockERC20.attach(await curveMetapoolGBP.lpToken()),
    },
    yearnVaultEUR,
    yearnVaultGBP,
    curveMetapoolEUR,
    curveMetapoolGBP,
    mockBasicIssuanceModule,
    threeXBatchProcessing,
    threeXStorage,
    staking,
    threePool,
    zapper,
  };
}

const timeTravel = async (time: number) => {
  await provider.send("evm_increaseTime", [time]);
  await provider.send("evm_mine", []);
};

async function mintERC20(erc20: MockERC20, recipient: string, amount: BigNumber): Promise<void> {
  await erc20.mint(recipient, amount);
}

const deployAndAssignContracts = async () => {
  [owner, depositor] = await ethers.getSigners();
  contracts = await deployContracts();
  await mintERC20(contracts.token.dai, depositor.address, parseEther("10000"));
  await mintERC20(contracts.token.usdc, depositor.address, parseEther("10000"));
  await mintERC20(contracts.token.dai, contracts.threePool.address, parseEther("20000"));
  await mintERC20(contracts.token.usdc, contracts.threePool.address, parseEther("20000"));

  await contracts.token.usdc
    .connect(depositor)
    .approve(contracts.threeXBatchProcessing.address, parseEther("100000000"));
  await contracts.token.usdc.connect(depositor).approve(contracts.zapper.address, parseEther("100000000"));
  await contracts.token.dai.connect(depositor).approve(contracts.zapper.address, parseEther("100000000"));
};

describe("ThreeXZapper", function () {
  beforeEach(async function () {
    await deployAndAssignContracts();
  });
  context("zapIntoBatch", function () {
    let batchId;
    beforeEach(async function () {
      batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
    });
    it("reverts when slippage is too high", async () => {
      await expectRevert(
        contracts.zapper.connect(depositor).zapIntoBatch(parseEther("10000"), 0, 1, parseEther("100000")),
        "slippage too high"
      );
    });
    it("zaps into batch successfully", async function () {
      await expect(await contracts.zapper.connect(depositor).zapIntoBatch(parseEther("10000"), 0, 1, 0))
        .to.emit(contracts.zapper, "ZappedIntoBatch")
        .withArgs(parseEther("10000"), depositor.address);

      expect(await contracts.token.dai.balanceOf(depositor.address)).to.equal(parseEther("0"));

      const batch = await contracts.threeXBatchProcessing.getBatch(batchId);
      expect(batch.sourceTokenBalance).to.equal(parseEther("10000"));
    });
  });
  context("zapOutOfBatch", function () {
    let batchId;
    beforeEach(async function () {
      await contracts.threeXBatchProcessing.connect(depositor).depositForMint(parseEther("10000"), depositor.address);
      batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
    });
    it("reverts when slippage is too high", async () => {
      await expectRevert(
        contracts.zapper.connect(depositor).zapOutOfBatch(batchId, parseEther("10"), 1, 0, parseEther("10000")),
        "slippage too high"
      );
    });
    it("reverts when batch is of type redeem", async function () {
      const redeemId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
      await expectRevert(
        contracts.zapper.connect(depositor).zapOutOfBatch(redeemId, parseEther("10"), 1, 0, 0),
        "!mint"
      );
    });
    it("zaps out of batch successfully", async function () {
      await expect(await contracts.zapper.connect(depositor).zapOutOfBatch(batchId, parseEther("10"), 1, 0, 0))
        .to.emit(contracts.zapper, "ZappedOutOfBatch")
        .withArgs(batchId, 0, parseEther("10"), parseEther("10"), depositor.address);

      expect(await contracts.token.dai.balanceOf(depositor.address)).to.equal(parseEther("10010"));

      const batch = await contracts.threeXBatchProcessing.getBatch(batchId);
      expect(batch.unclaimedShares).to.equal(parseEther("9990"));
      expect(batch.targetTokenBalance).to.equal(0);
    });
  });
  context("claiming", function () {
    let batchId;
    beforeEach(async function () {
      await contracts.threeXBatchProcessing.connect(depositor).depositForMint(parseEther("10000"), depositor.address);
      await timeTravel(1800);
      batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
      await contracts.threeXBatchProcessing.batchMint();
    });
    it("reverts when batch is of type mint", async function () {
      await expectRevert(contracts.zapper.connect(depositor).claimAndSwapToStable(batchId, 1, 0, 0), "!redeem");
    });
    it("reverts when slippage is too high", async () => {
      const redeemId = await claimAndRedeem(batchId);
      await expectRevert(
        contracts.zapper.connect(depositor).claimAndSwapToStable(redeemId, 1, 0, parseEther("10000")),
        "slippage too high"
      );
    });
    it("claims batch successfully", async function () {
      const redeemId = await claimAndRedeem(batchId);
      await expect(await contracts.zapper.connect(depositor).claimAndSwapToStable(redeemId, 1, 0, parseEther("1000")))
        .to.emit(contracts.zapper, "ClaimedIntoStable")
        .withArgs(
          redeemId,
          0,
          parseEther("2147.010451284530614107"),
          parseEther("2147.010451284530614107"),
          depositor.address
        );
      expect(await contracts.token.dai.balanceOf(depositor.address)).to.equal(parseEther("12147.010451284530614107"));
      const batch = await contracts.threeXBatchProcessing.getBatch(batchId);
      expect(batch.unclaimedShares).to.equal(parseEther("0"));
      expect(batch.targetTokenBalance).to.equal(parseEther("0"));
    });
  });
});

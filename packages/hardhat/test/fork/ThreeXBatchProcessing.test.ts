import { parseEther } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import BasicIssuanceModule from "@setprotocol/set-protocol-v2/artifacts/contracts/protocol/modules/BasicIssuanceModule.sol/BasicIssuanceModule.json";
import SetToken from "@setprotocol/set-protocol-v2/artifacts/contracts/protocol/SetToken.sol/SetToken.json";
import SetTokenCreator from "@setprotocol/set-protocol-v2/artifacts/contracts/protocol/SetTokenCreator.sol/SetTokenCreator.json";
import { expect } from "chai";
import { BigNumber, utils } from "ethers";
import { Signer } from "ethers/lib/ethers";
import { ethers, network, waffle } from "hardhat";
import { ADDRESS_ZERO } from "../../lib/external/SetToken/utils/constants";
import { expectBigNumberCloseTo, expectEvent, expectRevert, expectValue } from "../../lib/utils/expectValue";
import { impersonateSigner } from "../../lib/utils/test/impersonateSigner";
import { sendEth } from "../../lib/utils/test/sendEth";
import { ThreeXBatchVault } from "../../typechain/ThreeXBatchVault";
import {
  ERC20,
  ThreeXBatchProcessing,
  MockERC20,
  Staking,
  CurveMetapool,
  CurveMetapool__factory,
  RewardsEscrow,
  MockYearnV2Vault,
  MockYearnV2Vault__factory,
} from "../../typechain";
import ThreeXBatchAdapter from "../../lib/adapters/ThreeXBatchAdapter";
import { BatchType } from "../../../utils/src/types";

const provider = waffle.provider;
const DAY = 60 * 60 * 24;

const SET_TOKEN_CREATOR_ADDRESS = "0xeF72D3278dC3Eba6Dc2614965308d1435FFd748a";
const SET_BASIC_ISSUANCE_MODULE_ADDRESS = "0xd8EF3cACe8b4907117a45B0b125c68560532F94D";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const USDC_WHALE_ADDRESS = "0xcffad3200574698b78f32232aa9d63eabd290703";

const Y_D3_ADDRESS = "0x16825039dfe2a5b01F3E1E6a2BBF9a576c6F95c4";
const Y_3EUR_ADDRESS = "0x5AB64C599FcC59f0f2726A300b03166A395578Da";

const D3_METAPOOL_ADDRESS = "0xBaaa1F5DbA42C3389bDbc2c9D2dE134F5cD0Dc89";
const THREE_EUR_METAPOOL_ADDRESS = "0xb9446c4Ef5EBE66268dA6700D26f96273DE3d571";
const FRAX_METAPOOL_ADDRESS = "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B";
const EURS_METAPOOL_ADDRESS = "0x98a7F18d4E56Cfe84E3D081B40001B3d5bD3eB8B";

const FRAX_ADDRESS = "0x853d955aCEf822Db058eb8505911ED77F175b99e";

const ANGLE_ROUTER_ADDRESS = "0xBB755240596530be0c1DE5DFD77ec6398471561d";
const AG_EUR_ADDRESS = "0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8";

interface Token {
  usdc: ERC20;
  pop: MockERC20;
  setToken: ERC20;
}
interface Contracts {
  token: Token;
  yearnVaultD3: MockYearnV2Vault;
  yearnVault3EUR: MockYearnV2Vault;
  curveMetapoolD3: CurveMetapool;
  curveMetapool3EUR: CurveMetapool;
  swapPoolFrax: CurveMetapool;
  swapPoolEurs: CurveMetapool;
  threeXBatchProcessing: ThreeXBatchProcessing;
  staking: Staking;
  threeXStorage: ThreeXBatchVault;
}

let contracts: Contracts;

let owner: SignerWithAddress,
  depositor: SignerWithAddress,
  depositor1: SignerWithAddress,
  depositor2: SignerWithAddress;
let usdcWhale: Signer;

async function deployToken(): Promise<Token> {
  const MockERC20 = await ethers.getContractFactory("MockERC20");

  const pop = await (await MockERC20.deploy("POP", "POP", 18)).deployed();

  const usdc = (await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
    USDC_ADDRESS
  )) as ERC20;

  const setTokenCreator = await ethers.getContractAt(SetTokenCreator.abi, SET_TOKEN_CREATOR_ADDRESS);
  const setTokenAddress = await setTokenCreator.callStatic.create(
    [Y_D3_ADDRESS, Y_3EUR_ADDRESS],
    [parseEther("50"), parseEther("50")],
    [SET_BASIC_ISSUANCE_MODULE_ADDRESS],
    owner.address,
    "4X",
    "4X"
  );
  await setTokenCreator.create(
    [Y_D3_ADDRESS, Y_3EUR_ADDRESS],
    [parseEther("50"), parseEther("50")],
    [SET_BASIC_ISSUANCE_MODULE_ADDRESS],
    owner.address,
    "4X",
    "4X"
  );
  const setToken = (await ethers.getContractAt(SetToken.abi, setTokenAddress)) as ERC20;

  const setBasicIssuanceModule = await ethers.getContractAt(BasicIssuanceModule.abi, SET_BASIC_ISSUANCE_MODULE_ADDRESS);

  await setBasicIssuanceModule.connect(owner).initialize(setToken.address, ADDRESS_ZERO);

  return {
    pop,
    usdc,
    setToken,
  };
}

async function deployContracts(): Promise<Contracts> {
  const token = await deployToken();

  const swapPoolFrax = CurveMetapool__factory.connect(FRAX_METAPOOL_ADDRESS, owner);
  const swapPoolEurs = CurveMetapool__factory.connect(EURS_METAPOOL_ADDRESS, owner);

  const curveMetapoolD3 = CurveMetapool__factory.connect(D3_METAPOOL_ADDRESS, owner);
  const curveMetapool3EUR = CurveMetapool__factory.connect(THREE_EUR_METAPOOL_ADDRESS, owner);

  const yearnVaultD3 = MockYearnV2Vault__factory.connect(Y_D3_ADDRESS, owner);
  const yearnVault3EUR = MockYearnV2Vault__factory.connect(Y_3EUR_ADDRESS, owner);

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
      SET_BASIC_ISSUANCE_MODULE_ADDRESS,
      [yearnVaultD3.address, yearnVault3EUR.address],
      [
        {
          swapPool: FRAX_METAPOOL_ADDRESS,
          curveMetaPool: D3_METAPOOL_ADDRESS,
          angleRouter: ethers.constants.AddressZero,
        },
        {
          swapPool: EURS_METAPOOL_ADDRESS,
          curveMetaPool: THREE_EUR_METAPOOL_ADDRESS,
          angleRouter: ANGLE_ROUTER_ADDRESS,
        },
      ],
      [FRAX_ADDRESS, AG_EUR_ADDRESS],
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
    .createIncentive(utils.formatBytes32String("ThreeXBatchProcessing"), 0, true, false);

  await keeperIncentive
    .connect(owner)
    .createIncentive(utils.formatBytes32String("ThreeXBatchProcessing"), 0, true, false);

  await keeperIncentive
    .connect(owner)
    .addControllerContract(utils.formatBytes32String("ThreeXBatchProcessing"), threeXBatchProcessing.address);

  await threeXBatchProcessing.connect(owner).setSlippage(100, 100);

  const threeXStorage = (await ethers.getContractAt(
    "ThreeXBatchVault",
    await threeXBatchProcessing.batchStorage()
  )) as ThreeXBatchVault;

  return {
    token,
    yearnVaultD3,
    yearnVault3EUR,
    swapPoolFrax,
    swapPoolEurs,
    curveMetapoolD3,
    curveMetapool3EUR,
    threeXBatchProcessing,
    staking,
    threeXStorage,
  };
}

const timeTravel = async (time: number) => {
  await provider.send("evm_increaseTime", [time]);
  await provider.send("evm_mine", []);
};

async function sendERC20(erc20: ERC20, whale: Signer, recipient: string, amount: BigNumber): Promise<void> {
  await erc20.connect(whale).transfer(recipient, amount);
}

async function mintAndClaim(user: SignerWithAddress = depositor): Promise<void> {
  await contracts.token.usdc.connect(user).approve(contracts.threeXBatchProcessing.address, parseEther("10000"));
  await contracts.threeXBatchProcessing.connect(user).depositForMint(BigNumber.from("1000000000"), user.address);
  const mintId = await contracts.threeXBatchProcessing.currentMintBatchId();
  await timeTravel(1800);
  await contracts.threeXBatchProcessing.connect(owner).batchMint();
  await contracts.threeXBatchProcessing.connect(user).claim(mintId, user.address);
}

const mintDeposit = async (amount?: number, user: SignerWithAddress = depositor) => {
  const bigNumberAmount = BigNumber.from(amount ? amount.toString() : "10000000");
  await sendERC20(contracts.token.usdc, usdcWhale, user.address, bigNumberAmount);
  await contracts.token.usdc.connect(user).approve(contracts.threeXBatchProcessing.address, bigNumberAmount);
  await contracts.threeXBatchProcessing.connect(user).depositForMint(bigNumberAmount, user.address);
};

const mintSubject = async (batchId) => {
  const adapter = new ThreeXBatchAdapter(contracts.threeXBatchProcessing);
  const batch = await adapter.getBatch(batchId);
  return batch;
};

const redeemDeposit = async (amount?: number, user: SignerWithAddress = depositor) => {
  const bigNumberAmount = parseEther(amount ? amount.toString() : "1");
  await contracts.token.setToken.connect(user).approve(contracts.threeXBatchProcessing.address, bigNumberAmount);
  await contracts.threeXBatchProcessing.connect(user).depositForRedeem(bigNumberAmount);
};

const redeemSubject = async (batchId) => {
  const adapter = new ThreeXBatchAdapter(contracts.threeXBatchProcessing);
  const batch = await adapter.getBatch(batchId);
  return batch;
};

describe("ThreeXBatchProcessing - Fork", () => {
  beforeEach(async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.FORKING_RPC_URL,
            blockNumber: 14898223,
          },
        },
      ],
    });
    [owner, depositor, depositor1, depositor2] = await ethers.getSigners();
    contracts = await deployContracts();
    usdcWhale = await impersonateSigner(USDC_WHALE_ADDRESS);
    await sendEth(USDC_WHALE_ADDRESS, "10");
    await sendERC20(contracts.token.usdc, usdcWhale, depositor.address, BigNumber.from("20000000000"));
    await contracts.token.usdc
      .connect(depositor)
      .approve(contracts.threeXBatchProcessing.address, parseEther("100000000"));
    await contracts.threeXBatchProcessing.setSlippage(45, 80);
  });
  describe("EOA only flash loan defender", () => {
    it("does not allow interaction from unapproved contracts on depositForMint", async () => {
      const defendedContract = await ethers.getContractFactory("ButterBatchProcessingDefendedHelper");
      const deployed = await defendedContract.deploy(contracts.threeXBatchProcessing.address);
      await expectRevert(deployed.connect(depositor).depositMint(), "Access denied for caller");
    });
    it("does not allow interaction from unapproved contracts on depositForRedeem", async () => {
      const defendedContract = await ethers.getContractFactory("ButterBatchProcessingDefendedHelper");
      const deployed = await defendedContract.deploy(contracts.threeXBatchProcessing.address);
      await expectRevert(deployed.connect(depositor).depositRedeem(), "Access denied for caller");
    });
  });
  context("setters and getters", () => {
    describe("set slippage", async () => {
      const SLIPPAGE = 54;
      let result;
      beforeEach(async () => {
        result = await contracts.threeXBatchProcessing.connect(owner).setSlippage(SLIPPAGE, SLIPPAGE);
      });
      it("sets slippage value with correct permissions", async () => {
        const slippage = await contracts.threeXBatchProcessing.slippage();
        expectValue(slippage.mintBps, SLIPPAGE);
        expectValue(slippage.redeemBps, SLIPPAGE);
      });
      it("emits event", async () => {
        await expectEvent(result, contracts.threeXBatchProcessing, "SlippageUpdated", [
          [45, 80],
          [SLIPPAGE, SLIPPAGE],
        ]);
      });
      it("does not allow unauthenticated address to set redeem slippage", async () => {
        await expectRevert(
          contracts.threeXBatchProcessing.connect(depositor).setSlippage(SLIPPAGE, SLIPPAGE),
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
        result = await contracts.threeXBatchProcessing.connect(owner).setComponents(
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
        expect(await contracts.threeXBatchProcessing.componentDependencies(yToken)).to.deep.eq([
          swapPool,
          curveMetaPool,
          angleRouter,
        ]);
      });
      it("emits an event", async () => {
        await expect(result).to.emit(contracts.threeXBatchProcessing, "ComponentDependenciesUpdated");
      });
      it("should revert if not owner", async function () {
        await expectRevert(
          contracts.threeXBatchProcessing.connect(depositor).setComponents(
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
        result = await contracts.threeXBatchProcessing.setProcessingThreshold(cooldown, mintThreshold, redeemThreshold);
      });
      it("sets processing threshold", async () => {
        const processingThreshold = await contracts.threeXBatchProcessing.processingThreshold();
        expect(processingThreshold[0]).to.equal(BigNumber.from("52414"));
        expect(processingThreshold[1]).to.equal(mintThreshold);
        expect(processingThreshold[2]).to.equal(redeemThreshold);
      });
      it("emits an event", async () => {
        expectEvent(result, contracts.threeXBatchProcessing, "ProcessingThresholdUpdated", [
          [BigNumber.from("1800"), parseEther("20000"), parseEther("200")],
          [BigNumber.from("52414"), mintThreshold, redeemThreshold],
        ]);
      });
      it("should revert if not owner", async function () {
        await expectRevert(
          contracts.threeXBatchProcessing
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
        const batchId0 = await contracts.threeXStorage.batchIds(0);
        const adapter = new ThreeXBatchAdapter(contracts.threeXBatchProcessing);
        const batch = await adapter.getBatch(batchId0);
        expect(
          batch.batchId.match(/0x.+[^0x0000000000000000000000000000000000000000000000000000000000000000]/)?.length
        ).equal(1);
      });
      it("should set batch struct properties when the contract is deployed", async () => {
        const batchId0 = await contracts.threeXStorage.batchIds(0);
        const adapter = new ThreeXBatchAdapter(contracts.threeXBatchProcessing);
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
        const batchId1 = await contracts.threeXStorage.batchIds(1);
        const adapter = new ThreeXBatchAdapter(contracts.threeXBatchProcessing);
        const batch = await adapter.getBatch(batchId1);
        expect(
          batch.batchId.match(/0x.+[^0x0000000000000000000000000000000000000000000000000000000000000000]/)?.length
        ).equal(1);
      });

      it("should set batch struct properties when the contract is deployed", async () => {
        const batchId1 = await contracts.threeXStorage.batchIds(1);
        const adapter = new ThreeXBatchAdapter(contracts.threeXBatchProcessing);
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
        it("increments suppliedTokenBalance and unclaimedShares with deposit", async () => {
          const batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
          await mintDeposit(10);
          const batch = await mintSubject(batchId);
          expect(batch.suppliedTokenBalance).to.equal(BigNumber.from("10"));
          expect(batch.unclaimedShares).to.equal(BigNumber.from("10"));
        });
        it("depositing does not make a batch claimable", async () => {
          const batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
          await mintDeposit(10);
          expect(await mintSubject(batchId)).to.deep.contain({
            claimable: false,
          });
        });
        it("increments suppliedTokenBalance and unclaimedShares when multiple deposits are made", async () => {
          const batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
          await mintDeposit(); // 10
          await mintDeposit(); // 10
          await mintDeposit(); // 10
          const batch = await mintSubject(batchId);
          expect(batch.claimableTokenBalance).to.equal(BigNumber.from("0"));
          expect(batch.suppliedTokenBalance).to.equal(BigNumber.from("30000000"));
          expect(batch.unclaimedShares).to.equal(BigNumber.from("30000000"));
        });
        it("increments claimableTokenBalance when batch is minted", async () => {
          const batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
          await mintDeposit();
          await timeTravel(1800);

          await contracts.threeXBatchProcessing.connect(owner).batchMint();
          const batchButterOwned = await contracts.token.setToken.balanceOf(
            await contracts.threeXBatchProcessing.batchStorage()
          );
          const batch = await mintSubject(batchId);
          expect(batch.claimableTokenBalance).to.equal(batchButterOwned);
          expect(batch.suppliedTokenBalance).to.equal(BigNumber.from("10000000"));
          expect(batch.unclaimedShares).to.equal(BigNumber.from("10000000"));
        });
        it("sets batch to claimable when batch is minted", async () => {
          const batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
          await mintDeposit();
          await timeTravel(1800);

          await contracts.threeXBatchProcessing.connect(owner).batchMint();
          const batch = await mintSubject(batchId);
          expect(batch.claimable).to.equal(true);
        });
        it("decrements unclaimedShares and claimable when claim is made", async () => {
          const batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
          await mintDeposit();
          await timeTravel(1800);

          await contracts.threeXBatchProcessing.connect(owner).batchMint();
          await contracts.threeXBatchProcessing.connect(depositor).claim(batchId, depositor.address);
          const batch = await mintSubject(batchId);
          expect(batch.claimable).to.equal(true);
          expect(batch.claimableTokenBalance).to.equal(BigNumber.from("0"));
          expect(batch.unclaimedShares).to.equal(BigNumber.from("0"));
        });
      });
      it("deposits usdc in the current mintBatch", async function () {
        const result = await contracts.threeXBatchProcessing
          .connect(depositor)
          .depositForMint(BigNumber.from("10000000"), depositor.address);
        await expect(result)
          .to.emit(contracts.threeXBatchProcessing, "Deposit")
          .withArgs(depositor.address, BigNumber.from("10000000"));
        expect(await contracts.token.usdc.balanceOf(await contracts.threeXBatchProcessing.batchStorage())).to.equal(
          BigNumber.from("10000000")
        );
        const currentMintBatchId = await contracts.threeXBatchProcessing.currentMintBatchId();
        const currentBatch = await contracts.threeXBatchProcessing.getBatch(currentMintBatchId);
        expect(currentBatch.sourceTokenBalance).to.equal(BigNumber.from("10000000"));
        expect(currentBatch.unclaimedShares).to.equal(BigNumber.from("10000000"));
      });
      it("adds the mintBatch to the users batches", async function () {
        await contracts.token.usdc
          .connect(depositor)
          .approve(contracts.threeXBatchProcessing.address, BigNumber.from("10000000"));
        await contracts.threeXBatchProcessing
          .connect(depositor)
          .depositForMint(BigNumber.from("10000000"), depositor.address);

        const currentMintBatchId = await contracts.threeXBatchProcessing.currentMintBatchId();
        expect(await contracts.threeXStorage.accountBatches(depositor.address, 0)).to.equal(currentMintBatchId);
      });
      it("allows multiple deposits", async function () {
        await sendERC20(contracts.token.usdc, usdcWhale, depositor1.address, BigNumber.from("10000000"));
        await sendERC20(contracts.token.usdc, usdcWhale, depositor2.address, BigNumber.from("10000000"));

        await contracts.token.usdc
          .connect(depositor)
          .approve(contracts.threeXBatchProcessing.address, BigNumber.from("10000000"));
        await contracts.threeXBatchProcessing
          .connect(depositor)
          .depositForMint(BigNumber.from("10000000"), depositor.address);

        await contracts.token.usdc
          .connect(depositor1)
          .approve(contracts.threeXBatchProcessing.address, BigNumber.from("10000000"));
        await contracts.threeXBatchProcessing
          .connect(depositor1)
          .depositForMint(BigNumber.from("10000000"), depositor1.address);

        await contracts.token.usdc
          .connect(depositor2)
          .approve(contracts.threeXBatchProcessing.address, BigNumber.from("10000000"));
        await contracts.threeXBatchProcessing
          .connect(depositor2)
          .depositForMint(BigNumber.from("5000000"), depositor2.address);
        await contracts.threeXBatchProcessing
          .connect(depositor2)
          .depositForMint(BigNumber.from("5000000"), depositor2.address);

        const currentMintBatchId = await contracts.threeXBatchProcessing.currentMintBatchId();
        const currentBatch = await contracts.threeXBatchProcessing.getBatch(currentMintBatchId);
        expect(currentBatch.sourceTokenBalance).to.equal(BigNumber.from("30000000"));
        expect(currentBatch.unclaimedShares).to.equal(BigNumber.from("30000000"));
        expect(await contracts.threeXStorage.accountBatches(depositor.address, 0)).to.equal(currentMintBatchId);
        expect(await contracts.threeXStorage.accountBatches(depositor1.address, 0)).to.equal(currentMintBatchId);
        expect(await contracts.threeXStorage.accountBatches(depositor2.address, 0)).to.equal(currentMintBatchId);
      });
    });
    context("claiming", function () {
      let batchId;
      beforeEach(async function () {
        batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
      });
      it("reverts when batch is not yet claimable", async function () {
        await mintDeposit();
        await expect(
          contracts.threeXBatchProcessing.connect(depositor).claim(batchId, depositor.address)
        ).to.be.revertedWith("not yet claimable");
      });
      it("claims batch successfully", async function () {
        await mintDeposit();
        await timeTravel(1800);
        await contracts.threeXBatchProcessing.connect(owner).batchMint();
        expect(await contracts.threeXBatchProcessing.connect(depositor).claim(batchId, depositor.address)).to.emit(
          contracts.threeXBatchProcessing,
          "Claimed"
        );
        expectBigNumberCloseTo(
          await contracts.token.setToken.balanceOf(depositor.address),
          parseEther("128.317657310824363389"),
          parseEther("0.00015")
        );
      });
      describe("claim and stake", () => {
        it("claims and stakes batch successully", async function () {
          await mintDeposit();
          await timeTravel(1800);
          await contracts.threeXBatchProcessing.connect(owner).batchMint();
          expect(await contracts.threeXBatchProcessing.connect(depositor).claimAndStake(batchId)).to.emit(
            contracts.threeXBatchProcessing,
            "Claimed"
          );
          expectBigNumberCloseTo(
            await contracts.staking.balanceOf(depositor.address),
            parseEther("128.317171800624366821"),
            parseEther("0.00015")
          );
        });
        it("reverts when batch is not yet claimable", async function () {
          await mintDeposit();
          await expect(contracts.threeXBatchProcessing.connect(depositor).claimAndStake(batchId)).to.be.revertedWith(
            "not yet claimable"
          );
        });
        it("reverts when the batchType is Redeem", async function () {
          //Prepare claimable redeem batch
          await mintAndClaim();
          await contracts.token.setToken
            .connect(depositor)
            .approve(contracts.threeXBatchProcessing.address, parseEther("1"));
          await contracts.threeXBatchProcessing.connect(depositor).depositForRedeem(parseEther("1"));
          await provider.send("evm_increaseTime", [1800]);
          const batchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();

          await contracts.threeXBatchProcessing.connect(owner).batchRedeem();

          //Actual Test
          await expect(contracts.threeXBatchProcessing.connect(depositor).claimAndStake(batchId)).to.be.revertedWith(
            "ERC20: transfer amount exceeds balance"
          );
        });
      });
    });
    context("success", function () {
      it("batch mints", async function () {
        await mintDeposit();
        await timeTravel(1800);

        expect(await contracts.threeXBatchProcessing.connect(owner).batchMint()).to.emit(
          contracts.threeXBatchProcessing,
          "BatchMinted"
        );
        expectBigNumberCloseTo(
          await contracts.token.setToken.balanceOf(contracts.threeXBatchProcessing.address),
          parseEther("1283.232294321335542932"),
          parseEther("0.00015")
        );
      });
      it("mints twice", async () => {
        await mintAndClaim();
        await mintAndClaim();
      });
      it("mints early when mintThreshold is met", async function () {
        await contracts.threeXBatchProcessing
          .connect(owner)
          .setProcessingThreshold(1800, 0, BigNumber.from("10000000"));
        await mintDeposit();
        await expect(contracts.threeXBatchProcessing.connect(owner).batchMint()).to.emit(
          contracts.threeXBatchProcessing,
          "BatchMinted"
        );
      });
      it("advances to the next batch", async function () {
        await mintDeposit();

        await timeTravel(1800);

        const previousMintBatchId = await contracts.threeXBatchProcessing.currentMintBatchId();
        await contracts.threeXBatchProcessing.connect(owner).batchMint();

        const previousBatch = await contracts.threeXBatchProcessing.getBatch(previousMintBatchId);
        expect(previousBatch.claimable).to.equal(true);

        const currentMintBatchId = await contracts.threeXBatchProcessing.currentMintBatchId();
        expect(currentMintBatchId).to.not.equal(previousMintBatchId);
      });
    });
    context("reverts", function () {
      it("reverts when minting too early", async function () {
        await mintDeposit();
        await expect(contracts.threeXBatchProcessing.connect(owner).batchMint()).to.be.revertedWith(
          "can not execute batch mint yet"
        );
      });
      it("reverts when called by someone other the keeper", async function () {
        await mintDeposit();

        await provider.send("evm_increaseTime", [1800]);

        await expect(contracts.threeXBatchProcessing.connect(depositor).batchMint()).to.be.revertedWith(
          "you dont have the right role"
        );
      });
      it("reverts when slippage is too high", async () => {
        await contracts.threeXBatchProcessing.connect(owner).setSlippage(0, 0);
        await mintDeposit();
        await timeTravel(1800);

        await expect(contracts.threeXBatchProcessing.connect(owner).batchMint()).to.be.revertedWith(
          "slippage too high"
        );
      });
    });
  });

  describe("redeeming", function () {
    beforeEach(async function () {
      await mintAndClaim();
    });
    context("depositing", function () {
      describe("batch struct", () => {
        it("increments suppliedTokenBalance and unclaimedShares when a redeem deposit is made", async () => {
          const batchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
          await redeemDeposit();
          const batch = await redeemSubject(batchId);
          expect(batch.suppliedTokenBalance).to.equal(parseEther("1"));
          expect(batch.claimable).to.equal(false);
          expect(batch.unclaimedShares).to.equal(parseEther("1"));
        });
        it("increments suppliedTokenBalance and unclaimedShares when multiple deposits are made", async () => {
          const batchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
          await redeemDeposit(); // 1
          await redeemDeposit(); // 1
          await redeemDeposit(); // 1
          const batch = await redeemSubject(batchId);
          expect(batch.claimableTokenBalance).to.equal(parseEther("0"));
          expect(batch.suppliedTokenBalance).to.equal(parseEther("3"));
          expect(batch.claimable).to.equal(false);
          expect(batch.unclaimedShares).to.equal(parseEther("3"));
        });
        it("updates struct when batch is redeemed", async () => {
          const batchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
          await redeemDeposit(); // 1
          await timeTravel(1800); // wait enough time to redeem batch
          await contracts.threeXBatchProcessing.connect(owner).batchRedeem();

          const batch = await redeemSubject(batchId);
          expect(batch.suppliedTokenBalance).to.equal(parseEther("1"));
          expect(batch.claimable).to.equal(true);
          expect(batch.unclaimedShares).to.equal(parseEther("1"));
        });
        it("decrements unclaimedShares and claimable when claim is made", async () => {
          const batchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
          await redeemDeposit(); // 10
          await timeTravel(1800); // wait enough time to redeem batch
          await contracts.threeXBatchProcessing.batchRedeem();
          await contracts.threeXBatchProcessing.connect(depositor).claim(batchId, depositor.address);

          const batch = await redeemSubject(batchId);
          expect(batch.claimableTokenBalance).to.equal(parseEther("0"));
          expect(batch.claimable).to.equal(true);
          expect(batch.unclaimedShares).to.equal(parseEther("0"));
        });
      });
      it("deposits setToken in the current redeemBatch", async function () {
        await contracts.token.setToken
          .connect(depositor)
          .approve(contracts.threeXBatchProcessing.address, parseEther("1"));
        const result = await contracts.threeXBatchProcessing.connect(depositor).depositForRedeem(parseEther("1"));
        await expect(result)
          .to.emit(contracts.threeXBatchProcessing, "Deposit")
          .withArgs(depositor.address, parseEther("1"));
        expect(await contracts.token.setToken.balanceOf(await contracts.threeXBatchProcessing.batchStorage())).to.equal(
          parseEther("1")
        );
        const currentRedeemBatchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
        const currentBatch = await contracts.threeXBatchProcessing.getBatch(currentRedeemBatchId);
        expect(currentBatch.sourceTokenBalance).to.equal(parseEther("1"));
        expect(currentBatch.unclaimedShares).to.equal(parseEther("1"));
      });
      it("adds the redeemBatch to the users batches", async function () {
        await redeemDeposit();

        const currentRedeemBatchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
        expect(await contracts.threeXStorage.accountBatches(depositor.address, 1)).to.equal(currentRedeemBatchId);
      });
      it("allows multiple deposits", async function () {
        await sendERC20(contracts.token.usdc, usdcWhale, depositor1.address, BigNumber.from("1000000000"));
        await sendERC20(contracts.token.usdc, usdcWhale, depositor2.address, BigNumber.from("1000000000"));
        await mintAndClaim(depositor1);
        await mintAndClaim(depositor2);
        await redeemDeposit();
        await redeemDeposit(1, depositor1);
        await redeemDeposit(0.5, depositor2);
        await redeemDeposit(0.5, depositor2);
        const currentRedeemBatchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
        const currentBatch = await contracts.threeXStorage.getBatch(currentRedeemBatchId);
        expect(currentBatch.sourceTokenBalance).to.equal(parseEther("3"));
        expect(currentBatch.unclaimedShares).to.equal(parseEther("3"));
        expect(await contracts.threeXStorage.accountBatches(depositor.address, 1)).to.equal(currentRedeemBatchId);
        expect(await contracts.threeXStorage.accountBatches(depositor1.address, 1)).to.equal(currentRedeemBatchId);
        expect(await contracts.threeXStorage.accountBatches(depositor2.address, 1)).to.equal(currentRedeemBatchId);
      });
    });
    it("batch redeems", async function () {
      await contracts.token.setToken
        .connect(depositor)
        .approve(contracts.threeXBatchProcessing.address, parseEther("100"));
      await contracts.threeXBatchProcessing.connect(depositor).depositForRedeem(parseEther("1"));
      await provider.send("evm_increaseTime", [1800]);

      expect(await contracts.threeXBatchProcessing.connect(owner).batchRedeem()).to.emit(
        contracts.threeXBatchProcessing,
        "BatchRedeemed"
      );
      expectBigNumberCloseTo(
        await contracts.token.usdc.balanceOf(contracts.threeXBatchProcessing.address),
        parseEther("7704.791831148143290671"),
        parseEther("0.00015")
      );
    });
    it("redeems early when redeemThreshold is met", async function () {
      await contracts.threeXBatchProcessing.connect(owner).setProcessingThreshold(1800, BigNumber.from("10000000"), 0);
      await redeemDeposit();
      await expect(contracts.threeXBatchProcessing.connect(owner).batchRedeem()).to.emit(
        contracts.threeXBatchProcessing,
        "BatchRedeemed"
      );
    });
    it("advances to the next batch", async function () {
      await redeemDeposit();
      await timeTravel(1800);

      const previousRedeemBatchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
      await contracts.threeXBatchProcessing.connect(owner).batchRedeem();

      const previousBatch = await contracts.threeXBatchProcessing.getBatch(previousRedeemBatchId);
      expect(previousBatch.claimable).to.equal(true);

      const currentRedeemBatchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
      expect(currentRedeemBatchId).to.not.equal(previousRedeemBatchId);
    });
    context("claiming", function () {
      it("reverts when batch is not yet claimable", async function () {
        await redeemDeposit();
        const batchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
        await expect(
          contracts.threeXBatchProcessing.connect(depositor).claim(batchId, depositor.address)
        ).to.be.revertedWith("not yet claimable");
      });
      it("claim batch successfully", async function () {
        await redeemDeposit();
        await timeTravel(1800);
        const batchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
        await contracts.threeXBatchProcessing.connect(owner).batchRedeem();

        await timeTravel(1000);
        expect(await contracts.threeXBatchProcessing.connect(depositor).claim(batchId, depositor.address)).to.emit(
          contracts.threeXBatchProcessing,
          "Claimed"
        );
        expectBigNumberCloseTo(
          await contracts.token.usdc.balanceOf(depositor.address),
          parseEther("7704.746559839569104981"),
          parseEther("0.00015")
        );
      });
    });
  });
  describe("withdrawing from batch", function () {
    let batchId;
    context("mint batch withdrawal", () => {
      beforeEach(async function () {
        await contracts.threeXBatchProcessing
          .connect(depositor)
          .depositForMint(BigNumber.from("1000000000"), depositor.address);
        batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
      });
      it("transfers usdc to depositor after withdraw", async function () {
        const balanceBefore = await contracts.token.usdc.balanceOf(depositor.address);
        await contracts.threeXBatchProcessing
          .connect(depositor)
          ["withdrawFromBatch(bytes32,uint256,address)"](batchId, BigNumber.from("1000000000"), depositor.address);
        const balanceAfter = await contracts.token.usdc.balanceOf(depositor.address);
        expect(balanceAfter.sub(balanceBefore)).to.equal(BigNumber.from("1000000000"));
      });
    });
    context("redeem batch withdrawal", () => {
      beforeEach(async function () {
        await mintAndClaim();
        await contracts.token.setToken
          .connect(depositor)
          .approve(contracts.threeXBatchProcessing.address, parseEther("10"));
        await contracts.threeXBatchProcessing.connect(depositor).depositForRedeem(parseEther("1"));
        batchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
      });
      it("transfers set token to depositor after withdraw", async function () {
        await contracts.threeXBatchProcessing
          .connect(depositor)
          ["withdrawFromBatch(bytes32,uint256,address)"](batchId, parseEther("1"), depositor.address);
        expectBigNumberCloseTo(
          await contracts.token.setToken.balanceOf(depositor.address),
          parseEther("128.313565895760310099"),
          parseEther("0.00015")
        );
      });
    });
  });

  context("withdrawing from batch", function () {
    describe("batch struct", () => {
      const withdraw = async (batchId: string, amount?: BigNumber) => {
        return contracts.threeXBatchProcessing
          .connect(depositor)
          ["withdrawFromBatch(bytes32,uint256,address)"](
            batchId,
            amount ? amount : parseEther("10"),
            depositor.address
          );
      };
      const subject = async (batchId) => {
        const adapter = new ThreeXBatchAdapter(contracts.threeXBatchProcessing);
        const batch = await adapter.getBatch(batchId);
        return batch;
      };
      context("redeem batch withdrawal", () => {
        beforeEach(async function () {
          await mintAndClaim();
          await redeemDeposit();
        });

        it("prevents stealing funds", async () => {
          const batchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();

          await expectRevert(
            contracts.threeXBatchProcessing
              .connect(depositor)
              ["withdrawFromBatch(bytes32,uint256,address,address)"](
                batchId,
                parseEther("1"),
                depositor.address,
                owner.address
              ),
            "won't send"
          );
        });

        it("decrements suppliedTokenBalance and unclaimedShares when a withdrawal is made", async () => {
          await mintAndClaim();
          await redeemDeposit();

          const batchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
          const batchBefore = await subject(batchId);

          await withdraw(batchId, parseEther("1"));
          const batchAfter = await subject(batchId);
          expect(batchAfter.suppliedTokenBalance.lt(batchBefore.suppliedTokenBalance)).to.be.true;
          expect(batchAfter.unclaimedShares.lt(batchBefore.unclaimedShares)).to.be.true;
        });
        it("decrements suppliedTokenBalance and unclaimedShares when multiple withdrawls are made", async () => {
          await mintAndClaim();
          await redeemDeposit();
          await mintAndClaim();
          await redeemDeposit();
          await mintAndClaim();
          await redeemDeposit();

          const batchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
          const batchBefore = await subject(batchId);
          await withdraw(batchId, parseEther("1"));
          await withdraw(batchId, parseEther("1"));
          await withdraw(batchId, parseEther("1"));
          const batchAfter = await subject(batchId);
          expect(batchBefore.suppliedTokenBalance.sub(parseEther("3"))).to.equal(batchAfter.suppliedTokenBalance);
          expect(batchBefore.unclaimedShares.sub(parseEther("3"))).to.equal(batchAfter.unclaimedShares);
        });
        it("transfers set token to depositor after withdraw", async function () {
          const batchId = await contracts.threeXStorage.accountBatches(depositor.address, 1);
          await contracts.threeXBatchProcessing
            .connect(depositor)
            ["withdrawFromBatch(bytes32,uint256,address)"](batchId, BigNumber.from("1"), depositor.address);
          expectBigNumberCloseTo(
            await contracts.token.setToken.balanceOf(depositor.address),
            BigNumber.from("8297564781640256149"),
            parseEther("0.00015")
          );
        });
        it("reverts when the batch was already redeemed", async function () {
          const batchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
          await timeTravel(1800);
          await contracts.threeXBatchProcessing.connect(owner).batchRedeem();
          await expect(withdraw(batchId, parseEther("1"))).to.be.revertedWith("already processed");
        });
      });
      context("mint batch withdrawal", () => {
        beforeEach(async function () {
          await mintDeposit();
        });
        it("decrements suppliedTokenBalance and unclaimedShares when a withdrawal is made", async () => {
          const batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
          const batchBefore = await subject(batchId);
          await withdraw(batchId, BigNumber.from("10000000"));
          const batchAfter = await subject(batchId);
          expect(batchAfter.suppliedTokenBalance.lt(batchBefore.suppliedTokenBalance)).to.be.true;
          expect(batchAfter.unclaimedShares.lt(batchBefore.unclaimedShares)).to.be.true;
        });
        it("decrements suppliedTokenBalance and unclaimedShares when multiple withdrawals are made", async () => {
          const batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
          const batchBefore = await subject(batchId);
          await withdraw(batchId, BigNumber.from("1000000"));
          await withdraw(batchId, BigNumber.from("1000000"));
          await withdraw(batchId, BigNumber.from("1000000"));
          const batchAfter = await subject(batchId);
          expect(batchBefore.suppliedTokenBalance.sub(BigNumber.from("3000000"))).to.equal(
            batchAfter.suppliedTokenBalance
          );
          expect(batchBefore.unclaimedShares.sub(BigNumber.from("3000000"))).to.equal(batchAfter.unclaimedShares);
        });
        it("emits an event when withdrawn", async function () {
          const batchId = await contracts.threeXStorage.accountBatches(depositor.address, 0);
          await expect(await withdraw(batchId, BigNumber.from("10000000")))
            .to.emit(contracts.threeXBatchProcessing, "WithdrawnFromBatch")
            .withArgs(batchId, BigNumber.from("10000000"), depositor.address);
        });
        it("transfers usdc to depositor after withdraw", async function () {
          const batchId = await contracts.threeXStorage.accountBatches(depositor.address, 0);
          const balanceBefore = await contracts.token.usdc.balanceOf(depositor.address);
          await contracts.threeXBatchProcessing
            .connect(depositor)
            ["withdrawFromBatch(bytes32,uint256,address)"](batchId, BigNumber.from("10000000"), depositor.address);
          const balanceAfter = await contracts.token.usdc.balanceOf(depositor.address);
          expect(balanceAfter.sub(balanceBefore)).to.equal(BigNumber.from("10000000"));
        });
        it("reverts when the batch was already minted", async function () {
          const batchId = await contracts.threeXStorage.accountBatches(depositor.address, 0);
          await timeTravel(1800);
          await contracts.threeXBatchProcessing.batchMint();
          await expect(withdraw(batchId, BigNumber.from("1000000"))).to.be.revertedWith("already processed");
        });
      });
    });
  });

  context("depositUnclaimedSetTokenForRedeem", function () {
    it("moves set token into current redeemBatch", async function () {
      await contracts.token.usdc
        .connect(depositor)
        .approve(contracts.threeXBatchProcessing.address, parseEther("10000"));
      await contracts.threeXBatchProcessing
        .connect(depositor)
        .depositForMint(BigNumber.from("1000000000"), depositor.address);
      const batchId = await contracts.threeXStorage.accountBatches(depositor.address, 0);
      await provider.send("evm_increaseTime", [1800]);
      await provider.send("evm_mine", []);
      await contracts.threeXBatchProcessing.connect(owner).batchMint();
      const mintedButter = await contracts.token.setToken.balanceOf(
        await contracts.threeXBatchProcessing.batchStorage()
      );
      expect(
        await contracts.threeXBatchProcessing
          .connect(depositor)
          .moveUnclaimedIntoCurrentBatch([batchId], [BigNumber.from("1000000000")], false)
      ).to.emit(contracts.threeXBatchProcessing, "DepositedUnclaimedSetTokenForRedeem");
      const currentRedeemBatchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
      const redeemBatch = await contracts.threeXBatchProcessing.getBatch(currentRedeemBatchId);
      expect(redeemBatch.sourceTokenBalance).to.be.equal(mintedButter);
    });
  });

  context("paused", function () {
    let claimableMintId;
    let claimableRedeemId;
    let currentMintId;
    let currentRedeemId;

    beforeEach(async function () {
      //Prepare MintBatches
      claimableMintId = await contracts.threeXBatchProcessing.currentMintBatchId();
      await mintDeposit();
      await timeTravel(1800);
      await contracts.threeXBatchProcessing.connect(owner).batchMint();

      //Prepare RedeemBatches
      claimableRedeemId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
      await mintAndClaim();
      await redeemDeposit();
      await contracts.threeXBatchProcessing.connect(owner).batchRedeem();
      currentRedeemId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
      await mintAndClaim();
      await redeemDeposit();

      //Prepare 2. MintBatch
      currentMintId = await contracts.threeXBatchProcessing.currentMintBatchId();
      await mintDeposit();

      //Allow token for later usage
      await contracts.token.setToken
        .connect(depositor)
        .approve(contracts.threeXBatchProcessing.address, parseEther("10"));
      await contracts.token.usdc.connect(depositor).approve(contracts.threeXBatchProcessing.address, parseEther("10"));

      //Pause Contract
      await contracts.threeXBatchProcessing.connect(owner).pause();
    });
    it("prevents deposit for mint", async function () {
      await expectRevert(
        contracts.threeXBatchProcessing.connect(depositor).depositForMint(parseEther("1"), depositor.address),
        "Pausable: paused"
      );
    });
    it("prevents deposit for redeem", async function () {
      await expectRevert(
        contracts.threeXBatchProcessing.connect(depositor).depositForRedeem(parseEther("1")),
        "Pausable: paused"
      );
    });
    it("prevents mint", async function () {
      await expectRevert(contracts.threeXBatchProcessing.connect(owner).batchMint(), "Pausable: paused");
    });
    it("prevents redeem", async function () {
      await expectRevert(contracts.threeXBatchProcessing.connect(owner).batchRedeem(), "Pausable: paused");
    });
    it("prevents to move unclaimed deposits into the current batch", async function () {
      const batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
      await expectRevert(
        contracts.threeXBatchProcessing
          .connect(depositor)
          .moveUnclaimedIntoCurrentBatch([batchId], [parseEther("1")], true),
        "Pausable: paused"
      );
    });
    it("still allows to withdraw from mint batch", async function () {
      await expect(
        contracts.threeXBatchProcessing
          .connect(depositor)
          ["withdrawFromBatch(bytes32,uint256,address)"](currentMintId, BigNumber.from("10000000"), depositor.address)
      )
        .to.emit(contracts.threeXBatchProcessing, "WithdrawnFromBatch")
        .withArgs(currentMintId, BigNumber.from("10000000"), depositor.address);
    });
    it("still allows to withdraw from redeem batch", async function () {
      await expect(
        contracts.threeXBatchProcessing
          .connect(depositor)
          ["withdrawFromBatch(bytes32,uint256,address)"](currentRedeemId, parseEther("1"), depositor.address)
      )
        .to.emit(contracts.threeXBatchProcessing, "WithdrawnFromBatch")
        .withArgs(currentRedeemId, parseEther("1"), depositor.address);
    });
    it("still allows to claim minted butter", async function () {
      await expect(contracts.threeXBatchProcessing.connect(depositor).claim(claimableMintId, depositor.address))
        .to.emit(contracts.threeXBatchProcessing, "Claimed")
        .withArgs(depositor.address, BatchType.Mint, BigNumber.from("10000000"), BigNumber.from("92739561430939790"));
    });
    it("still allows to claim redemeed usdc", async function () {
      await expect(contracts.threeXBatchProcessing.connect(depositor).claim(claimableRedeemId, depositor.address))
        .to.emit(contracts.threeXBatchProcessing, "Claimed")
        .withArgs(depositor.address, BatchType.Redeem, parseEther("1"), BigNumber.from("108930689"));
    });
    it("allows deposits for minting after unpausing", async function () {
      await contracts.threeXBatchProcessing.unpause();

      await expect(
        contracts.threeXBatchProcessing
          .connect(depositor)
          .depositForMint(BigNumber.from("100000000"), depositor.address)
      )
        .to.emit(contracts.threeXBatchProcessing, "Deposit")
        .withArgs(depositor.address, BigNumber.from("100000000"));
    });
    it("allows deposits for redeeming after unpausing", async function () {
      await contracts.threeXBatchProcessing.unpause();

      await expect(contracts.threeXBatchProcessing.connect(depositor).depositForRedeem(parseEther("1")))
        .to.emit(contracts.threeXBatchProcessing, "Deposit")
        .withArgs(depositor.address, parseEther("1"));
    });
  });

  describe("allows only clients to interact with the storage contract", () => {
    const deposit = async (amount?: number) => {
      await contracts.threeXBatchProcessing
        .connect(depositor)
        .depositForMint(parseEther(amount ? amount.toString() : "10"), depositor.address);
    };
    it("reverts when a non client tries to deposit", async function () {
      const batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
      await expect(
        contracts.threeXStorage.connect(depositor).deposit(batchId, depositor.address, parseEther("10"))
      ).to.be.revertedWith("!allowed");
    });
    it("reverts when a non client tries to claim", async function () {
      const batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
      deposit();
      await expect(
        contracts.threeXStorage
          .connect(depositor)
          .claim(batchId, depositor.address, parseEther("10"), depositor.address)
      ).to.be.revertedWith("!allowed");
    });
    it("reverts when a non client tries to withdraw", async function () {
      const batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
      deposit();
      await expect(
        contracts.threeXStorage
          .connect(depositor)
          .withdraw(batchId, depositor.address, parseEther("10"), depositor.address)
      ).to.be.revertedWith("!allowed");
    });
    it("reverts when a non client tries to withdrawSourceTokenFromBatch", async function () {
      const batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
      deposit();
      await expect(contracts.threeXStorage.connect(depositor).withdrawSourceTokenFromBatch(batchId)).to.be.revertedWith(
        "!allowed"
      );
    });
    it("reverts when a non client tries to moveUnclaimedIntoCurrentBatch", async function () {
      const batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
      const redeemId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
      deposit();
      await expect(
        contracts.threeXStorage
          .connect(depositor)
          .moveUnclaimedIntoCurrentBatch(batchId, redeemId, depositor.address, parseEther("1"))
      ).to.be.revertedWith("!allowed");
    });
  });
  describe("redemption fee", () => {
    context("sets RedemptionFee", () => {
      it("sets a redemptionRate when called with DAO role", async () => {
        await expect(await contracts.threeXBatchProcessing.setRedemptionFee(100, owner.address))
          .to.emit(contracts.threeXBatchProcessing, "RedemptionFeeUpdated")
          .withArgs(100, owner.address);

        const redemptionFee = await contracts.threeXBatchProcessing.redemptionFee();
        expect(redemptionFee[0]).to.equal(BigNumber.from("0"));
        expect(redemptionFee[1]).to.equal(BigNumber.from("100"));
        expect(redemptionFee[2]).to.equal(owner.address);
      });
      it("reverts when setting redemptionRate without DAO role", async () => {
        await expectRevert(
          contracts.threeXBatchProcessing.connect(depositor).setRedemptionFee(100, owner.address),
          "you dont have the right role"
        );
      });
      it("reverts when setting a feeRate higher than 1%", async () => {
        await expectRevert(contracts.threeXBatchProcessing.setRedemptionFee(1000, owner.address), "dont be greedy");
      });
    });
    context("with redemption fee", () => {
      let batchId;
      const depositAmount = parseEther("1");
      const feeRate = 100;
      beforeEach(async () => {
        await mintAndClaim();
        await redeemDeposit();
        await contracts.threeXBatchProcessing.setRedemptionFee(feeRate, owner.address);
        await timeTravel(1800);
        batchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
        await contracts.threeXBatchProcessing.connect(owner).batchRedeem();
      });
      it("takes the fee", async () => {
        const accountBalance = await contracts.threeXBatchProcessing.getAccountBalance(batchId, depositor.address);
        const batch = await contracts.threeXBatchProcessing.getBatch(batchId);
        const claimAmountWithoutFee = batch.targetTokenBalance.mul(accountBalance).div(batch.unclaimedShares);
        const fee = claimAmountWithoutFee.mul(feeRate).div(10000);
        const oldBal = await contracts.token.usdc.balanceOf(depositor.address);

        await expect(await contracts.threeXBatchProcessing.connect(depositor).claim(batchId, depositor.address))
          .to.emit(contracts.threeXBatchProcessing, "Claimed")
          .withArgs(depositor.address, BatchType.Redeem, depositAmount, claimAmountWithoutFee.sub(fee));

        const newBal = await contracts.token.usdc.balanceOf(depositor.address);
        expect(newBal).to.equal(oldBal.add(claimAmountWithoutFee.sub(fee)));

        expect((await contracts.threeXBatchProcessing.redemptionFee()).accumulated).to.equal(fee);
      });
    });
  });
});

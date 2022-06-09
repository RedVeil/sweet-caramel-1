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
import { expectBigNumberCloseTo } from "../../lib/utils/expectValue";
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

const provider = waffle.provider;

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

let owner: SignerWithAddress, depositor: SignerWithAddress;
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
    "3X",
    "3X"
  );
  await setTokenCreator.create(
    [Y_D3_ADDRESS, Y_3EUR_ADDRESS],
    [parseEther("50"), parseEther("50")],
    [SET_BASIC_ISSUANCE_MODULE_ADDRESS],
    owner.address,
    "3X",
    "3X"
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

async function mintAndClaim(): Promise<void> {
  await contracts.token.usdc.connect(depositor).approve(contracts.threeXBatchProcessing.address, parseEther("10000"));
  await contracts.threeXBatchProcessing
    .connect(depositor)
    .depositForMint(BigNumber.from("1000000000"), depositor.address);
  const mintId = await contracts.threeXBatchProcessing.currentMintBatchId();
  await timeTravel(1800);
  await contracts.threeXBatchProcessing.connect(owner).batchMint();
  await contracts.threeXBatchProcessing.connect(depositor).claim(mintId, depositor.address);
}

describe("ThreeXBatchProcessing - Fork", () => {
  before(async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.FORKING_RPC_URL,
            blockNumber: 14879223,
          },
        },
      ],
    });
  });
  beforeEach(async () => {
    [owner, depositor] = await ethers.getSigners();
    contracts = await deployContracts();
    usdcWhale = await impersonateSigner(USDC_WHALE_ADDRESS);
    await sendEth(USDC_WHALE_ADDRESS, "10");
    await sendERC20(contracts.token.usdc, usdcWhale, depositor.address, BigNumber.from("20000000000"));
    await contracts.token.usdc
      .connect(depositor)
      .approve(contracts.threeXBatchProcessing.address, parseEther("100000000"));
    await contracts.threeXBatchProcessing.setSlippage(45, 80);
  });
  describe("minting", function () {
    it("batch mints", async function () {
      await sendERC20(contracts.token.usdc, usdcWhale, depositor.address, BigNumber.from("100000000000"));
      await contracts.token.usdc
        .connect(depositor)
        .approve(contracts.threeXBatchProcessing.address, parseEther("100000"));
      await contracts.threeXBatchProcessing
        .connect(depositor)
        .depositForMint(BigNumber.from("100000000000"), depositor.address);
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
    context("claiming", function () {
      let batchId;
      beforeEach(async function () {
        await contracts.token.usdc
          .connect(depositor)
          .approve(contracts.threeXBatchProcessing.address, parseEther("10000"));
        await contracts.threeXBatchProcessing
          .connect(depositor)
          .depositForMint(BigNumber.from("10000000000"), depositor.address);
        batchId = await contracts.threeXBatchProcessing.currentMintBatchId();

        await timeTravel(1800);
        await contracts.threeXBatchProcessing.connect(owner).batchMint();
      });
      it("claims batch successfully", async function () {
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
      });
    });
  });

  describe("redeeming", function () {
    beforeEach(async function () {
      await mintAndClaim();
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
    context("claiming", function () {
      let batchId;
      beforeEach(async function () {
        await contracts.token.setToken
          .connect(depositor)
          .approve(contracts.threeXBatchProcessing.address, parseEther("100"));
        const bal = await contracts.token.setToken.balanceOf(depositor.address);

        await contracts.threeXBatchProcessing.connect(depositor).depositForRedeem(parseEther("1"));
        await timeTravel(1800);
        batchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
        await contracts.threeXBatchProcessing.connect(owner).batchRedeem();
      });
      it("claim batch successfully", async function () {
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
});

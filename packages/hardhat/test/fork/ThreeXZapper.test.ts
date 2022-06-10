import { parseEther } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import BasicIssuanceModule from "@setprotocol/set-protocol-v2/artifacts/contracts/protocol/modules/BasicIssuanceModule.sol/BasicIssuanceModule.json";
import SetToken from "@setprotocol/set-protocol-v2/artifacts/contracts/protocol/SetToken.sol/SetToken.json";
import SetTokenCreator from "@setprotocol/set-protocol-v2/artifacts/contracts/protocol/SetTokenCreator.sol/SetTokenCreator.json";
import { expect } from "chai";
import { BigNumber, Contract, utils } from "ethers";
import { Signer } from "ethers/lib/ethers";
import { ethers, network, waffle } from "hardhat";
import { ADDRESS_ZERO, MAX_UINT_256 } from "../../lib/external/SetToken/utils/constants";
import { expectBigNumberCloseTo, expectRevert } from "../../lib/utils/expectValue";
import { impersonateSigner } from "../../lib/utils/test/impersonateSigner";
import { sendEth } from "../../lib/utils/test/sendEth";
import { ThreeXBatchVault } from "../../typechain/ThreeXBatchVault";
import {
  ERC20,
  ThreeXBatchProcessing,
  MockERC20,
  Staking,
  MockYearnV2Vault__factory,
  ThreeXZapper,
} from "../../typechain";

const provider = waffle.provider;

const DAI_WHALE_ADDRESS = "0x5d38b4e4783e34e2301a2a36c39a03c45798c4dd";
const USDC_WHALE_ADDRESS = "0xcffad3200574698b78f32232aa9d63eabd290703";

const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const THREE_POOL_ADDRESS = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7";

const SET_TOKEN_CREATOR_ADDRESS = "0xeF72D3278dC3Eba6Dc2614965308d1435FFd748a";
const SET_BASIC_ISSUANCE_MODULE_ADDRESS = "0xd8EF3cACe8b4907117a45B0b125c68560532F94D";

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
  dai: ERC20;
  pop: MockERC20;
  setToken: ERC20;
}
interface Contracts {
  token: Token;
  threeXBatchProcessing: ThreeXBatchProcessing;
  staking: Staking;
  threeXStorage: ThreeXBatchVault;
  zapper: ThreeXZapper;
}

let contracts: Contracts;

let owner: SignerWithAddress, depositor: SignerWithAddress;
let daiWhale: Signer;
let usdcWhale: Signer;

async function deployToken(): Promise<Token> {
  const MockERC20 = await ethers.getContractFactory("MockERC20");

  const pop = await (await MockERC20.deploy("POP", "POP", 18)).deployed();

  const usdc = (await ethers.getContractAt(
    "@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20",
    USDC_ADDRESS
  )) as ERC20;

  const dai = (await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20", DAI_ADDRESS)) as ERC20;

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
    dai,
    setToken,
  };
}

async function deployContracts(): Promise<Contracts> {
  const token = await deployToken();

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

  const rewardsEscrow = await (
    await (await ethers.getContractFactory("RewardsEscrow")).deploy(token.pop.address)
  ).deployed();

  const staking = await (
    await (
      await ethers.getContractFactory("Staking")
    ).deploy(token.pop.address, token.setToken.address, rewardsEscrow.address)
  ).deployed();

  const yearnVaultD3 = MockYearnV2Vault__factory.connect(Y_D3_ADDRESS, owner);
  const yearnVault3EUR = MockYearnV2Vault__factory.connect(Y_3EUR_ADDRESS, owner);

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

  await contractRegistry
    .connect(owner)
    .addContract(ethers.utils.id("ThreeXBatchProcessing"), threeXBatchProcessing.address, ethers.utils.id("1"));

  await keeperIncentive
    .connect(owner)
    .createIncentive(utils.formatBytes32String("ThreeXBatchProcessing"), 0, true, false);

  await keeperIncentive
    .connect(owner)
    .createIncentive(utils.formatBytes32String("ThreeXBatchProcessing"), 0, true, false);

  await keeperIncentive
    .connect(owner)
    .addControllerContract(utils.formatBytes32String("ThreeXBatchProcessing"), threeXBatchProcessing.address);

  const zapper = await (
    await (
      await ethers.getContractFactory("ThreeXZapper")
    ).deploy(contractRegistry.address, THREE_POOL_ADDRESS, [DAI_ADDRESS, USDC_ADDRESS, USDT_ADDRESS])
  ).deployed();

  await aclRegistry.grantRole(ethers.utils.id("ThreeXZapper"), zapper.address);

  await aclRegistry.grantRole(ethers.utils.id("ApprovedContract"), zapper.address);

  const threeXStorage = (await ethers.getContractAt(
    "ThreeXBatchVault",
    await threeXBatchProcessing.batchStorage()
  )) as ThreeXBatchVault;

  return {
    token,
    threeXBatchProcessing,
    threeXStorage,
    staking,
    zapper,
  };
}

const timeTravel = async (time: number) => {
  await provider.send("evm_increaseTime", [time]);
  await provider.send("evm_mine", []);
};

async function sendERC20(erc20: ERC20, whale: Signer, recipient: string, amount: BigNumber): Promise<void> {
  await erc20.connect(whale).transfer(recipient, amount);
}

async function claimAndRedeem(mintId: string): Promise<string> {
  await contracts.threeXBatchProcessing.connect(depositor).claim(mintId, depositor.address);
  await contracts.token.setToken.connect(depositor).approve(contracts.threeXBatchProcessing.address, parseEther("10"));
  await contracts.threeXBatchProcessing.connect(depositor).depositForRedeem(parseEther("10"));
  const redeemId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
  await timeTravel(1800);
  await contracts.threeXBatchProcessing.batchRedeem();
  return redeemId;
}

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
    [owner, depositor] = await ethers.getSigners();
    contracts = await deployContracts();
    await contracts.threeXBatchProcessing.setSlippage(45, 80);

    daiWhale = await impersonateSigner(DAI_WHALE_ADDRESS);
    await sendEth(DAI_WHALE_ADDRESS, "10");
    await sendERC20(contracts.token.dai, daiWhale, depositor.address, parseEther("20000"));

    usdcWhale = await impersonateSigner(USDC_WHALE_ADDRESS);
    await sendEth(USDC_WHALE_ADDRESS, "10");
    await sendERC20(contracts.token.usdc, usdcWhale, depositor.address, BigNumber.from("20000000000"));

    await contracts.token.dai.connect(depositor).approve(contracts.zapper.address, MAX_UINT_256);
    await contracts.token.usdc.connect(depositor).approve(contracts.threeXBatchProcessing.address, MAX_UINT_256);
  });
  context("zapIntoBatch", function () {
    let batchId;
    beforeEach(async function () {
      batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
    });
    it("zaps into batch successfully", async function () {
      expect(await contracts.zapper.connect(depositor).zapIntoBatch(parseEther("1000"), 0, 1, 0))
        .to.emit(contracts.zapper, "ZappedIntoBatch")
        .withArgs(BigNumber.from("999894685"), depositor.address);

      const batch = await contracts.threeXBatchProcessing.getBatch(batchId);
      expect(batch.sourceTokenBalance).to.equal(BigNumber.from("999894685"));
    });
    it("reverts when slippage is too high", async () => {
      await expectRevert(
        contracts.zapper.connect(depositor).zapIntoBatch(parseEther("10000"), 0, 1, parseEther("100000")),
        "slippage too high"
      );
    });
  });
  context("zapOutOfBatch", function () {
    let batchId;
    beforeEach(async function () {
      await contracts.threeXBatchProcessing
        .connect(depositor)
        .depositForMint(BigNumber.from("100000000"), depositor.address);
      batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
    });
    it("zaps out of batch successfully", async function () {
      expect(await contracts.zapper.connect(depositor).zapOutOfBatch(batchId, BigNumber.from("100000000"), 1, 0, 0))
        .to.emit(contracts.zapper, "ZappedOutOfBatch")
        .withArgs(
          batchId,
          1,
          parseEther("998.212262053729723696"),
          parseEther("10.009900118676774612"),
          depositor.address
        );

      expectBigNumberCloseTo(
        await contracts.token.dai.balanceOf(depositor.address),
        parseEther("39010"),
        parseEther("0.000015")
      );

      const batch = await contracts.threeXBatchProcessing.getBatch(batchId);
      expect(batch.unclaimedShares).to.equal(0);
      expect(batch.targetTokenBalance).to.equal(0);
    });
    it("reverts when slippage is too high", async () => {
      await expectRevert(
        contracts.zapper
          .connect(depositor)
          .zapOutOfBatch(batchId, BigNumber.from("10000000"), 1, 0, parseEther("10000")),
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
  });
  describe("claimAndSwap", () => {
    let batchId;
    beforeEach(async function () {
      await contracts.token.dai
        .connect(depositor)
        .approve(contracts.threeXBatchProcessing.address, parseEther("10000"));
      await contracts.threeXBatchProcessing
        .connect(depositor)
        .depositForMint(BigNumber.from("10000000000"), depositor.address);
      const mintBatchId = await contracts.threeXBatchProcessing.currentMintBatchId();

      await timeTravel(1800);
      await contracts.threeXBatchProcessing.connect(owner).batchMint();
      await contracts.threeXBatchProcessing.connect(depositor).claim(mintBatchId, depositor.address);
      await contracts.token.setToken
        .connect(depositor)
        .approve(contracts.threeXBatchProcessing.address, parseEther("10000"));
      await contracts.threeXBatchProcessing.connect(depositor).depositForRedeem(parseEther("10"));
      batchId = await contracts.threeXBatchProcessing.currentRedeemBatchId();
      await timeTravel(1800);
      await contracts.threeXBatchProcessing.connect(owner).batchRedeem();
      await timeTravel(1000);
    });
    it("claims batch and swaps into DAI", async function () {
      expect(await contracts.zapper.connect(depositor).claimAndSwapToStable(batchId, 1, 0, 0)).to.emit(
        contracts.zapper,
        "ClaimedIntoStable"
      );
      expectBigNumberCloseTo(
        await contracts.token.dai.balanceOf(depositor.address),
        parseEther("10837.099834769427980844"),
        parseEther("0.00015")
      );
    });
    it("reverts when batch is of type mint", async function () {
      await contracts.threeXBatchProcessing
        .connect(depositor)
        .depositForMint(BigNumber.from("100000000"), depositor.address);
      batchId = await contracts.threeXBatchProcessing.currentMintBatchId();
      await expectRevert(contracts.zapper.connect(depositor).claimAndSwapToStable(batchId, 1, 0, 0), "!redeem");
    });
    it("reverts when slippage is too high", async () => {
      const redeemId = await claimAndRedeem(batchId);
      await expectRevert(
        contracts.zapper.connect(depositor).claimAndSwapToStable(redeemId, 1, 0, parseEther("10000")),
        "slippage too high"
      );
    });
  });
});

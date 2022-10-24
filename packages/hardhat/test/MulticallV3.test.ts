import { expect } from "chai";
import { ethers, waffle, network } from "hardhat";
import { deployMockContract, MockContract } from "ethereum-waffle";
import { ADDRESS_ZERO, MAX_UINT_256, ZERO } from "../lib/external/SetToken/utils/constants";
import { parseEther } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import yearnRegistryABI from "../contracts/mocks/abis/yearnRegistry.json";
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
import { DAYS, getErc20, impersonateSigner, sendEth, setTimestamp, timeTravel, transferErc20 } from "../lib/utils/test";

const MINUTE = 60;
const DAY = 60 * 60 * 24;
const DEPOSIT_AMOUNT = parseEther("1000");
const FEE_MULTIPLIER = parseEther("0.0001"); // 1e14

let owner: SignerWithAddress,
  depositor: SignerWithAddress,
  depositor2: SignerWithAddress,
  receiver: SignerWithAddress,
  rewardsManager: SignerWithAddress,
  zapper: SignerWithAddress;
let contracts: Contracts;

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
  const vault = await (await Vault.deploy()).deployed();
  await vault.initialize(
    depositToken.address,
    yearnRegistry.address,
    contractRegistry.address,
    ADDRESS_ZERO,
    ADDRESS_ZERO,
    {
      deposit: 0,
      withdrawal: FEE_MULTIPLIER.mul(50),
      management: FEE_MULTIPLIER.mul(200),
      performance: FEE_MULTIPLIER.mul(2000),
    },
    {
      minWithdrawalAmount: parseEther("100"),
      incentiveVigBps: 0,
      keeperPayout: 0,
    }
  );

  const Staking = await ethers.getContractFactory("Staking");
  const staking = await (await Staking.deploy(rewardsToken.address, vault.address, rewardsEscrow.address)).deployed();
  await staking.connect(owner).setVault(vault.address);

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
  await aclRegistry.grantRole(ethers.utils.id("VaultsController"), owner.address);

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

const MULTICALLV3_ABI = [
  {
    inputs: [],
    name: "getBasefee",
    outputs: [{ internalType: "uint256", name: "basefee", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getChainId",
    outputs: [{ internalType: "uint256", name: "chainid", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getBlockNumber",
    outputs: [{ internalType: "uint256", name: "blockNumber", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "target", type: "address" },
          { internalType: "bytes", name: "callData", type: "bytes" },
        ],
        internalType: "struct Multicall3.Call[]",
        name: "calls",
        type: "tuple[]",
      },
    ],
    name: "aggregate",
    outputs: [
      { internalType: "uint256", name: "blockNumber", type: "uint256" },
      { internalType: "bytes[]", name: "returnData", type: "bytes[]" },
    ],
    stateMutability: "payable",
    type: "function",
  },
];

const prepareManager = async () => {
  await network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: process.env.FORKING_RPC_URL,
          blockNumber: 13677417,
        },
      },
    ],
  });
};

async function mm() {}

describe("Vault", () => {
  //beforeEach(async () => {
  //  await prepareManager();
  //  // [owner, depositor, depositor2, receiver, rewardsManager, zapper] = await ethers.getSigners();
  //  // contracts = await deployContracts();
  //  //
  //  console.log(res);
  //});

  describe("xxx", async () => {
    it("ttt", async () => {
      const signer = await impersonateSigner("0xF023E5eF2Eb3b8747cBaD5B3847813b66E9BFdD7");

      const multicall = await ethers.getContractAt(
        MULTICALLV3_ABI,
        "0xcA11bde05977b3631167028862bE2a173976CA11",
        signer
      );
      const res = await multicall.getBlockNumber();
      console.log(res);
    });
  });
});

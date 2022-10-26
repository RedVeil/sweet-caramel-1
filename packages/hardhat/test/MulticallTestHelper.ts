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

interface DSProxyFactory {
  build(): Promise<string>;
}

export interface Contracts {
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

const FEE_MULTIPLIER = parseEther("0.0001"); // 1e14

export async function deployContracts(owner, rewardsManager): Promise<Contracts> {
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
      deposit: 10,
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
  // this should be deposit token address?
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

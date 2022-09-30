import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import { VaultStaking } from "packages/hardhat/typechain/VaultStaking";

import { ADDRESS_ZERO } from "../../../lib/external/SetToken/utils/constants";
import { getNamedAccountsByChainId } from "../../../lib/utils/getNamedAccounts";
import { impersonateSigner } from "../../../lib/utils/test";
import { ACLRegistry, ContractRegistry, ERC20, Faucet, MockERC20, RewardsEscrow, Staking, Vault } from "../../../typechain";

export interface Contracts {
  faucet: Faucet;
  asset: ERC20;
  vault: Vault;
  contractRegistry: ContractRegistry;
  staking: VaultStaking;
}
const FEE_MULTIPLIER = parseEther("0.0001"); // 1e14
const DAO_ADDRESS = "0x92a1cb552d0e177f3a135b4c87a4160c8f2a485f"

export const accounts = getNamedAccountsByChainId(1);

export async function deployContracts(assetAddress: string): Promise<Contracts> {
  // Deploy helper Faucet
  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = await (
    await Faucet.deploy(
      accounts.uniswapRouter /* accounts.curveAddressProvider, accounts.curveFactoryMetapoolDepositZap */
    )
  ).deployed();

  // Send ETH to Faucet
  await network.provider.send("hardhat_setBalance", [
    faucet.address,
    "0x152d02c7e14af6800000", // 100k ETH
  ]);

  // Send ETH to contract signer
  await network.provider.send("hardhat_setBalance", [
    accounts.dao,
    "0x152d02c7e14af6800000", // 100k ETH
  ]);

  const ERC20 = await ethers.getContractFactory("@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20");
  const asset = (await ERC20.attach(assetAddress)) as ERC20;

  const aclRegistry = await ethers.getContractAt("ACLRegistry", accounts.aclRegistry);
  const contractRegistry = await ethers.getContractAt("ContractRegistry", accounts.contractRegistry);

  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(
    assetAddress,
    accounts.yearnRegistry,
    accounts.contractRegistry,
    ADDRESS_ZERO,
    ADDRESS_ZERO,
    {
      deposit: 0,
      withdrawal: FEE_MULTIPLIER.mul(50),
      management: FEE_MULTIPLIER.mul(200),
      performance: FEE_MULTIPLIER.mul(2000),
    },
    {
      minWithdrawalAmount: parseEther("0"),
      incentiveVigBps: 0,
      keeperPayout: 0,
    }
  );
  await vault.deployed();

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
      accounts.contractRegistry
    )
  ).deployed();
  const dao = await impersonateSigner(DAO_ADDRESS);

  await contractRegistry
    .connect(dao)
    .addContract(ethers.utils.id("VaultFeeController"), vaultFeeController.address, ethers.utils.id("1"));

  await aclRegistry.connect(dao).grantRole(ethers.utils.id("VaultsController"), DAO_ADDRESS);

  const Staking = await ethers.getContractFactory("VaultStaking");
  const staking = await Staking.deploy(vault.address, contractRegistry.address);
  await staking.connect(dao).setVault(vault.address)
  await vault.connect(dao).setStaking(staking.address)

  return {
    faucet,
    asset,
    vault,
    contractRegistry,
    staking,
  };
}

import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers, network } from "hardhat";
import { ADDRESS_ZERO } from "../../../lib/external/SetToken/utils/constants";
import { getNamedAccountsByChainId } from "../../../lib/utils/getNamedAccounts";
import { impersonateSigner } from "../../../lib/utils/test";
import { ERC20, Faucet, Vault } from "../../../typechain";
export interface Contracts {
  faucet: Faucet;
  asset: ERC20;
  vault: Vault;
}
const FEE_MULTIPLIER = parseEther("0.0001"); // 1e14

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

  const contractRegistry = await ethers.getContractAt("ContractRegistry", accounts.contractRegistry);

  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(assetAddress, accounts.yearnRegistry, accounts.contractRegistry, ADDRESS_ZERO, {
    deposit: 0,
    withdrawal: FEE_MULTIPLIER.mul(50),
    management: FEE_MULTIPLIER.mul(200),
    performance: FEE_MULTIPLIER.mul(2000),
  });
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

  const dao = await impersonateSigner("0x92a1cb552d0e177f3a135b4c87a4160c8f2a485f");

  await contractRegistry
    .connect(dao)
    .addContract(ethers.utils.id("VaultFeeController"), vaultFeeController.address, ethers.utils.id("1"));
  return {
    faucet,
    asset,
    vault,
  };
}

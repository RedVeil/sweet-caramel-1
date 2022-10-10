import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { parseEther } from "@ethersproject/units";

import { ADDRESS_ZERO } from "../lib/utils/constants";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { getVaultStakingPools } from "../lib/utils/getStakingPools";
import { addContractToRegistry, FaucetController } from "./utils";

const FEE_MULTIPLIER = parseEther("0.0001"); // 1e14
const FEE_STRUCTURE = {
  deposit: 0,
  withdrawal: 0,
  management: FEE_MULTIPLIER.mul(200),
  performance: FEE_MULTIPLIER.mul(2000),
};
const KEEPER_SETTINGS = {
  minWithdrawalAmount: parseEther("100"),
  incentiveVigBps: 1,
  keeperPayout: 9,
};

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();
  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);
  const vaultStakingPools = await getVaultStakingPools(hre.network.config.chainId, addresses, deployments);

  const contractRegistry = await (await deployments.get("ContractRegistry")).address;

  await deploy("VaultFeeController", {
    from: addresses.deployer,
    args: [FEE_STRUCTURE, addresses.contractRegistry],
    log: true,
    autoMine: true,
    contract: "VaultFeeController",
  });
  await addContractToRegistry("VaultFeeController", deployments, signer, hre);



  for (var i = 0; i < vaultStakingPools.length; i++) {
    console.log({
      vaultName: vaultStakingPools[i].vaultName,
      inputToken: vaultStakingPools[i].inputToken,
      yearnRegistry: addresses.yearnRegistry,
      contractRegistry,
      ADDRESS_ZERO,
      FEE_STRUCTURE,
      KEEPER_SETTINGS,
    });
    const VaultDeployed = await deploy(vaultStakingPools[i].vaultName, {
      from: addresses.deployer,
      args: [],
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
      contract: "Vault",
    });
    const vault = await ethers.getContractAt("Vault", VaultDeployed.address);
    await vault.initialize(
      vaultStakingPools[i].inputToken,
      addresses.yearnRegistry,
      contractRegistry,
      ADDRESS_ZERO,
      ADDRESS_ZERO,
      FEE_STRUCTURE,
      KEEPER_SETTINGS,
    );

    const Staking = await deploy(vaultStakingPools[i].poolName, {
      from: addresses.deployer,
      args: [vaultStakingPools[i].rewardsToken, VaultDeployed.address, addresses.vaultsRewardsEscrow],
      log: true,
      autoMine: true,
      contract: "Staking",
    });

    await addContractToRegistry(vaultStakingPools[i].vaultName, deployments, signer, hre);
    await vault.connect(signer).setStaking(Staking.address);

    const staking = await ethers.getContractAt("Staking", Staking.address);
    await staking.connect(signer).setVault(vault.address);
  }
};

export default main;
main.dependencies = ["setup", "test-tokens", "contract-registry", "acl-registry", "test-pop"];
main.tags = ["frontend", "sweet-vaults"];

import { parseEther } from "@ethersproject/units";
import { ethers } from "hardhat";
import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { getVaultStakingPools } from "../lib/utils/getStakingPools";
import { addContractToRegistry, FaucetController } from "./utils";
import { ADDRESS_ZERO } from "../lib/utils/constants";

const FEE_MULTIPLIER = parseEther("0.0001"); // 1e14
const FEE_STRUCTURE = {
  deposit: 0,
  withdrawal: 0,
  management: FEE_MULTIPLIER.mul(200),
  performance: FEE_MULTIPLIER.mul(2000),
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
    });
    const VaultDeployed = await deploy(vaultStakingPools[i].vaultName, {
      from: addresses.deployer,
      args: [vaultStakingPools[i].inputToken, addresses.yearnRegistry, contractRegistry, ADDRESS_ZERO, FEE_STRUCTURE],
      log: true,
      autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
      contract: "Vault",
    });

    const Staking = await deploy(vaultStakingPools[i].poolName, {
      from: addresses.deployer,
      args: [vaultStakingPools[i].rewardsToken, VaultDeployed.address, addresses.rewardsEscrow],
      log: true,
      autoMine: true,
      contract: "Staking",
    });

    const vault = await ethers.getContractAt("Vault", VaultDeployed.address);

    await addContractToRegistry(vaultStakingPools[i].vaultName, deployments, signer, hre);
    await vault.connect(signer).setStaking(Staking.address);
  };
}

export default main;
main.dependencies = ["setup", "test-tokens", "contract-registry", "acl-registry", "test-pop"];
main.tags = ["frontend", "sweet-vaults"];

async function createDemoSweetVaults(hre: HardhatRuntimeEnvironment, signer, addresses, poolInfo) {
  const makeDeposit = async () => {
    const vault = await hre.ethers.getContractAt(
      "Vault",
      (
        await hre.deployments.get("sEthSweetVault")
      ).address,
      signer
    );
    const underlyingToken = await hre.ethers.getContractAt("MockERC20", poolInfo.inputToken, signer);
    await underlyingToken.approve(vault.address, parseEther("10"));
    await vault["deposit(uint256)"](parseEther("10"));
    console.log(await (await underlyingToken.balanceOf(addresses.deployer)).toString());
  };

  const { deployer } = addresses;
  const faucet = await FaucetController(hre, signer);

  await Promise.all([
    faucet.sendDai(deployer, 1000),
    faucet.sendUsdc(deployer, 10),
    faucet.sendCrvSethLPTokens(addresses.deployer, 100),
  ]);

  await makeDeposit();
}
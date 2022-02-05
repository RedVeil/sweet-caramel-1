import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();

  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  await deploy("RewardsDistribution", {
    from: addresses.deployer,
    args: [hre.config.namedAccounts.deployer as string, addresses.pop, addresses.daoTreasury],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "RewardsDistribution",
  });
  await addContractToRegistry("RewardsDistribution", deployments, signer, hre);

  /*
  NOTICE: We could call addRewardDistribution() for the staking contracts here or add RewardsDistributors 
  but i feel like neither rewardsAmount or the rewardsDistributor are that set in stone as to set them here. 
  Instead we should probably do this later on etherscan.
  */
};
export default main;
main.dependencies = ["setup"];
main.tags = ["core", "rewards-distribution"];

import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const pop = await deployments.get("POP");
  const popEthLp = await deployments.get("POP_ETH_LP");
  const butter = await deployments.get("BUTTER");

  await deploy("PopStaking", {
    from: deployer,
    args: [pop.address, pop.address],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks,
    contract: "StakingRewards",
  });

  await deploy("popEthLPStaking", {
    from: deployer,
    args: [pop.address, popEthLp.address],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "StakingRewards",
  });

  await deploy("butterStaking", {
    from: deployer,
    args: [pop.address, butter.address],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "StakingRewards",
  });
};
export default func;

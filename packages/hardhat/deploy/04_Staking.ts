import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("StakingRewards", {
    from: deployer,
    args: ["POP_ADDRESS", "POP_ADDRESS"],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  await deploy("StakingRewards", {
    from: deployer,
    args: ["POP_ADDRESS", "ETH_POP_LP_ADDRESS"],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  await deploy("StakingRewards", {
    from: deployer,
    args: ["POP_ADDRESS", "BUTTER_ADDRESS"],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};
export default func;

import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("POP", {
    from: deployer,
    args: ["POP", "POP"],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "ERC20",
  });

  await deploy("3CRV", {
    from: deployer,
    args: ["Three Curve", "3CRV"],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "ERC20",
  });

  //Temp solution for local deployment
  await deploy("POP_ETH_LP", {
    from: deployer,
    args: ["POP_ETH_LP", "POPETH", 18],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
  });

  await deploy("BUTTER", {
    from: deployer,
    args: ["Butter", "BUTTER", 18],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
  });
};
export default func;

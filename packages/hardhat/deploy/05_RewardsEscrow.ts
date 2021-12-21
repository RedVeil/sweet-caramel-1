import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("RewardsEscrow", {
    from: deployer,
    args: [(await deployments.get("TestPOP")).address],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};
export default main;
main.tags = ["frontend"];

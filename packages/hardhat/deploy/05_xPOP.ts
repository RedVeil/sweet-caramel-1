import { parseEther } from "@ethersproject/units";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const XPOP_SUPPLY = parseEther("1000000");

  await deploy("xPOP", {
    from: deployer,
    args: [XPOP_SUPPLY],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks,
    contract: "XPop",
  });
};
export default main;

import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("USDC", {
    from: deployer,
    args: ["Test USDC", "TUSDC", 6],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
    waitConfirmations: 1,
  });
};

export default main;
main.tags = [];
main.skip = async (hre: HardhatRuntimeEnvironment) => {
  return ["mainnet", "arbitrum", "polygon"].includes(hre.network.name);
};

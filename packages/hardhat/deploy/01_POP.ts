import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("POP", {
    from: deployer,
    args: ["Test POP", "TPOP", 18],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
    waitConfirmations: 1,
  });
};

export default main;
main.tags = ["LBP"];
main.skip = async (hre: HardhatRuntimeEnvironment) => {
  return ["mainnet", "polygon", "arbitrum", "rinkeby", "hardhat"].includes(
    hre.network.name
  );
};

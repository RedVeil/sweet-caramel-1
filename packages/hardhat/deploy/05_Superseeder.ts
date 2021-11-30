import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("Superseeder", {
    from: deployer,
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks,
    pre_eip1559: supportsEIP1559(hre),
  });
};

export default main;

const supportsEIP1559 = (hre: HardhatRuntimeEnvironment): boolean => {
  const NOT_EIP1559Compatible = ["rinkarby", "mumbai", "polygon", "arbitrum"];
  return !NOT_EIP1559Compatible.includes(hre.network.name);
};
main.tags = ["superseeder"];
main.dependencies = ["setup"];

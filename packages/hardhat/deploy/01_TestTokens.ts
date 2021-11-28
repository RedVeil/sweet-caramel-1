import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { parseUnits } from "@ethersproject/units";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("USDC", {
    from: deployer,
    args: ["Test USDC_1", "TUSDC1", 6],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
    waitConfirmations: 1,
    pre_eip1559: supportsEIP1559(hre),
    gasPrice: parseUnits("150", "gwei"),
  });

  await deploy("POP", {
    from: deployer,
    args: ["Test Foo_1", "TFOO1", 18],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "MockERC20",
    waitConfirmations: 1,
    pre_eip1559: supportsEIP1559(hre),
    gasPrice: parseUnits("150", "gwei"),
  });
};

export default main;
main.tags = ["test-tokens"];
main.dependencies = ["setup"];
main.skip = async (hre: HardhatRuntimeEnvironment) => {
  return ["mainnet", "arbitrum", "polygon"].includes(hre.network.name);
};

const supportsEIP1559 = (hre: HardhatRuntimeEnvironment): boolean => {
  const NOT_EIP1559Compatible = [
    "rinkarby",
    "mumbai",
    "polygon",
    "polygontest",
    "arbitrum",
  ];
  return !NOT_EIP1559Compatible.includes(hre.network.name);
};

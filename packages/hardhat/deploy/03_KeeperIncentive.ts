import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { BigNumber } from "@ethersproject/bignumber";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const signer = await getSignerFrom(
    hre.config.namedAccounts.deployer as string,
    hre
  );

  await deploy("KeeperIncentive", {
    from: deployer,
    args: [
      (await deployments.get("ContractRegistry")).address,
      BigNumber.from("0"),
      BigNumber.from("0"),
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    pre_eip1559: supportsEIP1559(hre),
  });

  await addContractToRegistry("KeeperIncentive", deployments, signer, hre);
};
export default func;
func.dependencies = ["setup"];
func.tags = ["core", "frontend"];

const supportsEIP1559 = (hre: HardhatRuntimeEnvironment): boolean => {
  const NOT_EIP1559Compatible = ["rinkarby", "mumbai", "polygon", "arbitrum"];
  return !NOT_EIP1559Compatible.includes(hre.network.name);
};

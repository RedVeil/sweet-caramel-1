import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer, pop } = await getNamedAccounts();

  const signer = await getSignerFrom(
    hre.config.namedAccounts.deployer as string,
    hre
  );

  const popAddress = !["mainnet", "polygon", "arbitrum"].includes(
    hre.network.name
  )
    ? (await deployments.get("TestPOP")).address
    : pop;

  // todo: replace testpop with real pop
  await deploy("RewardsEscrow", {
    from: deployer,
    args: [popAddress],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    pre_eip1559: supportsEIP1559(hre),
  });

  await addContractToRegistry("RewardsEscrow", deployments, signer, hre);
};
export default main;

main.dependencies = ["setup"];
main.tags = ["core", "frontend"];

const supportsEIP1559 = (hre: HardhatRuntimeEnvironment): boolean => {
  const NOT_EIP1559Compatible = ["rinkarby", "mumbai", "polygon", "arbitrum"];
  return !NOT_EIP1559Compatible.includes(hre.network.name);
};

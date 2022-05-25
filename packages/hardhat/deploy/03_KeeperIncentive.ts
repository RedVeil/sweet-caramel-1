import { BigNumber } from "@ethersproject/bignumber";
import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();
  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  await deploy("KeeperIncentive", {
    from: addresses.deployer,
    args: [addresses.contractRegistry, BigNumber.from("0"), BigNumber.from("0")],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  await addContractToRegistry("KeeperIncentive", deployments, signer, hre);
};
export default func;
func.dependencies = ["setup"];
func.tags = ["keeper-incentives", "frontend"];

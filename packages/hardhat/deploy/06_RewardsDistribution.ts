import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();

  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  await deploy("RewardsDistribution", {
    from: addresses.deployer,
    args: [
      hre.config.namedAccounts.deployer as string,
      await (await deployments.get("TestPOP")).address,
      addresses.daoTreasury,
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "RewardsDistribution",
  });
  await addContractToRegistry("RewardsDistribution", deployments, signer, hre);
};
export default main;
main.dependencies = ["setup", "contract-registry", "test-pop"];
main.tags = ["core", "rewards-distribution"];

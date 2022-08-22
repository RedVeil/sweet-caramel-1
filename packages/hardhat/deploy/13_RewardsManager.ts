import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();
  const pop = addresses.pop;

  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);
  const aclRegistry = await hre.ethers.getContractAt("ACLRegistry", (await deployments.get("ACLRegistry")).address);
  const keeperIncentive = await hre.ethers.getContractAt(
    "KeeperIncentiveV2",
    (
      await deployments.get("KeeperIncentive")
    ).address
  );
  const rewardsManager = await deploy("RewardsManager", {
    from: addresses.deployer,
    args: [(await deployments.get("ContractRegistry")).address, addresses.uniswapRouter],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "RewardsManager",
  });
  await addContractToRegistry("RewardsManager", deployments, signer, hre);
  await aclRegistry.grantRole(ethers.utils.id("RewardsManager"), (await deployments.get("RewardsManager")).address);
  console.log("creating incentive 1 ...");
  await keeperIncentive.createIncentive(rewardsManager.address, 0, true, true, pop, 60 * 60 * 24, 0);

  console.log("creating incentive 2 ...");
  await keeperIncentive.createIncentive(rewardsManager.address, 0, true, true, pop, 60 * 60 * 24, 0);
};
export default main;
main.dependencies = ["setup"];
main.tags = ["core", "rewards-manager"];

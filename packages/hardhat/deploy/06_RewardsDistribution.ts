import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { parseEther } from "ethers/lib/utils";
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
      await (await deployments.get("ContractRegistry")).address,
      await (await deployments.get("TestPOP")).address,
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "RewardsDistribution",
  });
  await addContractToRegistry("RewardsDistribution", deployments, signer, hre);

  const rewardsDistribution = await hre.ethers.getContractAt(
    "RewardsDistribution",
    (
      await deployments.get("RewardsDistribution")
    ).address,
    signer
  );
  rewardsDistribution.setKeeperIncentiveBps(parseEther("0.001"));

  const keeperIncentive = await hre.ethers.getContractAt(
    "KeeperIncentiveV2",
    (
      await deployments.get("KeeperIncentive")
    ).address,
    signer
  );
  await keeperIncentive.createIncentive(
    await (await deployments.get("RewardsDistribution")).address,
    0,
    true,
    true,
    await (await deployments.get("TestPOP")).address,
    1,
    0);


};
export default main;
main.dependencies = ["setup", "contract-registry", "test-pop"];
main.tags = ["core", "rewards-distribution"];

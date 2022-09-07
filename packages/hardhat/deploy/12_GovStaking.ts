import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();

  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  await deploy("GovStaking", {
    from: addresses.deployer,
    args: [(await deployments.get("ContractRegistry")).address],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "GovStaking",
  });
  await addContractToRegistry("GovStaking", deployments, signer, hre);
  const rewardsEscrow = await hre.ethers.getContractAt(
    "RewardsEscrow",
    await (
      await deployments.get("RewardsEscrow")
    ).address,
    signer
  );
  await rewardsEscrow.addAuthorizedContract((await deployments.get("GovStaking")).address);
};
export default main;
main.dependencies = ["setup", "contract-registry", "rewards-escrow"];
main.tags = ["core", "gov-staking"];

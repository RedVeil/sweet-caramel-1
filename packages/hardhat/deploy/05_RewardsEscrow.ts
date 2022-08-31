import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer, pop } = await getNamedAccounts();

  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  const popAddress = !["mainnet", "polygon", "arbitrum", "bsc"].includes(hre.network.name)
    ? (await deployments.get("TestPOP")).address
    : pop;

  // todo: replace testpop with real pop
  await deploy("RewardsEscrow", {
    from: deployer,
    args: [popAddress],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  await addContractToRegistry("RewardsEscrow", deployments, signer, hre);
};
export default main;

main.dependencies = ["setup", "contract-registry", "test-pop"];
main.tags = ["core", "frontend", "rewards-escrow"];

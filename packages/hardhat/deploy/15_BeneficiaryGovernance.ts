import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();

  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  const aclRegistry = await hre.ethers.getContractAt("ACLRegistry", (await deployments.get("ACLRegistry")).address);
  const participationReward = await hre.ethers.getContractAt(
    "ParticipationReward",
    (
      await deployments.get("ParticipationReward")
    ).address
  );

  await deploy("BeneficiaryGovernance", {
    from: addresses.deployer,
    args: [(await deployments.get("ContractRegistry")).address],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "BeneficiaryGovernance",
  });
  await addContractToRegistry("BeneficiaryGovernance", deployments, signer, hre);
  aclRegistry.grantRole(
    ethers.utils.id("BeneficiaryGovernance"),
    (await deployments.get("BeneficiaryGovernance")).address
  );
  await participationReward.addControllerContract(
    ethers.utils.id("BeneficiaryGovernance"),
    (
      await deployments.get("BeneficiaryGovernance")
    ).address
  );
};
export default main;
main.dependencies = ["setup"];
main.tags = ["core", "beneficiary-governance"];

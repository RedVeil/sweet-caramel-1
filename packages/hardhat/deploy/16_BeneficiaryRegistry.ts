import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";
import { addContractToRegistry } from "./utils";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const addresses = await getNamedAccounts();

  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  await deploy("BeneficiaryRegistry", {
    from: addresses.deployer,
    args: [(await deployments.get("ContractRegistry")).address],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    contract: "BeneficiaryRegistry",
  });
  await addContractToRegistry("BeneficiaryRegistry", deployments, signer, hre);
};
export default main;
main.dependencies = ["setup", "beneficiary-governance", "contract-registry"];
main.tags = ["core", "beneficiary-registry"];

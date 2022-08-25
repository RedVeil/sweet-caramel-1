import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DAO_ROLE, KEEPER_ROLE } from "../lib/acl/roles";
import { getSignerFrom } from "../lib/utils/getSignerFrom";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const signer = await getSignerFrom(hre.config.namedAccounts.deployer as string, hre);

  await deploy("ACLRegistry", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    gasLimit: 2000000,
  });

  const aclRegistry = await hre.ethers.getContractAt(
    "ACLRegistry",
    (
      await deployments.get("ACLRegistry")
    ).address,
    signer
  );

  //Grant signer roles for later contract interactions
  await aclRegistry.grantRole(DAO_ROLE, await signer.getAddress());
  await aclRegistry.grantRole(KEEPER_ROLE, await signer.getAddress());
};

export default main;
main.dependencies = ["setup"];
main.tags = ["core", "frontend", "acl-registry"];

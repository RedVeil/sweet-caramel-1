import { DeployFunction } from "@anthonymartin/hardhat-deploy/types";
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSignerFrom } from "../lib/utils/getSignerFrom";

const main: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const signer = await getSignerFrom(
    hre.config.namedAccounts.deployer as string,
    hre
  );

  await deploy("ACLRegistry", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });

  const aclRegistry = await hre.ethers.getContractAt(
    "ACLRegistry",
    (
      await deployments.get("ACLRegistry")
    ).address,
    signer
  );

  //Grant signer roles for later contract interactions
  await aclRegistry.grantRole(
    ethers.utils.id("DAO"),
    await signer.getAddress()
  );
  await aclRegistry.grantRole(
    ethers.utils.id("Keeper"),
    await signer.getAddress()
  );
};
export default main;

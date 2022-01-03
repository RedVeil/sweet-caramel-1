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
    gasLimit: 2000000,
    pre_eip1559: supportsEIP1559(hre),
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
main.dependencies = ["setup"];
main.tags = ["core", "frontend"];

const supportsEIP1559 = (hre: HardhatRuntimeEnvironment): boolean => {
  const NOT_EIP1559Compatible = ["rinkarby", "mumbai", "polygon", "arbitrum"];
  return !NOT_EIP1559Compatible.includes(hre.network.name);
};
